# SoundCraft command catalogue (installed build 0.14.0, 482 commands)

Confirm with `list_commands {filter:"<text>"}` (authoritative `params` doc; `?` = optional). Run with
`execute {command, params}` or `batch {calls:[{command,params}], keep_going}`. CLI: `soundcraft-cli run --cmd 'ID={json}'`.
Families (by prefix): view 96 (UI only; useless headless), edit 94, track 66, event 35, options 35, clip 33,
mix 29, setup 20, file 17, transport 13, session 11, automation 10, markers 6, engine 6, midi 6, video 3.

## MCP helper tools
`new_session {name, sample_rate, template:blank|demo}`, `open_session {path}`, `save_session {path, replace}`,
`import_audio {path, track, at}` -> `{imported:[{track, clip, source, frames, channels}]}`,
`bounce_mix {path, format:wav|aiff|flac, bit_depth:"16"|"24"|"32f", start, end, normalize}` ->
`{path, bytes, seconds, peak_db, true_peak_db, lufs}`, `inspect_session {detail}`, `parity`.

## Session and files
`session.new {name, sample_rate=48000, bit_depth=24, template}`, `session.open/close/save/save_as/save_copy/save_template/revert`,
`session.inspect`, `session.audio_health`, `session.format_time {at, format}`, `setup.session {frame_rate, bit_depth,
timecode_start, name}`, `setup.main_format {format:stereo|LCR|Quad|5.1|7.1|7.1.4|...}`, `file.get_info`,
`file.import_audio {path | paths, track, at, new_tracks}`, `file.import_midi {path, at}`, `file.import_video {path, at}`,
`file.import_session_data {path, tracks}`, `file.bounce_mix {path, format, bit_depth, start, end, source:main|<bus>,
normalize, dither, fold_down}`, `file.bounce_stems {dir, ...}`, `file.export_clips {dir, clips, format}`,
`file.export_midi {path, tracks}`, `file.export_session_text`, `file.export_sibelius` (MusicXML), `file.print_score`
(SVG), `file.export_clip_groups`. Formats in: WAV/BWF/RF64, AIFF/AIFC, FLAC, MP3, MP2, Ogg Vorbis, AAC/M4A, ALAC,
CAF, audio of MP4/MOV/MKV/WebM; out: WAV, AIFF, FLAC only. CLI: `soundcraft-cli info|convert|run|script|commands|describe|plugins`.

## Tracks
`track.new {count, format:mono|stereo|5.1.., kind:audio|aux|master|midi|instrument|vca|folder, name, timebase, instrument}`,
`track.rename {track, name}`, `track.delete`, `track.duplicate`, `track.change_width {tracks, format}`, `track.split_into_mono`,
`track.group/ungroup/group_modify`, `track.move`, `track.move_to_folder`, `track.make_inactive`, `track.hide`,
`track.input {tracks, input:none|<bus>}`, `track.output {tracks, output:main|none|<bus>}`, `track.vca`,
`track.playlist_new/duplicate/select/promote`, `track.elastic {algorithm}`, `track.freeze/commit/bounce` (track-level render),
`track.save_preset/load_preset {path}` (JSON), `track.comments`, `track.color`, `track.height`, `track.inspect {track}`.

## Editing (act on the selection unless `tracks/start/end` given)
`edit.select {tracks, start, end, clips, sources, exact}`, `edit.select_all/select_none`, `edit.cut/copy/paste/clear`,
`edit.duplicate`, `edit.repeat {count}`, `edit.shift {by, later}`, `edit.insert_silence`, `edit.separate {at | start/end}`,
`edit.separate_on_grid`, `edit.separate_at_transients {sensitivity}`, `edit.heal`, `edit.trim_to_selection`,
`edit.trim_start_to_insertion`, `edit.trim_end_to_insertion`, `edit.consolidate`, `edit.mute_clips`,
`edit.strip_silence_preview {threshold_db=-48, min_length_ms=50, pad_before_ms, pad_after_ms}` -> ranges,
`edit.strip_silence {... mode:strip|extract|separate}`, `edit.fades_create {shape:linear|equal power|s-curve|exponential|logarithmic,
tracks, start, end}` or `{clip, side:in|out, length, shape, curvature}`, `edit.fades_delete`, `edit.mode {mode:shuffle|slip|spot|grid}`,
`edit.snap_to_grid`, `edit.tool`, `edit.move_clips {clips, by | to, track}`, `edit.trim_clip {clip, start, end}`,
`edit.space_clips`, `edit.snap_next/snap_previous`, `edit.tce_to_timeline` (stretch to selection, pitch kept),
`edit.copy_audio_as_midi` (monophonic pitch tracking), `edit.undo/redo`, `engine.history`.
`clip.gain {clips, db | delta_db}`, `clip.loop {count|length|fill}`, `clip.rename`, `clip.color`, `clip.rating`,
`clip.edit_lock`, `clip.group`, `clip.elastic_properties {ratio}`, `clip.conform_to_tempo`, `clip.effects_set {params}`,
`clip.place_source {source, track, at}`, `clip.clear {clips, sources, with_clips}` (files stay on disk), `clip.inspect {clip}`.

## Mixer
`mix.volume {tracks, db -144..12 | delta_db}`, `mix.pan {tracks, pan -1..1, index}`, `mix.mute/solo/solo_safe/phase_invert`,
`mix.trim {tracks, db}`, `mix.insert {track, slot 0..9|a..j, plugin, params}`, `mix.insert_param {track, slot, param, value}`,
`mix.insert_params {track, slot, params, preset}`, `mix.insert_bypass`, `mix.insert_remove`, `mix.insert_move {from,to}`,
`mix.new_bus {name, format}`, `mix.send {track, slot, bus, level_db, pre_fader}`, `mix.send_level {track, slot, db, pan, mute}`,
`mix.send_remove`, `mix.automation_mode {tracks, mode:off|read|touch|latch|write|trim}`, `mix.instrument {track, plugin, params}`,
`mix.instrument_param`, `mix.sampler_load {track, path, params:{root_note,key_low,key_high,attack,loop_mode..}}`,
`mix.surround_pan`, `mix.record_arm` / `mix.input_monitor` (microphone: do NOT use).
Automation: `automation.set_point {track, param:volume|pan|mute|send_a_level|plugin:a:<param id>, at, value}`,
`automation.write_range {track, param, start, end, value}`, `automation.clear`, `automation.thin {tolerance}`,
`automation.volume_to_clip_gain`, `automation.clip_gain_to_volume`.

## Offline processing
`audiosuite.process {process:<plugin id>|normalize|reverse|invert|gain|duplicate|time_stretch|pitch_shift|varispeed|speed_ramp|
signal_generator, params, clips, tracks, start, end}`. Needs a selection of clips (or track + range).

## Time, MIDI
`event.tempo {bpm, at}`, `event.tempo_linear/parabolic/s_curve`, `event.meter {numerator, denominator}`, `event.add_key_change`,
`event.beat_detective`, `event.identify_beat`, `markers.add {name, at | start,end}`, `markers.edit/delete/recall`,
`transport.locate {at}`, `transport.status`; MIDI: `midi.new_clip {track, start, end|length}`, `midi.note_add {clip, pitch,
start_ticks, length_ticks=480, velocity=100, channel}`, `midi.note_edit/note_delete/notes_move`, `midi.notes {clip}`,
`event.quantize {grid, strength, swing, clips}`, `event.transpose {semitones}`, `event.change_velocity {set|add|scale}`,
`event.change_duration {legato}`, `event.step_input`, `event.midi_rtp`, `event.extract_chords`.
Never call: `transport.record`, `mix.record_arm`, `track.set_record_to_input_only`, `setup.hardware` changes.

## Built-in plugin ids and parameters (from `engine.plugins`; ranges min..max, default)
- `eq_7band`: `input_gain`, `hpf_on` 0/1, `hpf_freq` 10..2000 (80), `hpf_slope` 0..3, `low_shelf_freq|gain|q`, `low_mid_freq|gain|q`
  (250 Hz), `mid_freq|gain|q` (1 kHz), `high_mid_freq|gain|q` (4 kHz), `high_shelf_freq|gain|q` (8 kHz), `lpf_on|freq|slope`, `output_gain`
  (gains -24..24 dB). `eq_1band`: `type` (0 Peak,1 LowShelf,2 HighShelf,3 HighPass,4 LowPass,5 Notch,6 BandPass), `freq` 20..20k, `gain`, `q` 0.1..10.
- `compressor`: `threshold` -60..0 (-20), `ratio` 1..100 (4), `attack` 0.01..300 ms (10), `release` 5..3000 ms (100), `knee` 0..24,
  `makeup` 0..40, `sc_hpf_on|freq`, `limiter` 0/1, `lookahead` 0..10 ms, `mix` 0..100.
- `expander_gate`: `threshold` -80..0 (-40), `ratio`, `range` 0..80 dB, `attack`, `hold`, `release`. `de_esser`: `freq` 2k..16k (6k), `range`
  0..40, `threshold` -60..0, `listen`. `maximizer`: `threshold` -30..0, `ceiling` -30..0 (-0.3), `release` 1..1000.
  `channel_strip` (gate+comp+EQ in one).
- `room_reverb` / `plate_reverb`: `mix` 0..100 (25), `pre_delay` 0..250 ms, `decay` 0.1..20 s (1.2), `size`, `damping` Hz, `diffusion`,
  `width`, `low_cut` Hz. `mod_delay`: `time`, `feedback`, `mix`, `mod_rate`, `mod_depth`, `lpf`.
- Modulation: `chorus`, `flanger`, `phaser`, `auto_pan`, `ring_mod`. Harmonic: `saturator` (`drive`, `bias`, `tone`, `mix`, `output`), `lofi`
  (`bits`, `sample_rate`, `noise`, `mix`), `rectifier`, `subharmonic`. Pitch: `pitch_shifter` (`semitones`, `cents`, `mix`), `time_shift`.
- Utility: `gain` (-96..24 dB), `trim`, `invert`, `dc_offset_removal`, `signal_generator` (`waveform` 0..5, `freq` 20..20k, `level` -96..0 dB),
  `dither` (`bits`, `noise_shaping`).
- Instruments: `subtractive_synth` (`osc1_wave`, `osc2_wave`, `osc2_semitones`, `osc2_detune`, `osc_mix`, `cutoff`, `resonance`,
  `filter_env_amount`, `amp_attack|decay|sustain|release`, `filter_*`, `glide`, ...), `drum_synth` (`kick_tune|decay`, `snare_tune|snappy|decay`,
  `hat_decay`, `open_hat_decay`, `tom_*`, `cymbal_decay`, `level`), `sampler` (`root_note`, `key_low|high`, `attack`..`release`, `loop_mode`, `level`).
- `engine.clap_plugins {rescan}`, `engine.vst3_plugins {rescan}` list installed third-party plugins (`clap:...`, `vst3:...`).

## App-only (need `soundcraft --control PORT` + `soundcraft-cli mcp --connect PORT`)
`screenshot`, `ui_inspect`, `ui_set {state:{window:"Mix"}}`, `menu_invoke {path}`, `click`, `drag`, `key`; `soundcraft-cli app --port P METHOD [JSON]`
(`transport.play`, `ui.screenshot {path}`). Not available in the registered headless MCP.
