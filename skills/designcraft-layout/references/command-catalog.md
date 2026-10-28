# DesignCraft command catalogue (installed build 0.14.0, 542 commands)

Always confirm with `list_commands {filter:"<text>"}` (the `params` doc is authoritative). Families by id prefix:
object (59), file (37), table, type, style, layout, text, swatch, path, transform, selection, story,
frame, find, toc, footnote, xref, index, book, links, layer, guide, hyperlink, bookmark, variables,
preflight, color, anchored, snippet, math, spelling, hyphenation. Coordinates: points, y down, spread space.

## Documents and files
`file.new {preset?: "Letter"|"A4"|..., intent?, units?, width?, height?, pages?, startPage?, facingPages?, columns?, gutter?,
margins?: n|{top,bottom,inside,outside}, bleed?, slug?, title?, primaryTextFrame?}` (MCP: `new_document`), `file.presets`,
`file.savePreset`, `file.open {path}` (.designcraft, .idml, .indd/.indt), `file.save/saveAs/saveACopy {path}`,
`file.revert`, `file.place {path|base64, frame?, x?, y?, width?, page?, rect?, autoflow?, styleMap?, styleConflicts?, link?}`,
`file.package {dir, idml?, pdf?, instructions?}`, `file.recentFiles`, `document.inspect`, `document.preferences`,
`layout.documentSetup {width,height,pages,facingPages,margins,bleed,slug,adjustLayout}`.

## Export
`file.exportPdf {path?, pages?, bleed?, marks?, standard?: none|x4|x1a|a2b, flatten?, spreads?, tagged?, compressImages?, title?, author?,
pageLayout?, view?, bookmarksPanel?}`, `file.printBooklet {type: saddleStitch|twoUpConsecutive}`, `file.exportIdml`, `file.exportEpub`,
`file.exportFixedEpub`, `file.exportHtml`, `file.exportPptx`, `file.exportText {format: txt|rtf|tagged}`, `file.exportXml`,
`file.print {printer?, dryRun?}`, `book.exportPdf`. MCP: `export_png {page,path,scale}` (jpg by extension), `render_page`.
CLI: `designcraft-cli validate-pdf FILE.pdf` (PDF/X-4 checks).

## Pages, spreads, parents, sections
`layout.pages.insert {count, after, parent}`, `.delete {pages}`, `.move {from,to}`, `.duplicateSpread`, `.applyParent {pages, parent}`,
`.toSpread`, `layout.parents.new {prefix,name}`, `.edit {parent}`, `.options {parent,basedOn}`, `.delete`,
`layout.marginsAndColumns {pages, margins, columns, gutter}`, `layout.pageSize`, `layout.section {page,startNumber,style,prefix}`,
`layout.chapterNumbering`, `layout.createAlternate`, `layout.overrideParentItems`, `layout.removeOverrides`, `layout.detachAll`.
Guides: `guide.add {orientation,position,page,spreadGuide}`, `layout.createGuides {rows,columns,rowGutter,columnGutter,fitTo:"margins"|"page"}`.

## Frames and objects
`frame.create {spread?, rect, shape?: rectangle|ellipse|polygon, content?: text|graphic|unassigned, text?, sides?}` -> `{id, story}`,
`frame.grid {rect, cols, rows, gutter}`, `object.fill {swatch,tint,ids}`, `object.stroke {swatch,weight,type,align}`,
`object.effects {dropShadow,...}`, `object.cornerOptions {shape,size}`, `object.textFrameOptions {columns,gutter,inset,
verticalJustification,autoSize,columnRule,baselineGrid,...}`, `object.textWrap {mode,offset}`, `object.fit {mode}`,
`object.fittingOptions`, `object.opacity {opacity,blend}`, `object.align {edge,to}`, `object.distribute`, `object.group`,
`object.lock`, `object.label`, `object.caption {text,position,offset}`, `transform.move {dx,dy,ids}`,
`transform.resize {from,to}`, `transform.rotate {angle}`, `transform.scale`, `selection.set {ids}`, `layer.new/set/move/merge`.

## Text and styles
`type.char {attrs:{fontFamily,fontStyle,size,leading:{kind:points,value},tracking,kerning,fill,capitalization,underline,...}}`,
`type.para {attrs:{align,leftIndent,firstLineIndent,spaceBefore,spaceAfter,dropCapLines,dropCapChars,hyphenate,tabs,ruleAbove,...}}`,
`type.bold/italic/underline/allCaps/changeCase`, `type.tabs.*`, `type.openType {feature}`, `type.createOutlines`, `type.onPath`,
`text.insert`, `text.select`, `text.thread {from,to,rect,autoflow}`, `text.unthread`, `story.get/setText/replaceRange/options`,
`type.fillWithPlaceholder`, `find.find/change {find,change,grep,scope}`, `spelling.check`, `hyphenation.addException`.
Styles: `style.paragraph.create {name,basedOn,nextStyle,para,chars,fromSelection}`, `.edit`, `.apply {name,clearOverrides}`, `.delete`,
`style.character.create/edit/apply`, `style.object.create/apply`, `style.table/cell.*`, `style.list`, `style.load {path}`, `style.group`.
Swatches: `swatch.create {name,color:"#rrggbb"|{c,m,y,k}|{gradient}}`, `swatch.options`, `swatch.delete`, `swatch.load/save` (.ase),
`color.settings`, `color.convert`, `color.extractTheme`, `swatch.addColorTheme`.

## Long-document features
`table.insert {rows,cols,headerRows}`, `table.convertFromText`, `table.setCell {fill,insets,...}`, `table.setColumnWidth`, `table.merge`,
`table.get`, `footnote.insert/options/list`, `toc.generate {entries,title,page}`/`toc.update`/`toc.entries`, `xref.insert`, `index.addReference/generate`,
`variables.define {name,type: custom|lastPageNumber|chapterNumber|fileName|creationDate|runningHeader}`/`insert`, `book.new/add/paginate/syncStyles/exportPdf`,
`anchored.insert`, `hyperlink.create`, `bookmark.add`, `links.list/relink/embed/copyTo`, `snippet.export/place`, `math.insert {latex}`.

## Checks
`preflight.run {minPpi}` -> `{errors, warnings, issues:[{severity,kind,message,item,page}]}` (overset, missing links, low resolution...),
`inspect_document`, `get_story`, `font.list`, `links.list`.

## Recipes

Magazine skeleton (A4, 8 facing pages, 2 columns, 3 mm bleed):
`new_document {preset:"A4", pages:8, facingPages:true, columns:2, gutter:14, margins:{top:50,bottom:56,inside:56,outside:42}, bleed:9, intent:"print"}`
-> `swatch.create` brand colours -> `style.paragraph.create` Body/Body First/Headline/Deck/Kicker/Caption/Pull Quote/Folio ->
parent: `frame.create {spread:{kind:"parent",index:0}, rect:[56,800,300,818], content:"text", text:"  |  TITLE"}` + `style.paragraph.apply {name:"Folio"}`
-> `layout.pages.applyParent {pages:[0..7], parent:"A-Parent"}` -> first text frame inside margins -> `file.place {path:story.docx, frame, autoflow:true}` ->
heroes with `place_image` + `object.fit` -> `render_page` each page -> `preflight.run` -> `save_document`.

One-page flyer (A5 portrait, bleed): single page, no columns; hero image frame to the bleed edge (rect extends -9..W+9),
headline frame, body frame, call-to-action frame with `object.fill`, `object.cornerOptions`; CMYK swatches; PDF with `bleed:true, marks:true, standard:"x4"`.

Book chapter pages: Body style with `firstLineIndent`, `Body First` without indent after headings; widow control via styles; running head on parent
using `variables.insert` (runningHeader) or text; TOC with `toc.generate {entries:[{style:"Chapter",level:1},{style:"Section",level:2}], page:2}`.

Reuse: `style.load {path: other.designcraft}` imports styles; `snippet.export`/`snippet.place` for blocks; `file.savePreset` for page setups.
