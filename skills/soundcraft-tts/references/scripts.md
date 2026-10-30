# TTS scripts and snippets

Templates to adapt, not tested end to end in this repository (no engine was installed while writing
them): API names follow the providers' documentation as of 2026-10-30 (`sources.md`); lines marked
**(unverified)** are the ones most likely to need a fix. Save the scripts in `WORKDIR/scripts/`, keep
downloaded models in `WORKDIR/models/` or `WORKDIR/voices/` (separate folders), and run them with the
venv's interpreter. Layout used below:

```text
WORKDIR/script.txt          final text, paragraphs separated by a blank line
WORKDIR/chunks/NNNN.txt     one request each, plus chunks/index.tsv (chunk id, paragraph number)
WORKDIR/auditions/          one sentence per candidate voice
WORKDIR/tts/NNNN.wav|mp3    engine output per chunk
WORKDIR/narration-48k.wav   assembled, 48 kHz 24-bit, imported into SoundCraft
```

## 1. Secrets: the user stores the key, the agent only loads it

The user runs this in **their own terminal** (hidden prompt: the key is not shown, not in shell history,
not in the chat). The `!` prefix in Claude Code may not support a hidden interactive prompt (unverified),
so a separate terminal is the safe choice. Keep the file outside any repo and outside `WORKDIR`.

```bash
mkdir -p ~/.config/tts-secrets && chmod 700 ~/.config/tts-secrets
( umask 077; read -rsp 'ElevenLabs API key: ' K; echo
  printf 'ELEVENLABS_API_KEY=%s\n' "$K" > ~/.config/tts-secrets/elevenlabs.env; unset K )
```

The agent loads it in the same Bash call that uses it, and never prints it:

```bash
set -a; . ~/.config/tts-secrets/elevenlabs.env; set +a
[ -n "$ELEVENLABS_API_KEY" ] && echo "key: set" || echo "key: missing"
"$WORKDIR/.venv-cloud/bin/python" "$WORKDIR/scripts/eleven_render.py" VOICE_ID eleven_multilingual_v2 mp3_44100_128 "$WORKDIR/tts" "$WORKDIR"/chunks/*.txt
```

Google: prefer `gcloud auth application-default login` (no file to manage). Polly: prefer
`aws sso login --profile NAME` and `export AWS_PROFILE=NAME AWS_REGION=eu-central-1` (region example).
Never `cat` a credentials file, never `env`/`printenv` without a filter, never `set -x` around these lines.

## 2. Chunker (stdlib only)

`python3 chunk.py script.txt chunks LIMIT [chars|bytes]`. Limits: Google 4800 bytes (margin under 5,000),
Polly 2800 chars, ElevenLabs 9000 (multilingual v2 / v4) or 35000 (flash v2.5), Kokoro and Piper about
300-400 chars (keeps each request short; kokoro-onnx also checks 510 phonemes per sentence).

```python
#!/usr/bin/env python3
"""Split a script into chunks under a size limit: paragraphs first, then sentences, never mid-sentence."""
import pathlib, re, sys

src, outdir, limit = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), int(sys.argv[3])
unit = sys.argv[4] if len(sys.argv) > 4 else "chars"
size = (lambda s: len(s.encode("utf-8"))) if unit == "bytes" else len
SENT = re.compile(r"(?<=[.!?…:;])\s+")
outdir.mkdir(parents=True, exist_ok=True)
rows, n = [], 0

def emit(text, para):
    global n
    n += 1
    (outdir / f"{n:04d}.txt").write_text(text + "\n", encoding="utf-8")
    rows.append(f"{n:04d}\t{para}")

paragraphs = [" ".join(p.split()) for p in re.split(r"\n\s*\n", src.read_text(encoding="utf-8"))]
for para_no, para in enumerate(p for p in paragraphs if p):
    buf = ""
    for sent in SENT.split(para):
        if size(sent) > limit:
            sys.exit(f"sentence over the limit ({size(sent)} {unit}); split it by hand: {sent[:60]}...")
        candidate = f"{buf} {sent}".strip()
        if size(candidate) <= limit:
            buf = candidate
        else:
            emit(buf, para_no)
            buf = sent
    if buf:
        emit(buf, para_no)
(outdir / "index.tsv").write_text("\n".join(rows) + "\n", encoding="utf-8")
print(f"{n} chunks in {outdir}")
```

SSML chunks (Google, Polly): wrap each chunk in `<speak>...</speak>` after chunking and escape `&`, `<`,
`>` in the text; tags are not counted by Polly's billing but do count towards Google's byte limit.

## 3. Local engines

### Kokoro, Route A (PyTorch)

`KOKORO_DEVICE=cuda|cpu python kokoro_render.py VOICE SPEED OUTDIR chunks/*.txt` (voice e.g. `if_sara`;
the first letter of the voice id is the language code).

```python
#!/usr/bin/env python3
import os, pathlib, re, sys
import numpy as np
import soundfile as sf
from kokoro import KPipeline

voice, speed, outdir = sys.argv[1], float(sys.argv[2]), pathlib.Path(sys.argv[3])
files = [pathlib.Path(f) for f in sys.argv[4:]]
sent_gap = float(os.environ.get("SENT_GAP_S", "0.12"))      # pause between sentences inside a chunk (taste)
pipe = KPipeline(lang_code=voice[0], device=os.environ.get("KOKORO_DEVICE", "cpu"))
outdir.mkdir(parents=True, exist_ok=True)
SR = 24000
for f in files:
    # Italian is not chunked by kokoro: one sentence per line, split on newlines
    text = re.sub(r"(?<=[.!?…])\s+", "\n", f.read_text(encoding="utf-8").strip())
    parts = []
    for _graphemes, _phonemes, audio in pipe(text, voice=voice, speed=speed, split_pattern=r"\n+"):
        audio = audio.cpu().numpy() if hasattr(audio, "cpu") else np.asarray(audio)
        parts += [audio, np.zeros(int(SR * sent_gap), dtype=np.float32)]
    sf.write(outdir / f"{f.stem}.wav", np.concatenate(parts[:-1]), SR)
    print(f.stem, "ok")
```

### Kokoro, Route B (kokoro-onnx, phonemised with misaki)

`ONNX_PROVIDER=CPUExecutionProvider|CUDAExecutionProvider python kokoro_onnx_render.py MODEL VOICES_BIN VOICE SPEED OUTDIR chunks/*.txt`

```python
#!/usr/bin/env python3
import os, pathlib, re, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from misaki.espeak import EspeakG2P          # as in the kokoro-onnx example (unverified import path)

model, voices, voice, speed, outdir = sys.argv[1:4] + [float(sys.argv[4]), pathlib.Path(sys.argv[5])]
files = [pathlib.Path(f) for f in sys.argv[6:]]
sent_gap = float(os.environ.get("SENT_GAP_S", "0.12"))
kokoro = Kokoro(model, voices)
g2p = EspeakG2P(language="it")              # change for other languages
outdir.mkdir(parents=True, exist_ok=True)
for f in files:
    parts, sr = [], 24000
    for sent in re.split(r"(?<=[.!?…])\s+", f.read_text(encoding="utf-8").strip()):
        phonemes, _ = g2p(sent)               # returns (phonemes, tokens) (unverified)
        if len(phonemes) > 510:
            sys.exit(f"{f.name}: sentence over 510 phonemes, split it: {sent[:60]}...")
        samples, sr = kokoro.create(phonemes, voice=voice, speed=speed, is_phonemes=True)
        parts += [samples, np.zeros(int(sr * sent_gap), dtype=np.float32)]
    sf.write(outdir / f"{f.stem}.wav", np.concatenate(parts[:-1]), sr)
    print(f.stem, "ok")
```

If the `misaki` import fails, install the extra the kokoro-onnx example names (its `[en]` extra pulls
spaCy and downloads a model at runtime: needs network and pip inside the venv). As a quick test,
`kokoro.create(text, voice=voice, speed=speed, lang="it")` without misaki may work (untested).

### Piper

```bash
. "$WORKDIR/.venv-piper/bin/activate"
mkdir -p "$WORKDIR/tts"
for f in "$WORKDIR"/chunks/*.txt; do
  python3 -m piper -m it_IT-paola-medium --data-dir "$WORKDIR/voices" \
    -f "$WORKDIR/tts/$(basename "$f" .txt).wav" -- "$(cat "$f")"
done
```

## 4. Cloud engines

Shared venv: `python3 -m venv "$WORKDIR/.venv-cloud"` then `pip install --no-cache-dir elevenlabs`
(or `google-cloud-texttospeech`, or `boto3`) plus `soundfile numpy` for assembly. Each script skips chunks
that already exist, so a rerun after an error resumes instead of paying twice.

### ElevenLabs: list voices, then render

```python
#!/usr/bin/env python3
# eleven_voices.py: GET /v2/voices; the key travels in a header, never on a command line
import json, os, urllib.request
req = urllib.request.Request("https://api.elevenlabs.io/v2/voices",
                             headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"]})
for v in json.load(urllib.request.urlopen(req))["voices"]:
    print(v["voice_id"], v["name"], json.dumps(v.get("labels", {}), ensure_ascii=False))
```

```python
#!/usr/bin/env python3
# eleven_render.py VOICE_ID MODEL_ID OUTPUT_FORMAT OUTDIR chunks/*.txt
import os, pathlib, sys
from elevenlabs.client import ElevenLabs

voice_id, model_id, fmt, outdir = sys.argv[1], sys.argv[2], sys.argv[3], pathlib.Path(sys.argv[4])
client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
ext = "mp3" if fmt.startswith("mp3") else "wav"
outdir.mkdir(parents=True, exist_ok=True)
for f in map(pathlib.Path, sys.argv[5:]):
    out = outdir / f"{f.stem}.{ext}"
    if out.exists():
        continue
    audio = client.text_to_speech.convert(text=f.read_text(encoding="utf-8").strip(), voice_id=voice_id,
                                          model_id=model_id, output_format=fmt)   # iterator of bytes
    with open(out, "wb") as fh:
        for block in audio:
            fh.write(block)
    print(f.stem, "ok")
```

`pcm_44100` returns raw PCM without a header (unverified): prefer `mp3_44100_128`/`_192` unless on Pro.
Keep `voice_settings` (stability, similarity) identical for all chunks if you set them.

### Google Cloud TTS

```python
#!/usr/bin/env python3
# google_render.py VOICE_NAME SPEAKING_RATE OUTDIR chunks/*.txt   (ADC or GOOGLE_APPLICATION_CREDENTIALS)
import pathlib, sys
from google.cloud import texttospeech as tts

voice_name, rate, outdir = sys.argv[1], float(sys.argv[2]), pathlib.Path(sys.argv[3])
lang = "-".join(voice_name.split("-")[:2])              # it-IT-Neural2-F -> it-IT
client = tts.TextToSpeechClient()
outdir.mkdir(parents=True, exist_ok=True)
for f in map(pathlib.Path, sys.argv[4:]):
    out = outdir / f"{f.stem}.wav"
    if out.exists():
        continue
    text = f.read_text(encoding="utf-8").strip()
    inp = tts.SynthesisInput(ssml=text) if text.startswith("<speak") else tts.SynthesisInput(text=text)
    resp = client.synthesize_speech(
        input=inp,
        voice=tts.VoiceSelectionParams(language_code=lang, name=voice_name),
        audio_config=tts.AudioConfig(audio_encoding=tts.AudioEncoding.LINEAR16,
                                     sample_rate_hertz=48000, speaking_rate=rate))
    out.write_bytes(resp.audio_content)                  # LINEAR16 comes with a WAV header
    print(f.stem, "ok")
```

List voices: `for v in tts.TextToSpeechClient().list_voices(language_code="it-IT").voices: print(v.name,
tts.SsmlVoiceGender(v.ssml_gender).name, v.natural_sample_rate_hertz)`. Chirp 3 HD: plain text only
(and `speaking_rate` support is unverified).

### Amazon Polly

```python
#!/usr/bin/env python3
# polly_render.py VOICE ENGINE OUTDIR chunks/*.txt   (AWS_PROFILE / AWS_REGION or SSO)
import os, pathlib, sys
import boto3

voice, engine, outdir = sys.argv[1], sys.argv[2], pathlib.Path(sys.argv[3])
rate = os.environ.get("POLLY_RATE", "48000")          # if rejected for this engine, use 24000 (unverified)
polly = boto3.Session().client("polly")
outdir.mkdir(parents=True, exist_ok=True)
for f in map(pathlib.Path, sys.argv[4:]):
    out = outdir / f"{f.stem}.mp3"
    if out.exists():
        continue
    text = f.read_text(encoding="utf-8").strip()
    resp = polly.synthesize_speech(Text=text, TextType="ssml" if text.startswith("<speak") else "text",
                                   VoiceId=voice, Engine=engine, OutputFormat="mp3",
                                   SampleRate=rate, LanguageCode="it-IT")
    out.write_bytes(resp["AudioStream"].read())
    print(f.stem, "ok")
```

List voices: `boto3.client("polly").describe_voices(LanguageCode="it-IT", Engine="generative")["Voices"]`.

## 5. Check each chunk

```bash
cd "$WORKDIR"
for f in tts/*; do
  id=$(basename "${f%.*}")
  chars=$(wc -m < "chunks/$id.txt")
  read -r rate dur < <(ffprobe -v error -show_entries stream=sample_rate:format=duration \
                         -of default=nw=1:nk=1 "$f" | paste -sd' ')
  awk -v id="$id" -v c="$chars" -v d="$dur" -v r="$rate" \
    'BEGIN { cps = c / d; flag = (cps > 25 || cps < 6) ? "  <-- check" : ""; printf "%s %5d chars %6.2fs %s Hz %4.1f c/s%s\n", id, c, d, r, cps, flag }'
done
```

Natural speech runs at roughly 12-18 characters per second (approx.); a much higher figure usually means
a truncated chunk, a much lower one long silences or a stuck render.

## 6. Assemble, then resample to the session rate

1. MP3 chunks (ElevenLabs, Polly): decode to WAV at their own rate first:
   `for f in tts/*.mp3; do ffmpeg -v error -n -i "$f" -ac 1 -c:a pcm_s16le "${f%.mp3}.wav"; done`
2. Concatenate with gaps (short inside a paragraph, longer between paragraphs, from `chunks/index.tsv`):

```python
#!/usr/bin/env python3
# assemble.py WORKDIR [GAP_S] [PARA_GAP_S]
import pathlib, sys
import numpy as np
import soundfile as sf

work = pathlib.Path(sys.argv[1])
gap = float(sys.argv[2]) if len(sys.argv) > 2 else 0.25
para_gap = float(sys.argv[3]) if len(sys.argv) > 3 else 0.7
rows = [line.split("\t") for line in (work / "chunks/index.tsv").read_text().split("\n") if line]
parts, sr, prev_para = [], None, None
for chunk_id, para in rows:
    audio, rate = sf.read(work / "tts" / f"{chunk_id}.wav", dtype="float32", always_2d=True)
    if sr is None:
        sr = rate
    if rate != sr:
        sys.exit(f"{chunk_id}: {rate} Hz differs from {sr} Hz; re-render or convert first")
    if prev_para is not None:
        parts.append(np.zeros((int(sr * (para_gap if para != prev_para else gap)), 1), dtype=np.float32))
    parts.append(audio[:, :1])                               # mono
    prev_para = para
out = work / "narration-native.wav"
sf.write(out, np.concatenate(parts), sr, subtype="FLOAT")
print(out, sr, "Hz", round(sum(len(p) for p in parts) / sr, 2), "s")
```

3. Resample once to the session rate, 24-bit:
   `ffmpeg -v error -i narration-native.wav -af aresample=48000:resampler=soxr -c:a pcm_s24le narration-48k.wav`
   (drop `:resampler=soxr` if this ffmpeg build lacks soxr), or
   `sox narration-native.wav -b 24 narration-48k.wav rate -v 48000`.

Chunks with long leading/trailing silence: trim them in the SoundCraft edit pass (preferred, visible to the
user) rather than by guesswork here.

## 7. Measure and clean up

```bash
ffmpeg -nostats -i master.wav -af ebur128=peak=true -f null - 2>&1 | tail -n 12      # LUFS, true peak
ffmpeg -nostats -i master.wav -af astats=reset=0 -f null - 2>&1 | grep -E 'RMS level|Peak level|Noise floor' | tail -n 3   # ACX
du -sh "$WORKDIR"/.venv-* "$WORKDIR"/models "$WORKDIR"/voices 2>/dev/null
du -sh "${HF_HOME:-$HOME/.cache/huggingface}"/hub/models--hexgrad--Kokoro-82M 2>/dev/null
```

Install with `pip install --no-cache-dir ...` (or `UV_NO_CACHE=1` with uv) so multi-GB wheels are not
also kept in the package cache; if a cache was filled anyway, report its growth instead of purging a
cache that also holds the user's other packages.
