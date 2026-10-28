---
name: photocraft-images
description: "Edit, retouch, composite and export raster images and photos in PhotoCraft (ArtCraft's Photoshop-class image editor, via the `photocraft` MCP server (mcp__photocraft__*) or `photocraft-cli`). Use whenever the user mentions PhotoCraft or the photocraft MCP tools, or asks to retouch/edit/enhance/resize/crop/colour-correct a photo or image, remove a background or object, make a collage, composite layers, add text or effects to an image, work with layers, masks, selections, adjustment layers or filters, open or convert PSD/PNG/JPG/TIFF/WebP files, or export web/print image sizes. Covers the non-destructive layer workflow, render-and-verify loop, save/export and the mandatory show-and-approve phase. UI/screen design (mockups, apps, landing pages) belongs to figcraft-design, vector logos/icons/illustrations to vectorcraft-illustration."
license: MIT
metadata:
  author: dnviti
  version: "1.0.0" # x-release-please-version
---

# PhotoCraft images

PhotoCraft is an open-source, Photoshop-class raster editor (layers, masks, selections, adjustment
layers, smart objects, filters, retouching, type, shapes, paths, artboards; native `.pcraft`, also PSD,
PNG, JPG, TIFF, WebP, EXR...). You drive it with the `photocraft` MCP server (headless engine) or, for
paths outside its file roots or when the preflight fails, with `photocraft-cli` from Bash (section 1). This skill says what to build,
in what order, to what quality bar, and how to hand the result to the user.

- Command ids and params by area: `references/command-catalog.md`
- Recipes (retouch, background removal, collage, social/web export, text on photo): `references/recipes.md`

## 0. Ground rules for the tools

MCP tools: `doc_new`, `doc_open`, `doc_save`, `doc_export`, `doc_export_layers`, `doc_place`,
`doc_inspect`, `render_preview` (= `doc_render_preview`), `session_list`, `doc_select`, `doc_close`,
`command_list`, `command_run`, `command_batch`, `jobs_list`, `jobs_cancel`, plus bridge-only `ui_*` and
`control_call`. They are deferred: load schemas with ToolSearch (`+photocraft`, max_results 30) first.

- **Every action is a command.** Discover with `command_list {filter:"curves"}` (ids, labels, the
  `params` doc, `enabled`/`disabledReason`). Never call it unfiltered: the catalogue is ~940 commands
  (300 KB). The `params` doc is the truth, e.g. `{"radius":0.1..1000=1}` means optional number, default 1.
- **Coordinates** are document pixels, origin top-left, y down. Colours `"#rrggbb"`.
- **One history step per command**; `command_batch {steps:[{id,params}], stop_on_error}` runs in order
  but is not atomic (earlier steps stay applied on failure; fix and continue, or `history.undo`).
- **Layer targeting**: commands act on the active layer unless `layer` (id) is given. `layer.select
  {name|layer}` changes the active layer. Creation commands return the new layer id: keep ids, names
  can duplicate. `doc_inspect` lists layers top to bottom with ids, kind, bounds, opacity, masks.
- **Long commands** (filters on big images, Content-Aware Fill, `paint.remove`, Photomerge) can run as
  background jobs with `wait:false`: poll `jobs_list`, stop with `jobs_cancel`.
- **Filters need a pixel layer.** Active layer a Shape/Adjustment/Type layer gives "filters need a pixel
  layer": select a pixel layer, rasterize (`type.rasterize`, `shape.rasterize`), or convert to a smart
  object first (`layer.smartObjects.convertToSmartObject`, then filters stay editable as smart filters).
- Programmatic commands never open dialogs; a failing command leaves the document unchanged.

## 1. File access: check this first (critical)

`photocraft-cli mcp` is headless and has **no file access unless it was started with
`--automation-read-root DIR` / `--automation-write-root DIR`** (each flag accepts a single directory for
PhotoCraft: it is not repeatable, unlike the other ArtCraft apps). Example registration:
`claude mcp add --scope user photocraft -- /usr/bin/photocraft-cli mcp --automation-read-root /path/to/dir --automation-write-root /path/to/dir`.
With roots granted (in sessions started after the MCP was registered), so:

- `doc_open`, `doc_place`, `doc_save`, `doc_export*` work directly on paths under the root
  (absolute or relative to the root). Paths outside it (for example a temp or scratch dir that is NOT
  the root) fail with `automation path rejected: absolute paths must
  be inside the automation root`: put MCP working/preview files under the root, or use the CLI
  route for them. Ambient-path commands (`file.saveACopy`, ...) stay disabled; use `doc_save`.
- **Preflight** at the start: `session_list`, then try `doc_open`/`doc_save` on the real path. If it is
  refused (`automation filesystem access is not granted` = session started before the roots were added or
  roots missing; `path rejected` = outside the root), use the **CLI route** below as the fallback,
  and for the first case tell the user once that restarting Claude Code picks up the roots, and that the
  MCP server must be registered with `--automation-read-root/--automation-write-root`. Do not edit the
  user's config yourself.

**CLI route (fallback; works anywhere, no roots, in Bash)**: each `run` is a full pipeline on one file.

```bash
# never edit the user's original: make a project copy first (lossless, layered)
photocraft-cli convert /abs/photo.jpg /abs/work/photo.pcraft
# apply edits in place on the project copy (commands run in order; one failure aborts and saves nothing)
photocraft-cli run /abs/work/photo.pcraft \
  --cmd layer.newAdjustmentLayer.curves --params '{"points":[[0,0],[128,142],[255,255]]}' \
  --cmd layer.setProps --params '{"name":"Curves lift"}' --out /abs/work/photo.pcraft --in-place
# preview to look at (flattens), then Read the PNG
photocraft-cli convert /abs/work/photo.pcraft /path/to/tmp/preview.png
photocraft-cli info /abs/work/photo.pcraft          # layer tree JSON (ids, names, kinds)
photocraft-cli run --new '{"width":1920,"height":1080,"background":"#ffffff","name":"Poster"}' --cmd ... --out /abs/x.pcraft
```

Notes: `--cmd`/`--params` pairs repeat, but `--out` and `--in-place` only once; `--out` equal to the input
is refused without `--in-place`; the selection and history do not survive between runs (selection-
dependent steps go in the same run); layer ids persist in `.pcraft`. `--format`, `--quality 1-100`,
`--tiff-layers` control output. `photocraft-cli commands` dumps the catalogue; `batch`/`droplet` process
folders. Preview files go in a temp dir, not next to the user's files.

## 2. Workflow

1. **Brief**: what is the image for (web, print, social, thumbnail), target size/format, what must not
   change, where the original lives. Ask only what you cannot infer.
2. **Safe start**: never touch the original. Open or convert it into a project `.pcraft` copy (project
   dir or user-named path) and work there. New artwork: `doc_new` with the real target size.
3. **Plan the layer stack** before editing (section 3), then build it.
4. **Verify loop** after each major step (section 5).
5. **Save** the layered `.pcraft` (keeps everything editable) and **Show and approve** (section 7).
6. **Final export** only after acceptance (section 6).

Scale work to the request: a one-line "brighten this" is one adjustment layer and a preview, not a
10-layer retouch.

## 3. Craft know-how: non-destructive first

- **Adjustments as adjustment layers** (`layer.newAdjustmentLayer.*`: levels, curves, hueSaturation,
  vibrance, colorBalance, exposure, selectiveColor, photoFilter, blackWhite, gradientMap, colorLookup...),
  never `image.adjustments.*` on the pixels unless baking is the point. They keep params editable
  (`layer.setAdjustment`) and take a mask: with a selection active the selection becomes the mask.
- **Filters as smart filters**: `layer.smartObjects.convertToSmartObject`, then the filter; adjust later
  with `layer.smartFilter.setParams`.
- **Retouch on a new empty layer** (`layer.new.layer`) with `sampleAllLayers:true` / `sampleLayer`
  options on healing, spot healing, clone stamp, `paint.remove {newLayer:true}`, so the photo stays
  untouched and the fix can be hidden.
- **Dodge/burn and local contrast**: a 50% gray layer in Overlay/Soft Light (`layer.new.layer
  {mode:"Overlay", fillNeutral:true}`) painted black/white at low opacity.
- **Masks over erasing**: `select.*` then `layer.layerMask.revealSelection` / `hideSelection`, paint on
  the mask with `paint.stroke {target:"mask"}`. Feather soft edges (`select.modify.feather`, or `feather`
  in `select.rect`); `select.modify.expand/contract/smooth` fix halos. `layer.removeBackground` does
  Select Subject to a mask in one step; refine afterwards. Isolated subject on transparent: export PNG/WebP.
- **Order of operations**: crop/straighten and size first (`image.crop`, `image.imageSize`), then
  exposure/white balance, colour, local fixes, then sharpen last, at output size
  (`filter.sharpen.unsharpMask`/`smartSharpen`, or `filter.other.highPass` in Overlay).
- **Resolution**: downscale freely, upscale rarely (and say so). Web: sRGB 8-bit RGB; print: 300 ppi at
  physical size (`image.imageSize {resolution, resample}`); keep CMYK/16-bit only if asked
  (`image.mode.*`).
- **Colour discipline**: keep one tonal intent (a look), neutralise casts before stylising, check skin
  tones are not clipped (use Levels/Curves points, not only Auto Tone). `image.autoTone/autoColor`
  are starting points, judge the preview.
- **Text and shapes**: `type.create {x,y,text,font,size,color,box?}` (check `type.fonts`) and
  `shape.create {kind,rect,fill,stroke}` stay editable vector/type layers until rasterized. Name layers
  (`layer.renameLayer`) and group (`layer.groupLayers`) so the stack reads.
- **Layer styles** for shadows/glows/strokes: `layer.layerStyle.dropShadow {distance,size,opacity,
  angle}`, `.stroke`, `.colorOverlay`, `.outerGlow` (non-destructive; `add:true` stacks).
- **Compositing**: `doc_place` / `file.placeEmbedded` brings a file in as a smart object (lossless
  scaling); match light direction, colour temperature, grain and edge softness before judging.
- **Do not fabricate evidence**: do not alter photos to mislead (documents, IDs, news imagery); object
  removal and cosmetic retouching are fine, faking a record is not.

## 4. Building blocks (details in the catalogue)

| Goal | Commands |
|---|---|
| New/open | `doc_new {width,height,background,mode,depth}`, `doc_open {path}`, `session_list`, `doc_select` |
| Crop / size | `image.crop {x,y,width,height,angle,targetWidth,targetHeight}`, `image.imageSize {width|percent,resolution,resample}`, `image.canvasSize {width,height,anchor,extensionColor}` |
| Tone/colour | `layer.newAdjustmentLayer.levels/curves/exposure/vibrance/hueSaturation/colorBalance/selectiveColor`, `image.adjustments.shadowsHighlights` |
| Select | `select.rect {x,y,width,height,ellipse,feather,mode}`, `select.subject`, `select.sky`, `select.quick {points,size}`, `select.colorRange`, `select.magicWand {x,y,tolerance}`, `select.modify.*`, `select.saveSelection/loadSelection`, `select.deselect` |
| Masks | `layer.layerMask.revealAll/hideAll/revealSelection/hideSelection/apply`, `layer.removeBackground`, `layer.createClippingMask` |
| Retouch | `paint.spotHealing`, `paint.healingBrush`, `paint.cloneStamp`, `paint.remove`, `edit.contentAwareFill`, `paint.dodge/burn`, `filter.liquify`, `image.detectFaces` |
| Paint/fill | `tools.setColors`, `paint.stroke {points,size,hardness,color,target}`, `paint.gradient {from,to,colors}`, `paint.bucket`, `edit.fill {contents}` |
| Filters | `filter.blur.gaussianBlur/surfaceBlur/lensBlur`, `filter.sharpen.unsharpMask/smartSharpen`, `filter.noise.reduceNoise/addNoise`, `filter.other.highPass`, `filter.cameraRaw` |
| Layers | `layer.new.layer`, `layer.new.group`, `layer.duplicate`, `layer.setProps {opacity,blend,visible,fill,locked}`, `layer.moveTo`, `layer.align.*`, `layer.mergeDown`, `layer.flattenImage` |
| Transform | `edit.transform {scaleX,scaleY,rotate,dx,dy,rect|quad|matrix}`, `edit.transform.flipHorizontal` |
| Type/shape | `type.create`, `type.setStyle`, `shape.create` |
| Artboards | `layer.new.artboard {preset,name}`, `file.export.artboardsToFiles {dir,format}` |

## 5. Verify loop (mandatory)

After each major step:

1. `doc_inspect` (MCP) or `photocraft-cli info FILE` (CLI): check layer names, kinds, opacity, mask
   presence, size, mode, history. Look for the active layer being the wrong one (most common error).
2. **Look**: `render_preview {max_side:1600}` (flattened PNG, default 1024, max 2048; 0 = full size
   within the ceiling), or on the CLI route `photocraft-cli convert proj.pcraft /path/to/tmp/preview.png`
   then Read it. Check halos on mask edges, banding, clipped highlights/blocked shadows, skin colour,
   over-sharpening, noise, stray selection fills, text legibility and position.
3. For fine detail, preview a crop: `image.crop` is destructive on the live doc, so on the CLI route
   preview from a throw-away copy, or in MCP `command_run history.undo` after looking.
4. Fix with a command, `history.undo`/`edit.undo`, or by adjusting the layer's own params; repeat.
5. Before saving: layer names sensible, no empty/hidden junk (`layer.delete.hiddenLayers`,
   `file.scripts.deleteAllEmptyLayers`), pixel size is what the brief asked.

## 6. Save and export

- **Native, layered, lossless**: `.pcraft` (`doc_save {path:"x.pcraft"}`; no path writes back to a
  `.pcraft`/PSD/PSB that is the document's own file). PSD keeps layers for Photoshop users;
  `doc_save`/`doc_export` warnings list what the format cannot hold.
- **Flat exports** by extension: `png` (lossless, transparency), `jpg` (`quality` 1-100; photos 82-90,
  web 75-85), `webp` (`quality` => lossy, none => lossless), `tif` (`tiffLayers` to keep layers),
  `exr`, `tga`, `dds`. Exports never replace the opened file unless saved in its own PSD/PCRAFT format.
- Many sizes: `layer.new.artboard {preset}` + `file.export.artboardsToFiles {dir,format,quality}`;
  `doc_export_layers {dir,format}` for per-layer assets; for resized copies run
  `image.imageSize {width, resample:"bicubicSharper"}` on a duplicate (`image.duplicate`), never on the
  master.
- Descriptive file names (`portrait-retouched-v2.pcraft`, `hero-1600w.webp`); report absolute paths.
- Under the automation root save with `doc_save`/`doc_export`; for paths outside it, or if the preflight fails
  (section 1), the CLI route is how you save: `photocraft-cli run ... --out F`.

## 7. Show and approve (mandatory final phase)

Every task ends here, after the verify loop. The headless session has no window, so the user cannot
see the work until it is saved and the real app is opened on it.

1. **Save** the layered project `.pcraft` into the project directory or the path the user named, with a
   descriptive name, never over the user's original image unless they said so. Also write a flat preview
   or deliverable copy next to it if useful. Note the full absolute paths.
2. **Open PhotoCraft on that file, detached** (verified: `/usr/bin/photocraft`, `photocraft [FILES]...`):
   `setsid photocraft /abs/path/project.pcraft >/dev/null 2>&1 &`
   Native extension `.pcraft` (MIME `application/x-photocraft`); the app also opens PSD, PSB, PNG, JPG,
   TIFF, WebP, GIF, BMP, TGA, EXR, ... On Linux a second launch opens the file as a **new tab in the
   PhotoCraft already running** (`--new-instance` forces a separate window), so if the user already has
   it open do not launch again unless you need the new file shown. `setsid xdg-open file.pcraft ...`
   also works. If the app is already attached through a bridge (`--control`), just use that session.
   Do not leave extra instances you started running past the task if the user did not ask for the app.
3. **Stop and ask.** Give the full path and ask the user to accept or describe changes. No final
   export, delivery in other sizes/formats, or further steps before explicit acceptance. Silence or a
   vague reaction is not acceptance.
4. **Loop on changes**: apply them, redo the verify loop for what changed, save again, reopen/refresh
   (new tab or the already-open window, tell the user to reload if the file is already open), ask again.
5. **Inside a subagent** (cannot talk to the user): do steps 1 and 2, then return the file path(s), a
   short summary of what was done, and state clearly that **user approval is pending**. The orchestrator
   asks the user and relays changes; export/handoff waits for acceptance.

## 8. Top gotchas (more: `references/command-catalog.md`)

- MCP file access is limited to the automation root (section 1): on a refusal do not retry the same call, switch to the CLI route.
- Filters refuse non-pixel layers; adjustments/shapes/type are not pixels. Select the pixel layer first.
- A selection is applied to the next command and to the next new mask/adjustment layer: `select.deselect`
  when done, or later fills/filters are silently limited to it.
- Fill/paint colour comes from `tools.setColors` (foreground) unless `color` is passed.
- Params are strict: unknown keys or out-of-range values are errors; read the `params` doc.
- `layer.new.layer` and others take `layer`/`name` forms only as documented; names can duplicate, use ids.
- `image.crop`, `image.imageSize`, `image.canvasSize` change the whole document; do them before layer work.
- `doc_save` of a flat format flattens the output only (layers stay in the open doc); the warning says
  what was lost. A saved JPG is not a project file.
- Opening a PNG/JPG makes a single pixel layer "Layer 0"/"Background": a locked Background cannot
  take some operations; `layer.new.layerFromBackground` unlocks it.
- `preview` max is 2048 px on the long side; judge detail on crops.
- Do not leave test docs open: `doc_close`; never delete user files.
