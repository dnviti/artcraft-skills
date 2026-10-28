---
name: deckcraft-presentations
description: "Build and edit slide decks in DeckCraft (ArtCraft's PowerPoint-style presentation app, driven through the `deckcraft` MCP server, tools mcp__deckcraft__*). Use whenever the user mentions DeckCraft or the deckcraft MCP tools, or asks to create, design, restyle or edit a presentation, slide deck, pitch deck, keynote/talk, training or sales deck, or report-as-slides in/with DeckCraft (slides, layouts, themes, text, shapes, charts, tables, images, SmartArt, speaker notes, transitions, animations, .deckcraft/.pptx/.pdf output). Covers the outline, theme and layout choices, build, render-and-verify, save/export and the mandatory show-and-approve workflow. Not for cases where the user explicitly asked for another format or tool (a .pptx made with python-pptx, Google Slides, a Claude Slides artifact, PDF editing in PdfCraft, UI design in FigCraft)."
license: MIT
metadata:
  author: dnviti
  version: "1.0.0" # x-release-please-version
---

# DeckCraft presentations

DeckCraft is an open-source PowerPoint clone (slide masters and layouts, themes, text, shapes,
tables, charts, SmartArt, pictures, media, transitions, animations, sections, notes, slide show).
Native format `.deckcraft` (a zip); it also opens/saves `.pptx` and exports png/jpeg/pdf/gif/outline/rtf.
You drive it through the `deckcraft` MCP server. This skill says what to build, in what order, to what
quality bar, and how to verify it.

## 0. Tools and ground rules

MCP tools (deferred: load schemas with ToolSearch `+deckcraft`, max_results 30):
`new_presentation`, `open_presentation`, `save_presentation`, `export`, `add_slide`, `add_text_box`,
`add_shape`, `insert_picture`, `insert_table`, `insert_chart`, `set_text`, `go_to_slide`, `select`,
`inspect_document`, `inspect_slide`, `render_slide`, `list_commands`, `run_command`, `batch`, plus
interaction tools (`pointer`, `key`, `type_text`, `select_tool`) and the desktop-only `screenshot` /
`call_app` (they need the app attached via `deckcraft-cli mcp --connect PORT`; the default session is
headless with no window).

- **Everything is a command**: `run_command {command, params}` or `batch {commands:[{command,
  params}], keepGoing?}` (stops at the first error). Discover with `list_commands {filter}` using a
  narrow substring (`"slide."`, `"shape."`, `"format."`, `"table."`, `"animation."`): the unfiltered
  list is ~94k chars. Trust its param docs.
- **Coordinates are points on the current slide, y down**. Default 16:9 slide is **960x540**.
  `rect: [x, y, w, h]` in commands; `x, y, w, h` in the convenience tools.
- **Shape ids are looked up on the current slide.** After `slide.new` the new slide becomes current;
  to touch a shape on another slide, `slide.go {index}` (or `go_to_slide`) first, otherwise you get
  `no such shape`. `slide.new` inserts **after the current slide** (use `at`), so go to the last
  slide before appending in order.
- `format.*` acts on the selected shapes/text: select first (`edit.select {ids}` or the `select` tool).
  `shape.fill`, `shape.line`, `shape.move/resize/setBounds`, `arrange.*` take `ids` or act on the
  selection (a just-inserted shape is already selected).
- Colours: `#RRGGBB` or theme slots `accent1..6`, `tx1`, `bg1`... (use theme slots so a theme change recolours the deck).
- Placeholder text: `set_text {id, text}` / `text.set {id, text}` keeps the first run's formatting;
  `\n` makes paragraphs, leading tabs set bullet levels.
- `inspect_slide` gives ids, kinds, boxes `[x,y,w,h]`, placeholder types, text; `inspect_document`
  gives the whole deck. Read them back before editing.

## 1. Workflow

1. **Brief**: purpose (inform, persuade, teach, pitch), audience, language, duration (about one
   slide per 1-2 minutes), must-have content/data, brand colours/fonts, where it is shown (projector,
   screen share, printed), output needed (.deckcraft, .pptx, .pdf).
2. **Storyline**: write the outline in chat first: one message per slide (the title is the claim,
   a full-sentence takeaway, not a topic label), plus the evidence each slide shows (chart, table,
   quote, diagram, image). Opening: context/why now; middle: argument in 3-5 beats; closing:
   decision/next steps. Cut anything that is not on that path. Confirm the outline when the deck is
   large or the brief is vague.
3. **Design plan** (section 3): theme, 2 fonts, 4-6 colours, grid, the one memorable visual idea.
4. **Build**: `new_presentation {theme}` or `file.new {theme, template, size}`
   (`file.templates` lists starters; `blank:true` for no first slide), then slide by slide.
5. **Verify loop** after each slide or small batch (section 5).
6. **Speaker notes, transitions** if asked or the deck is for presenting (`slide.notes`, `transition.set`).
7. **Show and approve** (mandatory, always last; section 8).
8. Export (.pptx/.pdf/images) only after acceptance unless the user asked for it up front.

Scale to the request: a 3-slide update does not need sections and a custom master.

## 2. Building slides

Skeleton that works:

```
new_presentation {theme:"Harbor"}                        // 1 title slide (ids from inspect_slide)
slide.go {index:0}; text.set {id:<title id>, text:"..."}; text.set {id:<subtitle id>, text:"..."}
add_slide {layout:"titleAndContent", title:"Demand doubled in Q3", body:"Point\n\tSub-point\nPoint"}
slide.new {layout:"titleOnly", title:"..."} ; insert.chart {type, rect, categories, series}
```

- **Layouts** (`add_slide`/`slide.new` `layout`): `title`, `titleAndContent`, `sectionHeader`,
  `twoContent`, `comparison`, `titleOnly`, `blank`, `contentWithCaption`, `pictureWithCaption`.
  Prefer a real layout so titles are real placeholders (outline view, accessibility, pptx). `slide.layout
  {layout, index}` changes a slide's layout; `slide.reset` restores placeholders.
- **Text**: placeholders for titles/body; extra text via `add_text_box {x, y, w, text, size, color,
  align}` or `insert.textBox {rect, text}` (height grows to fit). Style with `format.size/color/bold/
  font/align/lineSpacing/paragraph/bullets/numbering/anchor/autofit`. `format.autofit {mode:"shrink"}`
  helps only as a safety net, resize instead.
- **Shapes**: `add_shape {preset, x, y, w, h, text, fill, line}` or `shape.insert {preset, rect, text}`;
  `shape.presets` lists names (rect, roundRect, ellipse, triangle, rightArrow, chevron, star5,
  line, straightConnector1...). `shape.fill {color|gradient|transparency}`, `shape.line {color, width,
  none}`, `shape.effects`, `shape.rename`, `arrange.align/distribute/group/bringToFront`,
  `shape.connect {from, to}` for connectors (diagrams).
- **Charts**: `insert_chart {type, categories, series:[{name, values}]}` or `insert.chart {type, rect, ...}`
  with types column, bar, line, pie, doughnut, area, scatter, stackedColumn... **The default chart shows
  a "Chart Title"**: set `chart.options {id, title:null | "text", legend:"b"|null, dataLabels:true,
  gridlines:false}`; `chart.type`, `chart.data` to change it later. One message per chart: the slide
  title says what to conclude.
- **Tables**: `insert_table {rows, cols, data:[[...]], x, y, w, h}`; then `table.style {style:
  "medium2-accent1"|"light1-accent2"|...}`, `table.options {headerRow, bandedRows}`, `table.cellFill`,
  `table.columnWidth`, `table.cellAlign`, `table.merge`. Keep to about 5x5; bigger belongs in an appendix.
- **Pictures**: `insert_picture {path|data, x, y, w, h}` (keep aspect ratio; use `picture.crop` rather
  than stretching); `picture.style`, `shape.altText`. Never use third-party logos or unlicensed images;
  use the user's files or neutral shapes.
- **SmartArt/diagrams**: `insert.smartArt {kind:"list|process|cycle|hierarchy|pyramid|matrix", items:[...]}`,
  `smartArt.setNodes`, `smartArt.style`, `smartArt.colors`; or build with shapes + `shape.connect`.
- **Icons**: `insert.icon {name, rect}` (list with `insert.icons`).
- **Outline to deck**: `slide.fromOutline {text, markdown:true}` creates slides from headings/bullets,
  then restyle: fast first draft for text-heavy material.
- **Notes**: `slide.notes {text}`; **sections**: `section.add {name, at}`; **hidden**: `slide.hide`;
  **duplicate**: `slide.duplicate`, **reorder**: `slide.move {from, to}`, **delete**: `slide.delete {index}`.
- **Motion** (only where it explains something): `transition.set {kind:"fade"|"morph"|"push"...,
  duration}`, `transition.applyAll`, `animation.add {effect, class, start, ids}`; `animation.list`,
  `transition.list` give the names.
- **Footer/slide numbers**: `design.headerFooter {slideNumber:true, footer:true, footerText:"..."}`.

## 3. Design quality bar

Distinctive, legible, restrained. Generic template-looking decks are the main failure mode.

- **Theme**: `design.theme {name}` (built-ins: DeckCraft, Harbor, Ember, Meadow, Nocturne, Paper, Coral
  Reef, Slate). The themes are minimal (white background, no decoration): the character comes from
  your choices. Custom: `design.colors {colors:{dk1, lt1, dk2, lt2, accent1..6}}`, `design.fonts {major,
  minor}`, `design.background {color|gradient|picture}`, `design.variant`, `design.slideSize`
  (`widescreen` 16:9 default, `standard` 4:3, portrait). Change the **master/layouts** for repeated
  elements (a logo band, an accent bar): `view.slideMaster` then add the shapes, `view.closeMaster`.
- **Fonts**: theme fonts reference families like Inter, Merriweather, Open Sans, Montserrat, Lato,
  Roboto, Carlito; check they are installed (`font.*` commands, render to confirm) because missing
  families fall back silently. Two families max; if the deck must open in PowerPoint elsewhere, prefer
  "Office Compatible" (Carlito) or Liberation fonts.
- **Type scale for 960x540**: title 36-44 pt, body 24-28 pt, secondary 18-20 pt, captions/labels no
  smaller than 14 pt, footers 12 pt. If it does not fit, cut words, do not shrink below 18 pt for body.
  Line spacing 1.0-1.2 for titles, 1.1-1.3 body. One message per slide; max ~5 bullets, ~8 words each.
- **Grid and spacing**: 60 pt side margins, 40-50 pt top margin; align left edges across slides
  (title at the same x,y everywhere); use `arrange.align/distribute` and consistent gaps (multiples of
  8 pt). Nothing within 30 pt of the slide edge unless full bleed. Leave white space.
- **Colour**: neutral background, one primary accent, one highlight, text contrast >= 4.5:1 (check the
  render), do not rely on colour alone to encode data (label directly). Dark slides: Nocturne theme or
  `design.background`.
- **Hierarchy**: size/weight/colour define reading order; the claim-title on top, the evidence big
  and unmistakable, source/footnote small at the bottom.
- **Avoid default tells** unless asked: bullet walls, every slide the same title+bullets layout,
  clip-art style icons everywhere, gradient decoration, an accent word in every title, 01/02/03 on
  non-sequences, ALL-CAPS tracked eyebrow labels on every slide, identical rounded cards in 3-up grids.
  Vary slide types: big statement, chart, two-column compare, image + caption, section divider,
  quote/number callout.
- **Data visuals**: label axes and units, remove chart junk (`chart.options {gridlines:false,
  legend:null}` for single series), highlight the one bar/line that matters with `shape.fill`/point
  colour, use direct labels (`dataLabels:true`).
- **Copy is design**: real, specific content in the user's language; sentence case; titles state the
  takeaway; numbers with units; no lorem ipsum.
- **The one memorable thing**: choose where boldness goes (a huge number, a full-bleed colour field,
  one strong diagram) and keep everything else quiet.

## 4. Existing decks

`open_presentation {path}` (.deckcraft or .pptx), then `inspect_document` (slides, layouts, theme,
sections, media) and `inspect_slide` per slide. Reuse its layouts/theme; do not restyle everything
unless asked. `text.find` / `text.replace {text, with}` for global edits, `slide.reuse {path, slides}`
to import slides from another deck (`keepFormatting:false` adopts the destination theme). Do not
overwrite the original: `save_presentation {path}` to a new name unless told otherwise.

## 5. Verify loop (mandatory)

After each slide or small group:

1. `inspect_slide {index}`: boxes within `[0,960]x[0,540]`, no overlapping shapes (compare boxes),
   placeholders filled (empty placeholders show "Click to add" prompts only in the editor, but are
   dead weight: delete or fill), text content right, fonts/sizes as planned.
2. `render_slide {slide, scale}` and **look at it** (scale 1 = 960x540; 1.5-2 for detail): text
   overflow, tiny text, alignment, collisions, contrast, chart readability, the hierarchy you planned.
   `render_slide {edit:true}` shows placeholder prompts like the editor.
3. Fix with commands; `edit.undo` for a bad step.
4. At the end: `inspect_document` (slide order, titles read as a story: read only the titles in
   sequence), render every slide, check notes and transitions, spelling of names/numbers.

A picture beats a JSON diff for aesthetics; JSON beats a picture for exact numbers. Use both.

## 6. Save and export

- `save_presentation {path}`: `.deckcraft` (native, keeps everything) or `.pptx` by extension; no path
  saves in place (only when opened from a file). Also `file.save`, `file.saveAs {path, format}`.
- `export {path, format}`: `pptx`, `pdf` (`layout:"slides|notes|handouts"`, `paper`, `perPage`,
  `slides`), `png`/`jpeg` (`slide` or `all:true`, `scale`), `gif`, `outline`, `rtf`, `deckcraft`.
- Default deliverable is the `.deckcraft` file; add `.pptx` and/or `.pdf` next to it when the user
  needs to share it. Native-only features (some effects, fonts) may differ in PowerPoint: render the PDF
  as the reference and tell the user if the `.pptx` is expected to reflow.
- Save into the project directory or the path the user named, descriptive file name
  (`board-update-q3.deckcraft`). Report the full absolute path. `file.properties {title, author}`.
- Experiments go to a temp dir and are deleted afterwards. Export formats only after acceptance.

## 7. Top gotchas

- `no such shape`: the shape id belongs to another slide. `slide.go` first; ids come from
  `inspect_slide` and change per slide.
- `slide.new` inserts after the current slide, not at the end.
- `new_presentation` creates one title slide with empty placeholders; fill them or delete the slide.
- A freshly inserted chart says "Chart Title": set `chart.options {id, title:null}` (or a real title).
- `format.*` with nothing selected does nothing useful: `edit.select {ids}` first (or run it right
  after inserting the shape, which is auto-selected).
- Placeholder text alignment comes from the layout: the title slide's subtitle is centered while a
  left-aligned title looks off; align both (`format.align`) or edit the layout in the master.
- `set_text`/`text.set` keep the first run's formatting and replace everything else.
- `add_text_box` height auto-grows but width does not: set `w` and keep text short so it does not run
  off the slide (check the render).
- Themes are plain: nothing decorative appears unless you add it; do not leave a bare white default deck.
- `list_commands` with no filter overflows the output; always filter.
- Desktop-only tools (`screenshot`, `call_app`, `pointer` with UI state) fail in the headless session: use
  `render_slide`.
- Do not claim a slide "looks right" without having rendered it.

## 8. Show and approve (mandatory final phase)

Every deck ends here, after the verify loop. The headless `deckcraft` MCP session has no window, so
the user cannot see the deck until you save it and open the real app on it.

1. **Save** with `save_presentation {path}` as `.deckcraft` (native) into the project directory (the
   current working directory) or the path the user named, with a descriptive name. Note the full
   absolute path. If the user asked for `.pptx`/`.pdf`, produce them after acceptance (or next to it,
   but still show the `.deckcraft` first).
2. **Open DeckCraft on that file**, detached so it does not block:
   `setsid deckcraft /abs/path/deck.deckcraft >/dev/null 2>&1 &`
   (`deckcraft [--control PORT] [--sample] [--show] [FILE...]` is the desktop app, `/usr/bin/deckcraft`;
   `.deckcraft` has MIME type `application/x-deckcraft`, and `.pptx` is associated too, so
   `setsid xdg-open /abs/path/deck.deckcraft >/dev/null 2>&1 &` works when DeckCraft is the default
   handler. Add `--show` to start the slide show.) If the app is already open on this deck, do not
   launch a second copy.
3. **Stop and ask.** Give the user the full file path and ask them to accept the deck or describe the
   changes. Never continue on your own: no export, sending or handoff before explicit acceptance.
   Silence or a vague reaction is not acceptance.
4. **Loop on changes.** Apply the requested changes (if the user edited and saved the deck in the app,
   `open_presentation {path}` first so you work on their version), re-run the verify loop for what
   changed, `save_presentation` again, reopen/refresh DeckCraft on the file, and ask again. Repeat until
   the user accepts.
5. **Inside a subagent** (it cannot talk to the user): do steps 1 and 2, then return the file path and a
   short summary (slide titles in order) to the orchestrator, stating clearly that **user approval is
   pending**. The orchestrator asks the user and relays changes back; export/handoff waits for the
   acceptance.
