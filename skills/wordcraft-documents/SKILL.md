---
name: wordcraft-documents
description: "Create and edit Word-style documents in WordCraft (ArtCraft's word processor, driven through the `wordcraft` MCP server, tools mcp__wordcraft__*). Use whenever the user mentions WordCraft or the wordcraft MCP tools, or asks to write, draft, format or edit a letter, report, resume/CV, memo, contract, proposal, manual, essay or any other document in/with WordCraft (headings, styles, lists, tables, images, headers/footers, page numbers, table of contents, footnotes, comments, tracked changes, .docx/.pdf output). Covers the plan, build, render-and-verify, save/export and mandatory show-and-approve workflow. Not for cases where the user explicitly asked for another format or connector (Google Docs, Claude Docs, a plain .docx built with a library, PDF editing in PdfCraft, spreadsheets, slides)."
license: MIT
metadata:
  author: dnviti
  version: "1.0.0" # x-release-please-version
---

# WordCraft documents

WordCraft is an open-source Word clone (styles, lists, tables, sections, headers/footers, fields,
TOC, footnotes, comments, track changes, equations, shapes, charts). Its native format is `.docx`
(it also reads/writes .doc, .odt, .rtf, .md, .tex, .html, .txt and exports .pdf/.png). You drive it
through the `wordcraft` MCP server; this skill says what to build, in what order, and how to verify it.

## 0. Tools and ground rules

MCP tools (deferred: load schemas first with ToolSearch, e.g. `+wordcraft`, max_results 30):
`new_document`, `open_document`, `save_document`, `type_text`, `select_text`, `execute`, `batch`,
`list_commands`, `inspect_document`, `get_text`, `render_page`, `parity`, plus desktop-only
`screenshot`, `click`, `key`, `ui_inspect` (they need the app attached; the default MCP session is
headless and has no window).

- **Everything is a command** (`execute {command, params}`, or `batch {commands:[{command,params}], keepGoing?}`;
  batch stops at the first error). Command ids are dotted: `text.insert`, `para.style`,
  `format.bold`, `insert.table`... **`type_text` is an MCP tool, not a command id**: inside `batch`
  use `text.insert`.
- **Discover, do not guess.** `list_commands {query}` returns the full catalog (643 commands,
  ~160k chars unfiltered: always pass a narrow `query` such as `"table."`, `"para.spacing"`,
  `"insert.chart"`). Trust its param docs over memory.
- **The caret is the cursor of everything.** Commands act on the selection/caret. Positions are
  `{story:"body", path:[block, (row, cell, block)...], off: offset}`. Every command returns the new
  selection; use it to know where you are.
- Move the caret with `select_text {text, occurrence}` (select the n-th occurrence of a string) or
  `select.range {anchor, focus}` with explicit positions (e.g. `path:[4], off:0`), `select.all`,
  `select.paragraph`, `edit.goto`.
- `format.*` applies to the selection, or to what you type next if it is collapsed;
  `para.*` applies to the paragraph(s) of the selection.
- Colours are `"RRGGBB"` hex **without `#`**. Sizes/spacing are in points (1 in = 72 pt; Letter
  is 612x792, A4 595x842).
- Style names can be given by name or id (`"Heading 1"` or `"Heading1"`).
- Each `type_text` / command call is one undo step; `edit.undo` / `edit.redo` / `edit.undoTo {count}`.

## 1. Workflow

1. **Brief**: document kind, audience, language, length, tone, must-have content, branding, page
   size (Letter vs A4: A4 for most of the world, Letter for US/Canada; follow the document's
   language and region unless told otherwise), whether the result must also be `.docx`/`.pdf`. If the brief is thin, propose
   a concrete structure and proceed; ask only what blocks the work.
2. **Plan** (a few lines in chat): outline of headings, which styles/fonts/colours, page setup,
   special elements (table, TOC, header/footer, page numbers, images).
3. **Start**: `new_document {template}` with `blank|letter|resume|report|sample`, or
   `open_document {path}` for an existing file (then `inspect_document` first, and reuse its
   styles). Set page setup early: `layout.size {name:"A4"}`, `layout.margins {preset:"normal"}`.
4. **Define styles before content** (section 3), then **write content with styles**, not with
   manual formatting.
5. **Verify loop** (section 5) after each major block.
6. **Show and approve** (mandatory, always last; section 8).
7. Export/handoff (PDF, other formats) only after acceptance.

Scale to the request: a one-page letter does not need a TOC; a 20-page report does.

## 2. Writing content

Order of operations that works:

```
new_document {template:"blank"}
batch [
 {command:"para.style", params:{style:"Title"}},
 {command:"text.insert", params:{text:"Quarterly Report"}},
 {command:"text.newParagraph"},
 {command:"para.style", params:{style:"Heading 1"}},
 {command:"text.insert", params:{text:"Summary"}},
 {command:"text.newParagraph"},
 {command:"para.normal"},
 {command:"text.insert", params:{text:"Body text..."}},
 {command:"text.newParagraph"}, ...]
```

- A new paragraph inherits the previous style, so set the style (`para.style`, `para.normal`,
  `para.heading1`) right after each `text.newParagraph`. Built-in style ids: Normal, Title,
  Subtitle, Heading1..9, Quote, IntenseQuote, ListParagraph, Caption, NoSpacing, TOC1-9, Header,
  Footer, FootnoteText, Hyperlink, TableGrid and Grid/List/Plain table styles.
- `type_text {text, paragraphs:true}` splits `\n`-separated lines into real paragraphs in one undo
  step (otherwise `\n` is a line break inside one paragraph). Good for bulk prose; then restyle with
  `select_text` + `para.style`. No AutoCorrect/AutoFormat runs on it.
- Bold/italic runs: `select_text {text:"phrase"}` then `execute format.bold` (`format.italic`,
  `format.underline`, `format.color {color:"1F5C4A"}`, `format.highlight`, `format.size`, `format.font`).
  To format while typing: `format.bold`, `text.insert`, `format.bold` (toggle off).
- **Lists**: `para.bullets` / `para.numbering {kind:"numbered|lowerLetter|lowerRoman|..."}` on a
  paragraph; `para.listLevel {level}` or `para.demote`/`para.promote` for nesting;
  `para.restartNumbering`; custom/multilevel: `list.define`, `list.multilevelPreset
  {preset:"headings|article|outlineHeadings|chapter"}` (numbered headings).
- **Tables**: `insert.table {rows, cols, style:"Table Grid"}` leaves the caret in cell (0,0). Fill
  cells with `text.insert` and move with **`text.tab`** (a literal tab character typed with
  `type_text` stays in the same cell!). `table.style`, `table.look {headerRow, bandedRows, ...}`,
  `table.shading {color}` (affects the cell(s) at the caret/selection only: select
  the whole table first with `table.selectTable`), `table.borders`, `table.columnWidth {width}`,
  `table.autofit`, `table.cellAlign`, `table.repeatHeader`, `table.insertRowBelow`, `table.merge`.
  After a table, the next paragraph is the block after it: `select.range` to `{path:[n], off:0}`
  of that paragraph (read the index with `inspect_document`) to keep typing.
- **Images**: `insert.picture {path, width, alt}` (always give `alt`); `picture.size`,
  `picture.crop`, `picture.altText`, `picture.style`. Put the caret on its own paragraph first.
  No third-party logos or stock photos without the user's files.
- **Charts/shapes**: `insert.chart {type, data:{categories, series:[{name, values}]}, title,
  legend}`, `insert.shape`, `insert.smartArt`, `insert.equation {latex}`, `insert.textBox`.
- **Navigation aids**: `references.toc {levels, title}` (requires heading styles; update with
  `references.updateToc` after edits), `references.footnote {text}`, `references.caption {label,
  text}`, `insert.link {url, text}`, `insert.bookmark`, `insert.crossReference`,
  `references.citation`/`bibliography`.
- **Header/footer/page numbers**: `insert.pageNumber {position:"bottom", align:"center",
  format:"x of y"}`, `insert.header {text}`, `insert.footer {text}`, `layout.differentFirstPage`.
  After editing a header/footer call `insert.closeHeader` to return to the body.
- **Review features**: `review.trackChanges {value:true}` before editing someone else's text;
  `review.newComment {text}` on the selection; `review.acceptAll`/`rejectAll`; `review.wordCount`.
  `get_text` returns the body text with tracked deletions omitted.
- **Find/replace**: `edit.replaceAll {text, with, matchCase?}`; `edit.find`.

## 3. Layout and typography know-how

Set these once through styles (`styles.modify {style, chr:{font,size,color,bold}, para:{spaceBefore,
spaceAfter, lineSpacing, align}}`), so every paragraph stays consistent; use `design.themeFonts
{heading, body}` / `design.themeColors` for a whole-document look, `design.styleSet`,
`design.paragraphSpacing`.

- **Body**: 10.5-12 pt, line spacing 1.15-1.5 (`para.lineSpacing {value:1.25}`), 6-10 pt space
  after, left-aligned (justify only when asked and with hyphenation `layout.hyphenation`).
  Line length ~60-90 characters: with 11 pt text and 72 pt margins on Letter/A4 this is already right.
- **Headings**: a real scale (e.g. Title 28, H1 20, H2 16, H3 13) with more space before than
  after; colour from one accent; never fake a heading with bold Normal text (it kills the TOC and
  navigation). Keep with next (`para.keepNext`) on headings, `para.keepLines` on short blocks.
- **Fonts**: the default theme uses Aptos, which may be missing here and fall back silently; check
  `font.list {all:true}` and prefer an installed family chosen for the reader (e.g. a less default
  humanist sans or text serif the machine has, such as Source Sans 3 or Source Serif 4); Carlito and
  Liberation are metric fallbacks, not a choice. Use at most two families. `font.add {path}` loads a TTF/OTF.
- **Conventional, not anonymous**: keep the document kind's conventions, but never ship the template
  look by default (fallback body font, stock blue headings, a shaded box on every heading). Pick a
  heading/body pairing and one accent for this reader and subject, set them once with
  `design.themeFonts`/`design.themeColors`, and let spacing and hierarchy carry the character.
- **Page**: margins 54-72 pt (`layout.margins`), A4 or Letter (`layout.size`), orientation
  `layout.orientation`; columns `layout.columns {count}`; page breaks `text.pageBreak`; sections
  `layout.break {kind:"nextPage"}` for different orientation or numbering.
- **Letters**: sender block, date, recipient block, subject line, salutation, body, closing,
  signature; no heading styles; `para.spacing` to separate blocks; `NoSpacing` style for address blocks.
- **Reports**: cover (`insert.coverPage {title, subtitle, author}`), TOC, numbered headings,
  captions on figures/tables, footnotes, page numbers, header with the title.
- **Resumes**: `new_document {template:"resume"}` as a skeleton, restyle it; one page, restrained colour.
- **Tables**: header row shaded and bold, light borders, numbers right-aligned
  (`para.alignRight` in the cells), cell padding via the table style, repeat header row on long tables.
- **Accessibility/quality**: real heading structure, alt text on images and tables
  (`table.altText`), colour contrast >= 4.5:1, descriptive link text, `file.accessibility`
  and `review.issues` (spelling/grammar) before delivering.
- Copy is design: real specific content in the user's language, no lorem ipsum, consistent
  terminology and date/number formats.

## 4. Existing documents

`open_document {path}` (.docx .doc .odt .rtf .md .tex .html .txt .json; `password` if protected).
`inspect_document` for structure (blocks with styles, runs, lists, tables, sections, headers,
comments, pages), `get_text` for text. Edit in place with `select_text`/`edit.replaceAll` and
keep the existing styles; turn on `review.trackChanges` when the user wants to see the edits. Do not
overwrite the original: `save_document {path}` to a new name unless told otherwise.

## 5. Verify loop (mandatory)

After each major step:

1. `inspect_document`: check block order, `style` of each block (headings really are headings),
   table `cells` content, list structure, `pages` count, `sections[].props` (page size, margins,
   headers/footers). Look for empty paragraphs used as spacing, stray styles, text in the wrong
   cell.
2. `render_page {page, scale}` and **look at it** (scale 1 = 612x792 px; use 1.5-2 for detail):
   alignment, rhythm, clipped tables, orphan headings at page bottom, wrong fonts, contrast. Render
   every page of the final document (the `pages` count is in `inspect_document` and in the render result).
3. Fix with commands; `edit.undo` for a bad step.
4. Final: re-read `get_text` for typos and numbers, run `references.updateFields {all:true}` (page
   numbers, TOC, cross-references), then render every page again.

## 6. Save and export

- `save_document {path}`: format from the extension: `.docx` (native, default choice), `.pdf`,
  `.odt`, `.rtf`, `.html`, `.md`, `.tex`, `.txt`, `.png` (page image). Omit `path` to save in place
  (only if opened from a file). Also `file.saveAs`, `file.exportPdf {path}`, `file.exportPng {path,
  page, scale}`, `file.save {password}` for encryption.
- Save into the project directory or the path the user named, descriptive file name
  (`offer-letter.docx`). Report the full absolute path.
- Set `file.properties {title, author}` for deliverables.
- Save to a temp dir for experiments; never leave test files around.
- Do the PDF export only after the user accepted the document (or when they asked for the PDF
  together with the document: still show the .docx first).

## 7. Top gotchas

- `type_text` with `\t` does not move between table cells; use `text.tab`. `\n` is a soft line
  break unless `paragraphs:true`.
- In `batch`, ids are command ids (`text.insert`), not tool names (`type_text` fails with "unknown command").
- New paragraphs copy the previous paragraph's style (a heading continues as a heading): reset with
  `para.normal` / `para.style`.
- Bulleted/numbered state also carries to the next paragraph; turn it off with `para.bullets {off:true}`.
- `table.shading`, `table.cellAlign` etc. act on the selected cell(s): select the table/column first.
- `insert.table` leaves a trailing empty paragraph after the table; reuse it or delete it, do not
  stack empty paragraphs as spacing.
- Colours have no `#`. `format.color {color:"auto"}` resets.
- `list_commands` with no filter overflows the output; always filter.
- Header/footer editing moves the caret into that story: `insert.closeHeader` afterwards.
- The TOC and fields do not auto-update: `references.updateToc`, `references.updateFields`.
- Missing fonts fall back silently in the render: verify the rendered look, not only the font name.
- `save_document` with no path saves in place: only valid for documents opened from a file.
- Do not claim the document "looks right" without a `render_page` of every page.

## 8. Show and approve (mandatory final phase)

Every document ends here, after the verify loop. The headless `wordcraft` MCP session has no
window, so the user cannot see the document until you save it and open the real app on it.

1. **Save** the document as `.docx` with `save_document {path}` into the project directory (the
   current working directory) or the path the user named, with a descriptive name. Note the full
   absolute path.
2. **Open WordCraft on that file**, detached so it does not block:
   `setsid wordcraft /abs/path/document.docx >/dev/null 2>&1 &`
   (`wordcraft [--sample] [--control PORT] [FILE...]` is the desktop app, `/usr/bin/wordcraft`;
   `.docx` is its native format, also associated via `ai.storyteller.wordcraft.desktop`, so
   `setsid xdg-open /abs/path/document.docx >/dev/null 2>&1 &` works when WordCraft is the default
   handler.) If the app is already open and bridged on this document, do not launch a second copy.
   Do not use `--control` unless the user wants live agent control.
3. **Stop and ask.** Give the user the full file path and ask them to accept the document or
   describe the changes. Never continue on your own: no PDF/other-format export, no sending,
   no further handoff before explicit acceptance. Silence or a vague reaction is not acceptance.
4. **Loop on changes.** Apply the requested changes (reopen the file in the headless session if
   the user edited it in the app: `open_document {path}`, because their edits live in the file, not
   in your session), re-run the verify loop for what changed, `save_document` again, reopen/refresh
   WordCraft on the file, and ask again. Repeat until the user accepts. If the user saved changes
   in the app, load their version before editing so you do not overwrite it.
5. **Inside a subagent** (it cannot talk to the user): do steps 1 and 2, then return the file path
   and a short summary of the document to the orchestrator, stating clearly that **user approval is
   pending**. The orchestrator asks the user and relays changes back; export/handoff waits for
   the acceptance.
