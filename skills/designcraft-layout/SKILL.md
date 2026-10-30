---
name: designcraft-layout
description: "Lay out magazines, books, brochures, flyers, catalogues, designed annual reports and other multi-page print documents in DesignCraft (ArtCraft's InDesign-class layout app, via the `designcraft` MCP server or `designcraft-cli`). Use whenever the user mentions DesignCraft or the designcraft MCP tools, or asks for page layout or desktop publishing work: a magazine or book layout, spreads with facing pages, parent (master) pages, running heads and page numbers, columns and grids, paragraph/character styles, text flow across threaded frames, image placement, tables, table of contents, footnotes, bleed and crop marks, preflight, print-ready PDF/X, IDML/InDesign import/export, EPUB. Covers setup, parents, styles, content flow, render-and-verify and the mandatory show-and-approve phase. Single-flow documents (letters, reports, contracts) belong to wordcraft-documents, vector artwork and logos to vectorcraft-illustration, editing an existing PDF to pdfcraft-documents, UI design to figcraft-design."
license: MIT
metadata:
  author: dnviti
  version: "1.0.0" # x-release-please-version
---

# DesignCraft layout

DesignCraft is an open-source page-layout app in the InDesign mould: spreads and pages, parent
pages, text frames threaded into stories, paragraph/character/object styles, swatches (RGB, CMYK,
spot), tables, footnotes, TOC and index, links, bleed and slug, preflight, PDF/X export, IDML
and InDesign (.indd) import. Native format `.designcraft`. You drive it with the `designcraft`
MCP server (headless engine) or with `designcraft-cli` from Bash. This skill says what to build,
in what order, to what quality bar, and how to hand the result to the user.

**Pages should look edited, not generated.** The path of least resistance is the template brochure:
one family at 12 pt, everything centred, equal images in a lattice, every page cut from the same
mould. A layout gets a face from a borrowed format (a field guide, an auction catalogue, a railway
timetable, a seed catalogue), a grid rule that makes some pages uncomfortable on purpose, the user
choosing between spreads that genuinely differ, and a reader who did not lay it out. The user's
house style or brand guide always wins.

- Command ids and params by area, recipes: `references/command-catalog.md`
- Traps and fixes: `references/gotchas.md`

## 0. The tools

MCP tools (deferred: load schemas with ToolSearch, `+designcraft`, max_results 30):
`new_document`, `open_document`, `save_document`, `execute`, `batch`, `list_commands`,
`inspect_document`, `get_story`, `set_story_text`, `place_image`, `render_page`, `export_png`,
`select_tool`, `pointer`, `key`, `type_text`, `ime`. Desktop-bridge-only (need
`designcraft-cli mcp --connect PORT` to a running app): `screenshot`, `click`, `drag`,
`menu_list`, `ui_inspect`, `ui_set`, `dialog_set/confirm/cancel`. Resources:
`designcraft://document`, `designcraft://commands`.

- **Every action is a command.** `list_commands {filter}` with a narrow filter (`"style."`, `"table."`,
  `"layout."`, `"file.export"`, `"object."`). The catalogue is ~540 commands (185 KB): never call it
  unfiltered. The `params` text is authoritative (`?` optional, `|` alternatives, `→` result);
  unknown params are refused with a "did you mean" hint.
- **Coordinates**: points (72 pt = 1 in), y down, in **spread space**. On a single-page spread the
  page's top-left is (0,0); on a facing-pages spread the right page starts at x = page width.
  Letter 612x792, A4 595.28x841.89.
- **`batch {commands:[{command,params}]}`** runs in order, stops at the first error, earlier steps stay
  applied (undo with `edit.undo`). Later steps can reuse earlier results: `"$0.story"`, `"$last.id"`,
  `"${0.id}"` inside strings; also `script` form: one `command.id {json}` per line.
- Programmatic calls never open dialogs. Item ids and story ids are different numbers: a text frame
  has `id` and `story`; `get_story`/`story.*` take the story (or `frame`).
- **Select-then-act**: many commands act on the selection when `ids` is omitted. New frames become
  the selection; `selection.set {ids}` to change it. `style.paragraph.apply` applies to the
  text selection or the selected frames' stories.

## 1. File access (check this first)

`designcraft-cli mcp` can confine files to roots: `--automation-read-root DIR` / `--automation-write-root DIR`
(repeatable; links followed). When the MCP is registered with roots, e.g.
`claude mcp add --scope user designcraft -- /usr/bin/designcraft-cli mcp --automation-read-root DIR --automation-write-root DIR`,
open/save/export/place work **under those folders only**. Outside them a call fails with
`automation path rejected: outside the write roots <roots>: <path>`.

- Preflight: save a first draft to the real destination early; if it is rejected, do not retry the
  same path. Save to an allowed folder instead (the project dir, or a scratch dir inside a granted
  root) and tell the user once; copying beyond the roots is done with plain `cp`/`mv`
  in Bash after the fact.
- Route without MCP roots: `designcraft-cli run --in FILE --cmd 'id={json}' --export OUT.pdf` and
  `designcraft-cli script FILE|- --in F --save OUT --export OUT` run **unconfined** pipelines from Bash
  (`--export` picks pdf/png by extension; `--page N`, `--scale S`, `--pdf-options JSON` apply to the
  exports that follow; `--all-pages DIR`). To build a document from scratch there:
  `printf 'file.new {"preset":"A5","pages":2}\nframe.create {...}\n' | designcraft-cli script - --save /abs/x.designcraft`.
- Never edit the user's MCP configuration yourself; if the roots are missing or too narrow, ask the user
  to add `"--automation-read-root","/abs","--automation-write-root","/abs"` to the MCP server args and restart Claude Code.
- Placed images/fonts/text must live under a read root too. Use absolute paths.
- `designcraft-cli mcp --connect PORT` bridges to a running app (`designcraft` started with a control
  port) and is **not** confined by the roots.
- **Never run `designcraft --help` or other flags on the app binary**: it treats `--help` as a file name
  and opens the GUI. Use `designcraft-cli`, which has the CLI.

## 2. Workflow

1. **Brief**: publication type, trim size, page count, spreads or single pages (facing pages for
   magazines/books), print or screen (PDF/X, CMYK vs RGB), who reads it, content available (text,
   images, brand colours, fonts), deliverable. Ask only what you cannot infer; state assumptions.
   Add a **borrowed format** from outside the genre and what it lends (a field guide's numbered
   specimens and margin notes; a timetable's rows and tabular figures), plus **2 constraints** that
   rule out the template answer (a 7- or 9-column grid with one deliberate break per spread; text
   always heavier than images; one accent colour per section; captions only in the outer margin).
   Scale down for a one-page flyer: one format, one constraint.
2. **Document setup**: `new_document {preset|width,height, pages, facingPages, columns, gutter,
   margins:{top,bottom,inside,outside}, bleed, intent}`. Print jobs: bleed 3 mm (9 pt) or 0.125 in (9 pt).
3. **Grid and parents**: margins, columns, baseline grid, then parent pages (running heads, folios,
   background shapes) applied to pages.
4. **Styles before content**: swatches, paragraph styles (Body, Headline, Deck, Kicker, Caption,
   Pull quote, Folio), character styles, object styles.
5. **Content**: stories threaded through frames, images placed and fitted, tables, captions.
6. **Verify loop** (section 5) after every page or spread.
7. **Preflight, save, export**, then **Show and approve** (section 7), always last.

**Divergent spreads** (after the brief, before steps 3-4 fix the grid, parents and styles; skipped
when a house style fixes the look): build the same opening spread (or cover + first spread) 2-4
ways, each differing in grid, type pairing, image scale and pacing, not just colour; 2 for a flyer.
Put each on its own pages of one draft document, save and open it as in section 7, then ask with the
multiple-choice question tool (AskUserQuestion in Claude Code; else a numbered list), multi-select for
hybrids. Never pick for the user; if they ask for advice, give the reason and let them choose. This
rule covers creative directions, while technical options may carry a labelled recommendation. Inside
a subagent, return the options (document path, page numbers, brief) to the orchestrator, which asks
the user. Build the full document only in the chosen direction.

Scale the work: a one-page flyer is a document, five styles, a handful of frames and a render;
a 24-page magazine is parents, a style set, autoflowed stories and spread-by-spread checks.

## 3. Layout know-how

**Typography first.** Decide a type system and encode it in styles, not local overrides:

- 1 or 2 families with clear roles (display + text); body 8.5-11 pt with leading 120-135% of size
  (`leading:{kind:"points",value:13}`), headline sizes on a scale (e.g. 10/14/20/32/56); tracking
  slight negative on large sizes; line length 45-75 characters (a 2-column grid on A4/Letter at
  9.5-10 pt body is about right).
- Check fonts exist: `font.list`; missing fonts fall back silently. Safe installed families seen here:
  Liberation Serif/Sans/Mono; ask the user for brand fonts and check them. Liberation is a fallback,
  not a choice: when the brief is open, propose faces that suit the borrowed format and ask before
  installing any. Libre sources: Fontshare (ITF's own free licence), Velvetyne and Collletttivo
  (mostly SIL OFL), and Google Fonts beyond the most popular families (OFL/Apache). Terms change:
  verify each family's licence at download.
- Paragraph styles carry alignment, indents, spacing and hyphenation (`style.paragraph.create {name,
  basedOn, nextStyle, para:{align,firstLineIndent,spaceAfter,...}, chars:{fontFamily,fontStyle,size,leading,tracking,fill}}`).
  `style.paragraph.apply {name}` then reads from the style; `clearOverrides` removes local tweaks.
  First paragraph after a heading has no indent ("Body First" based on "Body"); justified text needs
  hyphenation on and a column of at least ~35 characters; avoid widows/orphans and rivers.
- Use real typographic characters (quotes, en/em dashes, ellipsis) and non-breaking spaces; the engine
  converts quotes unless `raw:true`.

**Grid and margins.** Pick columns and margins once (inside margin larger for binding). Frames
snap to the grid by coordinates you compute: column width = (text width - gutter x (n-1)) / n. `layout.createGuides
{columns, rows, fitTo:"margins"}` marks them. Align heads, images and captions to column edges;
vary scale of images (hero, medium, small) for rhythm; keep generous outer margins.

**Parents (master pages).** Put repeating elements on a parent (`frame.create {spread:{kind:"parent",index:0}, ...}`):
running head, footer, folio, background tint. The **page-number marker is the character U+E000**
(`""`) in a parent text frame (renders as the page's own number; the section/prefix is handled by
`layout.section`). Facing pages: build the left-hand page items in the left half of the parent spread
and mirror them on the right half. Apply with `layout.pages.applyParent {pages:[0,1,2], parent:"A-Parent"}`.
The first parent is `A-Parent`; make more with `layout.parents.new`. Cover/opening pages get a different parent or none.

**Text flow.** Create a first text frame inside the margins, then flow a long story:
`file.place {path, frame:<frame id>, autoflow:true}` (autoflow threads one frame per column on following
pages and adds pages until the text fits) or `text.thread {from, to|rect, autoflow}` for manual threads.
Check `overset` in the result and in `inspect_document`/`preflight.run`. Paste short copy with
`frame.create {content:"text", text}` or `set_story_text`; Word/RTF/Markdown/plain text and .xlsx
(as a table) place via `file.place`, with `styleMap` to map imported styles to yours.

**Images.** `place_image {path, x, y, width}` or `file.place {path, frame}`; fit with
`object.fit {mode:"fillProportionally"|"fitProportionally"|"fitContentToFrame"}` and
`object.fittingOptions`. Resolution: aim 300 ppi at placed size for print (preflight warns below
`minPpi`); bleed images extend 9 pt past the trim. Text wrap: `object.textWrap {mode:"boundingBox"|"contour",
offset}`. Captions: `object.caption {text,position}` or a caption frame in the Caption style. Don't use copyrighted images;
use user-provided files or neutral placeholders. Colour: print = CMYK swatches (`swatch.create
{name, color:{c,m,y,k}}`), screen = RGB; `color.convert` to check; avoid 4-colour black on text (use K only).

**Default tells** (avoid unless the brief or house style asks for them): centred headings, body and
captions on every page; one family at the default 12 pt doing every job; images all the same size in
a lattice; equal margins all round with no binding allowance and no white space used as structure;
every spread built from the same parent with no change of pace (no quiet page, no full-bleed
moment); drop shadows or rounded corners on photographs; pull quotes in giant decorative quotation
marks; headline set over the middle of a busy photo; boxes and rules around every element; tinted
gradient panels behind text. Every rule, tint and size change should map to something in the brief.

**Objects.** `frame.create {rect:[x0,y0,x1,y1], shape, content:"text|graphic"}`, `object.fill/stroke`,
`object.cornerOptions`, `object.effects` (drop shadow etc., flattened at PDF export), `object.align/distribute`,
`object.group`, `layer.*` for stacking layers, `object.label` to tag items you must find again.

**Long documents.** Tables (`table.insert`, then `table.setCell`, `style.table.create`), footnotes
(`footnote.insert`), TOC from heading styles (`toc.generate {entries:[{style,level}], title, page}`,
refresh with `toc.update`), cross-references, index, text variables (`variables.define/insert`),
sections and numbering (`layout.section`), book files (`book.new/add/paginate/exportPdf`), snippets for reusable pieces.

## 4. Building blocks (details in the catalogue)

| Goal | Commands |
|---|---|
| New/open/save | `new_document`, `open_document`, `save_document {path}` (.designcraft), `file.open` (also .idml, .indd), `file.saveACopy` |
| Pages | `layout.pages.insert {count,after,parent}`, `.delete`, `.move`, `layout.documentSetup`, `layout.marginsAndColumns`, `layout.section` |
| Parents | `layout.parents.new/edit/options`, `layout.pages.applyParent`, `layout.overrideParentItems` |
| Frames | `frame.create`, `frame.grid`, `object.textFrameOptions {columns,gutter,inset,verticalJustification,...}`, `transform.move/resize/rotate` |
| Text | `type.char {attrs}`, `type.para {attrs}`, `style.*`, `text.thread`, `story.setText`, `find.find/change` |
| Placed content | `file.place`, `place_image`, `object.fit`, `object.textWrap`, `links.list/relink/update/embed` |
| Colour | `swatch.create/options/delete`, `color.settings`, `color.convert`, `color.extractTheme` |
| Long docs | `table.*`, `footnote.*`, `toc.*`, `xref.*`, `index.*`, `variables.*`, `book.*` |
| Output | `file.exportPdf`, `file.exportIdml`, `file.exportEpub`, `file.exportHtml`, `file.printBooklet`, `file.package`, `export_png`, `preflight.run` |

## 5. Verify loop (mandatory)

After each page or spread:

1. `inspect_document`: pages, margins, items (ids, bounds, fill), stories with **overset** flags, styles,
   swatches. `get_story {frame}` for text, lengths, overset position. Check bounds are inside margins,
   nothing sits off-page, no overset (red flag), styles applied (not `[No Paragraph Style]`).
2. **Look**: `render_page {page:N, scale:1.5, path:"/path/to/tmp/p.png"}` (0-based page index,
   printing items only, like Preview; scale = px per pt) and Read the PNG; for spreads render both
   pages. `export_png` writes a file. Judge hierarchy, alignment to the grid, rivers, widows,
   image crops, folio and running head, margins, contrast and legibility.
3. `preflight.run {minPpi:150}` (overset text, missing/low-res images, missing fonts, ...): zero errors
   before export.
4. Fix with commands (not by retyping), `edit.undo`, re-render. For text that does not fit: tighten copy,
   adjust tracking within +/-10, resize frames or add a page; never shrink body text below ~8.5 pt.
5. Before saving: parents applied to all pages, page count right, layer names, no empty frames or
   leftover placeholder text, document title set (`file.new {title}`).
6. **Cold read** (anything beyond a one-page edit, before section 7): a fresh subagent with a clean
   context, not a fork, gets only the rendered page PNGs, the brief with its format and constraints,
   and the tells above. It answers as a magazine art director who owes you nothing: which spreads look
   templated or AI-made, where the format or constraints vanished, what breaks hierarchy or
   legibility, worst first, one-line fix direction each, no praise. Fix the severe items; report any
   you reject and why. Inside a subagent, return the critique inputs (PNG paths, brief, tells) to the
   orchestrator, which starts the reviewer.

## 6. Save and export

- **Native**: `save_document {path:"/abs/name.designcraft"}` (a path without the extension gets it).
  Keep it as the master; descriptive names (`spring-issue-v2.designcraft`).
- **Print PDF**: `file.exportPdf {path, bleed:true, marks:true, standard:"x4"|"x1a"|"a2b"|"none",
  pages, tagged?, title, author}`; PDF/X-4 for modern RIPs, X-1a flattens to CMYK; check `warnings`;
  `designcraft-cli validate-pdf FILE.pdf` runs the built-in PDF/X-4 checks (including unembedded fonts).
  Screen PDF: omit bleed/marks, `tagged:true` for accessibility. Imposed booklet: `file.printBooklet`.
- Other: `file.exportIdml` (round trip with InDesign), `file.exportEpub`/`file.exportFixedEpub`,
  `file.exportHtml`, `file.exportPptx`, `file.exportText`, `export_png` (per page), `file.package
  {dir, idml:true, pdf:true}` (document + Links + fonts for a printer).
- Exports only after the user accepted (section 7), except the working PDF/PNG previews.
- Report absolute paths. Do not leave test documents or scratch files; never delete the user's files.

## 7. Show and approve (mandatory final phase)

Every task ends here, after the verify loop. The headless session has no window, so the user cannot see
the layout until it is saved and the real app is opened on it.

1. **Save** the `.designcraft` document into the project directory or the path the user named (under an
   allowed write root), with a descriptive name, never over their original files unless they said so.
   A preview PDF next to it is useful for sharing. Note the full absolute paths.
2. **Open DesignCraft on that file, detached** (`/usr/bin/designcraft`, `designcraft [FILES]...`):
   `setsid designcraft /abs/path/document.designcraft >/dev/null 2>&1 &`
   (native extension `.designcraft`, MIME `application/x-designcraft`; it also opens `.idml`, so
   `setsid xdg-open /abs/path/document.designcraft >/dev/null 2>&1 &` works too.) Always pass the file;
   never run the app with `--help` or without a file just to "test". If the user already has the app
   attached through a bridge, use that session. Do not leave extra instances you started running
   past the task if the user did not ask for the app.
3. **Stop and ask.** Give the full path and ask the user to accept the layout or describe changes. No final
   print export, packaging or handoff before explicit acceptance. Silence or a vague reaction is not acceptance.
4. **Loop on changes**: apply them, redo the verify loop for what changed, save again, tell the user to
   reload the file in the app (or reopen it), ask again.
5. **Inside a subagent** (cannot talk to the user): do steps 1 and 2, then return the file path(s), a short
   summary (trim size, pages, styles, fonts, preflight result) and state clearly **awaiting user approval**.
   The orchestrator asks the user and relays changes; export/handoff waits for acceptance.

## 8. Top gotchas (more: `references/gotchas.md`)

- When the MCP is registered with automation roots, file access is confined to them; anything else is rejected.
- Page-number marker is ``; `\u0018` renders as a box.
- Overset text is silent unless you read it: check `overset`/`preflight.run` every time.
- `render_page {page}` is 0-based; facing-pages spreads put the right page at x = page width.
- `file.place ... autoflow:true` needs a text frame on a document page (`frame` id), not a bare rect.
- Autoflowed frames fill the page margins: keep footers/folios outside the margin box or on parents with room.
- Item ids and story ids differ; copy the right one from the `frame.create` result.
- Do not run the `designcraft` binary with flags; use `designcraft-cli`.
