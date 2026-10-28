# GridCraft command catalog (selected; verified against GridCraft 0.12.1, 353 commands)

Run via `execute_command {command, params}`. Find more with `list_commands {search:"x"}`. `range?`
omitted means the current selection. Colors `"#RRGGBB"`.

## File
- `file.new {sample?: budget|sales|grades}`; `file.open {path, password?, csvAsText?}`
- `file.save {path?}` / `file.saveAs {path}`: .xlsx (default), .csv, .tsv, .json, .html, .pdf (active sheet)
- `file.exportPdf {path?, sheets?: active|all, range?, fitToPage?}` -> {pages, bytes, path}
- `file.printPreview {page?, sheets?, range?, fitToPage?}` -> page list (paper, scale, ranges)
- `file.exportCsv {path, sheet?}`, `file.exportHtml {path}`, `file.properties {title, author, ...}`
- `file.close {force?}`; `document.inspect`

## Entering / reading
- `cell.set {cell, input, sheet?, array?}`; `cell.get {cell}`
- `range.setValues {range, values, parse?:bool}` (parse:false keeps strings verbatim)
- `sheet.read {range?, sheet?, formulas?, formatted?}`
- `edit.fillDown/Right/Up/Left`, `edit.fillSeries {range, direction, type: linear|growth|date|autofill, step, stop, dateUnit}`,
  `edit.autoFill {source, target, mode}`, `edit.flashFill`
- `edit.find {what, matchCase, wholeCell, lookIn, all, within}`, `edit.replace {what, with, all, within}`
- `edit.goToSpecial {kind: blanks|formulas|errors|constants|...}`
- `formulas.convertToNumber {range}`: text numbers -> numbers

## Format
`home.bold/italic/underline/strikethrough {range, on}`, `home.fontName {name}`, `home.fontSize {size}`,
`home.fontColor {color}`, `home.fillColor {color|"none"}`, `home.borders {preset: bottom|all|outside|
thickBottom|topBottom|...}`, `home.drawBorder {range, edge, style, color}`, `home.alignLeft/Center/Right`,
`home.alignTop/Middle/Bottom`, `home.wrapText`, `home.shrinkToFit`, `home.mergeCells/mergeCenter/mergeAcross`,
`home.orientation {angle}`, `home.numberFormat {format: name|code}`, `home.accounting {symbol}`,
`home.percent`, `home.comma`, `home.increaseDecimal`, `home.cellStyle {name: Title|Heading 1|Good|Bad|Total|Accent1..}`,
`home.formatCells {style:{font,fill,borders,align,numFmt,protection}}`, `home.newCellStyle {name, fromCell}`,
`home.columnWidth {cols:"B:D", width px | chars}`, `home.rowHeight {rows, height|points}`,
`home.autofitColumnWidth/RowHeight`, `home.hideRows/Columns/unhide*`,
`home.insertRows {rows:"3:5"}`, `home.insertColumns`, `home.deleteRows/Columns`, `home.insertCells/deleteCells {shift}`,
`pageLayout.theme {name: Craft|Slate|Meadow|Ember|Ocean|Orchid|Graphite, colors?, majorFont?, minorFont?}`.

`format_range` (MCP tool) does bold/italic/underline/fontName/fontSize/fontColor/fillColor/numberFormat/
horizontalAlign/wrapText/borders in one call; borders accept a preset or `{preset, style, color}`.

## Conditional formatting / validation
- `home.conditionalFormat {range, rule:{type: cellIs|expression|containsText|beginsWith|endsWith|blanks|
  noBlanks|errors|duplicate|unique|top10|aboveAverage|timePeriod|colorScale|dataBar|iconSet,
  operator?, value?, value2?, formula?, text?, rank?, colors?, set?, style?:{font,fill,borders,num_fmt},
  preset?: lightRedFill|redText|yellowFill|greenFill|redBorder|lightRedFillDarkRedText}}`
- `home.clearRules {range|sheet:true}`, `home.manageRules {delete|moveUp|moveDown}`
- `data.validation {range, type: any|whole|decimal|list|date|time|textLength|custom, operator, formula1,
  formula2, ignoreBlank, dropdown, inputTitle, inputMessage, errorStyle: stop|warning|information,
  errorTitle, errorMessage, clear}`; `data.validate {cell, input}`, `data.circleInvalid`
- `insert.checkbox {range}`, `insert.sparkline {range, location, type: line|column|winLoss}`

## Tables / sort / filter
- `insert.table {range, header, style:"TableStyleMedium2", name}` (or tool `create_table`)
- `table.rename/style/totalRow/totalFunction {column, function}/bandedRows/resize/convertToRange/removeDuplicates`
- `data.sort {range, header, keys:[{column,order,by?}]}` (tool `sort_range`)
- `data.filterBy {column, values|custom|top|blanks}` (tool `filter`), `data.clearFilter`, `data.reapply`
- `data.removeDuplicates {range, columns, header}`, `data.textToColumns {delimiters, destination}`
- `data.subtotal {groupBy, function, columns}`, `data.group/ungroup/showLevels`, `data.advancedFilter`,
  `data.consolidate {sources, function}`, `insert.slicer {table, column}`

## Names / formulas
`formulas.defineName {name, refersTo:"=Sheet1!$A$1:$A$10", scope?}`, `formulas.deleteName`, `formulas.nameManager`,
`formulas.createFromSelection`, `formulas.tracePrecedents/Dependents`, `formulas.errorChecking` (lists error
cells), `formulas.evaluate {formula, cell}`, `formulas.calculateNow`, `formulas.calculationOptions {mode:
automatic|manual, iterative}`, `formulas.autoSum {function, range}`, `formulas.functions {search, category}`.

## Charts
`insert.chart {range, type: column|bar|line|pie|doughnut|area|scatter|bubble|radar|combo|histogram|waterfall|
funnel|treemap|sunburst|boxWhisker|stock, subtype: clustered|stacked|stacked100|markers, title, at, width, height}`
-> chart id. `chart.set {chart, type, subtype, title, legend: none|bottom|top|left|right, dataLabels, gridlines,
xTitle, yTitle, at, width, height}`, `chart.changeType`, `chart.changeColors {palette|colors}`,
`chart.addElement {element: title|legend|dataLabels|gridlines|axisTitles|smooth|trendline}`,
`chart.selectData {range, byRows, categories}`, `chart.switchRowColumn`, `chart.move {sheet, at}`,
`chart.formatSelection {series, color}`, `chart.delete`, `insert.chartRecommendations {range}`.
`insert.picture {path, at, width, height, alt}`, `insert.shape`, `insert.textBox`, `insert.link`.

## Pivots
`insert.pivotTable {source, destination:"new"|"Sheet1!H3", name, rows, columns, values:[{field,func,name}],
filters, replace}`, `insert.recommendedPivotTables {apply}`, `pivot.list`, `pivot.fields`, `pivot.addField {field,
area, func}`, `pivot.removeField`, `pivot.moveField`, `pivot.valueSettings {field, func, showAs}`, `pivot.filter`,
`pivot.sort`, `pivot.group {field, by: years|quarters|months|days}`, `pivot.layout`, `pivot.style`, `pivot.refresh`,
`data.refreshAll`, `pivot.calculatedField`, `insert.pivotChart`, `pivot.delete`.

## What-if / analysis
`data.goalSeek {set, to, changing}`, `data.solver {objective, goal, variables, constraints...}`,
`data.scenarioAdd/Show/Summary`, `data.dataTable {range, rowInput, columnInput}`, `data.forecastSheet`,
`data.analysisToolPak {tool: regression|correlation|descriptive|...}`.

## Review / protection / print
`review.newComment/newNote/replyComment/resolveComment`, `review.protectSheet {password, ...}`,
`review.unprotectSheet`, `review.protectWorkbook`, `home.lockCell {range,on}`, `review.checkAccessibility`,
`review.spelling`, `pageLayout.orientation/size/margins/printArea/printTitles/scaleToFit/headerFooter/pageSetup/breaks`,
`view.freezeTopRow`, `view.freezeFirstColumn`, `view.freezePanes {cell}`, `view.gridlines {on}`, `view.zoom`.

## Scripts
`automate.newScript {name, commands:[{command, params}]}`, `automate.runScript {name}`. Scripts inside a file
opened from disk are blocked until trusted.
