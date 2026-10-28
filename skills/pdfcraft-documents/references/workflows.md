# PdfCraft recipes

Paths below are examples. `<orig>` is never modified.

## A. Redact sensitive content (apply + verify)
1. `doc_open {path:<orig>}` -> doc; `doc_info`; `render_preview` pages. Text empty? OCR first (recipe E).
2. Marks (any mix): `redact_mark {doc, words:["Mario Rossi","4711"], overlay:"REDACTED"}`,
   `{pattern:"email"}`, `{pattern:"phone"}`, `{rect:[x0,y0,x1,y1], page}` for images/scans,
   `{whole_pages:true, pages:[3]}`. Use `find`/`words` for every spelling variant (names, initials, IDs,
   case). Marks show up in `doc_audit_redactions` as `unapplied-mark` until applied.
3. Review: `render_preview` (marks visible) and confirm each mark with the user if scope is unclear.
4. `redact_apply {doc}` (fails if anything readable remains).
5. Metadata/hidden: `doc_hidden_info`; `doc_remove_hidden {categories:[metadata, comments, attachments, hidden-text,
   private-data]}` when the user wants a clean file; check Title/Author for the redacted names (`doc_set_info`).
6. `doc_save {doc, path:"<dir>/<name>-redacted.pdf"}` (new file).
7. **Verify the saved file**: `doc_open` it as a new doc, then `text_find` for each sensitive string (count 0),
   `text_extract` skim, `doc_audit_redactions` (count 0), `render_preview` look at the boxes, optionally shell
   `pdftotext <file> - | grep -i <string>` and `pdfcraft-cli audit <file>`.
8. Show and approve (SKILL section 7). Tell the user the original is untouched and must not be shared.

## B. Fill a form
`doc_open` -> `form_fields` -> `form_fill {values:{"Name":"...","Agree":true,"Country":"IT"}}` -> check `warnings`
(unsupported glyphs) -> `render_preview` -> `doc_save` new file. No fields? `form_detect_fields {add:true}` then fill,
or `fill_sign_add {type:"text", at:[x,y], text}`. To publish a read-only copy: `doc_flatten`.
Build a form: `form_add_field {type, page, rect, name, options}` per field (`form_add_field_table` for grids),
`form_tab_order`, then `form_fields` to verify; `doc_create {from:"blank"}` + `page_add_text` for labels.

## C. Merge, split, reorder
- Merge: `doc_combine {paths:[a,b,c], pages:[null,"1-2",null], out:"<dir>/merged.pdf"}`; then `doc_open` it,
  `bookmark_list`, `doc_info`, render a few pages; optional `doc_header_footer {footer_center:"<<Page 1 of n>>"}`.
- Split: `doc_split {doc, every:10, out_dir}` or `{before:[5,9]}` or `{bookmarks:true}`; extract: `page_extract {pages, out}`.
- Reorder/delete/rotate in memory (`page_move`, `page_delete`, `page_rotate`), check by rendering thumbnails, save as new file.

## D. Sign
1. Finish all edits first; save the unsigned file.
2. Digital ID: use the one the user gives (.p12 + password). For a test/self-signed one:
   `sign_id_create {name, password, path}` (tell the user it will show "unknown" until trusted).
3. `sign_document {doc, id, password, page, rect:[72,700,300,760], reason, location, out:"<dir>/x-signed.pdf"}`;
   `certify:"no_changes"` for a certification signature.
4. Verify: `doc_open` the signed file, `sign_list` (status, `modification:"none"`), render the appearance.
5. Visual signature (no crypto): `fill_sign_add {type:"signature", text:"Name", path?:"sig.png", at}` then
   `doc_save {flatten_fill_sign:true}` if it must be baked in.
Only sign when the user asked and supplied/approved the identity.

## E. OCR a scan
`ocr_status` -> `ocr_recognize {doc, pages?, dpi:300}` -> `text_find` known words, `text_extract` sample pages, compare
numbers against the image (`render_preview`) -> `doc_save` new file. For phone photos: `page_enhance_camera` first.
Folders: `ocr_recognize_files` or `doc_batch {steps:["ocr","optimize"], out_dir}`.

## F. Compare two versions
`doc_open` old (id A) and new (id B) -> `doc_compare {doc:B, other:A, visual:true}` -> summarise replaced/inserted/deleted per
page -> `doc_compare_report {doc:B, other:A, path:"<dir>/changes.pdf"}` if a deliverable is wanted. Compare rects use
bottom-left origin.

## G. Accessibility pass
`accessibility_check {doc}` -> `accessibility_fix {rule:"title", value}` / `{rule:"primary-language", value:"en-US"}` /
`{rule:"tab-order"}` -> figures: `accessibility_figures` + `accessibility_set_alt` or `decorative:true` -> untagged simple
docs: `accessibility_autotag_preview {page}` then `accessibility_autotag_apply` -> re-check ->
`accessibility_report {path}` (HTML). Report remaining `failed`/`manual` rules; don't claim compliance.

## H. Protect / unprotect
`doc_protect {open_password}` (or `permissions_password` + `printing`, `copy`, `changes`) -> `doc_save {path:new}`. Reopen
with the password to verify. Unprotect only for files the user may unlock: `doc_open {password}` -> `doc_unprotect` -> save new.

## I. Shrink / PDF/A / convert
`doc_optimize {doc, path:"<dir>/x-small.pdf", preset:"mobile"}` -> compare byte sizes, render a page.
`pdfa_verify` -> `pdfa_convert {level:"2b"}` -> `pdfa_verify` -> save new file.
`doc_export_office {path:"x.docx"}` (layout is approximate: tell the user), `doc_export_text`, `doc_export_images`.

## J. Annotate / review
`comment_add {type:"highlight", find:"clause 4", page, contents:"check"}`, `note`, `textbox`, `stamp`; `comment_list`,
`comments_summarize`; flatten with `doc_flatten {comments:true}` only on request.

## K. Add content to a page
`page_add_text {page, text, at:[72,72], width:300, size:12}`; `page_add_image {page, path, rect}`; watermark
`doc_watermark {text:"DRAFT", opacity:0.15, rotation:45}`; Bates numbering via `doc_header_footer`.
