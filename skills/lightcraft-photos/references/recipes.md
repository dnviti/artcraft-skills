# LightCraft recipes

`run_command`/`command_batch` steps are `{id, params}`; the same ids work in `lightcraft-cli run ID key=value`.
Work in a persistent library (`--library DIR`) when the result must last. Verify with `render_preview` after each block.

## 1. Cull a shoot (first pass)
1. `import {paths:["/abs/shoot"]}` (mode add), `query_photos {limit:500}`.
2. Look at thumbnails-sized previews in batches: `render_preview {id, max_side:700, format:"jpeg"}`.
3. Rejects first (blur, closed eyes, duplicates via `library.findSimilar`): `photo.reject {ids}`; keepers `photo.pick {ids}`;
   best `photo.rate {rating:4, ids}` / 5. `stack.auto {gap:2, preview:true}` for bursts, then apply.
4. Report counts (`catalog.stats`: picks, rejects), do not delete anything: rejects stay in the library.

## 2. Organise: keywords, captions, albums
`photo.setMeta {ids, addKeywords:["lake","sunrise"], creator:"...", copyright:"..."}`, `keyword.rename`/`keyword.merge`
to clean variants, `album.create {name:"Selects"}` + `album.addPhotos {id, ids}`; smart album of picks 4+:
`album.createSmart {name:"Best", rules:{rating:4, ratingOp:"atLeast", flag:"pick"}}`.

## 3. Quick develop of one image
`set_develop {id, values:{"light.exposure":0.3,"light.highlights":-40,"light.shadows":30,"light.whites":10,
"light.blacks":-8,"color.vibrance":20,"effects.clarity":12}}` then `crop {rect:[0.03,0.05,0.97,0.95], angle:-0.6}`
(or `crop.autoStraighten`), preview, adjust, `detail.sharpenAmount` 40 last. Check skin and sky clipping.

## 4. Landscape with sky mask
`mask.add {kind:"linear", start:[0.5,0.0], end:[0.5,0.45], name:"Sky"}` -> `mask.adjust {id, values:{exposure:-0.5,
dehaze:15, saturation:10}}`; `mask.add {kind:"radial", center:[0.62,0.4], rx:0.2, ry:0.14, name:"Sun glow"}` ->
`mask.adjust {values:{temp:40, exposure:0.4}}`. `kind:"sky"` is a heuristic selection: preview the edge.

## 5. Black and white
`develop.treatment {bw:true}`, `set_develop {values:{"bw.blue":-35,"bw.orange":15,"effects.clarity":20,"light.contrast":15,
"grain.amount":18,"vignette.amount":-18}}`, tone with `grading.shadows.hue`/`.sat` (selenium ~ 230/10, sepia ~ 40/12) or
`apply_preset {preset:"lc.bw-selenium", amount:80}`.

## 6. Consistent look across a set
Develop the hero, then `library.select {ids:[...], active:<hero>}`, `develop.sync {groups:[...color and light groups...]}`
(or `develop.copy`/`develop.paste`); fix exposure per photo with `develop.matchExposure {ids}`; preview first, middle,
extreme photos.

## 7. Batch web export
`export {ids:[...], dir:"/abs/out/web", format:"jpeg", longEdge:2000, quality:85, colorSpace:"srgb", metadata:"copyright",
naming:"{name}-web", conflict:"unique"}`; smaller twin: `format:"webp", longEdge:1200, quality:80`. Report the returned paths.

## 8. Print-ready file and proof
`export {id, path:"/abs/out/p.tif", format:"tiff", bitDepth:16, colorSpace:"adobeRgb", longEdge:0, ppi:300}`;
proof sheet: `export.contactSheet {path:"/abs/out/proof.pdf", ids, paper:"a4", columns:4, rows:5, captions:true}`.

## 9. One-off raw to JPEG, no library
`lightcraft-cli render /abs/IMG.ARW -o /abs/out/IMG.jpg --set light.exposure=0.4 --set light.shadows=25 --preset lc.crisp-landscape --size 3000 --quality 90`
(then Read a smaller render to check: `-o /scratch/preview.png --size 1400`).

## 10. Hand edits to another app
`export {id, path:"/abs/out/IMG.ARW", format:"original"}` copies the file with an XMP sidecar carrying the edits
(`crs:` settings); `format:"dng"` embeds them in a DNG. Both leave the library untouched.
