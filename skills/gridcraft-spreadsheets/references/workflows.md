# GridCraft recipes

All calls are MCP tools unless noted. Replace sheet names/ranges to fit.

## A. Monthly budget (inputs, calcs, summary, chart)
1. `new_workbook`; `execute_command sheet.rename {name:"Budget"}`.
2. `write_range A1`: header `["Category","Type","Jan","Feb",...,"Dec","Total","Share"]` and rows. Totals
   `=SUM(C2:N2)`, share `=O2/$O$20`. Income and expense groups separated by a subtotal row.
3. Summary block: `=SUMIFS(O2:O19,B2:B19,"Income")`, `=...,"Expense"`, net `=income-expense`, savings rate.
4. `create_table` for the transaction list if the user will keep appending; else plain range.
5. Format: header fill/bold, `numberFormat "#,##0.00"`, percent `0.0%`, negative net red via
   conditional format `{type:"cellIs", operator:"lessThan", value:"0", preset:"redText"}`.
6. Chart: `insert_chart {range:"A1:A13 + monthly totals", type:"column"}` (build a small helper range
   Month / Income / Expense first, then chart that range).
7. Freeze `view.freezePanes {cell:"C2"}`, widths, verify, show-and-approve.

## B. Sales report from raw rows
1. Data block (Date, Region, Product, Units, Price, Revenue=`=D2*E2`) in one `write_range`, then
   `create_table {range, name:"Sales"}`.
2. `insert.pivotTable {source:"Sales", rows:["Region"], columns:["Product"], values:[{field:"Revenue",
   func:"sum"}]}`; `insert.pivotChart {type:"column"}`; sort `pivot.sort`.
3. KPI cells on a Summary sheet: `=SUM(Sales[Revenue])`, `=AVERAGE(Sales[Revenue])`,
   `=XLOOKUP(MAX(...),...)` for top region.
4. Top-N: `filter {column:"F", top:{count:10}}`, or `=SORT(FILTER(...))`.

## C. Tracker with validation (tasks, status, due dates)
- Columns: ID, Task, Owner, Status (list validation `To do,Doing,Done`), Due (date validation), Done%.
- `data.validation` on Status/Due; conditional format overdue: `{type:"expression",
  formula:"=AND($E2<TODAY(),$D2<>\"Done\")", preset:"lightRedFillDarkRedText"}`;
  status colours via `containsText`.
- Summary: `=COUNTIFS(D:D,"Done")/COUNTA(D2:D500)`; table + slicer `insert.slicer {table, column:"Owner"}`.

## D. Import and clean external data
1. `open_workbook {path:"data.csv"}` (use `file.open {csvAsText:true}` to keep IDs/zip codes as text), or
   `data.getData {text|path}` into a table sheet.
2. Clean: `data.removeDuplicates`, `edit.replace`, `formulas.convertToNumber`, `data.textToColumns`,
   TRIM/PROPER helper columns then paste values (`edit.pasteSpecial {what:"values"}`).
3. Check: `formulas.errorChecking`, `edit.goToSpecial {kind:"blanks"}`.
4. Save as a new `.xlsx`; never overwrite the source file.

## E. What-if model
Assumption cells named (`defineName`), outputs by formula, `data.goalSeek {set:"B20", to:100000,
changing:"B3"}` or `data.scenarioAdd` for named cases and `data.scenarioSummary`, sensitivity grid with
`data.dataTable`.

## F. Edit an existing workbook
`open_workbook`, `inspect_workbook`, `read_range {formulas:true}` on the area, change minimally, keep
existing styles/tables/names, re-verify totals, save under a new name, show and approve.
