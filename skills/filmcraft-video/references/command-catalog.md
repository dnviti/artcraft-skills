# FilmCraft command catalogue (installed build 0.14.0, 710 commands)

Always confirm with `command_list {filter:"<text>"}` (or `filmcraft-cli commands <filter>` / `describe <id>`); the `params`
doc is authoritative: `name:type=default`, `?` optional, `|` alternatives. Families by id prefix: graphics 82, file 57,
clip 57, timeline 56, sequence 51, project 40, edit 39, multicam 35, markers 32, trim 24, captions 23, mixer 20,
export 19, media 17, effects 16, shortcuts 16 (UI), playhead 14, transcript 14, masks 12, mediaBrowser 10 (UI),
essentialSound 9, source 7, lumetri 7, presets 7, tts 7, audio 5, lut 4, clipMixer 4, history 3, jobs 2.
Time = ticks (254016000000 per second); `seconds`, `frame`, `timecode` accepted where the doc lists them; ticks must be integers.

## Project, bins, media
- `file.newProject {name}`, `file.open {path}`, `file.save {path?}`, `file.saveAs {path}`, `file.saveCopy {path}`, `file.saveAll`, `file.revert`, `file.closeProject`,
  `file.openDemoProject`, `file.newProjectFromTemplate {template,name}`, `file.saveAsTemplate`.
- `file.import {paths,bin,imageSequence,replace}` (tool `media_import {paths,bin,image_sequence}`) -> `{items,errors}`; `file.importImageSequence {path}`;
  `file.newBin {name,parent}`, `file.newBinFromSelection`, `project.renameBin`, `project.delete {items}`, `clip.rename {item|clip,name}`, `project.setNotes`.
- Generated items: `file.newBarsAndTone`, `file.newBlackVideo`, `file.newColorMatte {color,seconds}`, `file.newTransparentVideo`, `file.newCountingLeader`,
  `file.newAdjustmentLayer {seconds}` (a bin item: place it with `timeline.place`), `file.newOfflineFile`, `file.importDemoFootage`.
- Info: `media.status {item}` (online/offline, proxy), `media.colorInfo {item}`, `file.mediaProperties`, `clip.sourceSettings`, `clip.interpretFootage {items,colorSpace,pixelAspect}`,
  `clip.modifyTimecode`, `clip.audioChannels {items,format}`, `clip.breakoutToMono`, `clip.extractAudio {items,dir}`. CLI: `filmcraft-cli probe <media>`.
- Missing media: `media.findMissing`, `media.relink {item,path,relinkOthers}`, `media.autoRelink {from,to}|{folder}`, `media.search {folder}`, `media.replaceFootage`, `media.makeOffline`.
- Proxies: `media.createProxies {items,preset:prores_proxy_quarter|prores_proxy_half|prores_lt_half|h264_quarter|h264_half,destination,attach,wait}`, `media.proxyPresets`,
  `media.attachProxies`, `media.detachProxies`, `media.reconnectFullRes`, `media.toggleProxies {enabled}`.

## Sequences and tracks
- `file.newSequence {name,width,height,fps,sampleRate,video:n,audio:n,mix,trackType,fromItem}` -> `{sequence}`, `file.newSequenceFromClip {items}`,
  `sequence.open {item}`, `sequence.close`, `sequence.settings {width,height,fps,sampleRate,mix,dropFrame,workingSpace}`, `sequence.colorSettings {workingSpace:rec709|rec2100-pq|rec2100-hlg,wideGamut,autoToneMap}`,
  `sequence.addTracks {video,audio,submix,...}`, `sequence.deleteTracks {video:"empty",...}`, `sequence.deleteTrack {track}`, `sequence.inspect`, `sequence.simplify`, `sequence.makeSubsequence`, `clip.nest {name}`.
- Tracks: `timeline.setTrack {track:"V1"|"A1"|id, locked,syncLock,enabled,muted,solo,name,volumeDb,pan,label}`, `timeline.setTargeting {track,targeted,sourcePatch}`.
- Render (preview files): `sequence.renderInToOut {wait}`, `sequence.renderEffectsInToOut`, `sequence.renderAudio`, `sequence.deleteRenderFiles`.
- Work area / in-out: `sequence.setWorkArea {start,end}`, `sequence.setWorkAreaIn/Out`, `playhead.set {seconds|frame|timecode|time}`.

## Placing and cutting
- `timeline.place {item|items,track:"V1"|id|"new",audioTrack,time|frame|seconds,insert,sourceIn,duration,video,audio}` -> `{clips,placed:[[video,audio],...]}`.
- `source.open {item}`, `project.setMarks {item,in,out}`, `source.insert`, `source.overwrite`, `clip.makeSubclip {item,name,start,end}`, `clip.replaceFromBin`, `edit.pasteMedia {paths,insert}`.
- Razor: `timeline.razor {time:int ticks,track?,clip?}` -> `{cuts}`; `sequence.addEdit {time}`, `sequence.addEditAllTracks`.
- Move/trim: `timeline.move {moves:[{clip,track,time}],insert,linked,copy}`, `timeline.trim {clip,edge:in|out,mode:regular|ripple,delta|deltaFrames,linked}` -> `{delta}`,
  `timeline.slip/slide {clip,delta|deltaFrames}`, `trim.selectEditPoint`, `trim.nudge {frames}`, `trim.edit`, `trim.rippleNext/Previous`, `trim.extendToPlayhead`.
- Remove: `edit.rippleDelete {clips}` (**fails if another sync-locked track has a clip in the way**: `timeline.setTrack {track,syncLock:false}` or lock that track), `edit.rippleDeleteHead`, `sequence.lift`, `sequence.extract`, `sequence.closeGap {track,time}`, `sequence.goToNextGap`.
- Clipboard: `edit.cut/copy/paste/pasteInsert`, `edit.pasteAttributes {clips,motion,opacity,timeRemapping,volume,effects}`, `edit.selectAll`, `timeline.select {clips,add,toggle,linked}`.
- Linking/grouping: `clip.link`, `clip.group`, `clip.ungroup`, `clip.enable`.
- Speed and frames: `clip.speedDuration {clips,speed:%,reverse,ripple,interpolation}`, `clip.frameHold {clips,time}`, `clip.insertFrameHoldSegment {clip,time,seconds}`,
  `clip.setTimeInterpolation {clips,mode}`, `clip.fitToFrame`, `clip.fillFrame`, `clip.scaleToFrameSize`, `clip.sceneEditDetection {clips,sensitivity,applyCuts}`, `clip.remix`.
- Multicam: `clip.createMulticam {items,method}`, `clip.synchronize {method:in|out|timecode|marker|audio}`, `clip.mergeClips`, `multicam.switchAngle {camera,time}`, `multicam.recordStart/Stop`, `clip.multicamFlatten`.
- Markers: `markers.add {target:program|source,time,name,comment,color,durationFrames}`, `markers.addRange`, `markers.addChapter`, `markers.addFlashCue`.

## Transitions
`sequence.applyVideoTransition {clip,effect,frames,edge:in|out,params,reverse}` -> `{transition}`, `sequence.applyAudioTransition`, `sequence.setTransition {transition,params,duration|frames,align}`,
`sequence.removeTransition`, `trim.applyDefaultTransition`, `effects.setDefaultTransition`. List: `effects.list {kind:"VideoTransition"|"AudioTransition"}` (112 video transitions: cross_dissolve, dip_to_black, film_dissolve, push, slide, split, zoom_blur, glitch, light_leak, ...).

## Effects
- `effects.list {kind:Video|Audio|VideoTransition|AudioTransition, folder, detail}` (detail:true gives `paramInfo`: id, type, range, options, animatable), `effects.apply {clips,effect}` -> `{applied:[{clip,effect,index}]}`,
  `effects.setParam {clip,effect:id|index,param,value,time,keyframe,mask}`, `effects.toggleAnimation`, `effects.addKeyframe`, `effects.setKeyframe`, `effects.moveKeyframe(s)`, `effects.deleteKeyframe`,
  `effects.setInterpolation {…,interpolation:linear|bezier|autoBezier|continuousBezier|hold|easeIn|easeOut}`, `effects.toggleEnabled`, `effects.remove {clip,index}`, `effects.reset`, `effects.resetParam`.
- Built-in per-clip: `motion` (position, scale, scale_width, uniform_scale, rotation, anchor, anti_flicker), `opacity` (opacity, blend), `time_remap` (speed); audio: `volume` (level), `channel_volume`, `panner` (balance).
- Notable video effects (130): lumetri, brightness_contrast, proc_amp, color_balance, levels, tint, black_white, leave_color, asc_cdl, gaussian_blur, directional_blur, sharpen, unsharp_mask, camera_blur, bokeh_blur,
  crop, edge_feather, transform, mirror, corner_pin, ultra_key, color_key, luma_key, track_matte, vignette, drop_shadow, warp_stabilizer, auto_reframe, camera_shake, posterize_time, echo, timecode, clip_name, lens_flare, noise,
  mosaic, lens_distortion, wave_warp, glints/glow family (echo_glow, wonder_glow, edge_glow), rgb_split, volumetric_rays, vr_* projections, graphic_text, graphic_shape.
- Masks: `masks.add {clip,effect,shape:ellipse|polygon|rectangle|bezier,path,center,size,cornerRadius}`, `masks.addVertex`, and more via `command_list {filter:"masks."}`; set mask params with `effects.setParam {mask:n}`.
- Presets: `presets.list/save/apply/rename/delete/import/export` (effect stacks), `lumetri.presets/applyPreset`.

## Colour
`lumetri.applyPreset {name,clips}` (folders Cinematic, Film Emulation, Monochrome, Technical; e.g. "Teal Shadows, Warm Skin", "Night Exterior", "Golden Dusk", "Steel Blue"), `lumetri.presetThumbnails`,
`lumetri.setInputLut {clip,lut:"lib:<id>"|"builtin:<id>"|path}`, `lumetri.setLook`, `lumetri.applyMatch {clip,referenceFrame|referenceTime}`, `lumetri.setSection {clip,section:basic|creative|curves|wheels|hsl|vignette,on}`,
`lut.import {path,name}`, `lut.list`, `lut.remove`, `lut.export`, `color.spaces`, `media.colorInfo`, `scopes.read {scopes:[waveform|parade|histogram|vectorscopeYuv|vectorscopeHls],waveformType,paradeType,colorSpace}`.
Lumetri effect params (`effects.setParam {effect:"lumetri"}`): basic_on, input_lut, temperature, tint, exposure (-5..5), contrast, highlights, shadows, whites, blacks (-100..100), saturation (0..200, default 100), plus creative/curves/wheels/hsl/vignette ids (see `effects.list ... detail:true`).

## Audio
- Clip: `clip.audioGain {clips,mode:set|adjust|normalizeMax|normalizeAll,db,relative}`, `clip.audioPeak`, `clip.volumeUp/Down`, effects `volume` `level` (dB), `panner` `balance`.
- Mixer: `mixer.inspect {time}`, `mixer.setStrip {strip:"A1"|"S1"|"Mix"|id,volumeDb,pan,muted,solo,mode:Off|Read|Latch|Touch|Write,output}`, `mixer.setValue {strip,lane,value,time}` (lanes volume|pan|mute|send.<i>.level|fx.<slot>.<param>),
  `mixer.addSubmix`, `mixer.addInsert {strip,effect,slot}`, `mixer.setInsert`, `mixer.addSend/setSend`, `mixer.writeAutomation {strip,lane,points:[[ticks,value]]}`, `mixer.setKeyframe`.
- Essential Sound: `essentialSound.setType {clips,type:dialogue|music|sfx|ambience}`, `.set {clips,key,value}` (keys e.g. repair.noise.on/amount, repair.humHz, clarity.eqPreset, creative.reverbPreset, ducking.reduceDb, volume.levelDb, mute),
  `.applyPreset`, `.autoMatch {target:lufs}`, `.generateDucking`, `.inspect`. Audio effects: `effects.list kind=Audio` (parametric EQ, high/low-pass, dynamics, true-peak limiter, delay, reverb, DeNoise, DeHummer, pitch shift).
- Voice: `audio.voiceover.*` (needs an input device), `tts.voices/create/edit/render` (voice models may need `tts.downloadVoices`).

## Graphics, captions, transcript
- `graphics.newText {text,size,font,fontStyle,position,box,vertical,seconds,time,track,newClip,clip}` -> `{clip,layer}`, `graphics.newShape`, `graphics.newRectangle/Ellipse/Polygon {position,size,seconds,track,time}`,
  `graphics.set {clip,layer,props:{font,font_style,size,align,tracking,leading,fill_color,stroke,...}}`, `graphics.setText`, `graphics.setCharStyle`, `graphics.setRoll {mode:roll|crawlLeft|crawlRight}`,
  `graphics.setResponsiveTime {introFrames,outroFrames}`, `graphics.newFromFile {path}`, `graphics.deleteLayer`, `graphics.template.export`/`file.exportGraphicsTemplate`, `file.replaceFonts`. Fonts: command `fonts.*`.
- Captions: `captions.newTrack {format:Subtitle|CEA-608|CEA-708|Teletext,name,language}`, `captions.add {track,text,seconds|time,durationSeconds}`, `captions.import {path}`, `captions.export {path,format:srt|vtt|scc|mcc|stl|ttml|dfxp,track}`, `captions.delete`.
- Transcript (Whisper, optional model): `transcript.models`, `transcript.downloadModel`, `transcript.generate {items,language,diarize}`, `sequence.transcribe`, `transcript.inspect/search/select/extract/lift/removePauses/removeFillers/renameSpeaker/createCaptions`, `transcript.set`.

## Export
- `file.exportMedia {path,preset,settings,format,audioCodec,width,height,fps,bitrateKbps,bitrateMode:cbr|vbr1Pass|vbr2Pass|crf,crf,hardwareEncoding:off|auto,scale,audio,quality,burnCaptions,alpha,
  exrCompression,captionSidecar:srt|vtt,loudnessLufs,proresProfile,dnxProfile,apvProfile,mxfVideoCodec,sequence,range:entire|inOut|workArea|custom,startSeconds,endSeconds,wait}` -> `{job,result:{bytes,frames,render_fps,seconds},offlineMedia}`.
- `export.presets.list {query,category,format,favorites}`, `.get`, `.save {name,from,settings,...}`, `.delete`, `.favorite`, `.import/.export`, `export.formats` (availability: hevc and av1 `available:false` here), `export.resolve`,
  `export.queue.add/list/start/stop/cancel/retry/remove/move/clear`, `export.quick {preset,path,wait}` (numbered image outputs), `file.exportFrame {path,format:png|jpeg|tiff|bmp,depth,time,sequence,target:source|program}`.
- Interchange: `file.exportInterchange {format:xml|fcpxml|otio|edl|aaf|omf,path,sequence}`, `file.exportEdl/Ale/Otio/Fcp7Xml/Fcpxml/Aaf/Omf`, `file.exportSelectionProject {path,items}`, `file.importAaf`.
- CLI: `filmcraft-cli export <out> [--preset N] [--format F] [--range entire|inOut|workArea] [--start S --end S] [--settings JSON] [--scale f] [--quality 0-100] [--no-audio] [--queue] [--allow-offline]`, `export --list-presets [query]`, `render --seconds S --out f.png [--scale]`.

## Misc
`state.inspect`, `history.list/clear`, `edit.undo` (tool-level undo), `jobs.list/cancel`, `perf.stats`, `command.list`, `labels.*`, `prefs.*`, `shortcuts.*` (UI only), `view`/panels via `ui_*` (bridge only).

## Verified behaviours (smoke test)
- `file.newSequence {name,width:320,height:180,fps:24}` -> `{sequence:7}`; clips import as items 8,9 (ids continue after the sequence's own).
- `timeline.place {items:[8,9],track:"V1",seconds:0}` -> `placed:[[11,12],[14,15]]`: a 3 s mjpeg+PCM `.mov` becomes 72 frames at 24 fps on V1 + A1.
- `timeline.razor {time:<int ticks>}` -> `{cuts:2}` (video and audio); float ticks -> `{cuts:0}` silently.
- `timeline.trim {clip,edge:"out",mode:"ripple",deltaFrames:-24}` shortens and shifts later clips; `clip.speedDuration {speed:200,ripple:true}` halves the clip and closes the gap.
- `sequence.applyVideoTransition {clip:11,effect:"Cross Dissolve",frames:6,edge:"out"}` -> `{transition:id}`.
- `effects.apply lumetri` inserts at index 0; `effects.setParam {effect:"lumetri",param:"exposure",value:0.5}` ok; `clip.audioGain {clips:[12],mode:"set",db:-6}` -> `gainDb:-6`.
- `edit.rippleDelete` failed with "this edit would break sync: V2 is sync-locked and has a clip in the way".
- `file.exportMedia {format:"h264",scale:0.5,range:"entire",wait:true,crf:28}` on a 6 s sequence: 160x90 H.264 + AAC, 144 frames in 0.2 s.
- `export.quick {preset:"PNG Sequence"}` wrote 144 numbered PNGs (q000.png...); `export --preset "Apple ProRes 422 Proxy" --scale 0.5 --start 0 --end 0.5` wrote ProRes + PCM 24-bit.
- `scopes.read` returns stats (r/g/b/y min-mean-max, chromaMean, hueDeg, saturation) for the current frame.
