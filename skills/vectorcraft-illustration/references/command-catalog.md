# VectorCraft command catalogue (installed build, ~810 commands)

Confirm with `command_list {filter:"<text>", brief:true}`; read params by filtering on the exact id.
Families by prefix: object (142), select (52), path (33), document (32), edit (30), text (29), file (28),
layer (26), perspective (25), swatch (23), type (23), paint (22), symbol (19), graphicStyle (18), view,
transparency, appearance (16), library, variable, brush, clipboard, artboard (12), dataset, links, shape
(10), stroke (10), effect (8), charStyle, paraStyle, livePaint, color, graph, guide, imageTrace (6),
recolor, pattern, pdf, webExport, assets, css, plugin.

## Documents and files
- `file.new {preset?,name,width,height,units,orientation,artboards,artboardLayout:{layout,columns,spacing}}` -> `{index}`;
  `file.newPresets {category}`; `file.open {path}` / `open_file`; `file.close`; `document.activate {index}`;
  `file.save|saveAs|saveCopy|saveAsTemplate|newFromTemplate|revert`; `file.export` (= `document.export`);
  `document.exportSelection`; `file.exportForScreens {folder,artboards,formats,prefix,zip}`;
  `document.exportForWeb`; `document.exportPdf` / `document.pdfSettings`; `document.exportDxf|exportEps`;
  `document.formats` (formats, extensions, read/write, options); `file.place {path,link,page,crop}`;
  `file.package`; `file.info`; `document.info`; `document.setup {units,bleed,gridColors,...}`;
  `document.setUnits`; `file.documentColorMode {mode:"cmyk|rgb",convert}`; `file.list {path}`.
- Readable: vectorcraft, drawcraft, svg, svgz, pdf, ai, ait, eps, ps, dxf, emf, wmf, psd, psb, png, jpg,
  gif, webp, tiff, bmp, tga, afdesign/af/afpub. Writable: vectorcraft, vctemplate, svg, svgz, pdf, ai, eps,
  dxf, emf, wmf, png, png8, jpg, webp, gif, tiff, bmp, tga, psd, txt.
- Inspect: `doc_inspect {depth,ids,kind,limit,offset}`, `document.find {name,kind,text,within,intersects,
  minWidth..}`, `document.node {id,summary,depth}`, `document.json` (whole model, big).

## Shapes, paths
`shape.rectangle {x,y,width,height,radius,rotation}`, `shape.ellipse`, `shape.polygon {cx,cy,radius,sides,rotation}`,
`shape.star {cx,cy,radius1,radius2,points}`, `shape.line`, `shape.arc`, `shape.spiral`, `shape.rectangularGrid`,
`shape.polarGrid`, `shape.flare`; `path.create {anchors:[{x,y,in?,out?}],closed,d}`, `path.appendAnchor`,
`path.close`, `path.setAnchors`, `path.moveAnchor|moveAnchors`, `path.setHandle`, `path.convertAnchor(s)`,
`path.insertAnchor`, `path.removeAnchor(s)`, `path.deleteAnchors`, `path.reverse`, `path.join`, `path.average`,
`path.split`, `path.cutAtAnchors`, `path.knife`, `path.lineCut|rectCut|mirrorCut`, `path.blob`, `path.freehand`,
`path.curvature`, `path.eraseRegion`, `path.smoothRegion`, `path.setFillRule {nonzero|evenodd}`.
Convert: `object.expandShape`, `object.expand {object,fill,stroke,gradient}`, `object.path.outlineStroke`,
`object.path.offsetPath {offset,joins,miterLimit}`, `type.createOutlines`.

## Combine and structure
`object.pathfinder.unite|minusFront|intersect|exclude|divide|trim|merge|crop|outline|minusBack|trap {ids}`,
`shapeBuilder.merge|regions`, `object.compoundPath.make|release`, `object.clippingMask.make|release|editContents`,
`object.group|ungroup`, `object.arrange.bringToFront|bringForward|sendBackward|sendToBack`,
`object.lock|unlockAll|hide`, `object.setProps {ids,name,visible,locked,opacity,blend,data}`,
`object.blend.make|release|expand|options`, `object.repeat.radial|grid|mirror|release|expand`,
`object.envelope.expand`, `object.cropImage|maskImage`, `livePaint.*`.
Selection: `select.set {ids}`, `select.add|toggle|none|all|inverse|key`, `select.same.fillColor|strokeColor|
strokeWeight|appearance|shapeType|fontFamily`, `select.object.openPaths|strayPoints|textObjects|clippingMasks`,
`select.save|recall`, `select.magicWand`.

## Transform and align
`transform {ids,dx,dy,rotate,scale,scaleX,scaleY,reflect,shear,origin,copy}` (tool) = `object.transform
{matrix:[a,b,c,d,e,f],copy,strokes,corners}`; `object.move {dx,dy,copy}`, `object.transformEach {scaleH,
scaleV,moveH,moveV,rotate,random,copy}`, `object.transformAgain`, `object.align {horizontal,vertical,
to:artboard|selection|key}`, `object.distribute`, `object.distributeSpacing`.

## Paint, swatches, appearance
`paint.setFill|setStroke {color|none|swatch,tint,gradient,ids,span}`, `paint.editGradient {kind,stops,method,
angle}`, `paint.setGradientGeom`, `paint.swap|default|none|invert|complement|sampleColor|recent`,
`stroke.set {weight,cap,join,miterLimit,align,dash,dashOffset,startArrow,endArrow}`,
`swatch.new {name,color,colors,gradient,pattern,global,spot,mode,group}`, `swatch.list|edit|delete|merge|
addUsedColors|unused|setSpot|library.*`, `color.convert {color,to:rgb|cmyk|gray|lab}`, `recolor.*`,
`colorTheme.*`, `pattern.*`, `symbol.*`, `graphicStyle.*`, `appearance.*`, `transparency.*` (blend, opacity masks),
`brush.*`.

## Effects
`effect.list {ids}` (catalogue + applied), `effect.apply {effect,params,ids,item,target}`, `effect.setParams`,
`effect.remove`, `effect.move`, `effect.duplicate`, `effect.expandAppearance`. Ids: stylize.dropShadow|innerGlow|
outerGlow|feather|roundCorners|scribble, blur.gaussian|radial|smart, distort.roughen|zigZag|twist|tweak|
puckerBloat|transform|freeDistort, warp.arc|arcLower|arcUpper|arch|bulge|shellLower|shellUpper|flag|wave|
fish|rise|fisheye|inflate|squeeze|twist, path.offsetPath|outlineObject|outlineStroke, pathfinder.add|intersect|
exclude|subtract|minusBack|divide|trim|merge|crop|outline|hardMix|softMix|trap, threeD.extrude|revolve|inflate|
rotate, convertToShape.rectangle|roundedRectangle|ellipse, adjust.*, artistic.*, sketch.*, texture.*,
brushStrokes.*, pixelate.*, cropMarks, rasterize.

## Type
`text.create {x,y,text,size,font,style,color,justify,area:{width,height,fit},rotation,vertical}`,
`text.createInPath {path,mode:area|onPath,at}`, `text.setText`, `text.setStyle {ids,font,style,size,leading,
tracking,justify,fill,features}`, `text.setRangeStyle`, `text.getRange`, `text.areaOptions|reshapeArea`,
`text.fitHeadline`, `text.thread.*`, `text.tabs.*`, `text.fontList`, `text.fonts {selectionOnly}`,
`text.missingFonts`, `text.replaceFont`, `text.findFontFiles|addFontFiles`, `type.createOutlines`,
`type.changeCase`, `type.convertToAreaType|PointType`, `charStyle.*`, `paraStyle.*`, `text_wrap` tool.

## Artboards, layers, guides
`artboard.new|delete|setProps|fitToArt|fitToSelection|duplicate|move|reorder|rearrange|convertToArtboards`,
`layer.new {name,top}`, `layer.newSublayer`, `layer.setProps`, `layer.setCurrent`, `layer.move`, `layer.merge|
flatten`, `layer.template`, `layer.lockOthers|hideOthers|showAll|unlockAll`, `layer.releaseToLayers`,
`guide.*`, `object.slice.clipToArtboard`.

## Image Trace, graphs, other
`imageTrace.presets`, `imageTrace.make {id,preset,enhanced,params:{mode,threshold,palette,colors,...}}`,
`imageTrace.expand`, `imageTrace.makeAndExpand`, `imageTrace.release`; `create_graph` / `graph.setData|setType`;
`perspective.*` (perspective grid), `dataset.*`/`variable.*` (data-driven graphics), `webExport.*`,
`css.*`, `links.*` (placed file links: `links.update`), `assets.*`, `plugin.*`, `print.*`.

## Desktop-only (need the app attached, else error)
`inspect_ui`/`ui_inspect`, `ui_screenshot` / `screenshot {window:true}`, `open_panel`, `invoke_menu`,
`select_tool {tool: selection|directSelection|pen|rectangle|ellipse|...}`, `pointer_gesture`, `press_key`,
`type_text`. Headless alternative for everything is a command.

## Error messages seen
- ``unknown command `add_text` `` (in `command_batch`): use `text.create`.
- Without `fill`/`stroke`, shapes get white fill and 1 pt black stroke (not an error, a trap).
- SVG save warning: "SVG keeps the artwork but not everything a VectorCraft document holds (editable
  effects, symbols, swatches, styles): save as VectorCraft to keep it all editable".
