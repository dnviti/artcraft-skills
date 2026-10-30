---
name: vectorcraft-illustration
description: "Draw and edit vector graphics in VectorCraft (ArtCraft's Illustrator-class vector illustration app, driven through the `vectorcraft` MCP server, tools mcp__vectorcraft__*). Use whenever the user mentions VectorCraft or the vectorcraft MCP tools, or asks to draw/design a logo, logomark, wordmark, icon or icon set, badge, emblem, illustration, pattern, infographic, chart/graph artwork, poster or print layout, business card, sticker (including distinctive, non-generic marks chosen from rough concepts), or to clean up, trace (image trace), recolour or convert SVG/PDF/AI/EPS artwork; or to export SVG, PDF, PNG, ICO-sized assets from vector art. Covers shapes, Bezier paths, pathfinder, gradients, strokes, live effects, text and outlines, artboards, colour modes (RGB/CMYK), the render-and-verify loop, save/export and the mandatory show-and-approve phase. UI/screen/app design (mockups, wireframes, design systems) belongs to figcraft-design, photo editing to photocraft-images."
license: MIT
metadata:
  author: dnviti
  version: "1.0.0" # x-release-please-version
---

# VectorCraft illustration

VectorCraft is an open-source, Illustrator-class vector app: live shapes, Bezier paths, pathfinder and
Shape Builder, gradients and meshes, strokes and brushes, live effects and appearances, symbols,
swatches, blends, repeats, type (point, area, on path), Image Trace, artboards, CMYK/RGB, graphs.
Native `.vectorcraft`; reads/writes SVG, PDF, AI, EPS, DXF, PNG, JPG, WebP, PSD and more. You drive
it through the `vectorcraft` MCP server (headless engine) and, for batch jobs, `vectorcraft-cli`.

**A mark that could belong to anyone has failed.** Unprompted, you will draw the statistical logo: a
swoosh, a globe, initials in a circle, a gradient blob. Asking yourself for "unique" does not change
that; changing the inputs does: a form taken from the client's own trade or place, a construction rule
the drawing must obey, rough alternatives the user chooses between, and a critic who did not draw it.
The user's brand or explicit direction overrides all of this.

- Command ids and params by area: `references/command-catalog.md`
- Recipes (logo, icon set, badge, pattern, trace, print card): `references/recipes.md`

## 0. Ground rules for the tools

MCP tools: `draw_shape`, `draw_path`, `add_text`, `set_paint`, `transform`, `pathfinder`,
`apply_effect`, `create_graph`, `text_wrap`, `doc_inspect` (= `inspect_document`), `render_preview`
(= `screenshot` for artboards), `export`, `save_file`, `open_file`, `command_run` (= `run_command`),
`command_batch`, `command_list` (= `list_commands`), `undo`, `redo`; desktop-only `ui_inspect`,
`ui_screenshot`, `open_panel`, `invoke_menu`, `select_tool`, `pointer_gesture`, `press_key`, `type_text`.
They are deferred: load schemas with ToolSearch (`+vectorcraft`, max_results 40) first.

- **Every menu action is a command.** Discover with `command_list {filter:"pathfinder", brief:true}` and
  read one command's `params` with a narrow filter. The catalogue is ~810 commands: never dump it whole.
  Trust the installed `params` doc over memory.
- **Coordinates**: points, y down, origin at the **first artboard's top-left**. New doc is 612x792 pt
  (Letter). `file.new {width,height,units,name,artboards,preset}` (`width:"210 mm"` strings work;
  `file.newPresets` lists Web/Print/Branding/Social presets).
- **Objects have integer ids.** Creation tools return `{id}`; keep them and pass `ids:[...]` instead of
  relying on the selection. New objects become the selection; `select.set {ids}` / `select.none`.
- **`command_batch`** steps are command ids (or `draw_path` / `draw_shape` with the tool's args). The
  convenience tools `add_text`, `apply_effect`, `set_paint`, `transform`, `pathfinder` are NOT batch step
  ids: use `text.create`, `effect.apply`, `paint.setFill`/`paint.setStroke`/`stroke.set`,
  `object.transform`/`object.move`..., `object.pathfinder.*`. Refer to earlier results with
  `"$N.id"`/`"$last.id"` in a param string. `atomic:true` + `label` makes the batch one undo step.
  Default stops at the first error; earlier steps stay applied.
- **Default paint**: omitted fill/stroke inherit "new art" appearance (white fill, 1 pt black stroke).
  Always pass `fill` and `stroke` explicitly (`stroke:"none"` for filled shapes).
- **Colours**: `"#rrggbb"`, `[r,g,b]` 0..1, `{c,m,y,k}`, `{gray}`, `{swatch:"name"}`, or gradient
  `{gradient:{kind:"linear|radial|freeform",angle,stops:[{offset,color,opacity}]}}`.
- Headless = no window; `render_preview` shows the artboard. Desktop-only tools error in headless.
- **File access** here is unconfined (verified: save/export to any writable path). If the MCP was started
  with `--automation-read-root/--automation-write-root`, paths must be inside them.

## 1. Workflow

1. **Brief**: what is it (logo, icon, illustration, print piece), where used (web, app, print,
   embroidery, signage), sizes, colours/brand, required formats. Propose a concrete concept if absent.
   Name a **source form outside graphic design** from the subject's world (a cooper's hoop, a tram
   ticket punch, a hallmark stamp, the profile of a local bridge) and say what the drawing takes from
   it (a silhouette, a cut, a rhythm), never the object as a literal pictogram.
2. **Set up the document first**: right artboard size and units (`file.new`), colour mode (RGB for
   screen, CMYK for print: `file.documentColorMode {mode:"cmyk"}`), name layers.
3. **Plan**: palette (3-5 colours, named swatches), grid/proportions, stroke weights, corner radii, and
   **1-2 construction rules** that forbid your first idea (only 45/90° angles; one circle and its cuts;
   a single stroke weight for everything; two flat colours, no gradient). Write it in a few lines
   before drawing; critique for genericness (section 3) and swap any part you would draw for any client.
4. **Divergent sketches** (logos, marks, icon or illustration styles; skip when the brand or user fixes
   the form): 3-4 black-only roughs on separate artboards (2 for a small job) that differ in
   construction and silhouette, not in colour or font. Build the options sequentially in the one
   headless session, never in parallel subagents. Save and open them (section 6), then ask with the
   multiple-choice question tool (AskUserQuestion in Claude Code; else a numbered list), multi-select so
   roughs can be combined. Never pick for the user. This rule covers creative directions, while
   technical options may carry a labelled recommendation. Inside a subagent, return the options (file
   path, artboard names, PNG paths, brief) to the orchestrator, which asks the user.
5. **Build** the chosen route with live shapes and precise numbers, name every object, group
   logically, layers by role. Every shape, colour and weight should trace back to the brief, the
   source form or a rule.
6. **Verify loop** after each major step (section 4).
7. **Save** `.vectorcraft` and **Show and approve** (section 6).
8. **Final export** (SVG/PDF/PNG sets) only after acceptance.

Existing file: `open_file {path}` (also SVG/PDF/AI/EPS/PNG, which becomes an image), `doc_inspect`,
`swatch.list`, reuse what exists; never redraw what is in the document. Never overwrite the user's
original: `file.saveAs` to a new name first.

## 2. Building blocks

- **Shapes**: `draw_shape {shape: rectangle|ellipse|polygon|star|line, x,y,width,height,radius | cx,cy,
  radius,sides | cx,cy,radius1,radius2,points | x1,y1,x2,y2, fill,stroke,strokeWidth,cap,join,dash,
  opacity,name,effects,rotation}`. Live shapes stay editable (corner radius, sides). Others: `shape.arc`,
  `shape.spiral`, `shape.rectangularGrid`, `shape.polarGrid`, `shape.flare`.
- **Paths**: `draw_path {points:[[x,y],...] | [{x,y,in:[dx,dy]?,out:[...]?}] | d:"M0 0 C... Z", closed,
  fill,stroke,strokeWidth,cap,join,dash,name}`. Handles `in`/`out` are **absolute document coordinates** (verified), and `smooth:true` auto-smooths. Edit: `path.setAnchors`, `path.moveAnchor`,
  `path.insertAnchor`, `path.removeAnchors`, `path.convertAnchor`, `path.join`, `path.split`,
  `path.reverse`, `path.knife`, `path.blob`, `path.freehand`.
- **Combine**: `pathfinder {operation: unite|minusFront|intersect|exclude|divide|trim|merge|crop|outline|
  minusBack, ids}` (back-to-front order matters: minusFront subtracts the front objects from the
  back one; with ids order = z-order, not argument order). Non-destructive: `effect.apply
  {effect:"pathfinder.subtract|add|intersect"...}` on a group. `shapeBuilder.merge`, `shapeBuilder.regions`,
  `object.compoundPath.make`, `object.clippingMask.make` (topmost object is the mask).
- **Paint**: `set_paint {ids,fill,stroke,strokeWidth}`, `paint.setFill` (gradients, swatches, tints),
  `paint.editGradient` (stops, midpoint, perceptual method), `stroke.set {weight,cap,join,miterLimit,
  align,dash,startArrow,endArrow}`, `object.path.outlineStroke`, `object.path.offsetPath {offset}`.
  `swatch.new {name,color,global}` for a named palette (global swatches recolour everywhere).
- **Transform**: `transform {ids,dx,dy,rotate,scale,scaleX,scaleY,reflect,shear,origin,copy}` (rotate is
  counter-clockwise degrees), `object.transformEach`, `object.align {horizontal,vertical,to:"artboard|
  selection|key"}`, `object.distribute`, `object.distributeSpacing`, `object.repeat.radial|grid|mirror`
  (live repeats), `object.blend.make`, `object.arrange.bringToFront|sendToBack...`.
- **Organise**: `object.group`, `object.ungroup`, `object.setProps {ids,name,opacity,blend,visible,locked}`,
  `layer.new {name}`, `layer.setProps`, `object.lock`, `object.hide`, `document.find {name|kind|text|within}`,
  `document.node {id}`.
- **Type**: `add_text {text,x,y,size,font,color,justify,width,height,fit}` (point type at baseline x,y;
  area type with width/height; `path`+`mode:"onPath"` for text on a path); `text.setStyle {ids,font,style,
  size,leading,tracking,justify,fill}`; `text.fontList`/`text.fonts` for installed families (Inter, Montserrat,
  Open Sans, Source Sans 3, Source Serif 4, Noto *, Liberation, IBM Plex Sans, Comfortaa, JetBrains Mono, ...);
  `type.createOutlines` to convert to paths. **Outline text for logos and any file that leaves the app**
  (or export SVG with `outlineText:true`, PDF `options.advanced.outlineText:true`).
- **Effects** (live, non-destructive): `apply_effect {effect,params,ids}`, or `effect.apply`. Catalogue ids:
  `stylize.dropShadow {x,y,blur,opacity}`, `stylize.outerGlow|innerGlow|feather|roundCorners|scribble`,
  `blur.gaussian {radius}`, `distort.roughen|zigZag|twist|puckerBloat|tweak|transform`,
  `warp.arc|wave|flag|bulge|fisheye|...`, `path.offsetPath|outlineStroke|outlineObject`,
  `pathfinder.add|subtract|intersect|exclude|divide|trim|merge|crop|outline`, `threeD.extrude|revolve|inflate|rotate`,
  `adjust.*`, artistic/sketch/texture raster effects. `apply_effect` with no `effect` returns the catalogue
  with defaults. `effect.list/setParams/remove/move/expandAppearance` manage them; `object.expand`
  bakes live shapes/effects/strokes into real paths before export for cutters, embroidery or hand-off.
- **Image Trace**: place a raster (`file.place {path}`), `imageTrace.presets`, `imageTrace.make {preset|params}`,
  `imageTrace.expand`/`makeAndExpand`; then clean up (remove stray points, unite, simplify colours).
- **Charts**: `create_graph {type: column|bar|line|area|scatter|pie|radar,csv|series..,x,y,width,height}`.
- **Artboards**: `artboard.new {x,y,width,height,name}`, `artboard.setProps`, `artboard.fitToArt`,
  `artboard.duplicate`, `artboard.rearrange`; exports address artboards by 0-based index.

## 3. Craft know-how

- **Build with geometry, not by eye.** Define a unit (e.g. 8 pt grid, icon on 24x24 with 2 pt keyline
  padding, logo on a circle/golden ratio), compute coordinates, centre with `object.align to artboard`.
  Round to whole or half points; no 13.37 pt one-offs.
- **Few, clean paths**: fewer anchors (extremes of curves only, handles horizontal/vertical on smooth
  points), no stray points, no overlapping duplicate shapes, no hairline gaps (unite or overlap then
  `pathfinder unite`). Use live shapes and `pathfinder` over freehand tracing. Closed paths for fills,
  open for strokes. Inspect a traced path's anchors with `document.node {id}`.
- **Strokes vs fills**: for logos and anything scaled, **outline strokes** (`object.path.outlineStroke`) in
  the final version so weight scales with the art; icons for UI keep consistent stroke weight (1.5-2 pt on
  24 px) with round caps/joins only when the style calls for it.
- **Colour**: 3-5 colours from a stated palette as global swatches (`swatch.new {global:true}`); test on
  light and dark backgrounds; keep a one-colour (black) and reversed (white) version of logos; contrast
  >= 4.5:1 for text on fills. RGB for screen (sRGB hex), CMYK for print with rich-black caution
  (`color.convert {color,to:"cmyk"}` shows out-of-gamut); spot colours via `swatch.setSpot`.
- **Gradients and effects sparingly**: a logo should read in flat colour first; gradients and shadows as
  live appearance on top; avoid raster effects (blur, artistic) in logos (they rasterize and break
  scaling).
- **Type**: pick fonts deliberately (check `text.fontList` for installed ones, missing fonts substitute
  silently: `text.missingFonts`), adjust tracking/kerning for display sizes, optical alignment;
  convert to outlines at the end for logos. Check licences: only use fonts the user can ship.
- **Artboards and bleed**: one artboard per deliverable size; print gets bleed (`document.setup {bleed:9}`)
  and safe margins (>= 12 pt inside trim); icon sets are one artboard per icon or a grid on a single one.
- **Naming and layers**: name objects (`name` param) and group by role (`Mark`, `Wordmark`, `Guides`,
  `Background`); keep construction guides on a locked, non-printing layer, delete them before export.
- **Originality**: do not copy a real brand's logo or trademarked artwork; do not imitate an existing
  company mark closely. Use neutral placeholders when the user has not supplied brand assets.
- **Default tells** (clip-art and AI giveaways; use one only when the brief asks for it):
  - a swoosh, orbit ring or underline arc around the name; a leaf for "green", an upward arrow or bar
    chart for "growth", a lightbulb for "ideas";
  - globes, gears, puzzle pieces, handshakes, house-with-roof outlines as the whole idea;
  - gradient blobs, mesh-gradient orbs, blue-to-purple or sunset gradients on a flat mark;
  - initials in a circle, shield or hexagon; a wide-tracked all-caps geometric sans (the installed
    Montserrat or Comfortaa) as the wordmark by reflex;
  - drop shadows, bevels, `threeD.extrude` or glossy highlights on a logo that should read flat;
  - "corporate flat people" with oversized limbs, isometric everything, low-poly facets;
  - icons all at the default 2 pt stroke, round caps and one corner radius, indistinguishable from a
    free icon pack.

## 4. Verify loop (mandatory)

After each major step:

1. `doc_inspect` (depth 1-2; `depth:0` on big docs, then `document.find`/`document.node`): objects, names,
   bounds, fills/strokes, artboard size, colour mode. Check bounds against the artboard (art overhanging
   or off-centre), unnamed leftovers, default white-fill/black-stroke slips, unintended strokes.
2. **Look**: `render_preview {artboard, max_side}` (1024 default, up to 4096) and check silhouette,
   balance, optical alignment, curve smoothness, gaps/overlaps, colour, text legibility. Also check at
   small size (render `max_side:64`/`32`): icons and logos must survive favicon scale.
3. Fix with `command_run`/`set_paint`/`transform`; `undo` for a bad step. Re-render.
4. Pre-export checks: text outlined if required, effects expanded where needed (`object.expand`), no
   hidden/stray objects (`select.object.strayPoints`, `document.find`), correct artboard dims, colour mode.
5. Round trip export: export SVG, re-open or render the PNG, compare to the artboard preview.
6. **Outside critique** (logos, icon sets, illustrations; not small edits), before section 6: a fresh
   subagent with a clean context, not a fork, gets only the rendered PNGs (full size and 32 px), the
   brief and the tells list in section 3, and is asked: what reads as clip-art, stock or AI-made, what
   contradicts the brief, and could this mark be moved onto a competitor unchanged? No compliments,
   no redesign. Fix what it rates severe, and tell the user where you disagree. Inside a subagent,
   return the critique inputs (PNG paths, brief, tells) to the orchestrator, which starts the reviewer.

## 5. Save and export

- **Native**: `save_file {path:"/abs/logo.vectorcraft"}` (extension picks the format; `.vectorcraft`,
  `.vctemplate`, `.ai` (PDF-compatible, reopens editable), `.pdf`, `.svg`, `.svgz`). `save_file` without path
  writes the document's own file. `warnings` lists what a format loses (SVG drops editable effects and
  swatches: keep the `.vectorcraft` as the master).
- **Export** (`export {path,format,artboard|range,scale,selection,outlineText,options}`): `svg` (artboard as
  viewBox; `outlineText:true` for portable text), `pdf`/`ai` (all artboards; `range:"1-3"`), `eps`, `dxf`,
  `emf/wmf`, raster `png` (scale = pixels per point: `scale:2` doubles; transparent background),
  `jpg`/`webp`/`gif`/`tiff`/`bmp`/`tga`/`psd`, `png8`. `selection:true` exports only the selection
  cropped to it. `run_command document.formats` lists each format's options (jpg quality, PNG
  settings, SVG decimals/styling). Multi-size: `file.exportForScreens {folder,artboards,formats,prefix}`.
- Icon/logo set: SVG (outlined text) + PNG at 1x/2x/4x + PDF for print; favicons 16/32/48/180/512 px at
  `scale = px / artboard pt`.
- Descriptive file names (`acme-logo-primary.svg`); report absolute paths and sizes.
- `file.package {folder,copyLinks,copyFonts}` collects links and fonts for hand-off.
- CLI batch (no MCP needed): `vectorcraft-cli convert IN OUT [--scale N] [--outline-text]`,
  `vectorcraft-cli run --in F --cmd ID --params JSON --export OUT`, `vectorcraft-cli info FILE`.

## 6. Show and approve (mandatory final phase)

Every task ends here, after the verify loop. The headless session has no window, so the user cannot see
the artwork until it is saved and the real app is opened on it.

1. **Save** the master `.vectorcraft` (`save_file {path}`) into the project directory or the path the
   user named, with a descriptive name, never over the user's original unless they said so. Optionally
   also write an SVG/PNG preview beside it. Note the full absolute paths.
2. **Open VectorCraft on that file, detached** (verified: `/usr/bin/vectorcraft`, `vectorcraft [files...]`):
   `setsid vectorcraft /abs/path/design.vectorcraft >/dev/null 2>&1 &`
   Native extensions: `.vectorcraft` and `.drawcraft` (MIME `application/x-vectorcraft`), templates
   `.vctemplate`; the app also opens SVG, PDF, AI/AIT, EPS, DXF, PNG, JPG and more
   (`setsid xdg-open file.vectorcraft ...` works too). Check `pgrep -x vectorcraft` first: if the user
   already has the app open on this file or in a `--control` bridge session, do not launch another copy
   (use `file.open {path}`/tell them to reload). Do not leave instances you started running when the
   task ends without the user's wish to keep working.
3. **Stop and ask.** Give the full path and ask the user to accept or describe changes. No final
   export set, format conversion for hand-off, or further steps before explicit acceptance. Silence or a
   vague reaction is not acceptance.
4. **Loop on changes**: apply them, redo the verify loop for what changed, `save_file` again, refresh
   or reopen the app on the file, ask again until accepted.
5. **Inside a subagent** (cannot talk to the user): do steps 1 and 2, then return the file path(s), a
   short summary, and state clearly that **user approval is pending**. The orchestrator asks the user
   and relays changes; final exports wait for acceptance.

## 7. Top gotchas (more: `references/command-catalog.md`)

- `add_text`, `apply_effect`, `set_paint`, `transform`, `pathfinder` are MCP tools, not command ids:
  in `command_batch` use `text.create`, `effect.apply`, `paint.setFill`, `object.transform`,
  `object.pathfinder.*` (error: ``unknown command `add_text` ``).
- Forgetting `fill`/`stroke` yields white fill + 1 pt black stroke. Pass both explicitly.
- Pathfinder/align/paint act on the selection when `ids` is omitted: stale selection = wrong target.
  `select.set {ids}` or pass `ids`.
- Pathfinder order is z-order: `minusFront` removes the top objects from the bottom one.
- The document's last `save_file` path may be an SVG (e.g. a default untitled doc saved as SVG becomes
  an SVG-format doc and the next plain save writes SVG): save the master explicitly as `.vectorcraft`.
- Open docs accumulate in the session (`file.new` adds a document): `file.close`/`document.activate {index}`;
  check `doc_inspect` `title`/`path` before saving.
- Gradient `angle:90` runs bottom to top (first stop at the bottom): verify direction in a preview.
- `object.expand` on a drop-shadow/blur object turns the effect into a **raster image** object; expand
  vector-only effects, and keep shadows live (or recreate them as vector shapes) for scalable art.
- Live effects and live shapes export as baked geometry/SVG filters; `object.expand` first when the
  recipient needs plain paths.
- Raster effects and Gaussian blur rasterize at export resolution: avoid them in scalable logos.
- Text exported as live text needs the font on the recipient's machine; outline it.
- `export` without `path` returns base64 inline (large); always give a path.
- Never leave test documents or files behind; ask before deleting anything the user made.
