# DesignCraft gotchas (observed on the installed 0.14.0 build)

- **Roots**: MCP launched with roots confines open/save/place/export; a path outside returns
  `automation path rejected: outside the write roots ...`. Without roots (stock `designcraft-cli mcp`)
  access is unconfined (tested). The CLI `run`/`script` routes are never confined.
- **`designcraft --help`** on the GUI binary is treated as a file name, starts the app and writes a log
  under `~/.config/designcraft/`. Use `designcraft-cli`.
- `frame.create {content:"text", text}` returns `{id, story}`; `frame.create {content:"graphic"}` returns `{id}`;
  `shape:"rectangle"` with `content:"graphic"` gives a colour box once `object.fill {swatch}` runs.
- Text frames made with `frame.create` have one column and no inset unless `object.textFrameOptions` says
  otherwise; the document's `columns` applies to the grid/guides and to autoflowed frames.
- A headline in a box that is too small returns `overset` (preflight: "Overset text: N characters").
  Enlarge the frame or reduce size, the text is never lost.
- `file.place {path, frame, autoflow:true}` -> `{overset, pagesAdded, story}`; `page` + `rect` (no frame) with
  `autoflow:true` is refused (`autoflow works only from a frame on a document page`). Plain `file.place`
  of a .txt with `rect` and `page` makes a frame.
- Imported text keeps the document's default paragraph style unless you `style.paragraph.apply` after
  (select the story first with `selection.set` on the frame) or pass `styleMap`.
- Parent items: create with `spread:{kind:"parent", index:0}`; they only show on pages after
  `layout.pages.applyParent`. In facing spreads the left parent page is x 0..W, the right W..2W; an item at x=36 shows on left pages only.
- Page-number marker in text is U+E000. Footers should sit inside the bottom margin region of the page
  that is not covered by autoflowed frames (autoflow frames span the whole margin box).
- `render_page` renders printing items only (no guides, no non-printing layers); bleed is excluded unless
  `bleed:true`. Scale is pixels per point (default 1 = 72 ppi); use 1.5-2 for reading small text.
- `inspect_document` can be long: it lists every item; use `get_story` for text and keep the doc small when testing.
- `edit.undo` after a failed `batch` to revert applied steps; `batch` is not atomic.
- Saving: `save_document` without `path` writes back to the document's own file; for a new document a path is required.
- Export PDF: images are included at their placed resolution; `flatten` controls transparency rasterisation;
  `standard:"x1a"` converts everything to CMYK/spot (no RGB, no transparency).
- Fonts: Liberation Serif/Sans/Mono are available; the default text face is a serif. Check `font.list` for others.
- Desktop-only tools (`screenshot`, `click`, `ui_*`) fail on the headless MCP; use `render_page`.
