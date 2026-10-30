---
name: cadcraft-drawings
description: "Draft, dimension, annotate and plot 2D technical drawings in CadCraft (ArtCraft's AutoCAD-class 2D drafting app, driven through the `cadcraft` MCP server, tools mcp__cadcraft__*, or through `cadcraft-cli`). Use whenever the user mentions CadCraft or the cadcraft MCP tools, or asks for a 2D technical drawing: floor plan, site or room layout, elevation or section, mechanical/part drawing with dimensions, schematic or detail sheet, title block, layers, blocks, hatching, dimensions and annotations, plot or print to PDF at a scale (1:50, 1:100), or to open, inspect, fix, convert (DXF to DWG, SVG, PDF, PNG) or measure DXF/DWG files. Covers units and scale planning, layers, geometry, dimension styles, layouts and viewports, the render-and-verify loop, save/export and the mandatory show-and-approve phase. 3D parts (solid modelling, STEP/STL) belong to solidcraft-cad, vector artwork to vectorcraft-illustration, multi-page print layout to designcraft-layout."
license: MIT
metadata:
  author: dnviti
  version: "1.1.0" # x-release-please-version
---

# CadCraft drawings

CadCraft is an open-source 2D/3D CAD drafting app that behaves like AutoCAD: command line with
aliases, layers, linetypes, blocks and attributes, dimension styles, hatches, tables, xrefs,
layouts with viewports, plotting to PDF, DXF and DWG read/write. You drive it with the `cadcraft`
MCP server (a headless drawing session) or with `cadcraft-cli` from Bash. This skill says how to
plan a drawing, build it in the right order, verify it, and hand it over.

- Command ids and parameters by area, plus recipes: `references/command-catalog.md`
- Traps and fixes: `references/gotchas.md`
- 3D solid parts go to `solidcraft-cad`; this skill is for 2D drafting (plans, sections, details, sheets).

## 0. The tools

MCP tools (deferred: load schemas with ToolSearch, `select:mcp__cadcraft__execute,...` or `+cadcraft`):
`command_line`, `script`, `execute`, `list_commands`, `inspect_drawing`, `query_entities`,
`render`, `find_text`, `new_drawing`, `open`, `save`, `cancel`. Resources: `cadcraft://drawing`,
`cadcraft://commands`.

- **`execute {command, params}`** runs any command with JSON params and no prompts: the reliable
  way to build geometry. It returns `{handle}` for what it created (keep handles, they are hex
  strings such as `"100"`; later commands take `handle`/`handles`).
- **`command_line {text}`** types one line at the AutoCAD prompt (`line 0,0 10,0 10,5 c`,
  `circle 5,2.5 1`, `zoom e`); spaces act as Enter. Good for aliases and quick sequences, but it
  leaves a running prompt behind when a line is incomplete: send `cancel` to reset. `script {text}`
  runs a multi-line `.scr`-style text.
- **`list_commands {filter}`**: always pass a narrow filter (`"dim"`, `"layer"`, `"plot"`, `"hatch"`).
  The catalogue has ~440 commands (150 KB). The `params` text is the truth for the installed build.
  Notation: `?` optional, `|` alternatives, `→` result.
- **Coordinates**: drawing units, **y up**, x right. Points are `[x,y]`, angles in degrees (CCW +).
  Units are whatever you decide (mm, m, inch): see section 2.
- **Atomicity**: there is no batch tool. Each call is one command and one undo step; a failing
  command changes nothing. `undo {count}` steps back. `{last}` handle chaining works only in
  `cadcraft-cli run --cmd`, not through the MCP: read the returned `handle` instead.
- Errors are explicit (`unknown command`, `invalid parameters for ...: ...`); fix the params, do not retry unchanged.

## 1. File access

`cadcraft-cli mcp` has **no automation-root flags**: `open`, `save`, `plot`, `render {path}` work
on any absolute path the user can access (verified under `/home` and `/tmp`). Always use absolute
paths. Optional: `mcp --connect HOST:PORT` bridges to a running app started with
`cadcraft --control PORT` (then the user watches the live drawing); `--lazy` waits for the app.
Settings (plotters, autosave) live in `CADCRAFT_CONFIG_DIR`; leave it alone.

Bash route (no MCP needed), each `run` is a full pipeline:

```bash
cadcraft-cli info /abs/plan.dxf                                   # summary JSON
cadcraft-cli convert /abs/plan.dwg /abs/plan.dxf                  # OUT extension: dxf dwg dwt svg png pdf
cadcraft-cli run --metric --cmd 'rectang {"p1":[0,0],"p2":[6000,4000]}' \
  --cmd 'dimlinear {"p1":[0,0],"p2":[6000,0],"at":[3000,-700]}' --save /abs/out.dxf --export /abs/out.png
cadcraft-cli run /abs/in.dxf --script-file /abs/job.scr --save /abs/out.dxf   # --in-place to overwrite the input
```

`--cmd 'id {json}'` lines print JSON results; `{last}` stands for the last returned handle.
`cadcraft-cli commands` dumps the catalogue; `sample` writes a sample drawing.

## 2. Workflow

1. **Brief**: what is it (floor plan, part, detail sheet), real dimensions, units, final scale and
   sheet size (A4/A3/ANSI), who reads it, deliverable (DXF/DWG to share, PDF to print). Ask only
   what you cannot infer; state the assumed units and scale back to the user.
2. **Safe start**: never overwrite the user's original. `open` an existing file, then `save` to a
   new path (`plan-v2.dxf`) before editing; new work: `new_drawing {metric:true}`.
3. **Set up**: units (`units`), layers (`layer.new`), text style, dimension style (section 3).
4. **Build the geometry** at full size, 1 drawing unit = 1 real unit (never draw "to scale" on the
   model; scale belongs to the layout/viewport and to annotation size).
5. **Dimension and annotate**, then (if a sheet is wanted) **layout + viewport + title block**.
6. **Verify loop** (section 5) after each stage.
7. **Save/export**, then **Show and approve** (section 7), always last.

Scale the work to the request: a quick "draw a 4x3 m room with door" is a layer set, a polyline,
two dimensions and a render, not a full title-blocked sheet.

## 3. Drafting know-how

- **Units**: pick one and keep it. Architecture: mm (or m with insunits 6); mechanical: mm.
  `new_drawing` is **imperial by default**: pass `{metric:true}` for mm/cm/m work, then
  `units {lunits:2, luprec:0, insunits:4}` (4 = mm, 6 = m, 1 = inches).
- **Layers first** (`layer.new {name, color, linetype?, lineweight? (mm), current?}`), named by
  meaning: `WALLS`, `DOORS`, `FURN`, `DIM`, `TEXT`, `HATCH`, `CENTER`, `HIDDEN`, `TITLE`, `DEFPOINTS` is
  reserved. New objects go on the current layer (`layer.current {name}`): set it before drawing,
  including before `hatch`, `dimlinear` and `text`. Colour/linetype/lineweight ByLayer (the default);
  never override per object unless needed. Lineweights: walls/outlines 0.35-0.5, details 0.18-0.25,
  dimensions/hatch 0.13-0.18.
- **Geometry**: closed outlines as polylines (`pline {vertices, closed}` / `rectang`) so they
  hatch, offset and measure cleanly; `offset {handle, distance, side:[x,y]}` (side = a point on
  the side to offset to) is the fast way to draw wall thickness; `trim`/`extend`/`fillet`/
  `chamfer` to clean joints; `mirror`, `array*`, `copy {count}` for repetition; `block` + `insert`
  for repeated symbols (doors, chairs, bolts). Use exact numbers, not eyeballed points; use
  `osnap`-free coordinates computed from the dimensions.
- **Dimension styles scale with the drawing**: the default style is sized for inches (text 0.18,
  arrows 0.18), so in a millimetre drawing 6000 units wide the dimension text is **invisible**.
  Create a style for the target scale: paper size of text/arrows times the scale factor, e.g. for
  1:50 with 2.5 mm text:
  `dimstyle {name:"ARCH-50", scale:50, textHeight:2.5, arrowSize:2.5, extOffset:1, extExtend:1.5, textGap:1, decimals:0, current:true}`.
  Annotation text (`text {at,text,height}` / `mtext {at,text,height,width}`) is in model units: for
  1:50 and 2.5 mm paper text, height = 125; titles 250.
- **Dimensioning**: `dimlinear {p1,p2,at}` (`at` = where the dimension line sits, offset 500-700
  units from the object at 1:50), `dimaligned`, `dimradius/dimdiameter {handle|center,point}`,
  `dimangular`, chains with `dimcontinue`/`dimbaseline`, `mleader` for notes. Dimension a feature once, outside the outline, nothing
  dimensioned twice, overall dimensions outermost, never dimension to hidden lines.
- **Hatch**: `hatch {points:[[x,y]] | handles, pattern:"ANSI31", scale, angle}` with an internal point
  of a closed region; scale roughly = drawing scale for hatches meant to read at 1:50 (try 50).
- **Text**: one text style, consistent heights, readable orientation; room names `mtext`, with area
  from `area {points|handle}`.
- **Layouts and plotting**: model space holds the full-size drawing; a layout is the sheet.
  `layout.new {name}` returns the viewport handle; `pagesetup {layout, paper:"A3", landscape:true}`;
  `layout.set {name}` to switch; `viewport.set {handle, scale:"1:50", center:[x,y]}` to frame the
  model; add a title block (table/lines/text on a TITLE layer in the layout) filled with this
  drawing's facts (title, scale, units, sheet, revision, date, author), with no generic template
  leftovers ("COMPANY NAME", empty logo boxes, unused fields). On a drawing, clarity is the style:
  no decorative frames, fills or extra fonts. `plot {path, layout,
  paper, landscape, fit?, scale?}` / `exportpdf` writes a vector PDF (lineweights on by default). Plot
  the model directly with `layout:"Model", scale:"1:50", paper`, or `fit:true`.
- **Quantities**: `dist {p1,p2}`, `area {points|handle}`, `measuregeom`, `list {handles}`,
  `query_entities` for counts by type/layer (bills of material: `dataextraction`).
- **Existing files**: `inspect_drawing` first (layers, blocks, layouts, styles, extents), `find_text`
  to read notes, `audit {fix?}` / `recover` for damaged files, `purge` to clean unused definitions.
  `open` returns `warnings` for what the reader could not keep (some DWG proxy objects): report them.

## 4. Building blocks (details in the catalogue)

| Goal | Commands |
|---|---|
| New/open/save | `new_drawing {metric}`, `open {path}`, `save {path}` (dxf/dwg; svg/png/pdf export), `saveas {path,version}` |
| Setup | `units`, `limits`, `layer.new/set/current`, `style`, `dimstyle`, `linetype {load}`, `ltscale`, `setvar` |
| Draw | `line`, `pline`, `rectang`, `circle`, `arc`, `ellipse`, `polygon`, `spline`, `xline`, `donut`, `point` |
| Edit | `move`, `copy`, `rotate`, `scale`, `mirror`, `offset`, `trim`, `extend`, `fillet`, `chamfer`, `stretch`, `array`, `join`, `explode`, `erase` |
| Annotate | `text`, `mtext`, `dimlinear/aligned/radius/diameter/angular`, `mleader`, `table`, `hatch`, `revcloud` |
| Blocks | `block`, `insert`, `attdef`, `attedit`, `wblock`, `xattach`, `purge` |
| Sheets | `layout.new`, `pagesetup`, `viewport.set`, `mview`, `plot`, `exportpdf`, `publish` |
| Query | `inspect_drawing`, `query_entities`, `find_text`, `dist`, `area`, `list`, `properties` |

## 5. Verify loop (mandatory)

After each major stage:

1. `inspect_drawing` (counts per type, layers, extents, current layer): extents far from the
   expected size mean a unit or typo error (a 6000 mm room with extents of 6 means wrong units).
2. **Look**: `render {path:"/abs/scratch/x.png"}` (fits the extents; 1600 px wide) then Read the PNG;
   `render {window:[[x0,y0],[x1,y1]]}` to zoom into a detail. The render is a dark-background
   screen view, not a plot: judge geometry, text size, dimension legibility, hatch density, layer
   colours. For a sheet: `plot {path:x.pdf, layout}` then `pdftoppm -r 60 -png x.pdf /abs/scratch/x`
   and look at the PDF page.
3. `query_entities {layer, type}` / `find_text` to confirm counts, handles and text content; compare
   measured values (`dist`, `area`) against the spec numbers, not just by eye.
4. Look for: dimensions that are invisible or huge, text overlapping geometry, objects on layer 0,
   open outlines that will not hatch, duplicate overlapping lines (`overkill`), wrong scale in the viewport.
5. Fix with the command (not by redrawing), `undo`, then re-check. `audit {fix:true}` before final save.

## 6. Save and export

- **Native exchange formats**: DXF (text, default 2018) and DWG. There is no private project format;
  keep the file as `.dxf` or `.dwg` (ask which the recipient uses; DXF is safest for interchange,
  DWG for AutoCAD users). `saveas {path, version:2000|2004|2007|2010|2013|2018}` for older readers.
- **Exports** by extension via `save {path}` (does not rename the drawing, unsaved state stays):
  `.pdf` (vector, fits extents), `.svg`, `.png`. For real sheets use `plot`/`exportpdf` with
  `layout`, `paper`, `scale`; `publish {path:"NAME.pdf"}` writes one PDF per layout.
- Descriptive names (`apartment-plan-A3-v2.dxf`); report absolute paths and sizes.
- Do not leave test drawings: `close` unneeded documents; never delete the user's files.

## 7. Show and approve (mandatory final phase)

Every task ends here, after the verify loop. The headless session has no window, so the user
cannot see the drawing until it is saved and the real app is opened on it.

1. **Save** the drawing as `.dxf` (or `.dwg` if the user works in DWG) in the project directory or
   the path the user named, with a descriptive name, never over their original unless they said so.
   Also write a PDF plot if a sheet was requested. Note the full absolute paths.
2. **Open CadCraft on that file, detached** (`/usr/bin/cadcraft`, `cadcraft [FILES]...`):
   `setsid cadcraft /abs/path/drawing.dxf >/dev/null 2>&1 &`
   (MIME `image/vnd.dxf` and `image/vnd.dwg`, so `setsid xdg-open /abs/path/drawing.dxf
   >/dev/null 2>&1 &` also works.) If the user already runs CadCraft with a bridge (`--control`),
   use that session instead of launching another copy. Never run `cadcraft` without a file argument
   and never leave extra instances you started running past the task if the user did not ask for them.
3. **Stop and ask.** Give the full path and ask the user to accept the drawing or describe changes.
   No final export, delivery in other formats or further steps before explicit acceptance.
   Silence or a vague reaction is not acceptance.
4. **Loop on changes**: apply them, redo the verify loop for what changed, save again, reopen /
   tell the user to reload the file if it is already open, ask again.
5. **Inside a subagent** (cannot talk to the user): do steps 1 and 2, then return the file path(s),
   a short summary of the drawing (units, layers, key dimensions, sheet) and state clearly **awaiting
   user approval**. The orchestrator asks the user and relays changes.

## 8. Top gotchas (more: `references/gotchas.md`)

- Default drawing is imperial; default dimension style is inch-sized and invisible in mm drawings.
- `{last}` works only on the CLI `run` route; via MCP use the returned handle.
- Draw at full size; set scale only in the viewport/plot and dimstyle/text heights.
- Hatch and dimensions go on the **current** layer; set the layer before creating them.
- `command_line` can leave a half-finished prompt: use `cancel`. Prefer `execute` with JSON.
- `save` to `.pdf/.svg/.png` exports only; it does not make that file the drawing's own file.
- Always `list_commands {filter}` before using a command you have not used here; params are strict.
