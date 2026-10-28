# PdfCraft gotchas (observed)

- Nothing is written until `doc_save`; edits are in memory. A new doc from `doc_create` has `path:null` until saved.
- `doc_save` with `path` -> full rewrite to the new file, the document then points to that file. Without `path` -> in place.
  The original stays safe only when you always pass a new path.
- `redact_mark` is only a mark (`marks_pending`). `doc_audit_redactions` before applying reports `unapplied-mark`;
  after apply and save it reports `count:0`. In testing, `redact_apply` removed the text from the content stream
  (`strings`/`pdftotext` on the saved file find nothing) and drew black boxes (with overlay text in red).
- Pattern `email` removes the whole address; `words:["Mario Rossi"]` also matches only that phrase, so add variants
  ("M. Rossi", "ROSSI") yourself. Labels like "Name:" stay: say so.
- A doc saved after redaction still has metadata (`doc_hidden_info` counted 3 metadata items): sanitise when privacy matters.
- `sign_document` returns the path it wrote (`out`) and leaves a signature that shows `status:"unknown"` for self-signed IDs.
  After signing, further edits create a new revision or invalidate it.
- `form_add_field` rects are top-left origin; `form_detect_fields` returns bottom-left rects; `doc_compare` rects too.
- `form_fill` regenerates appearances; glyphs the field font can't draw are saved but display `?` (see `warnings`).
- `doc_protect` / `doc_remove_hidden` take effect on the next save; `doc_unprotect` requires the permissions password.
- `doc_optimize` refuses signed documents and writes a copy; `doc_reduce` writes nothing if the result is not smaller (`written:false`).
- `text_edit` / `page_add_text` use standard fonts or fallback faces: matching a document's exact embedded font is not guaranteed.
- `doc_compare` is `enabled:false` in `command_list` until two docs are open.
- Scanned pages: `text_extract` empty; OCR (`ocr_recognize`, English models only) adds invisible text, the image is unchanged.
- `ocr_recognize` skips pages that already contain text unless `skip_text_pages:false`.
- Tool schemas are deferred: ToolSearch by exact name; `command_list` output is ~56 KB (always use `filter`).
- Output PNGs from `render_preview` are saved under the session tool-results folder; they are not part of your project.
- Opening the app: if a PdfCraft window is already running, `pdfcraft file.pdf` hands the file to it (no new process).
