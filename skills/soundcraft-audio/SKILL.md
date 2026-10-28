---
name: soundcraft-audio
description: "Edit, mix, master and sound-design audio and MIDI in SoundCraft (ArtCraft's Pro-Tools-class DAW, via the `soundcraft` MCP server (mcp__soundcraft__*) or `soundcraft-cli`). Use whenever the user mentions SoundCraft or the soundcraft MCP tools, or asks to edit, clean up, trim, fade, normalise, mix, master or bounce audio; podcast, voice-over, interview, audiobook or music mixes; hit a loudness target (LUFS, true peak); add EQ, compression, de-essing, gating, reverb or delay; build tracks, buses, sends and automation; edit or quantize MIDI and instrument tracks, synthesise sounds or drums; time-stretch/pitch-shift, strip silence, comp takes; convert between WAV/AIFF/FLAC/MP3/OGG, sample rates or bit depths; or work with .scraft sessions. Covers the session-first workflow, loudness verification, bounce and the mandatory show-and-approve phase. Video editing (and mixing audio inside a video timeline) belongs to filmcraft-video; animated motion graphics to effectcraft-motion. No live microphone recording."
license: MIT
metadata:
  author: dnviti
  version: "1.0.0" # x-release-please-version
---

# SoundCraft audio

SoundCraft is an open-source (pre-alpha), Pro-Tools-class digital audio workstation: Edit and Mix
windows, multitrack audio and MIDI, clips with fades/crossfades/clip gain, playlists, busses, sends,
VCAs, inserts (EQ, dynamics, reverbs, modulation, pitch, dither, a subtractive synth, a drum synth, a
sampler, CLAP/VST3 hosting), automation, tempo/meter maps, AudioSuite offline processing, bounce with
loudness measurement. Everything is a command. You drive it with the `soundcraft` MCP server (headless
engine) or `soundcraft-cli` from Bash. This skill says what to do, in what order, to what quality bar,
and how to hand the result to the user.

- Command ids and params by area, plugin parameter ids and ranges: `references/command-catalog.md`
- Recipes (podcast clean-up, music mix, loudness target, sound design, MIDI): `references/recipes.md`

## 0. Ground rules for the tools

MCP tools (`mcp__soundcraft__<tool>`): `list_commands {filter}`, `execute {command, params}`,
`batch {calls:[{command,params}], keep_going}` (up to 1000, stops at first error), `inspect_session
{detail:"summary"|"full"}`, `new_session {name, sample_rate, template:"blank"|"demo"}`, `open_session
{path}`, `save_session {path, replace}`, `import_audio {path, track, at}`, `bounce_mix {path, format,
bit_depth, start, end, normalize}`, `parity`, and **APP_ONLY** tools (`screenshot`, `ui_inspect`,
`ui_set`, `menu_invoke`, `click`, `drag`, `key`) that only work against a running app
(`soundcraft --control 0` + `soundcraft-cli mcp --connect PORT`); headless they fail. All tools are
deferred: load schemas with ToolSearch (`+soundcraft`, max_results 30) before calling them.

- **Discover before guessing.** ~480 commands. `list_commands {filter:"mix."}` (or `"edit."`, `"track."`,
  `"clip."`, `"event."`, `"automation."`, `"midi."`, `"file."`) returns id, label, `params` doc, and
  `enabled`/`disabled_reason`. Never call it unfiltered. The `params` doc is authoritative
  (`{tracks?, db: -144..12 | delta_db}`: `?` optional). Plugin ids and parameter ranges:
  `execute engine.plugins` (large; the catalogue file has the useful ones).
- **Positions** are samples (integers), `{"seconds": 12.5}`, or time strings (`"0:12.500"`,
  `"bars_beats:5|1|000"`, timecode). **Tracks** are referenced by name or id (ids are not 1..n:
  the first audio track in a new session got id 2; always take ids from `inspect_session`).
- **Selection matters**: many edit/AudioSuite commands act on the *selection*. Set it first:
  `edit.select {tracks:["Voice"], start, end}` (or `clips:[id]`), and check `inspect_session`
  (`selection`). `audiosuite.process` fails with "select audio clips first" when the selection holds no
  clips; a track + time range selection works.
- **Errors are readable and harmless** (`isError:true`, e.g. "unknown track", "empty slot", "automation
  path rejected"): fix and rerun; nothing changes. Undo is per command (`edit.undo`, `engine.history`).
- Programmatic calls never open dialogs; `session.inspect` reports exactly what changed.
- **Never record.** `transport.record` and `track.record_arm`/`mix.record_arm` use the microphone/audio
  input; do not call them. Import audio from files instead.

## 1. File access and sessions: check this first (critical)

The MCP is typically registered as `soundcraft-cli mcp` with `--automation-read-root DIR` and
`--automation-write-root DIR` (reads and writes are separate roots; links are followed). Verified behaviour:

- Every path a command reads (open, import, presets) or writes (save, bounce, export, track presets) must
  lie inside a granted root. Outside: `automation path rejected: outside the write root <root>: <path>`.
  That is a permission wall, not a bug: do not retry the same path. Write into an allowed folder
  (the project directory, a scratch dir inside a root), then copy with Bash if the user wants it elsewhere; for reads
  outside the roots copy the file into an allowed folder first. A missing root flag (`mcp` registered
  without them) means *no* file access at all (only in-memory editing and `new_session`); then use the
  **CLI route** (below), which has no roots, and tell the user once that granting roots in the MCP
  server args (`--automation-read-root/--automation-write-root`) is the cleaner fix. Do not edit their config yourself.
- **Never write into the user's source folders by accident**: imports do not move or change the original
  files (a session references them in place until saved), but `save_session` copies the audio next to the
  session (below).
- Headless writes nothing to `~/.config/soundcraft` (verified with `SOUNDCRAFT_NO_PREFS=1`; the desktop
  app is what creates settings, `Autosave/`, `Presets/`, logs).

**Sessions**: `.scraft` files (JSON, MIME `application/x-soundcraft-session`). `save_session {path}` is
required the first time, refuses to overwrite another existing file unless `replace:true`, and copies
the session's audio into an **`Audio Files/` folder beside the session file** (`audio_files_written`).
So give each project its own folder: `<project>/<name>.scraft` + `<project>/Audio Files/`. Re-opening
(`open_session`) reports `missing` sources; fix with the files back in place.

**CLI route (Bash, no roots, deterministic)**: one pipeline per call; good for batch jobs and as a
fallback.

```bash
export SOUNDCRAFT_NO_PREFS=1                         # no prefs/log files in ~/.config
soundcraft-cli run --in /abs/in.scraft \
  --cmd 'mix.volume={"tracks":["Voice"],"db":-3}' --cmd 'mix.insert={"track":"Voice","slot":0,"plugin":"compressor"}' \
  --bounce /abs/out.wav --save /abs/new.scraft --inspect --compact
soundcraft-cli run --demo --cmd ... ; soundcraft-cli script FILE      # FILE: one `ID JSON` per line
soundcraft-cli info /abs/file.wav|session.scraft                      # format JSON / session summary
soundcraft-cli convert IN OUT --bit-depth 16|24|32f --rate 44100 [--normalize] [--dither|--no-dither]
soundcraft-cli commands | describe ID | plugins                       # discovery
```

`run` prints each command's JSON, then bounces, saves and inspects in that order; `--inspect` is
needed when you use `--compact`; `--save` over the `--in` file needs `--in-place`. `convert` normalises
the **peak to -0.1 dBFS** only (not loudness).

## 2. Workflow

1. **Brief**: what is the piece (podcast episode, voice-over, song mix, sound effect, ringtone,
   audiobook chapter), the delivery spec (format, sample rate, bit depth, loudness target, length),
   where the source files are, what must not change. Ask only what you cannot infer.
2. **Safe start**: never edit the user's files. Import into a session (references in place), work in
   the session, bounce to a new file. Create the project folder first (section 1).
3. **Plan the session** (tracks, order of processing, buses) before building (section 3).
4. **Build in passes**, verifying after each (section 5): structure/edit -> clean -> balance -> tone
   and dynamics -> space/effects -> loudness.
5. **Save** the session and **Show and approve** (section 7).
6. **Final bounce/export** only after acceptance (section 6), unless the user asked up front for a
   file to be produced straight away.

Scale the work: "normalise this recording" is import, loudness measure, gain, bounce; not a full mix.

## 3. Craft know-how

**Everything non-destructive**: clips, fades, clip gain, inserts and automation are session data; source
audio is untouched. Offline `audiosuite.process` (normalize, reverse, invert, gain, time_stretch,
pitch_shift, varispeed, speed_ramp, signal_generator, or any plugin id) writes new audio for the
selected clips (undoable, original source stays in the session's clip list): use it for things that must
be baked, prefer inserts for everything adjustable.

**Gain staging first.** Source peaks around -12 to -6 dBFS before processing; set levels with
`mix.volume` / `clip.gain` / `mix.trim`, not by pushing plugins into the red. 24-bit sessions have
headroom: leave -6 dB or more on the way out of the mix, finish loudness at the end. Check a bounce's
`peak_db` / `true_peak_db` / `lufs` (returned by every bounce).

**Insert order on a voice**: `eq_7band` (high-pass `hpf_on` at 70-100 Hz; cut mud 200-400 Hz; presence
boost 2-5 kHz sparingly) -> `de_esser` (`freq` 5-8 kHz) -> `compressor` (ratio 2-4:1, attack 10-30 ms,
release 80-150 ms, 3-6 dB gain reduction, `makeup` to restore level) -> optional `expander_gate` for
noise between phrases (`range` 10-20 dB, not a hard gate) -> `maximizer` or the compressor's `limiter`
as the last stage on the main path. Reverb on an aux bus, not per-track inserts: `mix.new_bus`, a
`plate_reverb` / `room_reverb` insert (`mix:100`, `decay`, `pre_delay` 10-30 ms, `low_cut`) on an aux
track whose input is that bus (`track.input {tracks:["Reverb"], input:"Verb"}`), and sends with
`mix.send {track, slot, bus, level_db}`.

**Music mix**: rough balance with faders and pan first; high-pass everything that is not bass/kick;
carve one instrument per frequency area; bus compression gently (1-3 dB) on drums/vocals; automate
volume/pan with `automation.set_point` rather than riding clip gain when level moves with time;
automate on the mix not on the master. Check in mono (pan both to centre or `track.change_width`
test) and at low level.

**Editing**: `edit.select` -> `edit.separate` / `edit.cut` / `edit.clear` / `edit.trim_to_selection`;
close gaps with Shuffle mode (`edit.mode {mode:"shuffle"}`; Slip is the default and leaves gaps).
`edit.strip_silence_preview` first, then `edit.strip_silence {threshold_db:-48, min_length_ms,
pad_before_ms, pad_after_ms, mode}`; crossfade every cut (`edit.fades_create {shape:"equal power"|
"s-curve", tracks, start, end}` over the selection, or a `clip`/`side`/`length` form), 5-20 ms on
speech edits, never leave an unfaded cut. Remove clicks with `edit.heal`. Multiple takes: playlists
(`track.playlist_new`, `track.playlist_promote`), clip ratings (`clip.rating`).

**Time and pitch**: tempo is session data (`event.tempo {bpm}`, `event.meter`); stretch audio to a length
with `edit.tce_to_timeline` (pitch preserved) or `audiosuite.process {process:"time_stretch"|
"pitch_shift"}`; `track.elastic {algorithm}` + `clip.elastic_properties {ratio}` for warping.
`event.beat_detective`/`event.identify_beat` for tempo from audio.

**MIDI and synths**: `track.new {kind:"instrument", name, instrument:"subtractive_synth"|"drum_synth"|"sampler"}`
(or `mix.instrument`); `midi.new_clip {track, start, length}`, `midi.note_add {clip, pitch, start_ticks,
length_ticks, velocity}` (480 ticks per quarter note; 60 = middle C), `midi.notes_move`, `event.quantize
{grid:"1/16", strength, swing}`, `event.transpose`, `event.change_velocity`; `file.import_midi`,
`file.export_midi`; synth parameters via `mix.instrument_param {track, param, value}`. Sampler:
`mix.sampler_load {track, path}`. Test tones/sweeps: `audiosuite.process {process:"signal_generator",
params:{waveform,freq,level}}` over a time selection.

**Loudness and formats** (measure with the bounce result, `lufs` = integrated LUFS):
- Podcast/spoken word: **-16 LUFS stereo** (-19 mono) integrated, true peak <= -1 dBTP (Apple/Spotify
  podcasts; -14 to -16 is common). Audiobooks (ACX): RMS -23 to -18 dBFS, peaks <= -3 dBFS, noise
  floor below -60 dBFS.
- Music streaming: about **-14 LUFS** integrated (Spotify, YouTube; Apple Music -16), true peak
  <= -1 dBTP (-2 for lossy delivery headroom). Don't crush dynamics to chase loudness.
- Broadcast: EBU R128 **-23 LUFS** (+-0.5), true peak <= -1 dBTP; US ATSC A/85 -24 LKFS.
- Video/social: -14 LUFS, true peak <= -1 dBTP.
- Delivery formats: WAV 24-bit for masters/stems/hand-off; WAV/FLAC 16-bit for CD-quality (dither on);
  44.1 kHz for music/podcast, 48 kHz for video; MP3/AAC/Ogg export is **not available** (they import
  only): for a lossy file, bounce WAV/FLAC and encode with `ffmpeg` (tell the user).
- `normalize:true` in a bounce/`audiosuite normalize` is **peak** normalisation to -0.1 dBFS, not
  loudness: a quiet file normalised this way read -4.4 LUFS in testing. For a loudness target, bounce,
  read `lufs`, correct with gain (`mix.volume`/`mix.trim`/`gain` insert, `delta_db: target - measured`),
  limit with `maximizer` (`ceiling` -1.0), bounce again, confirm `lufs`/`true_peak_db`. Two passes are
  normal; short test clips measure unreliably (integrated loudness wants >= a few seconds of signal).

## 4. Building blocks (details in the catalogue)

| Goal | Commands |
|---|---|
| Session | `new_session`, `open_session`, `save_session`, `session.save_as/save_copy`, `setup.session {frame_rate, bit_depth}`, `file.get_info` |
| Import | `import_audio {path, track, at}` / `file.import_audio {paths, new_tracks}`, `file.import_midi`, `file.import_video` (audio of a movie; picture editing belongs to filmcraft-video) |
| Tracks | `track.new {count, kind:audio\|aux\|master\|midi\|instrument\|vca\|folder, format, name}`, `track.rename`, `track.delete`, `track.duplicate`, `track.group`, `track.move_to_folder` |
| Edit | `edit.select`, `edit.separate`, `edit.cut/copy/paste/clear`, `edit.duplicate`, `edit.repeat`, `edit.shift`, `edit.strip_silence`, `edit.fades_create`, `edit.mode`, `edit.undo/redo` |
| Clips | `clip.gain`, `clip.rename`, `clip.loop`, `clip.elastic_properties`, `clip.rating`, `edit.move_clips`, `edit.trim_clip` |
| Mix | `mix.volume`, `mix.pan`, `mix.mute/solo`, `mix.trim`, `mix.insert/insert_param/insert_params/insert_bypass/insert_remove/insert_move`, `mix.new_bus`, `mix.send/send_level`, `mix.phase_invert` |
| Automation | `automation.set_point {track, param:volume\|pan\|mute\|send_a_level\|plugin:a:<id>, at, value}`, `automation.write_range`, `automation.thin`, `mix.automation_mode` |
| Time/markers | `event.tempo`, `event.meter`, `markers.add {name, at}`, `transport.locate` |
| Offline | `audiosuite.process {process, params, ...}` |
| Output | `bounce_mix` (= `file.bounce_mix {path, format, bit_depth, start, end, source, normalize, dither, fold_down}`), `file.bounce_stems {dir}`, `file.export_clips`, `file.export_midi` |
| Check | `inspect_session`, `session.audio_health`, `engine.history`, `markers`/`transport.status` |

## 5. Verify loop (mandatory)

SoundCraft cannot be listened to headless, so verify with numbers and structure:

1. **Structure**: `inspect_session` (tracks, clips with start/end/gain/fades, inserts and their params,
   sends, busses, automation, markers, selection, `length_samples`, `dirty`); check you edited the
   intended track (ids vs names) and that nothing is muted/inactive by accident.
   `session.audio_health` flags missing media, sample-rate mismatches, clips beyond source bounds.
2. **Levels**: every `bounce_mix` returns `peak_db`, `true_peak_db`, `lufs`, `seconds`, `bytes`. Bounce
   short ranges (`start`/`end`) to compare before/after a change: same range, same settings.
   Targets: no clipping (`peak_db` < 0, `true_peak_db` <= -1 for delivery), `lufs` at the spec,
   `seconds` equal to the expected duration (a wrong length means an edit or selection error).
3. **Content check** when numbers are not enough: bounce, then analyse the file with `ffmpeg`
   (`-af astats,ebur128` or `silencedetect`, `volumedetect`) or Python; `soundcraft-cli info FILE`
   gives format/frames/rate. Ask the user to listen at show-and-approve for anything taste-related;
   say clearly that you could not hear it.
4. **Edit checks**: after cuts, `edit.strip_silence_preview`, marker names, and a bounce of each cut point
   range; look for gaps, doubled words, missing fades.
5. **Fix and repeat**: `edit.undo`, change the parameter, re-bounce. Clean up your test bounces.

## 6. Save and export

- Save the session (`save_session`, project folder, `.scraft`, descriptive name `ep12-voice-v2.scraft`).
- **Bounce**: `bounce_mix {path, format:"wav"|"aiff"|"flac", bit_depth:"16"|"24"|"32f", start, end,
  normalize}` (no `start`/`end` = whole session; set the range to the music/speech, not to a stray
  long clip). `file.bounce_mix` adds `source: "main"|<bus name>`, `dither` (default true; matters at 16-bit),
  `fold_down`. Stems: `file.bounce_stems {dir, format, bit_depth}`. Mono sources bounce to a stereo file
  (main bus is stereo unless `setup.main_format`).
- Deliverables: report absolute paths, format, duration, measured LUFS/true peak. For MP3/AAC/Ogg run
  `ffmpeg -i master.wav -codec:a libmp3lame -b:a 192k out.mp3` (podcast speech 96-128 kbps mono is
  common) and verify the result with `ffprobe`.
- Everything lands inside the write roots; copy to the requested place afterwards if outside.

## 7. Show and approve (mandatory final phase)

Every task ends here, after the verify loop. The headless session has no window and nobody can listen to
it, so the user cannot judge the work until the session is saved and the real app is open on it.

1. **Save** the session (`save_session {path}`, `replace:true` only to overwrite your own earlier
   version of the same project) in the project directory or the path the user named, with a descriptive
   name; also keep a rough bounce next to it for quick listening. Note the full absolute paths.
2. **Open SoundCraft on that file, detached** (verified: `/usr/bin/soundcraft`, `soundcraft [OPTIONS]
   [FILES]...`; desktop entry `ai.storyteller.soundcraft`):
   `setsid soundcraft /abs/path/project.scraft >/dev/null 2>&1 &`
   The app opens sessions (`.scraft`), audio (WAV, AIFF, FLAC, MP3) and MIDI files; MIME types
   `application/x-soundcraft-session`, `audio/x-wav`, `audio/x-aiff`, `audio/flac`, `audio/mpeg`,
   `audio/midi`. `setsid xdg-open /abs/path/project.scraft >/dev/null 2>&1 &` also works. Add
   `--no-audio` only if the user has no audio device or wants it silent. If the user already has the app
   open on this project (`--control` session), do not launch another copy; ask them to reopen/refresh.
   Do not leave extra instances you started running beyond the task if the user did not ask for the app.
3. **Stop and ask.** Give the full session path (and the bounce path) and ask the user to listen and
   accept, or describe changes. No final export, delivery in other formats, stems or loudness
   re-masters before explicit acceptance. Silence or a vague reaction is not acceptance.
4. **Loop on changes**: apply them, re-run the verify loop for what changed, save (new version name or
   `replace:true`), reopen/refresh, ask again.
5. **Inside a subagent** (cannot talk to the user): do steps 1 and 2, then return the session path, the
   preview bounce path, a short summary (tracks, effects, measured LUFS/peaks) and state clearly that
   **user approval is pending**. The orchestrator asks the user and relays changes; the final export
   waits for acceptance.

## 8. Top gotchas

- Roots: reads/writes outside the granted roots are rejected; no roots registered
  means no file access (use the CLI route).
- Session ids are not 1..n; use names or ids from `inspect_session`. Track refs given as ids that do not
  exist give "unknown track N".
- `audiosuite.process` and many `edit.*` need a selection first; `mix.insert` and friends need a track
  (`track` param) and a *free or valid* slot (`slot` 0..9 or a..j); `mix.insert_param` on an empty slot errors.
- `save_session` writes an `Audio Files/` folder next to the session; saving elsewhere later repeats the copy.
- `normalize` = peak -0.1 dBFS, not LUFS. Bounce range defaults to the whole session length.
- Never `transport.record` / arm tracks (microphone). Playback (`transport.play`) is for the app.
- MP3/AAC/Ogg are import-only; export WAV/AIFF/FLAC and encode with ffmpeg.
- `file.import_video` imports a movie's audio and picture track; video editing is filmcraft-video.
- CLAP/VST3/AU plugins (`engine.clap_plugins`, `engine.vst3_plugins`) come from the system; ids look like
  `clap:...`; the built-in plugins are enough for most jobs and always available.
- Pre-alpha software: if a command misbehaves (unexpected clip layout, empty bounce), inspect, undo, and
  report instead of piling workarounds. Do not leave test sessions/bounces around; never delete user files.
