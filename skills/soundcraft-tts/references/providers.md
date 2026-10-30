# TTS engines: requirements, setup, voices, limits

Facts were collected from the providers' documentation and package indexes on 2026-10-30
(`sources.md`). Items marked **(unverified)** or **(inferred)** were not confirmed against a primary source
or a real run; prices and quotas change, so re-check them on the pricing pages before quoting a cost.
Sizes marked "approx." are estimates: measure with `du -sh` after installing and report the real figure.

Everything below goes into the user-chosen work folder (`WORKDIR`, inside SoundCraft's read root),
except system packages and the Hugging Face cache. Venvs and model caches never go inside a git repo.

## Common checks (read-only)

```bash
nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader   # GPU? error = CPU
nvidia-smi | grep -o 'CUDA Version: [0-9.]*'       # highest CUDA the driver supports
python3.12 --version; uv --version                 # a 3.12 interpreter for the venv
command -v espeak-ng ffmpeg sox                    # system tools
df -h "$WORKDIR"                                    # free space
```

Picking the GPU wheel: driver CUDA >= 13 -> `cu130`; >= 12.8 -> `cu128`; older -> check the selector on
pytorch.org or use CPU. RTX 50-series (Blackwell) needs CUDA >= 12.8 builds (inferred). AMD (ROCm) and
Apple (MPS) are not covered here (unverified); default them to CPU.

Missing Python 3.12: `uv python install 3.12` (uv-managed, in `~/.local/share/uv`) or the distribution
package through the system package manager (e.g. `sudo dnf install python3.12` on Fedora; unverified
package name on other distros), which the user runs in their own terminal, never you.

## Local: Kokoro-82M (default)

- Licence Apache-2.0 (model and code): commercial use allowed. Output 24 kHz mono.
- 54 voices in 9 languages. Language codes for Route A: `a` American English, `b` British English,
  `i` Italian, and others listed in the Kokoro README. Italian voices: `if_sara` (female), `im_nicola` (male).
  Naming: first letter = language, second = `f`/`m`.
- Needs **espeak-ng**, a system package the user installs in their own terminal with the system package
  manager (e.g. `sudo dnf install espeak-ng` on Fedora, `sudo apt install espeak-ng`, `brew install
  espeak-ng`; Windows: the `.msi` from the espeak-ng releases). Size: small, a few MB (approx.).
- Python: a **3.12 venv**. Fedora ships 3.14, which is unsupported: `kokoro` 0.9.4 requires < 3.13,
  `kokoro-onnx` 0.6.1 requires < 3.14, `misaki` requires < 3.13.

### Route A: PyTorch (`kokoro` package)

```bash
uv venv --seed -p 3.12 "$WORKDIR/.venv-kokoro"     # or: python3.12 -m venv "$WORKDIR/.venv-kokoro"
. "$WORKDIR/.venv-kokoro/bin/activate"
# install torch FIRST, choosing the build (otherwise pip pulls a default build you did not choose):
pip install torch --index-url https://download.pytorch.org/whl/cpu      # CPU
pip install torch --index-url https://download.pytorch.org/whl/cu128    # NVIDIA, CUDA 12.8 (or cu130)
pip install kokoro soundfile
```

- Sizes: CPU torch several hundred MB installed (approx.); CUDA torch with its NVIDIA libraries several
  GB (approx. 3-5 GB, unverified). Model `kokoro-v1_0.pth` 327 MB plus ~0.5 MB per voice, downloaded on
  first use into the Hugging Face cache (`~/.cache/huggingface/hub`, moved by `HF_HOME`). Set `HF_HOME`
  to a folder in `WORKDIR` if the user wants everything in one place.
- `KPipeline(lang_code='i', device='cpu'|'cuda')`. Italian text is **not chunked** by the library:
  pre-split on newlines (`split_pattern=r'\n+'`). Speed via `speed=`.
- Kokoro's English G2P (misaki `[en]`) may download a spaCy model at runtime (network + pip inside the venv).

### Route B: ONNX (`kokoro-onnx`)

```bash
uv venv --seed -p 3.12 "$WORKDIR/.venv-kokoro-onnx"
. "$WORKDIR/.venv-kokoro-onnx/bin/activate"
pip install -U kokoro-onnx soundfile               # CPU (onnxruntime)
# GPU instead: pip install -U "kokoro-onnx[gpu]"  (onnxruntime-gpu; CUDA 12.8+/13 and cuDNN 9;
#   pip install "onnxruntime-gpu[cuda,cudnn]" pulls the CUDA/cuDNN wheels). Never install both
#   onnxruntime and onnxruntime-gpu in one venv.
pip install misaki                                 # for Italian phonemisation (see below)
```

- Model files, downloaded once by you (with consent) from the kokoro-onnx GitHub release
  `model-files-v1.1` (check the tag and file names on the releases page):
  `kokoro-v1.0.onnx` 326 MB, or `kokoro-v1.0.fp16.onnx` 164 MB, or `kokoro-v1.0.int8.onnx` 114 MB,
  plus `voices-v1.0.bin` 28 MB. Put them in `WORKDIR/models/`.
- onnxruntime CPU: tens of MB (approx.). onnxruntime-gpu with CUDA/cuDNN wheels: 1-3 GB (approx., unverified).
- Execution provider: env `ONNX_PROVIDER=CPUExecutionProvider` or `CUDAExecutionProvider`.
- `Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin").create(text, voice=..., speed=..., lang=...)` returns
  `(samples, sample_rate)`. Max **510 phonemes** per call: chunk by sentence.
- Italian: `lang="it"` is untested. The project's own example phonemises first with misaki's
  `EspeakG2P(language="it")` and calls `create(phonemes, ..., is_phonemes=True)` (scripts.md).

## Local: Piper (light alternative)

- `piper-tts` 1.8.0; engine licence GPL-3.0 (running it to produce audio is fine; audio output is not
  covered by the GPL). Each voice has its own licence and dataset licence in its model card: check it
  before commercial use.
- Output 22.05 kHz for medium/high voices, 16 kHz for `x_low`. CPU-friendly; GPU with `--cuda` plus
  `onnxruntime-gpu` (unverified on this setup).
- Italian voices: `it_IT-paola-medium`, `it_IT-riccardo-x_low` (16 kHz); also `serena` medium/high
  (CC-BY-4.0 dataset per the research; confirm the exact voice names in the voice list). About 63 MB per
  medium voice (`.onnx` + `.onnx.json`).

```bash
python3.12 -m venv "$WORKDIR/.venv-piper"          # 3.12 is safe; newer may work (unverified)
. "$WORKDIR/.venv-piper/bin/activate"
pip install piper-tts
python3 -m piper.download_voices it_IT-paola-medium   # run inside WORKDIR/voices or pass --data-dir (check --help)
python3 -m piper -m it_IT-paola-medium --data-dir "$WORKDIR/voices" -f out.wav -- 'Testo da leggere.'
```

Speed: Piper's `--length-scale` (> 1 slower; check `python3 -m piper --help` for the 1.8 flag names).

## Other local engines (mention only on request)

- **Chatterbox Multilingual** (Resemble AI): MIT, supports Italian, voice cloning from a reference clip,
  GPU recommended; every output carries an inaudible PerTh watermark. Size: several GB with PyTorch (approx.).
- **XTTS-v2** via the `coqui-tts` fork: multilingual with cloning, but the weights are under the Coqui
  Public Model Licence (non-commercial); model about 1.87 GB.
- Voice cloning of a real person needs that person's consent.

## ElevenLabs (cloud)

- Requirements: an ElevenLabs account; an API key (profile -> API keys) exported as
  `ELEVENLABS_API_KEY`; `pip install elevenlabs` (2.75.0 at research time) in a venv (system Python
  usually fine; use 3.12 if a wheel is missing).
- Call: `ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"]).text_to_speech.convert(text=..., voice_id=...,
  model_id=..., output_format=...)` returns an **iterator of bytes**: write the chunks to a file.
- Models (all support Italian): `eleven_multilingual_v2` (stable for long-form, 10k characters per
  request), `eleven_v4` (10k), `eleven_flash_v2_5` (40k, cheapest and fastest).
- `output_format`: `mp3_44100_128` works on all plans; `mp3_44100_192` needs Creator or higher;
  `wav_44100` / `pcm_44100` need Pro.
- Voices: `GET https://api.elevenlabs.io/v2/voices` with header `xi-api-key` (scripts.md uses Python so
  the key never appears on a command line). Voice library voices may need adding to the account first.
- Continuity across chunks: the API accepts `previous_text` / `next_text` context (unverified for every
  model); otherwise keep chunks at paragraph boundaries.
- Plans (per month): Free 10k credits (non-commercial, attribution may be required; inferred), Starter
  $6, Creator $22, Pro $99. Roughly 1 credit per character on multilingual models (unverified; Flash is cheaper).
- Privacy: data is processed and stored in the US; zero-retention mode is enterprise only. Tell the user
  before sending the script.

## Google Cloud Text-to-Speech (cloud)

- Requirements: a GCP project, billing enabled, the **Text-to-Speech API** enabled in it.
- Auth, in order of preference:
  1. ADC: the user runs `gcloud auth application-default login` (needs the Google Cloud CLI, a few hundred
     MB, approx.) and `gcloud auth application-default set-quota-project PROJECT_ID`.
  2. A service-account JSON key stored outside any repo (e.g. `~/.config/gcloud-keys/tts.json`, mode 600)
     and `export GOOGLE_APPLICATION_CREDENTIALS=...`. Least privilege; delete the key when done.
- `pip install google-cloud-texttospeech`.
- `synthesize_speech(input=SynthesisInput(text=...|ssml=...), voice=VoiceSelectionParams(language_code="it-IT",
  name=...), audio_config=AudioConfig(audio_encoding=AudioEncoding.LINEAR16, sample_rate_hertz=48000,
  speaking_rate=1.0))`. LINEAR16 returns WAV bytes with a header. List voices with
  `list_voices(language_code="it-IT")`; examples `it-IT-Neural2-F`, `it-IT-Chirp3-HD-Kore` (confirm the
  names in the list, they change).
- Limit **5,000 bytes** per request (UTF-8: accented letters take 2 bytes). Chirp 3 HD voices accept
  **no SSML**; Neural2/WaveNet/Standard do (`<break>`, `<say-as>`, `<phoneme>`, `<sub>`, `<prosody>`).
- Free per month: Standard and WaveNet 4M characters, Neural2 and Chirp 3 HD 1M. Then about $16 per 1M
  characters (Neural2) and $30 per 1M (Chirp 3 HD). Verify on the pricing page.

## Amazon Polly (cloud)

- Requirements: an AWS account; an IAM user/role allowed `polly:SynthesizeSpeech` (and
  `polly:DescribeVoices`; the managed policy `AmazonPollyReadOnlyAccess` covers both); credentials from
  `aws configure`, `aws configure sso` + `aws sso login`, or a named profile (`AWS_PROFILE`), or the
  variables `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION`. Prefer SSO or a profile.
- `pip install boto3`.
- `synthesize_speech(Text=..., VoiceId=..., Engine="generative"|"neural"|"standard", OutputFormat="mp3",
  SampleRate="48000", LanguageCode="it-IT", TextType="text"|"ssml")`; read `AudioStream`. `pcm` is
  only 8/16 kHz, so request MP3 and convert with ffmpeg. Accepted MP3 sample rates differ by engine:
  if `48000` is rejected, use `24000` and resample (unverified which engines accept 48000).
- Italian voices: Bianca (generative, neural, standard), Beatrice and Lorenzo (generative), Adriano
  (neural), Carla and Giorgio (standard). No long-form engine for Italian. Generative and neural voices
  are available only in some regions: pick one that lists them (unverified per region).
- Limits: synchronous `SynthesizeSpeech` 3,000 billed characters (SSML tags not billed);
  `StartSpeechSynthesisTask` up to 100k characters, writing to an S3 bucket (needs S3 permissions).
- Pricing per 1M characters: standard $4, neural $16, generative $30. The free tier is uncertain for
  accounts created after 2025-07-15 (AWS changed its free-tier model): check the pricing page.

## Cost estimate formula

`characters (after normalisation, including spaces) / 1,000,000 x price per 1M`, minus any remaining free
quota; Google counts bytes for the limit but characters for billing (unverified); retries and auditions
count too. Give the user the number and the pricing URL.
