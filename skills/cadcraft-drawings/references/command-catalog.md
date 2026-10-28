# CadCraft command catalogue (installed build 0.14.0, ~440 commands)

Always confirm with `list_commands {filter:"<text>"}`; the `params` doc is authoritative. Ids are
AutoCAD names (aliases in brackets work in `command_line`). Handles are hex strings.
Coordinates y up; angles degrees; unitless (you choose mm/m/in).

## Files and documents
`new {metric?, template?}` (MCP: `new_drawing`), `open {path}`, `qsave`/`save {path?}`,
`saveas {path, version?: 2000..2018, binary?}`, `close`, `closeall`, `document.switch {index}`,
`document.bytes {format,version}` (base64), `script {path}` (.scr), `audit {fix?}`, `recover {path}`,
`export {path, format?}` (dxf dwg svg png pdf), `purge {type?, names?}`, `undo {count?}`, `redo`.

## Selection and view
`select {handles | window,crossing | at | clear | add}`, `qselect {type, property, operator, value, layer, color}`,
`selectall`, `zoom {mode: extents|all|window|previous|in|out|center|scale|object, p1,p2,...}`,
`pan {delta | from,to | center}`, `view.set {center,height}`, `regen`, `isolateobjects`, `hideobjects`.

## Draw
`line {points, closed?}`, `pline {vertices:[[x,y]|{p,bulge,startWidth,endWidth}], closed?, width?}`,
`rectang {p1,p2 | dimensions:[l,w], rotation?, fillet?, chamfer?, center?}`, `circle {center,radius|diameter | p1,p2 | p1,p2,p3}`,
`arc {p1,p2,p3 | center,radius,start,end | start,center,end}`, `polygon {sides, center, radius, inscribed?}`,
`ellipse {center, major:[dx,dy], ratio}`, `spline {fit|control,closed?}`, `xline`, `ray`, `donut`, `point`,
`mline`, `boundary {points}`, `region`, `revcloud`, `wipeout`, `helix`, `divide`, `measure`.

## Modify
`move {handles?, delta|from,to}`, `copy {handles?, delta, count?}`, `rotate {base,angle,copy?}`, `scale {base,factor}`,
`mirror {p1,p2,erase?}`, `offset {handle,distance,side:[x,y],erase?,layer?}`, `trim {handle,pick|fence|crossing,edges?}`,
`extend`, `fillet {h1,p1,h2,p2,radius}`, `chamfer`, `stretch {window|polygon|fence,delta}`, `break`, `breakatpoint`,
`join`, `explode`, `lengthen`, `align`, `reverse`, `erase`, `array`/`arrayrect {rows,cols,rowSpacing,colSpacing}`/
`arraypolar {center,count,angle}`/`arraypath`, `pedit`, `splinedit`, `overkill`, `draworder`, `matchprop`,
`properties.set {handles, layer, color, linetype, lineweight, ltscale, ...geometry fields}`.

## Layers, styles, units
`layer.new {name,color,linetype,lineweight(mm),current}`, `layer.set {name,on,frozen,locked,plot,color,linetype,lineweight,newName}`,
`layer.current {name}`, `layer.delete`, `layerstate.save/restore`, `linetype {load:"CENTER"|"*", current}`, `ltscale {scale}`,
`lweight`, `color`, `units {lunits,luprec,aunits,auprec,insunits}`, `limits`, `style {name,font,height,...}`,
`dimstyle {name,current,<fields>}`, `dimstyle.list {name}`, `tablestyle`, `setvar {name,value}`, `sysvars`.

## Annotation
`text {at,text,height,rotation,justify}`, `mtext {at,text,height,width,attach|justify,style,list,...}` (`\P` = paragraph),
`dimlinear {p1,p2,at,rotation?,text?}`, `dimaligned`, `dimradius/dimdiameter {handle | center,point}`, `dimangular`,
`dimcontinue {points}`, `dimbaseline`, `qdim`, `dimedit`, `dimtedit`, `dimstyle.update`, `dimoverride`, `mleader`, `leader`,
`hatch {points|handles, pattern, scale, angle, associative?}`, `gradient`, `hatchedit`, `table {at,rows,cols,rowHeight,colWidth,cells,title,header}`,
`table.set/insertrow/merge/formula`, `tableexport {handle,path}`, `find {find,replace}`, `txt2mtxt`.

## Blocks and references
`block {name,base,handles}`, `insert {name,file?,at,scale?,rotation?,attribs?,explode?}`, `attdef`, `attedit`, `wblock {path,handles,base}`,
`blocks.list`, `burst`, `blockreplace`, `xattach {path,at}`, `xref`, `refedit`/`refclose`, `dataextraction`.

## Sheets and output
`layout.new {name,viewport?}`, `layout.set {name}`, `layout.list`, `layout.copy/rename/delete`, `pagesetup {layout,paper,width,height,landscape,margins,scale,plotStyleTable}`,
`mview {p1,p2,count,arrangement}`, `viewport.set {handle,scale,viewHeight,center,locked,freeze,thaw}`,
`plot {path,layout,paper,landscape,fit,scale,center,plotArea,window,lineweights}`, `exportpdf` (same), `publish {path,layouts}`,
`plotstyle`, `stylesmanager`, `plottermanager`, `pdfbook`.

## Query
`dist {p1,p2}`, `area {points|handle}`, `id {at}`, `list {handles}`, `measuregeom {mode,...}`, `properties`, MCP: `inspect_drawing {entities?,limit?}`,
`query_entities {type,layer,selected,window,crossing,limit,offset}`, `find_text {contains,layer,window}`.

## Recipes (JSON via `execute`; keep handles from results)

Room with wall thickness, door gap and dimensions (mm, 1:50):
1. `new_drawing {metric:true}`; `units {lunits:2,luprec:0,insunits:4}`
2. `layer.new` WALLS (white, 0.5), DOORS, DIM (green), TEXT (yellow), HATCH; `layer.current WALLS`
3. `rectang {p1:[0,0],p2:[6000,4000]}` -> h; `offset {handle:h,distance:200,side:[-100,-100]}` (outer wall)
4. `dimstyle {name:"ARCH-50",scale:50,textHeight:2.5,arrowSize:2.5,extOffset:1,extExtend:1.5,textGap:1,decimals:0,current:true}`
5. `layer.current DIM`; `dimlinear {p1:[0,0],p2:[6000,0],at:[3000,-700]}`; same for the vertical side
6. `layer.current TEXT`; `mtext {at:[300,3700],text:"LIVING ROOM\\P24.0 m2",height:125,width:2500}`
7. `layer.current HATCH`; `hatch {points:[[100,100]],pattern:"ANSI31",scale:50}` (wall band)
8. `zoom {mode:"extents"}`; `render`; fix; `save {path:"/abs/room.dxf"}`.

A3 sheet at 1:50: `layout.new {name:"A3"}` -> viewport h; `pagesetup {layout:"A3",paper:"A3",landscape:true}`;
`layout.set {name:"A3"}`; `viewport.set {handle:h,scale:"1:50",center:[3000,2000]}`; title block on layer TITLE
(`table`, `text`); `plot {path:"/abs/sheet.pdf",layout:"A3"}`; check with `pdftoppm -r 60 -png sheet.pdf /abs/scratch/s`.

Convert/inspect without a session: `cadcraft-cli info F`, `cadcraft-cli convert IN OUT`.
