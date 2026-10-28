# CadCraft gotchas (observed on the installed 0.14.0 build)

- `new_drawing` without `{metric:true}` makes an imperial drawing (inches). `open` of a DXF/DWG
  keeps the file's units.
- `dimlinear` etc. on a 6000-unit drawing with the stock `Standard` style produce text/arrows
  0.18 units tall: not visible. Define a scaled dimstyle (`dimstyle {name, scale, textHeight,
  arrowSize, extOffset, extExtend, textGap, decimals, current:true}`) before dimensioning, or
  restyle later with `dimstyle.update {handles}` / `dimstyle.override`.
- A `dimstyle` result lists style names only; read all fields with `dimstyle.list {name}`.
- `execute offset {handle, distance, side:[x,y]}`: handle must be a hex string. The `{last}`
  placeholder is a CLI-only feature (`cadcraft-cli run --cmd`). Through MCP take `handle` from the previous result.
- `layer.new`, `layer.current`, `zoom`, `units` return `null` on success; that is not an error.
- `command_line` returns the prompt state, not the created handle. Use `execute` when you need the handle.
- `layout.new {name}` returns `{name, viewport}`: that viewport handle is the one for `viewport.set
  {handle, scale:"1:50", center:[x,y]}`. `viewport.set` without a handle or a selected viewport is
  an error. Switch with `layout.set {name:"A3"}` / `{name:"Model"}`; the model view for `render` is
  model space.
- `pagesetup {layout, paper:"A3", landscape:true}`: papers are `"A4"|"A3"|"Letter"|"ANSI B"|...` or the
  device's names; sizes in mm; default margins 6.35 mm.
- `plot`/`exportpdf` return `{bytes, pages, path}`; without `path` they return base64 `data`.
- `block {name, base, handles}` needs real handles (or a selection): `no objects selected` otherwise.
- `hatch` uses internal points: the region must be closed (small gaps up to HPGAPTOL close), the
  hatch lands on the current layer and takes its colour.
- `open` on a non-DXF text file fails with `bad group code`; DWG is read natively. `warnings` in the
  open result lists what could not be read.
- `render` returns an image (and saves it when `path` is given); background is dark, ByLayer colour
  "white" shows white. A plot to PDF is black on white.
- `save {path:x.dwg}` writes DWG 2018 by default; use `saveas {path, version}` for older.
- Undo history: `undo {count:n}`; `u` is one step.
- Do not run `cadcraft-cli perf` (synthetic benchmark, heavy) or start the GUI app unless approving.
