# EffectCraft recipes

Snippets are `{command, params}` for the `batch` tool (atomic; `"$N"` = result of step N, 1-based) or
`command_run`. Param names are from the installed docs; confirm with `command_list {filter}` if one is
rejected. Preview after each block with `render_frame`. Work on a saved `.ecproj`, never touch source media.

## 1. Title card (fade + slide up, easy ease)
1. `comp.new {name:"Title", width:1920, height:1080, frameRate:30, duration:5, background:"#0e1116"}`
2. `layer.newText {name:"Headline", text:"Spring Launch", font:"<installed family>", size:140, fill:"#f4f1ea", position:[960,560], justify:"center"}`
   (check the family with `list_fonts {query}` first)
3. `add_keyframe {layer:"Headline", path:"transform/opacity", keys:[{time:0.2,value:0},{time:0.9,value:100}], interpolation:"easyEase"}`
4. `add_keyframe {layer:"Headline", path:"transform/position", keys:[{time:0.2,value:[960,620]},{time:0.9,value:[960,560]}], interpolation:"easyEase"}`
5. Outro: opacity 100 -> 0 between 4.4 s and 5 s. Hold the settled state 3 s+.
6. Verify frames at 0.0, 0.5, 1.0, 3.0, 4.8.

## 2. Lower third (bar wipes in, text staggered)
- `layer.newShape {kind:"rect", name:"Bar", size:[620,90], fill:"#ff5a36", position:[420,900]}`; set anchor to the left edge
  (`layer.setTransform {layers:["Bar"], prop:"anchor", value:[-310,0]}` if the shape anchor is centred) and animate `transform/scale`
  `[0,100,100] -> [100,100,100]` 0.0 -> 0.5 s with `easyEase`.
- Name text `layer.newText` size 44, Role text size 28 lower opacity; offset each by 3 frames (0.1 s) after the bar.
- A mask or track matte (`layer.setTrackMatte {layer:"Name", matte:"Bar", kind:"alpha"}`) can reveal text through the bar.
- Safe area: keep about 5% from edges; place on a transparent comp; render ProRes 4444 or WebM with alpha (recipe 8).

## 3. Kinetic type (per-character reveal)
1. `layer.newText {text:"MAKE IT MOVE", size:160, fill:"#ffffff"}`
2. `layer.addTextAnimator {layer:"MAKE IT MOVE", properties:["opacity","position"]}` -> `{animator:uid}`
3. Set the animator's Opacity to 0 and Position to `[0,60]` (find paths with `get_layer {flat:true}`), then animate the
   range selector's Offset from 0 to 100 over ~1.2 s with `add_keyframe` and `easyEase`. `layer.addTextSelector {animator, kind:"wiggly"}` adds randomness.
4. Or start from `anim.builtinPresets` / `anim.applyBuiltinPreset {preset, layers}`.

## 4. Logo sting (scale pop + glow + light sweep)
1. `file.import {paths:["/abs/logo.png"], addToComp:true}` (PNG/SVG-raster/PSD; keep it unmodified)
2. Scale 0 -> 108 -> 100 with three keys (0.0, 0.35, 0.55 s), `easyEase`; rotation settle -4 -> 0.
3. `add_effect {layer, effect:"Glow", values:{threshold:60, radius:20, intensity:1.2}}` on the logo or on an adjustment layer above.
4. Light sweep: duplicate the logo layer, `add_effect "Linear Wipe"`/`CC Light Sweep`, animate its position, set the layer
   `setBlendMode Add` and track matte "alpha" from the logo.
5. End with a 1 s hold and `animator` style fade.

## 5. Green-screen key
1. `file.import {paths:["/abs/greenshot.mp4"], addToComp:true}`; set comp size/fps to match (`file.interpretFootage` for fps).
2. Garbage mask: `layer.addMask {layer, shape:"polygon", rect:[...], mode:"add"}` around the actor, feather `masks/#1/feather`.
3. `add_effect {layer, effect:"Key Light", values:{}}` then `effect.pickColor {layer, effect:"Key Light", param:"screenColour", x, y}`
   on a clean screen pixel (or `set_property effects/#1/screenColour "#00b140"`). Check with `view` param: 4 Screen Matte,
   then 10 Final Result. Tune `screenGain`, `screenBalance`, clip black/white; add `Advanced Spill Suppressor`, `Matte Choker`.
4. Put the background below, colour-match the foreground (Curves/Tint), add a slight blur to the matte edge (`Refine Soft Matte`).
5. Verify on frames with motion, fine hair/edges, and a checkerboard/contrasting background to see halos.

## 6. Motion tracking (attach a graphic to a moving point)
1. Footage layer selected: `track.new {layer, kind:"transform", position:true, target:<graphic layer id>}`.
2. `track.setPoint {tracker:"#1", point:1, center:[x,y], featureSize:[40,40], searchSize:[120,120]}` on a high-contrast feature.
3. `track.analyze {layer, direction:"forward", wait:true}` (use the work area to limit length), check `track.status`,
   then `track.apply {dimensions:"xy"}`. Fix drift with `track.setPoint` mid-clip and re-analyze; smooth with `keys.smooth`.
4. Stabilize instead: `track.new {kind:"stabilize"}` or `track.warpStabilizer {layer, wait:true}`.

## 7. Render recipes
- **Web MP4**: `renderQueue.add {format:"h264", output:"/abs/out/title.mp4", timeSpan:"comp", resolution:"full", bitrate:12000}` then
  `renderQueue.render {wait:true}`; `ffprobe` the result.
- **Draft**: `effectcraft-cli render --project /abs/x.ecproj --comp Title --out /scratch/draft.mp4 --format h264 --resolution quarter --quality draft`.
- **Mezzanine for FilmCraft**: `format:"prores", proresProfile:"hq"` (opaque, mov) or `4444` for alpha, `audio:"auto"`.
- **PNG sequence**: `--format png` into an empty folder (`seq_00000.png`...), `channels:"rgba"` for alpha.
- **GIF**: `format:"gif"`, small resolution (e.g. `resolution:"half"`), `loop:true`, low fps (12-15 via `frameRate`).
- **Single still**: `comp.saveFrameAs {path:"/abs/poster.png", time:2.5}` or `render_frame {time, max_side:0, path}`.

## 8. Transparent overlay (alpha)
Keep opaque solids out of the comp (the comp background colour is composited in opaque previews; `render_frame
{transparent:true}` and an RGBA render keep the alpha instead). Render `prores`
`proresProfile:"4444"` `channels:"rgba"` (.mov) for NLEs or `webm` `channels:"rgba"` (VP9) for the web. Check one frame with
`render_frame {transparent:true, path}` and confirm the PNG has an alpha channel (`ffprobe`/`file`).

## 9. Lottie
Use shapes/solids/text (text as shapes with `textAsShapes:true`); avoid effects (not exported). `file.exportLottie {comp:"Main", path:"/abs/anim.json", textAsShapes:true}`;
the `.lottie` extension writes the zipped container. Re-import with `file.importLottie {path}` to eyeball what survived.

## 10. Batch many titles from a template
Build one comp, expose Source Text/colour via `essential.setPrimary` + `essential.addProperty`, then
`essential.exportTemplate {comp, path:"/abs/t.ectemplate"}`; per variant write `V.json` with the control values and run
`effectcraft-cli render --template /abs/t.ectemplate --values /abs/V.json --out /abs/out/name.mp4` (or `render-frame` for stills).
Check `essential.templateInfo {path}` for control ids.
