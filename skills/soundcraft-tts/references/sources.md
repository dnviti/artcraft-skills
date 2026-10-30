# Sources and verification status

This skill is original writing. Engine facts come from the pages below, read on 2026-10-30; no engine
was installed and no cloud request was made while writing it, so code snippets are templates. Re-check
versions, prices, quotas and voice names at the source before relying on them.

| Topic | Source |
|---|---|
| Kokoro-82M model, voices, licence | https://huggingface.co/hexgrad/Kokoro-82M, voice list `VOICES.md` in that repo |
| `kokoro` Python package (KPipeline, language codes) | https://github.com/hexgrad/kokoro, https://pypi.org/project/kokoro/ |
| misaki G2P (espeak backend) | https://github.com/hexgrad/misaki, https://pypi.org/project/misaki/ |
| kokoro-onnx (API, model files release, GPU extra) | https://github.com/thewh1teagle/kokoro-onnx (releases, `examples/`), https://pypi.org/project/kokoro-onnx/ |
| espeak-ng | https://github.com/espeak-ng/espeak-ng (install docs, Windows `.msi` releases) |
| PyTorch wheels (CPU, cu128, cu130) | https://pytorch.org/get-started/locally/ |
| onnxruntime GPU (CUDA/cuDNN requirements) | https://onnxruntime.ai/docs/execution-providers/CUDA-ExecutionProvider.html |
| uv (Python versions, venvs) | https://docs.astral.sh/uv/ |
| Piper (piper-tts 1.8, GPL-3.0) | https://github.com/OHF-Voice/piper1-gpl, https://pypi.org/project/piper-tts/ |
| Piper voices and model cards | https://huggingface.co/rhasspy/piper-voices |
| Chatterbox Multilingual | https://github.com/resemble-ai/chatterbox |
| XTTS-v2 / coqui-tts | https://huggingface.co/coqui/XTTS-v2, https://github.com/idiap/coqui-ai-TTS |
| ElevenLabs API (convert, output formats, voices) | https://elevenlabs.io/docs/api-reference/text-to-speech/convert, https://elevenlabs.io/docs/api-reference/voices/search |
| ElevenLabs models and limits | https://elevenlabs.io/docs/models |
| ElevenLabs pricing and plans | https://elevenlabs.io/pricing |
| ElevenLabs Python SDK | https://pypi.org/project/elevenlabs/, https://github.com/elevenlabs/elevenlabs-python |
| Google Cloud Text-to-Speech docs | https://cloud.google.com/text-to-speech/docs |
| Google voices, Chirp 3 HD, SSML | https://cloud.google.com/text-to-speech/docs/list-voices-and-types, https://cloud.google.com/text-to-speech/docs/chirp3-hd, https://cloud.google.com/text-to-speech/docs/ssml |
| Google quotas and pricing | https://cloud.google.com/text-to-speech/quotas, https://cloud.google.com/text-to-speech/pricing |
| Google Application Default Credentials | https://cloud.google.com/docs/authentication/provide-credentials-adc |
| Amazon Polly developer guide, voices | https://docs.aws.amazon.com/polly/latest/dg/what-is.html, https://docs.aws.amazon.com/polly/latest/dg/available-voices.html |
| Polly API and limits | https://docs.aws.amazon.com/polly/latest/dg/API_SynthesizeSpeech.html, https://docs.aws.amazon.com/polly/latest/dg/limits.html |
| Polly pricing | https://aws.amazon.com/polly/pricing/ |
| ACX audio submission requirements | https://www.acx.com/help/acx-audio-submission-requirements/201456300 |
| SoundCraft behaviour (import, chain, loudness, bounce, show and approve) | the `soundcraft-audio` skill in this repository |
| FilmCraft `tts.*` commands | the `filmcraft-video` skill in this repository (`references/command-catalog.md`) |

## Verified, inferred and unverified

- Verified against the app (through the `soundcraft-audio` and `filmcraft-video` skills): SoundCraft has
  no TTS command; its import formats; `session.new {name, sample_rate, bit_depth}`; `bounce_mix` returns
  `lufs` and `true_peak_db`; MP3 export goes through ffmpeg; FilmCraft exposes `tts.voices/create/render`
  and may need `tts.downloadVoices`.
- From documentation (not run here): package names and versions, Python version bounds, model sizes,
  sample rates, request limits, API call shapes, voice names, plan names and prices.
- Inferred: RTX 50-series needing CUDA >= 12.8 builds; ElevenLabs Free being non-commercial.
- Unverified (marked in the text): install sizes of PyTorch, onnxruntime and their GPU builds; the
  kokoro-onnx release tag and Italian via `lang="it"`; the misaki import path and return value; Piper's
  GPU path and Serena voice names; ElevenLabs `previous_text`/`next_text` on every model and raw `pcm`
  framing; Google billing by characters vs bytes and `speaking_rate` on Chirp 3 HD; which Polly engines
  accept a 48 kHz MP3 sample rate, regional availability of generative voices and the post-2025-07-15
  free tier; ACX's handling of digital silence and its current policy on synthetic narration; hidden
  prompts through Claude Code's `!` prefix.

Trademarks: ElevenLabs, Google Cloud, Amazon Polly, Kokoro, Piper and ArtCraft/SoundCraft/FilmCraft belong
to their owners. This skill is not affiliated with or endorsed by them.
