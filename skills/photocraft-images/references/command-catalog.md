# PhotoCraft command catalogue (installed build, ~940 commands)

Always confirm with `command_list {filter:"<text>"}` (the `params` doc is authoritative; notation
`name:type=default`, `?` = optional). Families by id prefix: layer (221), filter (124), edit (79),
type (67), image (66), file (58), select (35), view (31), paint (26), channel (22), path (21),
actions (18), brush (17), layerComp (14), tools (13), history (13), gradient (12), swatches (12),
document (11), pattern (10), shape (9), style (7), slice, timeline, notes, plugin.

## Documents and files
- MCP: `doc_new {width=1920,height=1080,mode:rgb|gray|cmyk|lab,depth:8|16|32,background:white|black|transparent|#hex,name}`
  -> `{document:index}`; `doc_open {path}`; `doc_place {path,scale,fit,center}` (smart object);
  `doc_replace_smart_object {layer,path}`; `doc_save {path?,format?,quality?,tiffLayers?}`;
  `doc_export` (same, always a conversion); `doc_export_layers {dir,format,prefix,visible_only}`;
  `doc_export_data_sets`/`doc_import_data_sets` (variable data); `doc_close {index?}`;
  `session_list`; `doc_select {index}`; `doc_inspect`; `render_preview {max_side<=2048}`.
- Paths only under the granted automation root (a directory passed with `--automation-read-root`/`--automation-write-root`; anything else is rejected: see SKILL.md section 1).
- Commands: `file.new`, `file.openAs`, `file.placeEmbedded {path,scale,fit,smartObject,center}`,
  `file.placeLinked`, `file.fileInfo`, `file.revert`, `file.close`, `file.export.quickExport {path}`,
  `file.export.layersToFiles`, `file.export.artboardsToFiles {dir,format,prefix,artboards,quality}`,
  `file.export.layerCompsToFiles`, `file.export.presets.*`, `file.generate.imageAssets`,
  `file.automate.fitImage`, `file.automate.batch`, `file.scripts.imageProcessor`,
  `file.automate.photomerge`, `file.automate.cropAndStraightenPhotos`, `file.automate.contactSheetII`.
  Ambient-path ones (`file.saveACopy` etc.) are disabled in headless MCP; use `doc_save`.
- Output formats: pcraft, psd, psb, png, jpg, tif, webp, exr, tga, dds, dpx, gif, bmp...
  `jpg/webp quality 1-100`; `tgaBits 24|32`; `ddsCompression none|bc1|bc2|bc3`.

## Image geometry and mode
`image.crop {x,y,width,height,angle,deleteCroppedPixels=true,contentAware,targetWidth,targetHeight,resolution}`,
`image.imageSize {width,height,percent,resolution,keepPrintSize,resample:automatic|preserveDetails|bicubicSmoother|bicubicSharper|bicubic|nearest|bilinear|lanczos|none}`,
`image.canvasSize {width,height,relative,anchor:center|topLeft|...,extensionColor}`, `image.trim`,
`image.rotation.arbitrary`, `image.imageRotation.90cw|90ccw|180|flipCanvasHorizontal`,
`image.perspectiveCrop`, `image.mode.rgb|grayscale|cmyk|lab|bits8|bits16|bits32|indexedColor|duotone`,
`image.duplicate`, `image.detectFaces {minScore}` -> faces with rect and landmarks,
`image.autoTone|autoContrast|autoColor`, `image.applyImage`, `image.calculations`.

## Adjustments (prefer layers)
Non-destructive: `layer.newAdjustmentLayer.<kind>` for brightnessContrast `{brightness -150..150,contrast -50..100}`,
levels `{inBlack,gamma,inWhite,outBlack,outWhite,red,green,blue}`, curves `{points:[[in,out],...],red,green,blue}`,
exposure `{exposure,offset,gamma}`, vibrance `{vibrance,saturation}`, hueSaturation
`{hue,saturation,lightness,colorize,reds..magentas}`, colorBalance `{shadows,midtones,highlights:[cr,mg,yb]}`,
blackWhite, photoFilter `{filter,color,density}`, channelMixer, invert, posterize, threshold,
gradientMap `{stops:[[0,"#hex"],[1,"#hex"]]}`, selectiveColor `{colors,cyan,magenta,yellow,black}`,
colorLookup `{lut: warm|cool|tealOrange|bleachBypass|fadedFilm|...}`. Edit later with
`layer.setAdjustment {layer, ...params}`. With a selection active the adjustment gets it as its mask.
Destructive twins: `image.adjustments.*` (also `shadowsHighlights {shadowAmount,highlightAmount,...}`,
`replaceColor`, `matchColor`, `hdrToning`, `equalize`, `desaturate`).

## Selections
`select.all|deselect|inverse|reselect`, `select.rect {x,y,width,height,mode,ellipse,feather}`,
`select.lasso`, `select.quick {points,size,mode}`, `select.subject {sampleAllLayers,mode}`,
`select.sky {threshold,softness}`, `select.object {rect|point}`, `select.magicWand {x,y,tolerance,contiguous}`,
`select.colorRange {select:sampledColors|reds|...|skinTones,color,fuzziness}`,
`select.modify.border|smooth|expand|contract|feather {radius}`, `select.grow`, `select.similar`,
`select.refineEdge`, `select.focusArea`, `select.saveSelection {name}`/`loadSelection`,
`select.toWorkPath`, `select.editInQuickMaskMode`, `select.float|drop`.
Modes: `replace|add|subtract|intersect`.

## Layers, masks, styles
- Create: `layer.new.layer {name,mode,opacity,fillNeutral,position,clipToPrevious}`, `layer.new.group`,
  `layer.new.layerViaCopy|ViaCut`, `layer.newFillLayer.solidColor|gradient|pattern`, `layer.duplicate`.
- Properties: `layer.setProps {layer|layers,name,visible,opacity 0..1,fill 0..1,blend,clipped,locked}`,
  `layer.renameLayer`, `layer.setLabelColor`, `layer.select {name|layer,mode}`, `layer.moveTo
  {layer,target,position:above|below|into}`, `layer.arrange.*`, `layer.align.*`, `layer.distribute.*`,
  `layer.delete`, `layer.mergeDown|mergeVisible|mergeGroup|flattenImage`.
- Masks: `layer.layerMask.revealAll|hideAll|revealSelection|hideSelection|apply|delete|enabled|linked|fromTransparency`,
  `layer.vectorMask.fromPath|add|delete`, `layer.createClippingMask|releaseClippingMask`,
  `layer.removeBackground {refine}`, `layer.maskAllObjects`. Paint on a mask with `target:"mask"`.
- Styles: `layer.layerStyle.dropShadow|innerShadow|outerGlow|innerGlow|stroke|colorOverlay|gradientOverlay|patternOverlay|bevelEmboss|satin`
  (`add:true` to stack), `copyLayerStyle|pasteLayerStyle|clear`, `rasterize.layerStyle`.
- Smart objects: `layer.smartObjects.convertToSmartObject|rasterize|editContents|saveContents|replaceContents|
  convertToLinked|warp|puppetWarp|perspectiveWarp`; smart filters `layer.smartFilter.setParams|setVisible|delete|move|clearSmartFilters`.
- Frames/artboards: `layer.new.frame {x,y,width,height,shape}`, `layer.new.artboard {preset,name,x,y,width,height,background}`.

## Painting and retouching (params carry `points:[[x,y,pressure?],...]`, `size`, `hardness`, `opacity`)
`paint.stroke {brush,preset,size,hardness,opacity,flow,color,mode,erase,target}`, `paint.pencil`,
`paint.spotHealing {type:contentAware|createTexture|proximityMatch}`, `paint.healingBrush {source|offset,aligned,sampleLayer}`,
`paint.cloneStamp`, `paint.patch`, `paint.remove {strokes,closeLoops,newLayer}` (background job),
`paint.contentAwareMove`, `paint.redEye`, `paint.dodge|burn|sponge|blur|sharpen|smudge`,
`paint.bucket {x,y,tolerance,contents,color}`, `paint.gradient {from,to,style,colors|stops,opacity,mode}`,
`edit.fill {contents:foreground|background|color|contentAware|pattern|history|black|gray|white,color,mode,opacity}`,
`edit.contentAwareFill {sampling,margin,output:current|new|duplicate}`, `edit.stroke {width,color,location}`,
`edit.clear`, `tools.setColors {foreground,background}`, `tools.setBrush`, `filter.liquify {strokes}`.
`target`: `pixels|mask|quickMask|{channel:i}`.

## Filters
blur: gaussianBlur `{radius}`, surfaceBlur `{radius,threshold}`, boxBlur, motionBlur, radialBlur, lensBlur, smartBlur;
blurGallery.tiltShift|irisBlur|fieldBlur|spinBlur|pathBlur; sharpen: unsharpMask `{amount,radius,threshold}`,
smartSharpen `{amount,radius,reduceNoise}`, sharpenEdges; noise: reduceNoise `{strength,preserveDetails,reduceColorNoise,sharpenDetails,removeJpegArtifact}`,
addNoise, median, despeckle, dustAndScratches; other: highPass `{radius}`, offset, custom, colorToAlpha;
pixelate, stylize, distort, render (clouds, lensFlare, lightingEffects), gallery.* artistic effects;
`filter.cameraRaw {temperature,tint,exposure,contrast,highlights,shadows,whites,blacks,texture,...}`;
`filter.lensCorrection`, `filter.adaptiveWideAngle`, `filter.vanishingPoint`, `filter.convertForSmartFilters`,
`filter.lastFilter`.

## Type, shapes, paths
`type.create {x,y,text,box,name,align,font,size,color,...}`, `type.edit`, `type.setStyle`, `type.fonts`,
`type.warpText`, `type.attachToPath`, `type.rasterize`, `type.convertToShape`, character/paragraph styles
(`type.characterStyle.*`, `type.paragraphStyle.*`); `shape.create {kind:rect|roundedRect|ellipse|polygon|star|line|path,
rect,radii,sides,fill,stroke:{width,color,align,cap,join}}`, `shape.edit`, `shape.rasterize`;
paths: `path.set`, `path.list`, `path.fill`, `path.stroke`, `path.toSelection`, `path.transform`,
`path.addAnchor|moveAnchors|convertPoint`.

## Transform
`edit.transform {layer,rect,quad,matrix,scaleX,scaleY,rotate,dx,dy,interpolation,target}`,
`edit.transform.flipHorizontal|flipVertical|rotate90Cw|...`, `edit.contentAwareScale`, `edit.puppetWarp`,
`edit.perspectiveWarp`, `edit.autoAlignLayers`, `edit.autoBlendLayers`.

## History, views, misc
`history.undo|redo|newSnapshot|selectSnapshot|clear` (a snapshot before a risky step is cheap),
`edit.undo|redo`, `view.*` (zoom/fit; bridge mode shows them), `layerComp.*` (versions of one design),
`channel.*` (alpha channels), `notes.*`, `swatches.*`, `gradient.*`, `pattern.*`, `brush.*`.

## Bridge mode (live app)
`ui_inspect`, `ui_screenshot`, `ui_pointer {events:[{kind,x,y}]}`, `ui_set {fields:{tool,zoom,fit,theme,...}}`,
`ui_menu_invoke`, `control_call {method}` exist only when the MCP was started with
`photocraft-cli mcp --bridge 127.0.0.1:PORT --control-token-file F` against `photocraft --control PORT`
(the app then enforces its own `--automation-read-root/--automation-write-root`). In headless they
error: "needs bridge mode". Not needed for the normal flow.

## Error messages seen
- `automation filesystem access is not granted: read|write authority is absent` -> no roots (session predates the config); CLI route.
- `automation path rejected: absolute paths must be inside the automation root` -> path outside the automation root; CLI route.
- `automation command ... uses ambient filesystem paths and is disabled; use capability-scoped document methods`.
- `command ... is not available right now: filters need a pixel layer (active layer is a Shape layer)`.
- `unknown command` (CLI/batch) -> typo in id; `command_list {filter}`.
