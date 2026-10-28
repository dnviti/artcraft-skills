# LightCraft command catalogue (installed build 0.15.0, 376 commands)

Always confirm with `list_commands {filter:"<text>"}` (the `params` doc is authoritative; `?` = optional,
`→` = result). Run with `run_command {command, params}` or `command_batch {steps:[{id,params}],
stop_on_error}` (in order, not atomic). CLI: `lightcraft-cli run [--library DIR] ID key=value ...`.
Families by prefix: library 47, photo 43, mask 31, develop 29, faces 21, keyword 20, print 20, denoise 16,
album 15, slideshow 15, stack 11, preset 9, crop 7, curve 7, spot 7, export 7, metadata 7, folder 6,
label 6, version 5, history 5, beforeAfter 5, segment 4, merge 4, filter 4, profile 3, redeye 3, app 3.

## MCP helper tools (shortcuts over commands)
- `import {paths, mode:add|copy|move, destination, organize, rename, album, onDeleted}` -> `{imported, duplicates, failed, scanned, sidecars}`.
- `query_photos {filter, sort, limit=200, offset}` -> photos (id, fileName, width, height, rating, flag, label, keywords, title, edited, previewOnly, format, captured, camera, copyOf).
- `select_photos {ids, active, mode}`; `doc_inspect` (library state + stats); `list_controls {section}`;
  `get_develop {id}`; `set_develop {id, values:{control:number}, settings:{partial JSON}, label}`;
  `apply_preset {preset, amount 0..200, ids}`; `crop {id, rect:[x0,y0,x1,y1], angle, reset}`;
  `render_preview {id, max_side=1024 (<=4096), format:png|jpeg}` (image); `render_photo {id, size, format, path}`;
  `export {...}` (below).

## Library and selection
- `library.selectAll`, `library.select {ids, active, mode:replace|add|toggle|range}`, `library.selectNone`,
  `library.selectBy {flag, rating, ratingOp:gte|eq|lte, label, add}`.
- `library.source {kind:all|recentlyAdded|album|recentlyDeleted|picks|missing|libraryFolder, id|path}`,
  `library.filter {text, rating, ratingOp:atLeast|exactly|atMost, flag, label, kind, merged, edited, date,
  libraryFolder, keyword, person, camera}`, `library.clearFilter`, `library.sort {key, ascending, group, seed}`.
- `library.import {paths, mode, ...}`, `library.folders`, `library.removeFolder {path}` (to Recently Deleted,
  files untouched), `library.missing`, `library.findMissing`, `photo.relink {id, path}`,
  `library.info` (`persistent`, path, counts), `library.state`, `catalog.stats`, `catalog.query`.
- `library.findSimilar {id, similarity 0.8}`; `stack.auto {gap=60, preview}`, `stack.group/ungroup/setTop`.
- `library.xmpPreferences {autoWrite, naming}`, `photo.saveMetadataToFile {ids}`,
  `photo.readMetadataFromFile` (XMP sidecars).
- Dangerous: `photo.delete` (to Recently Deleted, reversible via `photo.restore`),
  `photo.deletePermanently`, `library.emptyRecentlyDeleted` (library only, files stay),
  `library.import mode:move` (deletes originals after verified copy), `photo.rename`,
  `photo.moveToFolder`, `folder.create/rename/move`, `photo.duplicate` (writes `-copy` file),
  `library.compact`, `library.clearPreviews`.

## Culling and metadata
- `photo.rate {rating 0..5, ids}`, `photo.increaseRating/decreaseRating`, `photo.flag {flag:pick|reject|none, ids}`,
  `photo.pick/reject/unflag`, `photo.label {label:red|yellow|green|blue|purple|none, ids}`,
  `photo.rotateLeft/Right`, `photo.flipHorizontal/Vertical`.
- `photo.setMeta {ids, title, caption, altText, creator, copyright, copyrightStatus, usageTerms, location, city,
  state, country, gps, keywords, addKeywords, removeKeywords}`; `metadata.savePreset/applyPreset {name, ids}`;
  `photo.setCaptureTime`, `photo.autoTagTracklog {path(GPX), offset, dryRun}`; `photo.allMetadata`, `photo.inspect`.
- Keywords: `keyword.list`, `keyword.create {name, parent, synonyms, addToSelected}`, `keyword.rename {from,to}`,
  `keyword.merge {from:[..], into}`, `keyword.delete`, `keyword.suggest {prefix, ids}`, `keyword.sets`,
  `keyword.saveSet/useSet`, `keyword.export/import`, `keyword.purgeUnused`.
- Albums: `album.create {name, parent, folder, addSelected}`, `album.createSmart {name, rules}`,
  `album.setRules`, `album.ruleFields`, `album.addPhotos {id, ids}`, `album.removePhotos`, `album.rename/delete/move/
  reorder/sort/setCover`, `albums.list`.
- Labels: `label.names`, `label.setNames`, `label.sets`.

## Develop
- Sliders: `develop.set {control, value | values:{id:n}, ids}`, `develop.adjust {control, delta}`,
  `develop.quickAdjust {control, delta, ids}` (relative, many photos), `develop.resetControl {control}`,
  `develop.resetSection {section}`, `develop.reset {ids}`, `develop.get`, `develop.controls {section}`.
- Look: `develop.auto`, `develop.wb {mode:asShot|auto|daylight|cloudy|shade|tungsten|fluorescent|flash|custom, temp, tint}`,
  `develop.wbPick {x,y}` (eyedropper), `develop.treatment {bw}`, `develop.autoBwMix`, `develop.profile {id, amount}`
  (`profiles.list`: lc.color, lc.neutral, lc.vivid, lc.landscape, lc.portrait, monochrome...),
  `develop.curve {channel:master|red|green|blue, points:[[x,y]..] 0..1}`, `curve.presets/applyPreset {name}/reset`,
  `pointColor.pick`, `develop.targeted`, `develop.hdr {enabled, maxEv}`, `develop.matchExposure {ids}`.
- Copy/sync: `develop.copy {groups}`, `develop.paste {ids, groups}`, `develop.pastePrevious`, `develop.sync {groups}`,
  `develop.autoSync`, `develop.merge`.
- History/versions: `history.list/previous/next/restore {index}/clear`, `version.create {name}/restore {index}/delete/rename`,
  `edit.undo`, `edit.redo`, `beforeAfter.setBefore {source:import|current|history|version}`.
- Presets: `presets.list` (ids `lc.warm-glow`, `lc.teal-orange`, `lc.faded-matte`, `lc.warm-film`, `lc.bw-high-contrast`,
  `lc.bw-selenium`, `lc.crisp-landscape`, `lc.golden-hour`, `lc.soft-skin`, `lc.moody`, `lc.cinematic`, `lc.neon-night`,
  `lc.autumn-gold`, `lc.cross-process`... 41 built in, groups Color, Film, B&W, Landscape, Portrait, Style, Urban,
  Food, Seasons, Vintage), `preset.apply {id, amount 0..200, ids}` (or helper `apply_preset {preset}`),
  `preset.create {name, group, groups}`, `preset.update/rename/delete/favorite/export/import {paths}` (.lcpreset, XMP,
  .lrtemplate).
- Control ids by section (min..max):
  - light: `light.exposure` -5..5 (EV), `light.contrast|highlights|shadows|whites|blacks` -100..100.
  - color: `wb.temp` 2000..50000, `wb.tint` -150..150, `color.vibrance|saturation` -100..100.
  - effects: `effects.texture|clarity|dehaze` -100..100; vignette: `vignette.amount` -100..100, `.midpoint|.feather|.highlights`
    0..100, `.roundness` -100..100; grain: `grain.amount|size|roughness` 0..100.
  - curve: `curve.highlights|lights|darks|shadows` -100..100, `curve.split*`, `curve.refineSaturation`.
  - mixer: `mixer.<red|orange|yellow|green|aqua|blue|purple|magenta>.<hue|sat|lum>` -100..100;
    B&W: `bw.<same bands>` -100..100.
  - grading: `grading.<shadows|midtones|highlights|global>.<hue 0..360|sat 0..100|lum -100..100>`,
    `grading.blending` 0..100, `grading.balance` -100..100.
  - detail: `detail.sharpenAmount` 0..150, `.sharpenRadius` 0.5..3, `.sharpenDetail|Masking` 0..100,
    `detail.nrLuminance|nrDetail|nrContrast|nrColor|nrColorDetail|nrColorSmoothness` 0..100, `enhance.denoise` (AI, needs model).
  - optics: `optics.distortion|vignetting|caRed|caBlue` -100..100, `optics.defringePurple|Green` 0..20, profile amounts 0..200.
  - geometry: `geometry.vertical|horizontal|aspect|offsetX|offsetY` -100..100, `geometry.rotate` -10..10,
    `geometry.scale` 50..150, `crop.angle` -45..45. calibration: `calibration.*` -100..100.

## Crop, geometry
`crop {rect:[x0,y0,x1,y1], angle}` (helper) / `crop.set {rect, angle}`, `crop.aspect {aspect:"original|free|current|toggle|1x1|4x5|5x7|2x3|4x3|16x9|16x10|[w,h]", orientation}`,
`crop.rotateAspect`, `crop.straighten {angle}`, `crop.autoStraighten`, `crop.reset`,
`geometry.upright {mode:off|auto|guided|level|vertical|full}`, `geometry.guides`.

## Masks and spots
- `mask.add {kind:brush|linear|radial|sky|subject|background|luminanceRange|colorRange|object|prompt, name,
  start/end (linear), center/rx/ry/angle/feather (radial), lo/hi (ranges)}` -> `{activeMask: id}`.
  `object`/`prompt` need the optional SAM 3 model.
- `mask.addComponent {id, op:add|subtract|intersect, kind, ...}`, `mask.brushStroke {id, points, size, feather, flow,
  density, erase, autoMask}`, `mask.adjust {id, values:{exposure, contrast, highlights, shadows, whites, blacks, temp, tint,
  texture, clarity, dehaze, hue, saturation, sharpness, noise, moire, defringe, color_hue, color_sat, amount}}`,
  `mask.invert/rename/duplicate/delete/deleteAll/visible/select/move`, `mask.refine`, `mask.component {component, action}`,
  `mask.effects/applyEffect/saveEffect` (reusable local-adjustment presets).
- Spots: `spot.findDust {sensitivity}`, `spot.findBlemishes`, `spot.add {mode:remove|heal|clone|fill, points:[[x,y]],
  size, feather, opacity, source}`, `spot.update/delete/refreshSource`; `redeye.add`, `redeye.catchlight`.

## Merge
`merge.hdr {ids, align, deghost, autoSettings, stack, preview}`, `merge.panorama {ids, projection, boundaryWarp, autoCrop,
fillEdges}`, `merge.hdrPanorama`, `merge.hdrBatch`; they write a DNG next to the first source. CLI: `lightcraft-cli merge hdr|panorama FILES`.

## Export
`export` / `app.export {path | dir, ids, preset, format:jpeg|png|tiff|psd|webp|avif|jxl|original|dng|rendereddng,
longEdge|shortEdge|width+height(+fit)|percent|megapixels, dontEnlarge, quality 1..100, limitKb, colorSpace:srgb|displayP3|adobeRgb|
proPhoto|rec2020, bitDepth (PNG 8|16, TIFF 8|16|32, PSD 8|16, AVIF 8|10, JXL 8|16), ppi, metadata:all|allExceptCamera|
copyright|none, naming, destinationMode:specificFolder|sameAsOriginal (+subfolder), conflict:unique|overwrite|skip,
sharpening options, watermark options, hdr, hdrTransfer:pq|hlg, jxlLossless, jxlEffort, dngCompression}` ->
`{files:[{path, bytes, width, height, sidecars}]}`. `export.presets`, `export.savePreset {name, params}`,
`export.checkTarget {path}`, `export.contactSheet {path, ids, paper:a4|letter, landscape, columns, rows, captions}`
(<=1000 photos, 100 pages), print: `print.get/set/reset`, `print.cell.add/move/resize`, `print.layout.autoLayout`,
`print.template.*`, `print.exportPdf {path}`; slideshows: `slideshow.*` (`slideshow.export`).
CLI one-shot: `lightcraft-cli render IN -o OUT [--set CONTROL=VALUE] [--settings FILE|.lcpreset] [--preset ID] [--size N]
[--quality Q] [--opt KEY=VALUE]` (jpg/png/tif/webp/avif/jxl/psd/dng by extension, no library needed).

## Optional models (not installed here, do not download unasked)
`segment.model.*` (SAM 3, Object/Describe masks), `faces.*` (detection, People), `denoise.*` (AI denoise).

## Desktop-only / attached mode
`lightcraft --control PORT` serves a JSON-lines channel; `lightcraft-cli mcp --connect 127.0.0.1:PORT` (and
`run --connect`) then drive the live app including `ui.screenshot`, `ui.clickWidget`, `ui.pointer`. Not how the MCP
is registered by default.
