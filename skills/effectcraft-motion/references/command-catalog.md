# EffectCraft command catalogue (installed build 0.18.0, 735 commands, 307 effects)

Always confirm with `command_list {filter:"<text>"}` (the `params` doc is authoritative; `?` = optional,
`→` = what it returns). Families by id prefix: layer 122, view 78 (UI), file 61, keys 36, comp 31, edit 27,
track 22, essential 22, effect 21, renderQueue 20, camera 19, prop 18, mask 17, time 17, roto 14, text 14,
project 13, help 13 (UI), app 12, footage 12, puppet 10, anim 9, window 9, shape 8, paint 6, face 5,
objectMatte 5, templates 5, render 4, jobs 3, expr 2. View/window/help/shortcuts/prefs commands are
panel/UI actions and do nothing useful headless.

## Project and comps
- `file.newProject`, `file.open {path}`, `file.save {path?}`, `file.saveAs {path}`, `file.saveCopy {path}`,
  `file.saveCopyAsXml {path:.ecprojx}`, `file.closeProject`, `file.revert`, `file.openDemoProject`
  (tools `open_project {path|demo|new}`, `save_project {path?}` do the same).
- `file.projectSettings {bitDepth:8|16|32, colorEngine:adobe|ocio, workingSpace:srgb|rec709|rec2020|p3|acescg|aces2065, linearize, hdr, outputSpace, renderer:gpu|software, timeDisplay}`.
- `comp.new {name,width,height,frameRate,duration(s),background(#hex|[r,g,b]),pixelAspect,shutterAngle,motionBlurSamples,renderer:classic3D|advanced3D,open}` -> `{comp}`;
  `comp.settings {comp?,...}`, `comp.open {comp}`, `comp.close`, `comp.workArea {start,end}`, `comp.trimToWorkArea`,
  `comp.setSwitch {switch:hideShy|motionBlur|frameBlending|draft3d, value}`, `comp.addMarker`, `comp.info`, `project.summary`.
- Project panel: `project.newFolder`, `project.rename`, `project.move`, `project.delete`, `project.usage`, `project.duplicate`, `file.removeUnusedFootage`, `file.reduceProject`, `file.collectFiles {folder}`, `file.consolidateFootage`.

## Footage
- `file.import {paths, sequence?, importAs?:footage|composition|compositionLayerSizes, layer?, page?, frameRate?, addToComp?, background?}` -> `{items, comps, errors, warnings}`; `file.importPlaceholder`, `file.importSolid`,
  `file.importLottie {path}`, `file.importProject {path}`, `file.importTimeline {path: xml|fcpxml|otio|edl|aaf|omf}`.
- `file.interpretFootage {items, frameRate, alpha:straight|premultiplied|ignore|guess, colorProfile, loop, pixelAspect, fields}`, `file.replaceFootage {path,item}`, `file.reloadFootage`.
- `footage.missing`, `footage.check`, `footage.relink {item,path}`, `file.relinkFootage {folder, dryRun, wait}`.
- Proxies: `file.createProxy {kind:still|movie, item|comp, resolution}`, `file.setProxy`, `file.useProxy`, `file.setProxyNone`.
- 3D models: `layer.newModel {path: gltf|glb|obj|stl|fbx}`.

## Layers
- Create: `layer.newText {text,name,position,box,font,style,size,fill,stroke,strokeWidth,tracking,leading,justify,allCaps,...}`,
  `layer.newSolid {name,color,width,height}`, `layer.newShape {kind:rect|rounded|ellipse|star|polygon|none,size,fill,stroke,strokeWidth,position,name}`,
  `layer.newNull`, `layer.newAdjustment`, `layer.newCamera {type,preset,zoom,position,poi,dof}`, `layer.newLight {kind,color,intensity,castsShadows}`,
  `layer.new3dPrimitive {kind:cube|sphere|plane|torus|cone|cylinder,...}`, `layer.addItem {item,time,index,position,duration}`, `layer.newContentAwareFill`, `layer.autoTrace`.
- Edit: `layer.settings`, `layer.setText {layer,range,text,font,size,fill,justify,...}`, `layer.setTransform {layers,prop:anchor|position|scale|orientation|rotation|opacity,value}`,
  `layer.setBlendMode {layers,mode}`, `layer.setTrackMatte {layer,matte,kind:alpha|alphaInverted|luma|lumaInverted}`, `layer.setParent {layers,parent,compensate}`,
  `layer.setSwitch {layers,switch:video|audio|solo|lock|shy|collapse|quality|fx|frameBlend|motionBlur|adjustment|threeD|guide,value}`,
  `layer.setComment`, `layer.precompose {layers,name,mode:move|leave}`, `layer.sequence {layers,overlap,duration,transition}`, `layer.addMarker`.
  Duplicate/split/trim/in-out/time-stretch commands: `command_list {filter:"layer.dup"}`, `"layer.split"`, `"layer.setIn"`, `"time."`.
- Shape contents: `layer.addShapeItem {layer,kind:group|rect|ellipse|star|polygon|path|fill|stroke|gfill|gstroke|trim|repeater|round|offset|pucker|twist|zigzag|wiggle|merge,group}`,
  `shape.newShape`, `shape.newPath {vertices,inTangents,outTangents,closed,fill,stroke}`, `shape.fillStroke`, `shape.dashes.add`, `shape.stroke.taper/wave`.
- Text animation: `layer.addTextAnimator {layer,properties:[anchor|position|scale|skew|rotation|opacity|tracking|fillColor|blur|...]}` -> `{animator}`,
  `layer.addTextSelector {animator,kind:range|wiggly|expression}`, `text.presets`, `text.fonts {query}`, `text.fontFeatures`.

## Properties and keyframes
- Tools: `get_layer {comp?,layer,time?,depth?,flat?}`, `get_property {layer,path,time?}`, `set_property {layer,path,value,time?,expression?}`,
  `add_keyframe {layer,path,time|keys:[{time,value}],value?,interpolation}`.
- Commands: `prop.get`, `prop.set {layer,path,value,time,timeBase:layer|comp}`, `prop.toggleAnimation`, `prop.addKey`, `prop.setExpression {layer,path,expression,enabled}`,
  `prop.reset`, `prop.separateDimensions`, `prop.pickWhip {layer,path,target:{layer,path}}`, `prop.convertExpressionToKeyframes`.
- Keys: `keys.select {keys:[{layer,prop,time}]}` then `keys.easyEase|easyEaseIn|easyEaseOut|toggleHold|interpolation|velocity|move|delete|timeReverse|wiggle|smooth|transform`;
  absolute: `keys.set {layer,path,time,newTime,value}`, `keys.setEase {layer,path,time,side:in|out,speed,influence}`, `keys.setSpatialTangents`; `motion.sketch {points}`.
- Time: `time.set {time|frame|timecode}`, `time.step`, `time.nextKey`, `time.go {to}`.
- Presets: `anim.builtinPresets {category}`, `anim.applyBuiltinPreset {preset,layers}`, `anim.savePreset {path}`, `anim.applyPreset {path,layers}`.
- Expressions: `expr.errors {comp,time}`; the engine is AE-style JS (wiggle, loopOut, linear, ease, thisComp.layer(...), effect(...)("Slider")).

## Effects
- Tools `add_effect {layer,effect,values}`, `list_effects {filter}`. Commands `effect.apply {effect,layers}`, `effect.applyLast`, `effect.remove {layer,effect}`, `effect.toggle`,
  `effect.reorder {effect,index}`, `effect.duplicate`, `effect.reset`, `effect.copy`/`effect.paste`, `effect.pickColor`, `effect.list {filter}` (param ids/ranges/options),
  `effect.warning`, `effect.plugins.list/load` (WASM plug-ins; refused when confined).
- Categories and examples: Keying (Key Light, Color Difference Key, Screen Key, Linear Color Key, Color Range, Advanced Spill Suppressor, Key Cleaner, Inner/Outer Key, Extract, Unmult),
  Matte (Matte Choker, Simple Choker, Refine Hard/Soft Matte, Roto Brush & Refine Edge, Object Matte), Blur & Sharpen (Gaussian, Fast Box, Directional, Radial, Camera Lens, Bilateral, Sharpen, CC Vector Blur),
  Color Correction (Curves, Levels, Color Balance, Lumetri-style, Hue/Saturation, Tint, Tritone, Colorama, Exposure, Apply Color LUT in Utility), Distort (Bulge, Displacement Map, Mesh Warp, Turbulent Displace, CC Lens, Corner Pin),
  Generate (Gradient Ramp, 4-Color Gradient, Fill, Fractal Noise via Noise & Grain, Lightning, Beam, Circle, Grid, Audio Spectrum/Waveform, CC Light Rays/Sweep/Burst),
  Simulation (CC Particle World, CC Particle Systems II, CC Snowfall/Rainfall/Bubbles, Caustics, Wave World, Card Dance, Shatter-style), Stylize (Glow, Cartoon, Mosaic, Find Edges, CC Vignette, Roughen Edges),
  Time (Echo, Posterize Time, Pixel Motion Blur, Timewarp, Time Displacement), Transition (Gradient Wipe, Linear Wipe, Iris Wipe, Block Dissolve, CC Glass Wipe...), Perspective (Drop Shadow, Bevel Alpha, 3D Camera Tracker, CC Sphere),
  Expression Controls (Slider/Angle/Color/Point/Checkbox/Dropdown/Layer Control), Audio (EQ, Reverb, Delay, Compressor...), Immersive Video (VR ...), Utility (Apply Color LUT, Color Profile Converter, HDR Compander).
- Layer styles (drop shadow, glows, bevel, satin, overlays, stroke): `command_list {filter:"style"}`.

## Masks, roto, tracking
- `layer.addMask {layer,shape:rect|ellipse|rounded|polygon|star,rect,mode}`, `mask.new {layer,vertices,inTangents,outTangents,closed,mode}`, `layer.setMask {mask,mode,inverted}`,
  `mask.addVertex/setVertex/moveVertices/deleteVertices/convertVertex`, `mask.featherPoint.add/set/remove/list`, `mask.interpolate`, `mask.remove`.
- Roto: `roto.stroke {layer,kind:fg|bg|refine,points,frame}`, `roto.propagate {direction,wait}`, `roto.span`, `roto.freeze`, `roto.options`, `roto.model.select|download|install`, `objectMatte.apply {layer,point,box}` / `.propagate` / `.freeze`.
- Tracking: `track.new {layer,kind,position,rotation,scale,target}`, `track.setPoint {tracker,point,center,featureSize,searchSize}`, `track.options {channel,blur,adaptEveryFrame,action}`,
  `track.analyze {direction,start,end,wait}`, `track.apply {dimensions}`, `track.status`, `track.motion`, `track.stabilize`, `track.mask {method,wait}`, `track.warpStabilizer {layer,wait}`, `warp.analyze`,
  `track.camera {shotType,solveMethod,wait}`, `camera.points`, `camera.createFromSolve {kind:text|solid|null|shadowCatcher|camera}`, `camera.setGroundPlane`, `face.*` (face tracking models).
- Others: `puppet.addPin/movePin/recordPin/follow`, `paint.stroke`, `layer.newContentAwareFill`, `contentFill.*`.

## 3D and cameras
`layer.newCamera/newLight/new3dPrimitive/newModel`, `layer.setSwitch threeD`, `comp.renderer {renderer:advanced3d|classic3d}`, `camera.orbit/pan/dolly`, `camera.orbitNull`, `camera.fromModel`, `camera.stereoRig`, `camera.linkFocusToLayer`, `material.*`, `light.*`.

## Templates and Essential Graphics
`essential.setPrimary {comp}`, `essential.addProperty {comp,layer,path,name,group}`, `essential.addMedia`, `essential.list`, `essential.set {layer,control,value}`,
`essential.exportTemplate {comp,path:.ectemplate,name}`, `essential.importTemplate {path,comp,addToComp}`, `templates.list`, `templates.create {id|path}`, `templates.saveAs {name,...}`.

## Render and export
- `renderQueue.add {comp,template,format:h264|hevc|av1|prores|uncompressed|webm|png|jpeg|tiff|exr|gif|wav|aiff,output,quality,resolution:full|half|third|quarter|scale,timeSpan:workArea|comp|custom,start,end,frameRate,channels:rgb|rgba|alpha,bitrate,proresProfile,profile,level,rateControl,webmCodec:vp9|av1,audioBitrate,audio:auto|on|off,proxyUse,effects,motionBlur,colorDepth}` -> item;
  `renderQueue.setRenderSettings`, `setOutputModule`, `setOutput {path}`, `render.addOutputModule` (extra outputs), `renderQueue.render {wait:true}`, `renderQueue.list/stop/remove/move/duplicate`, `renderQueue.formats`, `renderQueue.templates`, `renderQueue.saveTemplate`.
- Stills: `comp.saveFrameAs {path:.png,time,scale}`, `comp.saveFrameAsPsd`, `comp.saveFrameAsExr`, tool `render_frame {time,max_side,path,transparent}`.
- `render.preRender {comp,output,format}`, `render.saveCurrentPreview`.
- Interchange: `file.exportLottie {comp,path:.json|.lottie,includeExpressions,textAsShapes}`, `file.exportTimeline {comp,path,format:xml|fcpxml|otio|edl|aaf|omf}`.
- Folder watching: `file.watchFolder {folder}` renders queued `.ecproj`s and writes `<project>.status.json`.
- CLI: `effectcraft-cli render [--comp C] --out FILE --format F [--start S --end E | --work-area] [--fps N] [--resolution ...] [--quality best|draft] [--channels rgb|rgba] [--jpeg-quality N] [--bitrate KBPS] [--prores PROFILE] [--audio auto|on|off] [--webm-codec vp9|av1] [--queue]`,
  `render-frame [--comp C] [--time S|--frame N] [--max-side PX|--scale K] [--out F.png] [--transparent]`, `render --template T.ectemplate --values V.json`, `bench`.

## Jobs
`jobs.list`, `jobs.wait`, `jobs.cancel` for background work (`wait:false` variants: import probing, tracking, roto, render).

## Verified behaviours (smoke test)
- `comp.new` -> `{comp:1}`; `layer.newSolid` -> `{layer:4}`; `layer.newText` -> `{layer:27}` (uids).
- `add_keyframe` with `keys` + `interpolation:"easyEase"` replies with the key list (in/out Bezier).
- `add_effect` Gaussian Blur `{blurriness:5}` -> params paths `effects/#1/blurriness`, `dimensions`, `repeatEdge`.
- `renderQueue.add {format:"h264",output:abs.mp4,resolution:"half"}` then `renderQueue.render` -> 320x180 @12 fps 2 s became a 160x90, 24-frame H.264 (verified with ffprobe).
- CLI `render --format png --end 0.25 --resolution quarter` -> `seq_00000.png`...; `--format webm` works.
- `effectcraft-cli script --eval '1+1'` -> `2` (unconfined CLI only).
