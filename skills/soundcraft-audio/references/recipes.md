# SoundCraft recipes

Steps are `{command, params}` for `execute`/`batch` (or `--cmd 'id={json}'` on the CLI). Work in a project folder
inside the allowed roots; after every block run `inspect_session` and a short `bounce_mix` to read levels.

## 1. Podcast / voice clean-up to -16 LUFS
1. `new_session {name:"ep12", sample_rate:48000}`; `import_audio {path:"/abs/raw.wav"}` (track "raw" or rename with `track.rename`).
2. Trim and cut: `edit.select {tracks:["raw"], start, end}` + `edit.separate`, `edit.clear` for coughs/false starts; `edit.mode {mode:"shuffle"}`
   to close gaps; `edit.fades_create {shape:"equal power", tracks:["raw"], start, end}` over each 10 ms joint.
   Long pauses: `edit.strip_silence_preview {threshold_db:-45, min_length_ms:600}` then `edit.strip_silence {... pad_before_ms:80, pad_after_ms:150}`.
3. Chain on the track: `mix.insert {track:"raw", slot:0, plugin:"eq_7band", params:{hpf_on:1, hpf_freq:80, low_mid_gain:-2, high_mid_gain:2}}`,
   slot 1 `de_esser {freq:6500, threshold:-30, range:8}`, slot 2 `compressor {threshold:-22, ratio:3, attack:15, release:120, makeup:4}`,
   slot 3 `maximizer {threshold:-6, ceiling:-1.5, release:80}`.
4. Music bed (optional): `import_audio` on a new track, `mix.volume {tracks:["bed"], db:-22}`, `automation.set_point` ducking under speech
   (volume at the speech start/end, 300 ms ramps).
5. Measure: `bounce_mix {path:"/abs/proj/ep12-test.wav", bit_depth:"24"}` -> read `lufs`, `true_peak_db`. Gain correction =
   -16 - measured: `mix.trim {tracks:["raw"], db: delta}` (or `mix.volume {delta_db}`), re-bounce, confirm -16 +- 0.5 and true peak <= -1.
6. Save session, show and approve (SKILL.md section 7), then final WAV 24-bit / `ffmpeg` MP3 128 kbps after acceptance.

## 2. Song mix skeleton
Tracks: `track.new {kind:"audio", count:n}` / imports per stem (`file.import_audio {paths:[...], new_tracks:true}`), buses
`mix.new_bus {name:"Drums"}` with `track.output {tracks:[...], output:"Drums"}`, reverb aux `track.new {kind:"aux", name:"Plate"}` +
`track.input {tracks:["Plate"], input:"Verb"}` + `plate_reverb {mix:100, decay:1.8, pre_delay:20}`; vocal send `mix.send {track:"Vox", slot:0, bus:"Verb",
level_db:-14}`. Balance with `mix.volume`/`mix.pan`; bus glue `compressor {ratio:2, attack:30, release:100}`; mix bus ends with `maximizer`
or a `gain` insert; leave -6 dB peak on the pre-master mix, bounce, then loudness pass to -14 LUFS / true peak -1.

## 3. Loudness pass (any programme)
Bounce -> `lufs` L and `true_peak_db` P. Add `gain = target - L` dB at the end of the chain (`mix.insert ... plugin:"gain"`, `params:{gain:g}`), put a
`maximizer {ceiling:-1.0}` after it for peaks, re-bounce, repeat until |lufs - target| < 0.5 and P <= -1. If the maximizer pushes more
than ~3 dB of reduction the mix is too dynamic: compress the sources first instead of squashing the master.

## 4. Sound design: tone, sweep, drum pattern
- Tone/noise: new audio track, `edit.select {tracks:["Tone"], start:0, end:{seconds:3}}`, `audiosuite.process {process:"signal_generator",
  params:{waveform:0, freq:440, level:-12}}`; shape with `edit.fades_create`; layer pitch with `audiosuite.process {process:"pitch_shift",
  params:{semitones:-5}}` on a duplicate.
- Synth line: `track.new {kind:"instrument", name:"Lead", instrument:"subtractive_synth"}`, `midi.new_clip {track:"Lead", start:0, length:{seconds:8}}`,
  `midi.note_add {clip:<id>, pitch:60|63|67..., start_ticks:0|960|1920... (960 ticks = one quarter note), length_ticks:960, velocity:90}`, `mix.instrument_param {track:"Lead",
  param:"cutoff", value:...}`, `event.tempo {bpm:100}`, `event.quantize {grid:"1/16", strength:100}`. Drums: instrument `drum_synth`, notes on
  36 (kick), 38 (snare), 42 (closed hat) as defined by the synth: audition by bouncing 2 bars.
- Sampler from a file: `track.new {kind:"instrument", instrument:"sampler"}`, `mix.sampler_load {track, path:"/abs/hit.wav", params:{root_note:60}}`.
  Several zones of one instrument: one sampler track per sample with adjacent `key_low`/`key_high` (and `vel_low`/`vel_high` for layers)
  and the same MIDI on every zone track (verified); libraries, routes and download rules in `sample-libraries.md`.

## 5. Convert / master a file with no session
`soundcraft-cli convert /abs/in.mp3 /abs/out.wav --bit-depth 24 --rate 48000` (peak `--normalize` optional). Loudness of a file:
`bounce_mix` of a session containing it, or `ffmpeg -i f -af ebur128=peak=true -f null -` for a second opinion.

## 6. Stems and MIDI export
`file.bounce_stems {dir:"/abs/proj/stems", format:"wav", bit_depth:"24"}`; `file.export_midi {path:"/abs/proj/song.mid"}`;
`file.export_sibelius {path:"/abs/proj/score.musicxml"}` for notation programs.

## 7. Time-fit a clip
`edit.select {tracks:["Voice"], start:0, end:{seconds:30}}` then `edit.tce_to_timeline {}` stretches the clip to exactly fill the selection
(pitch preserved); or `clip.elastic_properties {clips:[id], ratio:0.95}` on an Elastic track (`track.elastic {algorithm:"polyphonic"}`).
