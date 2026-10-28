# GridCraft gotchas (observed in 0.12.1)

- `list_commands` without `search` returns ~92 KB: always filter.
- `screenshot` errors in headless mode ("no UI in headless mode"). Verify via
  `file.exportPdf {path, fitToPage:true}` + `pdftoppm -png -r 80 -f 1 -l 1 x.pdf out` + Read the PNG.
  Charts, conditional formats, fills and column widths all render in that PDF.
  `file.printPreview` shows how many pages/scale the print would take (a wide sheet = several pages).
- `insert.pivotTable` creates a new sheet BEFORE the current one and activates it. After it, calls
  without sheet prefix target the pivot sheet (e.g. `evaluate_formula` returned null for Sheet1 refs).
  Use `Sheet1!A2:A4` prefixes or `sheet.activate {sheet:"Sheet1"}`.
- `read_range {formatted:true}` returns every value as a display string ("120"), even numbers; do
  numeric checks on the unformatted read.
- `data.validation`, `view.*` and a few commands return `null`/small objects on success: verify with
  `inspect_workbook` (validations, conditionalFormats, freeze counts per sheet).
- Strings in `write_range` parse like typed input by en-US rules (`"05.04.2026"` -> a date, `"2.500"` ->
  2.5). For other locales or text IDs: `range.setValues {parse:false}` or format the column Text first.
- Formulas: English names, comma separators. Cross-sheet refs `Sheet2!B3`; quote names with spaces
  `'My Sheet'!B3`.
- `sort_range` without `range` sorts the current region around the selection; header detection is
  automatic unless `header` is given. Always pass the whole block and `header:true`.
- `data.removeDuplicates`, `home.deleteRows/Columns`, `edit.clearAll` are destructive: undo exists but
  the user's file must not be the one being modified in place.
- csv/tsv saves only the active sheet; formulas are saved as values; charts and formats are lost.
- The headless session is shared: close your workbook (`file.close {force:true}`) at the end so the next
  task starts clean; `new_workbook` makes it the active one.
- Imports of .xls/.xlsb/.ods are partial (values and cached results); check the warnings and save as xlsx.
- Workbook scripts from a file are not trusted until `automate.trustScripts`; don't do it unasked.
- `gridcraft --help` starts the app machinery (logs a line, then exits); prefer `gridcraft-cli --help` for CLI usage.
