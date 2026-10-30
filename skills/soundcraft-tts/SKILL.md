---
name: soundcraft-tts
description: "Turn text into finished spoken audio: text to speech (TTS, voice synthesis, sintesi vocale) generated with a local or cloud engine, then imported, cleaned and mastered in SoundCraft (ArtCraft's DAW, `soundcraft` MCP server). Use whenever the user asks for a voice-over from a script, narration, an audiobook chapter, a podcast intro, e-learning or IVR prompts read by a synthetic voice, or names Kokoro, Piper, ElevenLabs, Google Cloud TTS or Amazon Polly. Asks which engine to use unless the user named one, shows its requirements and installs or configures only with consent (CPU or GPU), keeps API keys out of the project and chat, auditions 2-3 voices, synthesises in chunks, masters to a loudness target (-16 LUFS podcast, ACX audiobook, -14 LUFS video) and ends with the mandatory show-and-approve phase. Needs soundcraft-audio to import and master. Editing or mastering existing recordings belongs to soundcraft-audio; narration built inside a FilmCraft video can use FilmCraft's own tts.* commands (filmcraft-video)."
license: MIT
metadata:
  author: dnviti
  version: "1.1.0" # x-release-please-version
---

# SoundCraft text to speech

SoundCraft has **no text-to-speech command**: speech is generated outside it by a TTS engine (a local
model or a cloud API), written as audio files into a work folder, then imported into a SoundCraft session
where it is edited, cleaned, mastered to a loudness target and handed to the user. SoundCraft imports WAV,
AIFF, FLAC, MP3, OGG, AAC/M4A, ALAC and CAF. This skill covers the engine choice, safe setup, script
preparation, voice auditions and synthesis; for everything that happens inside SoundCraft it points to
the `soundcraft-audio` skill (load it too) instead of repeating it.

**Fit the voice to the brief, not the default.** Left alone, an agent takes the engine's first voice at
speed 1.0 with the same pause everywhere, and every narration sounds alike. Choose the voice, pace and
pauses from the brief (audience, tone, length, brand, language), audition 2-3 genuinely different
candidates and let the user pick. The user's explicit choice of voice or engine always wins.

- Per-engine requirements, install sizes, voices, limits, pricing and licences: `references/providers.md`
- Ready-to-adapt scripts (hardware check, chunker, each engine, concatenate and resample): `references/scripts.md`
- Source URLs and what is verified: `references/sources.md`

## 0. Ground rules

- **Ask before choosing the engine** (section 1) unless the user already named one, and only then show
  that engine's requirements.
- **Consent before anything persistent**: no package, venv, model download or system package without
  the user's explicit OK, after showing exactly what will be installed, where, and how big it is.
  System packages (espeak-ng, Python 3.12) go through the system package manager (e.g. `sudo dnf
  install …` on Fedora), which the user runs in their own terminal, never you.
- **Consent before sending text to a cloud provider**: name the provider that will receive the script
  (and where it stores data, see providers.md) before the first request.
- **Secrets** (section 2.3): environment variables only; never in project files, never in chat, never
  printed, never committed.
- **Work folder**: ask the user for one (e.g. `~/Audio/<project>-tts/`). It must lie inside SoundCraft's
  `--automation-read-root` (and the write root for bounces and the session; see `soundcraft-audio`,
  "File access and sessions"). Generated audio, scripts and chunks live there. **Venvs and model caches
  never go inside a git repository** (`git -C DIR rev-parse 2>/dev/null` prints nothing); if the work
  folder is in one, put them in a folder outside it. Deliverables go wherever the user names.
- **Never record from a microphone.** This skill only synthesises.
- **Inside a subagent** (cannot ask the user): do not pick the engine or install anything; return the
  engine question (section 1) or the requirements list (section 2) to the orchestrator and stop.

## 1. Choose the engine (ask first, unless the user already named one)

Ask one question with the multiple-choice question tool (AskUserQuestion in Claude Code; else a
numbered list) and wait:

| Option | Runs | Cost | Text leaves the machine | Setup | Notes |
|---|---|---|---|---|---|
| **Local: Kokoro** (default) | CPU or NVIDIA GPU | free | no | Python 3.12 venv + espeak-ng + ~0.4 GB model (more with GPU PyTorch) | Apache-2.0, 24 kHz, 54 voices in 9 languages (Italian: `if_sara` F, `im_nicola` M) |
| **Local: Piper** (light) | CPU (GPU optional) | free | no | venv + ~63 MB per voice | GPL-3.0 engine, per-voice licences, 22.05 kHz, robotic-to-good |
| **ElevenLabs** | cloud | free tier then paid plans | yes (stored in the US) | account + API key | most expressive; commercial use needs a paid plan (inferred: check the plan terms) |
| **Google Cloud TTS** | cloud | free monthly quota then per character | yes | GCP project + billing + ADC login | Neural2, WaveNet, Chirp 3 HD voices; SSML on most (providers.md) |
| **Amazon Polly** | cloud | per character | yes | AWS account + IAM credentials | generative/neural/standard voices; SSML |

If the narration is for a **FilmCraft video**, also offer FilmCraft's built-in `tts.voices` /
`tts.create` / `tts.render` (voice models may need `tts.downloadVoices`, a network download: ask
first). That path stays in FilmCraft and belongs to the `filmcraft-video` skill.
Other local engines exist (Chatterbox Multilingual, XTTS-v2); mention them only if the user asks for
voice cloning or more expressiveness (providers.md lists their caveats).

## 2. Requirements and setup (after the choice, with consent)

Show the requirements for the chosen engine only, collect what is missing, get an OK, then set up.
Full commands: providers.md (what and why) and scripts.md (the code).

### 2.1 Local engines: check the machine first

Run read-only checks and report them in one short block:

- **GPU**: `nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader` and the
  "CUDA Version" in the `nvidia-smi` header (the highest CUDA the driver supports). No `nvidia-smi` or
  an error means **CPU**. Kokoro (82M parameters) and Piper run acceptably on CPU; a GPU mainly speeds
  up long jobs. RTX 50-series (Blackwell) needs CUDA 12.8 or newer wheels (inferred from NVIDIA/PyTorch
  support matrices; unverified on hardware).
- **Python**: `python3.12 --version`, `uv --version`. Kokoro needs a **3.12 venv** (why and how:
  providers.md).
- **espeak-ng** (Kokoro only): `command -v espeak-ng`.
- **ffmpeg** (all engines, for concatenating and resampling): `command -v ffmpeg`.
- **Disk**: `df -h WORKDIR`.

Then present the install list for the chosen route, for example (sizes approximate, see providers.md):

> To use Kokoro on CPU I need to install, in `WORKDIR/.venv-kokoro` (Python 3.12):
> `kokoro`, `soundfile` and the CPU build of PyTorch (several hundred MB). On first use Kokoro downloads
> its model (327 MB) and each voice (~0.5 MB) to the Hugging Face cache (`~/.cache/huggingface/hub`).
> You need `espeak-ng`: please install it with your system package manager in your own terminal
> (e.g. `sudo dnf install espeak-ng` on Fedora). Total roughly 1 GB.
> OK to proceed?

Kokoro has two routes; pick with the user (sizes, GPU builds and caveats in providers.md): **Route A,
PyTorch** (`kokoro`), the best-supported path but heavy with GPU; **Route B, ONNX** (`kokoro-onnx`),
lighter and CPU by default.

Piper: `piper-tts` in a venv plus one voice file per voice (~63 MB medium quality). Light and CPU-friendly.

After installing, measure what was actually used (`du -sh` on the venv, the model files and the
Hugging Face cache entries) and tell the user.

### 2.2 Cloud engines: account and credentials

List what the user needs before anything else, and stop until they have it:

- **ElevenLabs**: an account and plan that allows the intended use (Free is non-commercial, inferred),
  an API key in `ELEVENLABS_API_KEY`, `pip install elevenlabs` in a venv.
- **Google Cloud TTS**: a GCP project with billing and the Text-to-Speech API enabled; authentication
  by Application Default Credentials (`gcloud auth application-default login`, preferred) or a
  service-account JSON kept outside any repo and pointed to by `GOOGLE_APPLICATION_CREDENTIALS`;
  `pip install google-cloud-texttospeech`.
- **Amazon Polly**: an AWS account, an IAM identity allowed `polly:SynthesizeSpeech` (e.g. the
  `AmazonPollyReadOnlyAccess` managed policy), credentials from `aws configure` / `aws sso login` /
  a named profile (`AWS_PROFILE`), a region (`AWS_REGION`); `pip install boto3`.

Give an estimate of the cost for the script length (characters x the provider's rate, minus any free
quota; providers.md) and say that prices must be checked on the pricing page.

### 2.3 Secrets

- Scripts read keys from environment variables only. Prefer keyless logins (Google ADC, AWS SSO or
  profiles) over long-lived keys.
- Never hard-code a key, write it into the work folder, a project file or a committed `.env`, print it,
  or ask the user to paste it into the chat.
- The user sets it in their own terminal: either `export` it before starting the agent, or create an env
  file **outside any repo** with mode 600, entering the key with a hidden prompt (scripts.md §1). Your
  Bash calls load that file in the same command that runs the synthesis (`set -a; . FILE; set +a`).
- Check presence without revealing the value: `[ -n "$ELEVENLABS_API_KEY" ] && echo set || echo missing`.
- At the end remind the user how to revoke or delete a key they created only for this job.

## 3. Script preparation

1. **Get the final text** and the brief: language, audience, tone, target length, delivery (podcast,
   audiobook, video, e-learning), and the loudness target (section 6).
2. **Normalise for speech**: spell out numbers, dates, currencies, units, abbreviations and acronyms the
   way they must be read ("2026" -> "duemilaventisei" if the engine misreads it); expand symbols (%, &,
   /); remove markup, URLs and footnote marks; check accents in Italian (perché, città).
3. **Pronunciation**: list names and foreign words; test them in the audition. Fix with respelling for
   local engines and ElevenLabs; with SSML `<phoneme>`, `<say-as>` and `<sub>` on Google and Polly where
   the voice supports it (providers.md).
4. **Pacing**: decide pauses from the content, not uniformly: short (150-400 ms) between chunks of the
   same paragraph, longer between paragraphs and sections (a taste guideline, tune with the user).
   SSML `<break time="600ms"/>` where supported; elsewhere punctuation, line breaks and inserted silence.
   Speed: most engines take a rate (Kokoro/kokoro-onnx `speed`, Google `speaking_rate`, Polly SSML
   `<prosody rate>`); keep it within about 0.9-1.1 unless the brief says otherwise.
5. **Chunk** (scripts.md chunker): split on paragraphs, then sentences, so every chunk stays under the
   engine's per-request limit (per engine in providers.md). Never split mid-sentence. Save `script.txt`
   and `chunks/NNNN.txt` in the work folder.

## 4. Audition voices (the user chooses)

1. Shortlist 2-3 voices that differ in a way that matters for the brief (female/male, warm/bright,
   calm/energetic, or the same voice at two speeds), all in the script's language. List them from the
   engine (providers.md: Kokoro voice ids, Piper voice names, ElevenLabs `GET /v2/voices`, Google
   `list_voices(language_code=...)`, Polly `describe_voices`). Do not just take the first entry.
2. Render **one representative sentence** (with a hard name or number in it) per candidate:
   `WORKDIR/auditions/01-if_sara-1.00.wav`, `02-im_nicola-0.95.wav`, ...
3. Let the user listen (`xdg-open FILE`, or import them on separate tracks of an audition session and
   open SoundCraft, see `soundcraft-audio`, "Show and approve"). You cannot hear them: say so.
4. Ask with the multiple-choice question tool (AskUserQuestion in Claude Code; else a numbered list):
   which voice, and whether speed or pauses should change. Repeat
   once with adjustments if needed; then lock voice, model and settings for the whole job.

## 5. Synthesise

1. Render every chunk with the **same voice, model and settings** to `WORKDIR/tts/NNNN.wav` (or `.mp3`
   for ElevenLabs and Polly), logging chunk id, characters and duration. Retry a failed chunk alone.
2. Check each file (`ffprobe` or `soundcraft-cli info`): non-zero duration roughly proportional to its
   text, expected sample rate, no clipping. A chunk far shorter than its text means truncation: re-render it.
3. Assemble (scripts.md §6): decode all chunks to one format at the engine's native rate, concatenate
   with the planned gaps, then resample to the session rate (48 kHz, 24-bit WAV) with ffmpeg or sox:
   `WORKDIR/narration-48k.wav`. For long-form work (audiobook chapters) you may instead import the
   chunks as separate clips (section 6) so that a single sentence can be re-taken later.
4. Mispronunciation found later: fix the text of that chunk, re-render only it, re-assemble.

## 6. Import, clean and master in SoundCraft

Load the `soundcraft-audio` skill and follow it; the TTS-specific parts are:

1. **Session**: `new_session {name, sample_rate:48000}` (or `execute session.new {name, sample_rate:48000,
   bit_depth:24}`), then `import_audio {path:"WORKDIR/narration-48k.wav", track:"Voice"}` (or
   `file.import_audio {paths:[...], new_tracks:true}` for separate chunks). Paths must be inside the
   read root (`soundcraft-audio`, "File access and sessions").
2. **Edit** (`soundcraft-audio`, "Craft know-how", Editing): tighten or lengthen pauses where the pacing is wrong,
   `edit.strip_silence_preview` before any `edit.strip_silence`, head and tail fades, short fades on
   every cut.
3. **Voice chain** (`soundcraft-audio`, "Craft know-how", insert order; recipe 1 in its `references/recipes.md`):
   `eq_7band` -> `de_esser` -> `compressor` -> `maximizer`. Synthetic voices are usually clean and
   even: skip the gate, compress lightly (1-3 dB of gain reduction), use the de-esser when the voice is
   bright, high-pass around 70-90 Hz.
4. **Loudness** (`soundcraft-audio`, "Craft know-how", Loudness and formats; recipe 3): bounce, read `lufs` and
   `true_peak_db` from `bounce_mix`, correct the gain, re-bounce. Targets:
   - Podcast / spoken word: -16 LUFS integrated (stereo; -19 mono), true peak <= -1 dBTP.
   - Audiobook (ACX): RMS -23 to -18 dB, peaks <= -3 dBFS, noise floor below -60 dB. `bounce_mix`
     reports LUFS, not RMS: measure RMS with `ffmpeg -af astats` (`soundcraft-audio`, "Verify loop").
     Pure digital silence between chunks may be flagged by ACX review (unverified): a very low room-tone
     bed avoids it. ACX has historically required human narration for its catalogue: check its current
     policy on synthetic voices before producing for ACX (unverified).
   - Video / social: -14 LUFS, true peak <= -1 dBTP (FilmCraft deliveries follow the video's spec).
5. **Lossy delivery**: SoundCraft bounces WAV/AIFF/FLAC only; encode MP3 with `ffmpeg` after approval
   (`soundcraft-audio`, "Save and export").

## 7. Verify

- **Structure**: `inspect_session`: one voice track (or the chunk clips in order, no overlaps), the
  inserts in the planned order, nothing muted.
- **Duration**: the session length matches the sum of the chunks plus gaps; an unexpected difference
  means a missing or doubled chunk.
- **Levels**: the last `bounce_mix` meets the target (`lufs` within 0.5 LU, `true_peak_db` at or under
  the ceiling; ACX RMS and peaks via ffmpeg).
- **Content**: you cannot listen. Spot-check that each chunk's duration fits its text; say plainly that
  pronunciation and naturalness need the user's ears.

## 8. Show and approve (mandatory final phase)

Follow `soundcraft-audio`, "Show and approve": save the session in the work folder with a descriptive name, keep a
rough bounce beside it, open SoundCraft on the session detached, give the absolute paths, the voice and
engine used and the measured LUFS / true peak, and **stop and ask** the user to listen and accept or
describe changes. No final export, MP3 encode or delivery before explicit acceptance. Changes loop back
to section 5 (re-render chunks) or section 6 (mix). Inside a subagent: save, open, return the paths and
summary, and state that user approval is pending.

## 9. Cleanup and handoff

- Remove your own test files (failed chunks, temporary concatenations) once the result is approved; keep
  the script, chunks, chosen auditions and the session until the user says otherwise.
- **Venvs and model caches are the user's to keep or remove**: report each with its size (`du -sh`) and
  the command that would remove it (venv folder, Kokoro ONNX model files, Piper voice files, the Hugging
  Face cache entry `models--hexgrad--Kokoro-82M`). Do not delete them unasked; they make the next job
  instant. Mention system packages you asked the user to install (espeak-ng) so they can remove them.
- Cloud: say how many characters were sent (cost estimate) and remind the user about key revocation
  (section 2.3). Never leave a key in a file you created inside a project.
- Close any SoundCraft instance you started that the user did not ask to keep.
