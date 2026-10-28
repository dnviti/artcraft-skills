---
name: gridcraft-spreadsheets
description: "Build and edit spreadsheets in GridCraft (ArtCraft's Excel-class spreadsheet app, driven through the `gridcraft` MCP server, tools mcp__gridcraft__*). Use whenever the user mentions GridCraft or the gridcraft MCP tools, or asks to create, fill, format, analyse or fix a workbook/spreadsheet/budget/tracker/invoice/dashboard/financial model/data sheet with formulas, tables, pivot tables, charts, conditional formatting, data validation, filters or sorting in/with GridCraft (.xlsx, .xlsm, .xls, .xlsb, .ods, .csv, .tsv, .json). Covers plan, build, formula check, render-and-verify, save/export and the mandatory show-and-approve workflow. Not for cases where the user explicitly asked for another tool, format or connector (Google Sheets, a plain .xlsx built with openpyxl/a library, Claude Docs, Word, PDF editing, slides)."
license: MIT
metadata:
  author: dnviti
  version: "1.0.0" # x-release-please-version
---

# GridCraft spreadsheets

GridCraft is an Excel-class spreadsheet app (cells, formulas, tables, pivots, charts, conditional
formats, validation, scenarios, solver, PDF export). You drive it through the `gridcraft` MCP
server. This skill says **what to build, in what order, how to verify it, and how to hand it to
the user**.

- Command ids by area and the tricky params: `references/command-catalog.md`
- Recipes (budget, sales report, tracker, pivot dashboard, import/clean data): `references/workflows.md`
- Traps and fixes: `references/gotchas.md`

## 0. Ground rules for the tools

MCP tools (deferred, load with ToolSearch `select:mcp__gridcraft__write_range,...` first):
`new_workbook`, `open_workbook`, `write_range`, `set_cell`, `read_range`, `get_cell`,
`format_range`, `create_table`, `insert_chart`, `sort_range`, `filter`, `evaluate_formula`,
`list_functions`, `inspect_workbook`, `select`, `undo`, `redo`, `save_workbook`, `screenshot`,
`list_commands`, `execute_command`.

- **Everything is a command.** The convenience tools cover the common flow; anything else is
  `execute_command {command, params}`. Discover with `list_commands {search:"pivot"}` (the full
  list is ~350 commands and too large to dump; always pass `search`) and trust its `params`
  doc over memory.
- **Addresses** are A1 style: `"B2"`, `"A1:D10"`, `"Sheet2!A1:C3"`, whole columns `"B:B"`.
  Commands without `range` act on the **current selection**: pass `range` explicitly or
  `select` first, never rely on the selection by accident.
- **Strings starting with `=` are formulas**; other strings are parsed like typed input
  (`"12%"` becomes 0.12, `"1/2/2024"` an en-US date). To store text verbatim (IDs with leading
  zeros, dd.mm.yyyy dates) use `execute_command range.setValues {range, values, parse:false}` or
  set the cell format to Text first.
- **Formulas use English function names and `,` separators** regardless of the user's locale.
  `list_functions {search|category}` shows what exists (XLOOKUP, LET, FILTER, SORT, UNIQUE,
  SUMIFS, ... check before assuming).
- Programmatic calls never open dialogs; missing required params are an error. Each convenience
  call is one undo step; `undo {steps}` rolls back.
- **Headless vs desktop**: the MCP server is normally headless (no window). `screenshot` only works
  against a connected desktop app (`gridcraft --control 7979` + `gridcraft-cli mcp --connect 7979`).
  In headless mode verify visually through PDF export (section 6).
- File reads/writes may be confined to allowed roots; a refused path gives a readable error.
  Pick the project dir or a temp dir.

## 1. Workflow

Scale the work to the request (a 10-row list is not a financial model).

1. **Plan** (in chat, a few lines): purpose and reader, sheets, the input/calc/output split, key
   formulas, formats, charts, acceptance checklist. Ask only what blocks the work.
2. **Start**: `new_workbook` (blank, or sample `budget|sales|grades` as a skeleton to restyle) or
   `open_workbook {path}` for an existing file; then `inspect_workbook` to learn sheets, tables,
   names, charts before touching anything. Check the open warnings (xls/xlsb/ods import is
   partial: values and cached results only).
3. **Data in**: `write_range` the whole block in one call (headers + rows), not cell by cell.
   Imports: `execute_command data.fromTextCsv {path|text, delimiter}` / `data.getData {path|text}`
   (CSV/TSV/JSON array of objects) land in a new sheet as a table.
4. **Logic**: formulas next, with absolute refs where needed, named ranges for assumptions.
5. **Structure**: `create_table` for lists, freeze headers, widths, number formats.
6. **Presentation**: formats, conditional formats, validation, charts.
7. **Verify loop** (section 6): read back values, scan for errors, render, fix, repeat.
8. **Show and approve** (mandatory, always last): section 8.

State the acceptance checklist before mutating; report at phase boundaries, not per call.

## 2. Building well (domain know-how)

**Layout conventions**
- One header row, one record per row, one fact per column, no blank rows/columns inside data, no
  merged cells inside data (merge only title banners). Titles above data leave row 1 free only
  when the sheet is a report, not a data table.
- Separate **Inputs / Assumptions** (own sheet or clearly shaded block), **Calculations**,
  **Outputs/Summary**. Inputs get a consistent fill (e.g. light yellow) and are the only
  hard-coded numbers; every other number is a formula.
- Name assumptions: `formulas.defineName {name:"TaxRate", refersTo:"=Assumptions!$B$2"}` then
  `=B5*TaxRate`. Names make formulas readable and survive row inserts.
- Freeze headers (`view.freezeTopRow` or `view.freezePanes {cell:"B2"}`), size columns
  (`home.columnWidth {cols:"A:A", width:...}` in pixels or `chars`, or `home.autofitColumnWidth`).

**Formulas**
- Totals: `=SUM(B2:B20)` (or table structured refs, or `formulas.autoSum`); conditional:
  `SUMIFS/COUNTIFS/AVERAGEIFS`; lookups: `XLOOKUP` (exact by default) over VLOOKUP; guard
  divisions: `=IFERROR(B2/C2,0)` only where a zero/blank is a legitimate outcome, don't blanket
  hide errors.
- Percent and ratios stay numbers (0.125 formatted `0.0%`), never text. Dates stay real dates
  (format `yyyy-mm-dd`), never strings.
- Relative vs absolute: lock the anchor (`$B$1`) when copying; fill with `edit.fillDown`
  / `range.fill {range,input}` (relative refs adjust) rather than writing 500 formulas by hand.
- Dynamic arrays (`FILTER`, `SORT`, `UNIQUE`, `SEQUENCE`) spill; check `get_cell` for the spill
  range and leave room below/right. Use `cell.set {array:true}` for legacy CSE arrays.
- Tables give structured refs: `create_table {range, name:"Sales"}` then `=SUM(Sales[Amount])`;
  `table.totalRow` / `table.totalFunction` for the total line.
- Financial models: monthly columns, one formula per row copied across (consistent), checks row
  (assets = liabilities + equity, sums match). Goal seek `data.goalSeek {set,to,changing}`,
  `data.solver`, `data.scenarioAdd/Show/Summary`, `data.dataTable` for what-ifs.

**Number formats** (`format_range numberFormat` accepts a name or code): currency
`"#,##0.00 \"EUR\""` or `Currency`; thousands `"#,##0"`; percent `"0.0%"`; date `"yyyy-mm-dd"`;
negative red `"#,##0;[Red]-#,##0"`. Align numbers right, headers matching their column.

**Presentation quality**
- Quiet, consistent styling: one header style (bold, tinted fill, white or dark text with enough
  contrast), light borders only where they help, banded rows via table style, one accent colour.
  No rainbow fills; colour encodes meaning (input / warning / good).
- Conditional formats for status and outliers: `home.conditionalFormat {range, rule:{type:
  "cellIs", operator, value, preset:"lightRedFillDarkRedText"}}`, colour scales, data bars, icon
  sets, `expression` rules (`formula:"=$D2<TODAY()"`).
- Data validation for inputs: `data.validation {range, type:"list", formula1:"North,South,East"}`
  (or a range ref), `whole/decimal/date` with `operator` + `formula1/2`, error messages.
- Print: `pageLayout.pageSetup` / `orientation`, `printArea`, `printTitles {rows:"1:1"}`,
  `scaleToFit {width:1,height:0}`; check with `file.printPreview`.

**Charts**: pick the type from the question: comparison `column/bar`, trend `line/area`, share
`pie/doughnut` (<=5 slices), relation `scatter`, distribution `histogram`, bridge `waterfall`.
`insert_chart {range (headers included), type, subtype, title, at:"H2"}`; refine with
`chart.set {chart, title, legend, dataLabels, xTitle, yTitle, width, height}`,
`chart.changeColors`, `chart.addElement {element:"trendline"}`. Source range = header row +
category column + series columns only (no totals row). Always title the chart and label axes.
`insert.chartRecommendations {range}` suggests suitable types.

**Pivots**: `insert.pivotTable {source:"Sales" | "Sheet1!$A$1:$E$200", rows:[...], columns:[...],
values:[{field,func}], filters:[...], destination}`; adjust with `pivot.addField/valueSettings/
sort/filter/group/layout`; `pivot.refresh` after source edits; `insert.pivotChart`. A pivot
creates (and activates) a new sheet before the current one.

## 3. Key commands (execute_command ids)

| Area | Ids |
|---|---|
| File | `file.new {sample}`, `file.open {path,password?,csvAsText?}`, `file.save/saveAs {path}`, `file.exportPdf {path,sheets,range,fitToPage}`, `file.exportCsv`, `file.printPreview`, `file.close {force}`, `file.properties` |
| Cells | `cell.set`, `range.setValues {range,values,parse}`, `range.fill`, `edit.fillDown/Right`, `edit.fillSeries`, `edit.autoFill`, `edit.find/replace`, `edit.clearContents/Formats/All` |
| Format | `home.bold/italic/fontName/fontSize/fontColor/fillColor/borders/alignX/wrapText/mergeCells/numberFormat/cellStyle/formatCells {style}`, `home.columnWidth/rowHeight/autofit*`, `home.hide*`, `home.insertRows/Columns/deleteRows` |
| Sheets | `home.insertSheet {name}`, `sheet.rename/move/tabColor/hide/activate`, `home.deleteSheet` |
| Tables | `insert.table`, `table.rename/style/totalRow/totalFunction/resize`, `insert.slicer` |
| Data | `data.sort`, `data.filterBy {column,values|custom|top}`, `data.removeDuplicates`, `data.textToColumns`, `data.validation`, `data.subtotal`, `data.group`, `data.consolidate`, `data.forecastSheet`, `data.analysisToolPak` |
| Formulas | `formulas.defineName`, `formulas.nameManager`, `formulas.errorChecking`, `formulas.tracePrecedents/Dependents`, `formulas.evaluate {formula}`, `formulas.calculateNow`, `formulas.convertToNumber` |
| Review | `review.newComment/newNote`, `review.protectSheet {password,...}`, `home.lockCell`, `review.protectWorkbook` |
| Read | `document.inspect`, `sheet.read {range,sheet,formulas,formatted}`, `cell.get` |
| Automation | `automate.newScript {name,commands}`, `automate.runScript` |

`gridcraft-cli` (shell) can also `info`, `cat`, `convert in out`, `eval`, `run --script`, and
`check <file>` (recalculation oracle + xlsx round-trip fidelity) on a saved file.

## 4. Safety and data care

- **Never overwrite the user's file** unless asked: for an existing workbook, edit in memory and
  `save_workbook {path:<new name>}` (e.g. `budget-v2.xlsx`) or confirm before saving in place.
  Mention the destructive operations you performed (removeDuplicates, sort, delete rows/cols).
- Sort/filter ranges: pass the full table range with `header:true`, never a single column of a
  multi-column block (rows must stay together).
- Protect formulas only on request; `review.protectSheet` passwords are the user's to choose and
  must be told to them.
- Don't invent data silently: sample/placeholder values are labelled as such.
- A workbook opened from a file has `trust:"fromFile"`: its macros/scripts do not run unless the
  user trusts them (`automate.trustScripts`); do not trust unasked.

## 5. Quality bar (acceptance checklist)

- No error cells (`#REF!`, `#NAME?`, `#DIV/0!`, `#VALUE!`, `#N/A` unless intentional and explained).
- Totals reconcile with an independent calc (`evaluate_formula`).
- Inputs separated and labelled; no magic numbers inside formulas.
- Headers frozen, columns readable (no `####`, no truncated text), numbers right-aligned and
  formatted, dates real dates.
- Charts titled, axes labelled, legend only when >1 series, no overlap with data.
- Print/PDF looks sane when the sheet is meant to be printed.

## 6. Verify loop (mandatory)

After each phase:

1. `read_range {range, formulas:true}` to check formulas, `read_range {range}` for computed values.
   Errors come back as `{"error":"#DIV/0!"}`. `execute_command formulas.errorChecking` lists all error
   cells. `read_range {formatted:true}` returns display text.
2. `inspect_workbook`: sheets, used ranges, tables, charts, merges, validations, conditional-format
   counts, freeze panes, dirty flag, undo history.
3. Independent check of key totals with `evaluate_formula {formula:"=SUM(Sheet1!B2:B20)"}` (it
   acts on the **active** sheet; prefix other sheets).
4. **Look at it**: in headless mode export the active sheet and render the PDF:
   `execute_command file.exportPdf {path:"<scratch>/check.pdf", fitToPage:true}` then
   `pdftoppm -png -r 80 -f 1 -l 1 check.pdf <scratch>/check` and Read the PNG (or open the PDF
   in pdfcraft `page_render`). Look for `####`, clipped text, chart overlaps, colours, alignment.
   With a desktop-connected server use `screenshot {path}` instead. Delete the scratch files.
5. Fix with commands; `undo` for a bad step; re-check what changed.

## 7. Save / export

- `save_workbook {path}`: format by extension: `.xlsx` (default, native), `.csv`/`.tsv` (active
  sheet only), `.json`, `.html`; `file.saveAs` also writes `.pdf` of the active sheet and
  `file.exportPdf {sheets:"all"}` all sheets. `.xlsm/.xlsb/.ods/.xls` are open-only formats.
- No extension in the path may default to xlsx; always give one.
- The headless session keeps workbooks in memory: close what you opened (`file.close
  {force:true}`) when done and remove scratch files.

## 8. Show and approve (mandatory final phase)

Every spreadsheet ends here, after the verify loop. The headless MCP session has no window, so
the user cannot see the workbook until you save it and open the real app on it.

1. **Save** with `save_workbook {path}` into the project directory, or the path the user named
   (descriptive name, `.xlsx`, allowed write root; a new name if a file with that name already
   exists unless the user said to overwrite). Note the full absolute path.
2. **Open GridCraft on that file**, detached so it doesn't block:
   `setsid gridcraft /abs/path/book.xlsx >/dev/null 2>&1 &`
   (`gridcraft [FILE...]` is the desktop app, `/usr/bin/gridcraft`; it registers for xlsx, xlsm,
   xlsb, ods, csv, tsv, so `setsid xdg-open /abs/path/book.xlsx` may open another default app:
   prefer the explicit command.) If the user is already attached to this workbook
   (`--control` session), don't launch another copy.
3. **Stop and ask.** Give the full path and ask the user to accept the workbook or describe
   changes. Never continue on your own: nothing is exported (CSV/PDF), emailed, uploaded or
   handed to another tool or format before explicit acceptance. Silence or a vague reaction is not
   acceptance.
4. **Loop on changes**: apply them, re-run the verify loop, save again (same new file), reopen
   and ask again, until the user accepts.
5. **Inside a subagent** (cannot talk to the user): do steps 1 and 2, then return the file path,
   a short summary (sheets, key formulas, charts, assumptions) and state clearly that **user
   approval is pending**. The orchestrator asks the user and relays changes back.

## 9. Top gotchas (more in `references/gotchas.md`)

- Always `search` in `list_commands`; the unfiltered list is huge.
- Commands without `range` hit the selection; `insert.pivotTable` and imports switch the active
  sheet, so later `write_range`/`evaluate_formula` without a sheet prefix hit the wrong sheet.
- `write_range` parses strings like typed input (en-US): dates/decimals from other locales need
  `parse:false`.
- Number-looking text is text: fix with `formulas.convertToNumber`.
- `read_range {formatted:true}` returns strings; plain read returns numbers.
- `screenshot` fails when headless: use PDF export + render.
- `data.validation` returns `null` on success; check with `inspect_workbook` (validations count).
- Sorting a partial range scrambles rows; sort the whole block with `header:true`.
- Save in `.xlsx`; csv/tsv keep only the active sheet and drop formulas' formatting and charts.
