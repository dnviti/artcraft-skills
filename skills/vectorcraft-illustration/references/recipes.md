# VectorCraft recipes

Snippets are `command_batch` steps (`id` = command id or `draw_shape`/`draw_path`). Always render a
preview after each block. Coordinates in pt; artboard top-left is (0,0).

## 0. Start a document
```json
{"id":"file.new","params":{"name":"acme-logo","width":800,"height":800,"units":"Pixels"}}
{"id":"swatch.new","params":{"name":"Ink","color":"#1b2a41","global":true}}
```

## 1. Geometric logomark (circle + cutout + wordmark)
1. Disc: `draw_shape {shape:"ellipse",x:200,y:160,width:400,height:400,fill:"#1b2a41",stroke:"none",name:"Disc"}`
2. Cut shape on top (star/polygon/path), unite or subtract:
   `draw_shape {shape:"star",cx:400,cy:360,radius1:150,radius2:62,points:5,fill:"#fff",stroke:"none",name:"Cut"}`
   then `pathfinder {operation:"minusFront",ids:[<disc>,<cut>]}` -> a single compound path.
3. Centre on the artboard: `select.set {ids:[...]}` + `object.align {horizontal:"center",to:"artboard"}`.
4. Wordmark: `add_text {text:"ACME",x:400,y:660,size:72,font:"Montserrat",justify:"center",color:"#1b2a41"}`;
   adjust `text.setStyle {ids,tracking:120}`; finish with `type.createOutlines`.
5. Group (`object.group`), name `Logo`, render at 1024, then at `max_side:48`.
6. Variants: duplicate group (`transform {copy:true,dx:0}` / `object.group`), recolour with `set_paint`; one-colour
   black and reversed (white on `#1b2a41` background) versions on extra artboards (`artboard.new`).

## 2. Icon on a 24 pt grid (UI icon set)
- `file.new {width:24,height:24,units:"Pixels",artboards:12,artboardLayout:{layout:"gridByRow",columns:4,spacing:8}}`.
- Live area 2 px padding; strokes 2 pt, `cap:"round"`, `join:"round"`, no fill (`fill:"none"`); corner radius 2.
- Draw with `draw_shape`/`draw_path` on whole/half coordinates, `stroke.set`, then
  `object.path.outlineStroke` when the set will ship as filled outlines.
- Export: `export {format:"svg",range:"1-12"}` (one file per artboard) or `file.exportForScreens {folder,
  formats:[...]}`; PNG sizes by `scale`.

## 3. Badge / emblem with text on a path
Ellipse (`draw_shape`), `add_text {text:"SINCE 1994 - SMALL BATCH - ",path:<id>,mode:"onPath",size:20}`,
inner ring via `object.path.offsetPath {offset:-24}`, centre mark, then align all to artboard; check
orientation (`transform {reflect}` or `text.createInPath` start `at`).

## 4. Gradient background and soft shadow card
```json
{"id":"draw_shape","params":{"shape":"rectangle","x":40,"y":40,"width":720,"height":420,"radius":24,
 "fill":{"gradient":{"kind":"linear","angle":0,"stops":[{"offset":0,"color":"#0f2027"},{"offset":1,"color":"#2c5364"}]}},
 "stroke":"none","name":"Card"}}
{"id":"effect.apply","params":{"effect":"stylize.dropShadow","ids":["$0.id"],"params":{"x":0,"y":10,"blur":24,"opacity":35}}}
```
(`angle:0` left to right; `90` bottom to top.)

## 5. Repeating pattern / radial burst
`object.repeat.radial {instances:12,radius:90}` or `object.repeat.grid` on a group (live, editable
with `object.repeat.options`); `object.repeat.expand` before exporting for a cutter. Seamless tiles:
`pattern.*` (make pattern from selection) and fill via `paint.setFill {swatch:"Pattern"}`.

## 6. Trace a raster logo or sketch
`file.place {path:"/abs/sketch.png"}` -> `imageTrace.presets` -> `imageTrace.makeAndExpand {preset:"Flat Logo"}`
(or `params:{mode:"color",colors:4}`) -> clean: delete stray bits (`select.object.strayPoints`), `pathfinder unite`
same-colour shapes, reduce anchors by redrawing key curves as paths, set swatches. Compare with the source
at 200 % zoom (render `max_side:2048`). Only trace art the user owns or may use.

## 7. Business card / print piece
`file.new {width:"3.5 in",height:"2 in",units:"Inches",name:"card"}`, `file.documentColorMode {mode:"cmyk"}`,
`document.setup {bleed:0.125}` (inches in doc units), keep text >= 0.125 in from trim, text outlined at the
end, export `pdf` (all artboards) with `options` from `document.formats` (marks/bleed). Black text as
`{c:0,m:0,y:0,k:100}`, big rich-black areas `{c:60,m:40,y:40,k:100}` sparingly.

## 8. Chart artwork
`create_graph {type:"column",csv:",2024,2025\nNorth,12,18\nSouth,9,14",x:60,y:60,width:600,height:360}`,
then recolour series with `select.same.fillColor` + `set_paint`, label with `add_text`. For real data
visualisation guidance (colour, labels) follow the dataviz skill if available.

## 9. Convert / batch without MCP
```bash
vectorcraft-cli convert in.svg out.pdf
vectorcraft-cli convert logo.vectorcraft logo@2x.png --scale 2
vectorcraft-cli convert logo.vectorcraft logo.svg --outline-text --decimals 2
vectorcraft-cli run --in logo.vectorcraft --cmd object.transformEach --params '{"scaleH":50,"scaleV":50}' --export small.png
vectorcraft-cli info file.ai
```
