# FilmCraft recipes

Snippets are `{id, params}` for `command_run` / `command_batch` (or `filmcraft-cli run steps.jsonl`). Ids come from
`project_inspect` / `sequence_inspect`; confirm param names with `command_list {filter}`. Preview with `render_frame {seconds}`
after each block. Work on a saved `.fcproj`; sources stay untouched.

## 1. Rough cut from clips (the base recipe)
1. `file.newProject {name}`; probe sources (`filmcraft-cli probe`) to pick fps/size; `file.newSequence {name, width:1920, height:1080, fps:25}`.
2. `media_import {paths:[...]}` -> item ids. Optionally `file.newBin {name:"Selects"}`.
3. Select the takes: `source.open {item}`, `project.setMarks {item, in:<ticks>, out:<ticks>}`, `source.overwrite`; or place whole clips and trim.
   Whole clips back to back: `timeline.place {items:[8,9,10], track:"V1", seconds:0}` -> note `placed` pairs.
4. Tighten: `timeline.trim {clip, edge:"out", mode:"ripple", deltaFrames:-12}`; remove a middle part: `playhead.set {seconds}`,
   `sequence.addEdit`, then the second edit, `timeline.select {clips:[mid]}`, `edit.rippleDelete {clips:[mid]}`
   (if sync-lock complains, `timeline.setTrack {track:"V2", syncLock:false}` first).
5. Transitions: `sequence.applyVideoTransition {clip, effect:"Cross Dissolve", frames:12, edge:"out"}` and a matching audio crossfade.
6. Verify (frames at each cut, duration), save, show and approve.

## 2. Interview / talking head clean-up
1. Place the clip; `transcript.generate {items:[item], language:"en", wait?}` (model download needs the user's OK) or listen-free: `clip.sceneEditDetection`.
2. `transcript.removePauses {minSeconds:0.6, keepSeconds:0.2}`, `transcript.removeFillers`; or `transcript.select {from,to}` + `transcript.lift/extract`.
3. Cover jump cuts with B-roll on V2 (`timeline.place {item, track:"V2", seconds, audio:false}`), or punch-ins: alternate `motion` scale 100/115
   (`effects.setParam {clip, effect:"motion", param:"scale", value:115}`).
4. Audio: `essentialSound.setType {type:"dialogue"}`, `essentialSound.set {key:"repair.noise.on", value:true}` (+ amount), `essentialSound.autoMatch {target:-16}`; music bed `type:"music"` + `essentialSound.generateDucking`.
5. Captions: `transcript.createCaptions {maxChars:42, lines:2}`, `captions.export {path:"/abs/x.srt"}`; burn-in with `burnCaptions:true` on export.

## 3. Colour grade a scene
1. Inspect `media.colorInfo {item}`: log footage needs an input LUT: `lut.import {path:"/abs/cam_to_709.cube"}`, `lumetri.setInputLut {clip, lut:"lib:<id>"}`.
2. Basic: `effects.apply {clips:[v], effect:"lumetri"}`; `effects.setParam {clip:v, effect:"lumetri", param:"exposure", value:0.3}`, `contrast`, `highlights:-20`, `shadows:15`, `whites`, `blacks`, `temperature`, `tint`, `saturation:110`.
3. Read `scopes.read {scopes:["waveform","parade","vectorscopeYuv"]}`; adjust until blacks about 0-5 %, whites below 100 %, neutrals balanced in the parade, skin near the skin line.
4. Match the next shot: `lumetri.applyMatch {clip:next, referenceFrame:<n of hero>}` or `edit.pasteAttributes {clips:[...], effects:true}` after copying a graded clip.
5. Look: `lumetri.applyPreset {name:"Golden Dusk", clips:[...]}` at reduced strength by tuning params, or an adjustment layer: `file.newAdjustmentLayer {seconds:<seq length>}` then
   `timeline.place {item:<adj item>, track:"V2", seconds:0}` and apply `lumetri` on that clip so one grade covers the sequence.
6. Vignette: `lumetri.setSection {clip, section:"vignette", on:true}` or the `vignette` effect. Verify with before/after frames (toggle `effects.toggleEnabled`).

## 4. Speed ramp / slow motion
- Constant: `clip.speedDuration {clips:[v], speed:50, interpolation:"opticalFlow"}` (linked audio clip: mute it or pitch-correct separately).
- Ramp: keyframe `time_remap` `speed`: `effects.setParam {clip:v, effect:"time_remap", param:"speed", value:100, time:<ticks>, keyframe:true}` then 40 at a later key,
  `effects.setInterpolation {..., interpolation:"easeIn"|"easeOut"}`. Check frames either side.
- Freeze: `clip.frameHold {clips:[v], time}` or `clip.insertFrameHoldSegment {clip, time, seconds:2}`.

## 5. Social vertical (9:16) from landscape footage
1. `file.newSequence {name:"Reel", width:1080, height:1920, fps:30}`; place the clip.
2. `clip.fillFrame {clips:[v]}`, then reposition: `effects.setParam {clip:v, effect:"motion", param:"position", value:[x,y]}` to follow the subject (keyframe with `time`, `keyframe:true`),
   or try the `auto_reframe` effect.
3. Title with `graphics.newText {text, size:96, font, position:[540,1500], seconds, time:0}` inside the platform safe zone (keep about 12 % at top and 20 % at bottom free).
4. Export `Social Vertical 1080×1920` (H.264, 12 Mbps), loudness `loudnessLufs:-14`.

## 6. Titles and lower thirds
`graphics.newText {text:"Name", size:64, fontStyle:"Bold", position:[160,900], seconds:4, time:<ticks>, track:2}` + `graphics.newRectangle {position, size, seconds}` under it; style
`graphics.set {clip, layer, props:{fill_color:"#ffffff", align:"left"}}`; fade with `effects.setParam {clip, effect:"opacity", param:"opacity", value:0/100, time, keyframe:true}`.
`graphics.setResponsiveTime {clip, introFrames:12, outroFrames:12}` keeps intro/outro fixed when stretching. Complex animated titles: build in effectcraft-motion (ProRes 4444 with alpha), then `file.import` and `timeline.place` on V2.

## 7. Music bed and levels
1. Place the music on A2 (`timeline.place {item, track:"A2", seconds:0, video:false}`), set `essentialSound.setType {clips:[music], type:"music"}`, `essentialSound.generateDucking {clips:[music]}` against dialogue.
2. Fades: `sequence.applyAudioTransition {clip, effect:"exponential_fade", frames:48, edge:"out"}`.
3. Master check: `mixer.inspect`, `clip.audioPeak`, then after export `ffmpeg -i out.mp4 -af ebur128 -f null -` (integrated LUFS target -14 web / -23 broadcast).
Detailed audio production: `soundcraft-audio`.

## 8. Proxies for heavy footage
`media.createProxies {items:[...], preset:"prores_proxy_half", attach:true, wait:true}`; edit as usual; before export `media.toggleProxies {enabled:false}`;
after export confirm size with `ffprobe`.

## 9. Interchange
`file.exportInterchange {format:"xml", path:"/abs/cut.xml"}` (Premiere/Resolve FCP7 XML), `"fcpxml"`, `"otio"`, `"edl"` (cuts only, one video track), `"aaf"`/`"omf"` for audio post (see `soundcraft-audio`). Import: `file.importAaf`, and EffectCraft can import timelines via `file.importTimeline`.

## 10. Delivery checklist
Right sequence active; range (entire vs in/out); preset name; proxies off; no offline media (`media.findMissing`); captions burn-in or sidecar; loudness; `wait:true`;
output folder exists and is empty for sequences; `ffprobe` the result; report path, size, duration.
