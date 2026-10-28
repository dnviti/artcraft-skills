# PhotoCraft recipes

All snippets are `{id, params}` steps for `command_batch` (MCP) or `--cmd ID --params 'JSON'` pairs
(CLI route, `photocraft-cli run proj.pcraft ... --out proj.pcraft --in-place`). Verify with a preview
after each block. Work on a `.pcraft` copy, never the original.

## 1. Quick enhance a flat photo (non-destructive)
1. `layer.select {name:"Layer 0"}` (or the Background) so the base is active.
2. `layer.newAdjustmentLayer.levels {inBlack:6,gamma:1.08,inWhite:246}`; rename "Levels"
3. `layer.newAdjustmentLayer.vibrance {vibrance:25,saturation:-3}`; rename "Vibrance"
4. `layer.newAdjustmentLayer.curves {points:[[0,0],[64,58],[192,200],[255,255]]}` for gentle S-curve.
5. Sharpen last on a merged copy or smart object: `layer.smartObjects.convertToSmartObject`
   then `filter.sharpen.unsharpMask {amount:60,radius:1.0,threshold:2}`.
Preview; compare with the original; back off anything that clips skin or sky.

## 2. Remove a blemish / object
- Small: new empty layer `layer.new.layer {name:"Heal"}`, then `paint.spotHealing {points:[[x,y]],size:30,
  sampleAllLayers:true}`.
- Larger: `paint.remove {strokes:[[[x,y],...]],closeLoops:true,newLayer:true}` (circle the object), or select
  with `select.lasso`/`select.quick`, expand by 6 px (`select.modify.expand {radius:6}`), then
  `edit.contentAwareFill {output:"new"}`. Run long ones with `wait:false` and poll `jobs_list`.
- Check repeated textures, straight lines and edges in a zoomed preview.

## 3. Cut out a subject / replace background
1. `select.subject` (or `layer.removeBackground`), inspect coverage.
2. `select.modify.smooth {radius:2}`, `select.modify.contract {radius:1}`, `select.modify.feather {radius:0.8}`.
3. `layer.layerMask.revealSelection` on the photo layer; `select.deselect`.
4. Add the new background below: `doc_place`/`file.placeEmbedded`, then `layer.moveTo {target:<photo>,
   position:"below"}`; match colour (`layer.newAdjustmentLayer.colorBalance`, clipped with
   `layer.createClippingMask`), add a soft shadow on a layer under the subject.
5. Look for fringing at hair/edges at 100% zoom; fix on the mask with `paint.stroke {target:"mask",
   color:"#000000"/"#ffffff",size:3,hardness:0.3,opacity:0.5}`.
6. Export PNG/WebP for transparency, JPG for flat.

## 4. Black and white with feel
`layer.newAdjustmentLayer.blackWhite {reds:35,yellows:55,greens:45,blues:15}` then curves for contrast and
`filter.noise.addNoise` on a neutral-gray Overlay layer (`layer.new.layer {mode:"Overlay",fillNeutral:true}`)
for grain.

## 5. Text on a photo (legible)
- Darken where the text sits: `layer.newFillLayer.gradient {from:"#000000",to:"#000000"}` is solid; better a
  `paint.gradient {from,to,stops:[[0,"#000000"],[1,"#00000000"]]}` on a new layer at 50% opacity, or a
  soft `layer.layerStyle.dropShadow {opacity:60,size:12,distance:2}`.
- `type.fonts` to pick an installed family; `type.create {x:80,y:900,text:"...",font:"...",size:64,
  color:"#ffffff",box:[80,820,900,200]}`. Contrast >= 4.5:1 against the actual pixels (preview).

## 6. Social / web export set from one master
1. Master stays `.pcraft` at full res (never resized in place).
2. For each target: `image.duplicate` -> `image.crop {x,y,width,height,targetWidth,targetHeight}` (aspect
   crop plus resize in one step) -> `filter.sharpen.unsharpMask {amount:40,radius:0.6}` -> `doc_save
   {path:"hero-1600w.webp",quality:82}` / `.jpg quality 85` / `.png`.
3. Typical sizes: 1080x1350 (portrait post), 1080x1080, 1200x630 (link preview), 1920x1080 (hero), 512/192
   (icons, PNG). Report the files with sizes.
4. Only after the user accepted the look (Show and approve).

## 7. Collage / contact sheet
New doc at final size (`doc_new`), place each image (`doc_place {path,center,scale}`) as smart objects,
align/distribute (`layer.align.*`, `layer.distribute.*`), frames for clipping (`layer.new.frame`), keep
consistent gaps in px, add a neutral background fill layer at the bottom.

## 8. Resize for print
`image.imageSize {resolution:300,keepPrintSize:false}` shows physical size; for a target of 20x30 cm at
300 ppi use width 2362, height 3543 with `resample:"preserveDetails"` for upsizing; state the effective
ppi if the source is smaller.
