---
name: filmcraft-video
description: "Edit video, colour-grade and mix sound in FilmCraft (ArtCraft's Premiere Pro-class non-linear editor, via the `filmcraft` MCP server (mcp__filmcraft__*) or `filmcraft-cli`). Use whenever the user mentions FilmCraft or the filmcraft MCP tools, or asks to edit/cut/trim/assemble video clips on a timeline, make a rough cut or highlight reel, add transitions, titles, captions or subtitles, speed up/slow down/reverse clips, colour-correct or grade footage (Lumetri, LUTs, scopes), balance dialogue/music/video audio levels, proxies, transcribe-and-cut, multicam, or export a video (MP4/H.264, ProRes, DNxHR, MXF, GIF, PNG sequence, audio-only) or interchange (EDL, FCP XML, AAF, OTIO); also .fcproj files. Covers ingest, sequence setup, assembly, trim, grade, mix, frame-preview verify, export and the mandatory show-and-approve phase. Animated titles, VFX, keying and motion graphics belong to effectcraft-motion, audio-only work to soundcraft-audio, still images to photocraft-images."
license: MIT
metadata:
  author: dnviti
  version: "1.1.0" # x-release-please-version
---

# FilmCraft video editing

FilmCraft is an open-source, Premiere Pro-class NLE (alpha, v0.14): bins, sequences with video/audio/
caption tracks, source monitor, ripple/roll/slip/slide trims, transitions, 130 video effects, Lumetri-style
colour with LUTs and scopes, audio mixer with Essential Sound, titles/graphics, captions, transcript editing,
multicam, proxies, export queue. Project file: `.fcproj`. Codecs are the app's own (no FFmpeg inside).
You drive it with the `filmcraft` MCP server (headless engine) or `filmcraft-cli` from Bash. This skill says
what to do, in what order, to what quality bar, and how to hand the result over.

**An edit has a voice; the default voice is the stock montage.** Unsteered, you will cut every piece
the same way: drone or slow-mo opener, cross dissolves on the beat, the "Cinematic" preset grade,
word-pop captions. Corrective jobs (trims, cleanup, conforming, deliverables) stay invisible; where
the cut has character to give, it comes from a rhythm borrowed from outside video templates, an
editing rule that forbids the easy move, alternative cuts the user picks between, and a viewer who
did not edit it. The user's references, brand film or broadcast spec win.

- Command ids and params by area: `references/command-catalog.md`
- Recipes (rough cut, interview cleanup, grade, speed ramp, social vertical, proxies, interchange): `references/recipes.md`
- Siblings: `effectcraft-motion` (animated titles, keying, VFX, composites; render ProRes/PNG to bring here),
  `soundcraft-audio` (audio-only production, repair, mastering), `photocraft-images` (stills/thumbnails).

## 0. Ground rules for the tools

MCP tools: `command_list`, `command_run`, `command_batch`, `doc_inspect`, `project_inspect`, `sequence_inspect`,
`media_import`, `render_frame` / `render_preview` (same PNG), and bridge-only `ui_elements`, `ui_click`,
`ui_drag`, `ui_key`, `ui_type`, `ui_screenshot`, `ui_inspect`, `ui_control`. They are deferred: load schemas
with ToolSearch (`+filmcraft`, max_results 20) first. The registered server is headless (no window).

- **Every action is a command** (710). Discover with `command_list {filter:"lumetri."}` (id, label, shortcut,
  `params` doc, enabled). Never call it unfiltered (190 KB). Trust the installed `params` doc
  (`{"seconds":f64=5}` = optional number with default). Bash: `filmcraft-cli commands <filter>`, `filmcraft-cli describe <id>`.
- **Time is in ticks: 254016000000 per second.** Many commands also take `seconds`, `frame` or `timecode`; use
  those when offered. Where a command takes `time:ticks`, **send an integer**: a float tick value silently did
  nothing (`timeline.razor` returned `cuts:0`).
- **Ids**: items (bin entries: sequences, clips, graphics) and timeline clips have numeric ids from
  `project_inspect` / `sequence_inspect`. Tracks are `"V1"`, `"A1"` or ids. **Video and audio of one source
  are two linked clips**: `timeline.place` returns `placed: [[videoClip, audioClip], ...]`. Volume/gain commands
  need the audio clip id, effects like blur/Lumetri the video clip id.
- Each `command_run` is one undo step; `command_batch {steps:[{id,params}], stop_on_error}` runs in order, not
  atomic. A failing command changes nothing; read the error. Programmatic calls never open dialogs.
- **Long jobs**: `file.exportMedia`, `export.queue.start`, `media.createProxies`, `sequence.render*`,
  `transcript.generate` return a `job` unless `wait:true`; poll `jobs.list`, cancel `jobs.cancel {job}`. In the
  headless MCP/CLI process a job dies if the server stops, so pass `wait:true` for exports you need finished.
- Sequences are what get exported: the **active sequence** (`project_inspect.activeSequence`) is the target of
  `render_frame`, `sequence_inspect`, `file.exportMedia` and most timeline commands. `sequence.open {item}` to switch.

## 1. File access

`filmcraft-cli mcp` has **no automation-root flags**: file access is unrestricted (verified: import, save, export,
render to any absolute path). Always use absolute paths. Relative paths in the CLI resolve against the working
directory. Put scratch/previews in a temp dir, deliverables where the user said. Never write over source media.
If access to a path is refused (permissions), pick another folder and tell the user once.
CLI route: every `filmcraft-cli` call is a complete pipeline on a project:
```bash
filmcraft-cli --project /abs/x.fcproj inspect sequence --compact
filmcraft-cli --project /abs/x.fcproj --save exec markers.add target=program seconds=12 name=beat
filmcraft-cli --project /abs/x.fcproj run steps.jsonl --save           # {"id","params"} per line, # comments
filmcraft-cli --project /abs/x.fcproj render --seconds 3.5 --out /scratch/f.png --scale 0.5
filmcraft-cli --project /abs/x.fcproj export /abs/out.mp4 --preset "YouTube 1080p Full HD"
filmcraft-cli import /abs/a.mov /abs/b.mov ; filmcraft-cli probe /abs/a.mov   # media info JSON
```
`--demo` opens the built-in demo; `--data-dir` isolates user presets/autosave; `--allow-offline` accepts offline media.
`export` needs `--start` with `--end` for a custom range. Exit status 1 = a command failed or offline media was rendered.

## 2. Workflow

1. **Brief**: purpose and destination (YouTube 16:9, Reels/TikTok 9:16, square, broadcast), target duration,
   story/structure, music, titles/captions, look, delivery codec/size. Where the footage is. Ask only what you
   cannot infer; propose defaults.
2. **Ingest and inspect**: `filmcraft-cli probe <file>` or `media_import` then `project_inspect`. Note resolution,
   frame rate (mixed rates?), codec/audio channels, duration, interlacing, colour space (`media.colorInfo`).
   Sources are only referenced; never modify, move or transcode them in place. Heavy/long-GOP/4K+ media on a slow
   machine: create proxies (section 3).
3. **Sequence setup**: `file.newSequence {name,width,height,fps,sampleRate,video,audio}` matching the delivery (or
   `file.newSequenceFromClip {items}` to match the first clip). Use the footage's frame rate (do not default to
   23.976 if shooting was 25/30). Name bins (`file.newBin`) and rename clips.
4. **Plan the edit** (a few lines): shot order, durations, music bed, titles, transitions, grade, loudness target.
   For anything with a creative brief (promo, reel, short, story), add a **rhythm borrowed from
   outside video** (a comic strip's panel beats; a radio play where sound leads picture; a match
   report's scoreline structure) and **1-2 edit rules** (no dissolves, hard cuts only; every cut lands
   on a sound; no music for the first 20 s; one shot size per section). Every transition, speed change
   and grade move should trace to the brief, the rhythm or a rule.
5. **Alternative cuts** (creative briefs only; skip for corrective work or a locked structure): cut the
   opening 15-30 s (or the key scene) 2-3 ways in separate sequences of one project (`file.newSequence`
   per version, named after its idea), differing in structure (cold open vs chronological), rhythm,
   music use and grade, not just in transition choice. Build the options sequentially in the one
   headless session, never in parallel subagents. Save and open the project (section 8), name the
   sequences, then ask with the multiple-choice question tool (AskUserQuestion in Claude Code; else a
   numbered list), multi-select for hybrids. Never pick for the user. This rule covers creative
   directions, while technical options may carry a labelled recommendation. Inside a subagent, return
   the options (project path, sequence names, brief) to the orchestrator, which asks the user.
6. **Assemble** with `timeline.place` (back-to-back `items`, `insert`), trim with `timeline.trim`/`razor`, tidy
   gaps (`sequence.closeGap`), add transitions, titles, captions; then grade; then audio mix.
7. **Verify loop** after each block (section 5). 8. **Save** the `.fcproj`, then **Show and approve** (section 8).
9. **Final export** only after acceptance (section 7), unless asked up front.

Scale to the request: "cut these three clips together with a fade" is one sequence, three placements and one
transition, not a full mix and grade.

## 3. Craft know-how

- **Structure**: cut on action or on the beat; J/L cuts for dialogue (audio leads/trails: move audio clip edges
  separately with `linked:false`); vary shot sizes; keep the best take; remove dead air; hold establishing shots
  3-5 s, action 1-3 s; no jump cuts on the same framing unless intentional (or add a punch-in `motion` scale).
  Prefer ripple deletes (`edit.rippleDelete`) to leaving gaps; check no stray gaps and no single-frame flashes.
- **Trim tools**: `timeline.trim {clip, edge:in|out, mode:regular|ripple, deltaFrames}`, `timeline.slip/slide`,
  roll via `trim.*`, `sequence.addEdit/addEditAllTracks` (razor at playhead; `playhead.set {seconds}` first),
  `timeline.move {moves:[{clip,track,time}], insert}`. `sequence.lift/extract` remove the in/out range.
  Scene detection: `clip.sceneEditDetection`.
- **Transitions**: `sequence.applyVideoTransition {clip, effect:"Cross Dissolve", frames:12, edge:"out"}` and
  `sequence.applyAudioTransition {effect:"constant_power"}`; 112 transitions (`effects.list kind=VideoTransition`).
  Dissolve 10-20 frames, dip to black for chapter breaks, hard cuts otherwise; audio crossfades on every
  picture dissolve and at music in/out. Default transition: `effects.setDefaultTransition`.
- **Speed**: `clip.speedDuration {clips, speed:percent, reverse, ripple, interpolation:frameSampling|frameBlending|opticalFlow}`;
  slow motion needs optical flow/blending or high-fps source; time remap keys via `effects.setParam clip time_remap speed`.
- **Reframe**: `clip.fitToFrame`, `clip.fillFrame`, `clip.scaleToFrameSize`; 9:16 from 16:9: new vertical sequence, scale/position
  with the `motion` effect (`effects.setParam {clip, effect:"motion", param:"position"|"scale", value}`), or the `auto_reframe` effect.
- **Effects**: `effects.apply {clips, effect:"Gaussian Blur"|id}`, `effects.setParam {clip, effect:id|index, param, value, time?, keyframe?}`;
  keyframes via `keyframe:true` + `time`, interpolation `effects.setInterpolation`. ids: `effects.list kind=Video detail=true` (param
  names, ranges, choices). New effects insert at index 0 (before motion/opacity); refer to them by effect id or index.
- **Colour** (do in this order, one clip, then match the rest): 1) technical: correct exposure/white balance
  (Lumetri basic: `temperature`, `tint`, `exposure`, `contrast`, `highlights`, `shadows`, `whites`, `blacks`, `saturation`) while reading
  `scopes.read {scopes:["waveform","parade","vectorscopeYuv"]}` (keep skin on the skin line, blacks near 0, whites below clipping);
  2) match shots (`lumetri.applyMatch {clip, referenceFrame}` or copy attributes `edit.pasteAttributes`); 3) creative look built
  from the plan's rhythm and reference, with a preset only as a starting point you then reshape: `lumetri.applyPreset
  {name, clips}` (Cinematic, Film Emulation, Monochrome, Technical) or LUTs (`lut.import`, `lumetri.setInputLut` for camera log to
  Rec.709, `lumetri.setLook` for a creative LUT); 4) secondary/masks (`masks.add`, HSL section, vignette). Use an
  **adjustment layer** (`file.newAdjustmentLayer`, placed above) for a grade over many clips. Respect the sequence working space
  (`sequence.colorSettings`, Rec.709 default; log/HLG/PQ media needs the right input transform: check `media.colorInfo`).
  Grade on a calibrated view only for a judgement of colour; your frame previews are a sanity check, say so.
- **Audio**: levels first (`clip.audioGain {clips, mode:set|adjust|normalizeMax, db}`, `mixer.setStrip`), dialogue
  around -16 LUFS short-term with peaks below -6 dBFS, music bed 12-20 dB under dialogue (`essentialSound.setType` dialogue|music|sfx|
  ambience, `essentialSound.generateDucking`, `essentialSound.autoMatch {target:lufs}`), repair (`essentialSound.set key:"repair.noise.on"`,
  `repair.humHz`), fades (audio transitions), no clipping. Delivery loudness: web/streaming about -14 LUFS, broadcast -23/-24 LUFS
  (export `loudnessLufs`). Mixing more deeply or music/restoration work: hand the audio to `soundcraft-audio`.
- **Titles/captions**: `graphics.newText {text,size,font,fontStyle,position|box,seconds,time,track}`, `graphics.set {clip,layer,props}`,
  lower thirds via `graphics.newRectangle`+text; captions `captions.newTrack`, `captions.add`, `captions.import`/`export` (srt|vtt|...),
  `transcript.generate` (Whisper model is an optional download: ask before `transcript.downloadModel`) then `transcript.createCaptions`,
  `transcript.removePauses/removeFillers/extract/lift` to cut by text. Burn-in on export with `burnCaptions:true`, or a sidecar
  `captionSidecar:"srt"`. Motion-heavy titles/animation: build in `effectcraft-motion`, export ProRes/PNG, import here.
- **Proxies**: `media.createProxies {items, preset:"prores_proxy_half"|"h264_half"|..., attach:true, wait:true}`, `media.toggleProxies {enabled}`,
  `media.attachProxies`, `media.detachProxies`. Edit on proxies, **export with proxies off** (check output size with `ffprobe`).
- **Offline/missing media**: `media.findMissing`, `media.relink`, `media.autoRelink {from,to}`; exports with offline media render placeholders
  and are flagged `offlineMedia`; fix before delivering.
- **Interchange**: `file.exportInterchange {format: xml|fcpxml|otio|edl|aaf|omf, path}`, `file.importAaf`; `.prproj` cannot be opened (import FCP7 XML/AAF/OTIO).
- **Default tells** (template-edit giveaways; use only when the brief asks): cross dissolves or whip/whoosh
  transitions on every cut; slow motion as the default emotion; Ken Burns pans on every still; the
  "Cinematic" Lumetri preset left as is, crushed blacks and letterbox bars added in post; a drone
  or timelapse opener; cuts on every downbeat of a stock track for the whole piece; word-by-word pop
  captions with emoji; a light-leak or glitch transition pack; "Thanks for watching" end cards.
- Do not fabricate evidence: no deceptive edits of real people's statements or fake news footage.

## 4. Building blocks

| Goal | Commands / tools |
|---|---|
| Project / bins | `file.newProject {name}`, `file.open {path}`, `file.newBin`, `file.import {paths,bin}` / `media_import`, `clip.rename`, `project.delete` |
| Sequence | `file.newSequence`, `sequence.settings`, `sequence.addTracks`, `sequence.open`, `sequence.nestSequences`, `clip.nest {name}` |
| Place / cut | `timeline.place {item|items,track,seconds|frame|time,insert,sourceIn,duration,video,audio}`, `timeline.razor {time(int),track?}`, `sequence.addEdit`, `timeline.trim`, `timeline.move`, `edit.rippleDelete {clips}`, `sequence.closeGap`, `sequence.lift/extract` |
| Source monitor | `source.open {item}`, `project.setMarks {item,in,out}`, `source.insert`, `source.overwrite`, `clip.makeSubclip` |
| Transitions | `sequence.applyVideoTransition`, `sequence.applyAudioTransition`, `sequence.setTransition`, `sequence.removeTransition` |
| Effects / motion | `effects.apply`, `effects.setParam`, `effects.setInterpolation`, `effects.toggleEnabled`, `masks.add`, `clip.speedDuration`, `clip.fitToFrame` |
| Colour | `lumetri.applyPreset`, `lumetri.setInputLut/setLook`, `lumetri.applyMatch`, `lumetri.setSection`, `lut.import`, `scopes.read`, `media.colorInfo`, `sequence.colorSettings` |
| Audio | `clip.audioGain`, `mixer.inspect/setStrip/setValue/addInsert/addSend/addSubmix`, `essentialSound.*`, `timeline.setTrack {track,muted,solo,volumeDb,pan}` |
| Graphics / captions | `graphics.newText/newShape/newRectangle/set/setText/setRoll`, `captions.*`, `transcript.*`, `tts.create` |
| Markers | `markers.add/addRange/addChapter`, `captions.export`, Markers panel CSV is UI |
| Inspect | `project_inspect`, `sequence_inspect`, `state.inspect`, `mixer.inspect`, `media.status`, `jobs.list` |
| Output | `render_frame`, `file.exportFrame`, `file.exportMedia`, `export.queue.*`, `export.quick`, `file.exportInterchange` |

## 5. Verify loop (mandatory)

After each block:
1. **Numbers**: `sequence_inspect` (tracks, clip ids, start/end frames, effects, transitions, linked pairs, markers, in/out),
   `project_inspect` (items, durations). Check: total duration vs brief, no gaps (`sequence.goToNextGap` or look at frame ranges),
   clips on the right tracks, audio linked to its video, effects on the intended clip, tracks not muted/disabled.
2. **Look**: `render_frame {seconds, max_side:960}` at: first frame, each cut (one frame before and after), mid transition, any
   title, the last frame. Check framing, black frames, stray flashes, title safety (about 5% margin), legibility, colour cast, clipping.
3. **Scopes** after grading: `scopes.read {scopes:[...]}` (stats: per-channel min/mean/max, chroma, hue, saturation).
4. **Audio** is not visible: check `mixer.inspect {time}` (levels, mutes), `clip.audioPeak {clips}`, `essentialSound.inspect`; after an
   export, `ffmpeg -i out.mp4 -af ebur128 -f null -` for loudness and `ffprobe` for streams.
5. Fix with a command, `edit.undo`, or by adjusting the clip's own params; repeat.
6. Before saving: no empty tracks you don't want, no leftover test clips, sequence settings right, media online (`media.findMissing`).
7. **Outside viewer** (creative edits beyond a small change, before section 8): a fresh subagent with a clean context, not a
   fork, gets only the frame stills around each cut, a cut list (clip, in/out, duration, transition) from `sequence_inspect`,
   the plan with its rhythm and rules, and the tells in section 3. As an editor who did not cut it, it lists what feels like
   a template or AI-assembled montage, where the rhythm or rules break, and any technical fault (flash frames, jump cuts,
   unreadable titles), most damaging first, a one-line fix each, no compliments. Fix what hurts the piece; say which notes you
   decline and why. Inside a subagent, return the critique inputs (still paths, cut list, plan, tells) to the orchestrator,
   which starts the reviewer.

## 6. Save

`file.save`, `file.saveAs {path}`, `file.saveCopy {path}`; `file.open {path}`. Descriptive names (`promo-cut-v2.fcproj`).
The project references media by path: keep sources in place (or `file.exportSelectionProject`, `media.relink` if moved). The headless
session is lost when the server stops: save before finishing.

## 7. Export (after acceptance)

Quickest: `filmcraft-cli --project P export OUT --preset "<name>"`; MCP: `command_run file.exportMedia {path, preset, wait:true}`
(or `settings`/`format`+flat params). Queue: `export.queue.add {...}` + `export.queue.start {wait:true}`.
- Built-in presets (39; `filmcraft-cli export --list-presets [query]`): Web & Social (High Quality 1080p/2160p, YouTube 1080p/2160p, Vimeo,
  Social Vertical 1080x1920), Match Source (Adaptive High/Medium/Low bitrate H.264), Broadcast (ProRes 422 Proxy/LT/422/HQ/4444/4444 with Alpha/
  4444 XQ, DNxHR LB/SQ/HQ, APV, MXF OP1a, OP-Atom), Image Sequence (PNG, TIFF, BMP, JPEG, TGA, DPX, EXR), Animated GIF, Audio Only (WAV, AIFF, AAC,
  FLAC). Custom: `export.presets.save {name, from, settings, ...}`.
- Export formats in the tested build: `h264` (software encoder, CRF/CBR/VBR1/VBR2), `prores` (422 HQ default; `proresProfile`), `dnxhr`, `apv`, `mjpeg`,
  `mxf-op1a/opatom`, `png/tiff/bmp/jpg/tga/dpx/exr` sequences, `gif`, `wav/aiff/aac/flac`. **HEVC and AV1 export are not available** (shown
  `available:false`); for H.265/AV1 deliver ProRes/H.264 and tell the user, or hand the master to an external encoder only if they ask.
- Guidance: web/social = H.264 MP4 (`High Quality 1080p HD`, ~16-20 Mbps VBR, AAC 320k, 8-bit 4:2:0); mezzanine/archival/hand-off to
  EffectCraft or others = ProRes 422 HQ or DNxHR HQ; transparency = ProRes 4444 with Alpha (`alpha:true`); audio stem = WAV 48 kHz 24-bit;
  loudness normalise on export `loudnessLufs:-14`; range `entire|inOut|workArea|custom`; `scale` for half-size drafts; `audio:false` for silent.
- Image-sequence and `export.quick` outputs are numbered (`name000.png`...): export into an **empty dedicated folder** (a 6 s PNG sequence is
  hundreds of files). Single frame: `file.exportFrame {path, format}` or `render --seconds`.
- After export: `ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames out.mp4` (size, fps, frames vs duration),
  look at a frame, listen for audio presence (stream list), report absolute path, size and duration. A reply with `offlineMedia` non-empty is a failure.
- First export of the user's project after acceptance, never over an existing file unless asked.

## 8. Show and approve (mandatory final phase)

Every task ends here, after the verify loop. The headless session has no window, so the user cannot see the edit until it is
saved and the real app is opened on it.

1. **Save** the project as `.fcproj` in the project directory or the path the user named, with a descriptive name. Also render a
   small preview (`render_frame` stills or a low-res H.264 draft export) next to it if useful. Note absolute paths.
2. **Open FilmCraft on that file, detached** (verified: `/usr/bin/filmcraft`, `filmcraft [project.fcproj | media files...]`):
   `setsid filmcraft /abs/path/project.fcproj >/dev/null 2>&1 &`
   Native extension `.fcproj` (MIME `application/x-filmcraft`, registered; the desktop entry also lists common video MIME types), so
   `setsid xdg-open /abs/path/project.fcproj >/dev/null 2>&1 &` should work too. After a crash the app may offer recovery of unsaved
   changes (`--recover`/`--no-recover` decide). If the user already has the app attached via `--control`, do not start another copy;
   tell them to open/reload the file. Do not leave an instance you started running unless the user wants it.
3. **Stop and ask.** Give the full path (and any preview) and ask the user to accept the edit or describe changes. No final
   export, other formats/sizes, interchange or delivery before explicit acceptance. Silence or a vague reaction is not acceptance.
   (If the user asked for the export up front, deliver it and still show and approve.)
4. **Loop on changes**: apply them, redo the verify loop for what changed, save again, reopen (tell the user to reload if the file is
   already open in the app), ask again.
5. **Inside a subagent** (cannot talk to the user): do steps 1 and 2, then return the project path, preview paths, a short summary
   (sequence settings, duration, clips/cuts, grade, audio, titles) and state clearly **"awaiting user approval"**. The orchestrator asks
   the user and relays changes; export/handoff waits for acceptance.

## 9. Top gotchas (more in `references/command-catalog.md`)

- Integer ticks only for `time`-type params; use `seconds`/`frame`/`timecode` where offered. Floats silently no-op on some (`timeline.razor`).
- `timeline.place` makes linked video+audio pairs: operate on the right id; `linked:false` to move/trim one side only.
- `file.exportMedia` is asynchronous by default (returns `job`): pass `wait:true` in headless sessions.
- `export.quick`/sequence exports write one file per frame; use an empty folder and a short range.
- Default sequence fps is 23.976: set `fps` to the footage rate (`filmcraft-cli probe`) to avoid pulldown-like judder.
- New effects are inserted at index 0; refer to effects by id (`gaussian_blur`) or `motion`/`opacity` names, not assumed indexes.
- `sequence_inspect` clip effect `params` values print as `Float(0.0)`/`Bool(false)` strings; set with plain numbers/bools.
- Only H.264 (software), ProRes, DNxHR, APV, MJPEG, MXF and stills/audio export; no HEVC/AV1. Decode includes H.264/HEVC/VP9/AV1/ProRes/DNx/MJPEG/MPEG-2/MXF.
- Hardware decode (NVDEC on NVIDIA GPUs) speeds H.264/HEVC; colour, keys and export run on the CPU, so 4K exports are slow: draft at `scale 0.5`, finals once.
- Camera/phone files in the wild are less tested: if a clip fails to import or decode, check `filmcraft-cli probe`, report the codec, and as a
  fallback transcode a copy (never the source) with ffmpeg into a supported intraframe format (some ffmpeg builds lack libx264 — check with `ffmpeg -encoders | grep libx264`; mjpeg/ProRes via ffmpeg is fine).
- `.prproj` is not importable; use XML/AAF/OTIO. No VST/AU/OpenFX plugins.
- `transcript.*` and `tts.*` need optional model downloads (network): ask first.
- Do not leave test sequences or an open app behind; delete only files you created.
