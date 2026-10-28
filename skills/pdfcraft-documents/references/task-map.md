# PdfCraft task map (tools verified in the headless session; ids 1-based pages, top-left points)

Load schemas first: ToolSearch `select:mcp__pdfcraft__<tool>,...`. Every tool except open/create/combine/
batch/printers takes `doc`.

## Session and files
- `doc_open {path, password?}` -> {doc, pages, editable, encrypted}; `doc_create {from:"blank", pages, width, height}` |
  `{from:"images", paths, dpi?}` | `{from:"text", text|path}` (WinAnsi only); `doc_list`; `doc_close {doc, discard_changes?}`
- `doc_save {doc, path?, full?, flatten_fill_sign?}`: with `path` = new full-rewrite file; without = in place (incremental)
- `doc_info` (metadata, pages, bookmarks, annotations, fields, links, layers, attachments, fonts, security, repair notes)
- `doc_set_info {key:"Title"|"Author"|"Subject"|"Keywords"|custom, value}`; `doc_initial_view`; `page_number {from,to,style,prefix}`
- `edit_undo`, `edit_redo`

## Pages
- `page_delete {pages}`, `page_move {pages, to}`, `page_rotate {degrees, pages?, subset?, orientation?}`,
  `page_duplicate`, `page_reverse`, `page_replace`, `page_insert_blank {at, width?, height?}`,
  `page_insert_file {path, at, pages?}`, `page_extract {pages, out?, open?, separate?, out_dir?, delete?}`,
  `page_set_box {box: crop|trim|bleed|art|media, margins [l,b,r,t] | rect, pages?}` (omit both to reset)
- `doc_combine {paths, pages?:["1-3",null], passwords?, groups?, field_conflicts: rename|merge, out?, open?}`
- `doc_split {doc, out_dir, every|before|bookmarks|max_mb}` -> `<name>-partK.pdf`
- `doc_create_multiple` (several docs from files), `doc_batch {paths,out_dir,steps:[convert,ocr,optimize]}`

## Reading
- `text_extract {pages?, rect?}`, `text_find {query, limit, start_page}` -> rects, `text_lines`, `text_paragraphs {page}`,
  `text_word_count`, `text_fonts`, `doc_export_text {path}`
- `page_render {page, dpi}` (PNG), `render_preview {page, max_side}`, `page_images`, `doc_export_images`, `doc_export_all_images`

## Editing content
- `page_add_text {page, text, at|rect, width, font: helvetica|times|courier, size, bold, italic, color, align}`
  (editable later with `content_update`; `content_list/copy/delete`, `object_list/move`)
- `text_edit {page, paragraph|line, text?, font, size, color, align, underline, line_spacing, dx, dy, width}`
- `page_add_image {page, path, at|rect, ...}`, `image_edit`, `image_save`, `image_hit`
- `doc_watermark {text|file, pages?, rotation, opacity, scale, behind, font_size, color, replace}`,
  `doc_background`, `doc_header_footer {header_left|center|right, footer_*, tokens <<1>> <<n>> <<Page 1 of n>>
  <<yyyy-mm-dd>> <<Bates Number#6#1#PREFIX#SUFFIX>>, shrink, replace, pages, margins}`, `doc_remove_marks {kind}`,
  `stamp_custom` / `comment_add {type:"stamp", stamp:"approved"}`
- `link_add/edit/delete/list`, `links_from_urls`, `links_remove`; `bookmark_add {title, page, parent?, position?}`,
  `bookmark_list/rename/move/delete/set_page/set_style`, `bookmark_from_structure`; `attachment_add {path}` /
  `attachment_delete {name}`; `layer_set`

## Comments / review
`comment_add {page, type: note|highlight|underline|strikeout|squiggly|replace|rectangle|oval|line|arrow|ink|textbox|stamp|
polygon|cloud|polyline|callout|caret|attachment, find|quads|rect|from/to|points|at, contents, color, author, all}`,
`comment_list`, `comment_edit`, `comment_reply`, `comment_set_status`, `comment_mark`, `comment_lock`, `comment_delete`,
`comments_summarize`, `comments_hide`, `comment_image_preview`.

## Forms
- `form_fields` (name, type, value, options, page, rect, required, read-only); `form_fill {values}`; `form_reset`
- `form_add_field {page, type: text|date|checkbox|radio|combo|list|button|image|signature, rect, name?, options?, group?,
  export?, multiline?, editable?, caption?}`; `form_add_field_table`; `form_delete_field`; `form_set_props`;
  `form_set_image`; `form_tab_order`; `form_calculation_order`; `form_actions`/`form_set_actions`/`form_set_script`
  (JS: `js_enabled`, `js_run`, `js_document_scripts`); `form_merge_data`
- `form_detect_fields {pages?, add?:true}` for printed blanks (rects bottom-left!)
- `doc_export_data {path, what: all|comments|fields}` (.xfdf/.fdf/.xml/.csv/.txt), `doc_import_data {path}`
- `doc_flatten {comments?, fields?}`; `xfa_to_static`

## Redaction and privacy
- `redact_mark {doc, rect+page | find | words[] | pattern: phone|email|credit-card|ssn|date | whole_pages, pages?, page?,
  case_sensitive?, whole_words?, overlay?, code_set: foia|privacy-act + codes, fill?}`
- `redact_apply {pages?}` (removes text, images, vectors, comments, fields under marks; internal verification may fail the call),
  `redact_clear`
- `doc_audit_redactions` (faux redactions + unapplied marks, per page with hidden text)
- `doc_hidden_info` / `doc_remove_hidden {categories?}`: metadata, attachments, comments, form-fields, hidden-text,
  hidden-layers, bookmarks, links-actions-scripts, private-data

## Signing
- `sign_id_create {name, password(>=8), path.p12, key: rsa2048|rsa3072|rsa4096|p256, years, organization, email, country}`
- `sign_document {doc, id(.p12), password, out, page+rect | field, certify?, reason, location, contact,
  graphic:{image|text|strokes}, appearance, labels}` (PAdES B-B SHA-256; saves to `out`)
- `sign_list` (status valid|unknown|invalid|unsigned, changes after signing), `sign_trust {paths|clear}`,
  `sign_keychain_ids`, `sign_windows_ids`
- `fill_sign_add {page, type: text|check|cross|dot|line|date|signature|initials, at, text|path, font_size, format}`
  (visual Fill & Sign marks, not cryptographic; `doc_save flatten_fill_sign:true` bakes them in)

## OCR / camera
`ocr_status`, `ocr_recognize {pages?, dpi?, language:"en", skip_text_pages?}`, `ocr_recognize_files`,
`page_enhance_camera`.

## Accessibility
`accessibility_check {rules?, categories?, pages?, all?}` (all:true adds colour contrast), `accessibility_report {path}`
(HTML), `accessibility_fix {rule: primary-language|title|tab-order, value?}`, `accessibility_figures`,
`accessibility_set_alt {figure, alt|decorative}`, `accessibility_tags/tag_content/set_tag_property/move_tag/
mark_tag_artifact`, `accessibility_find_untagged`, `accessibility_autotag_preview/apply/form_fields`,
`accessibility_review_record/html/save/load`, `view_reading_colors`.

## Compare
`doc_compare {doc:<newer>, other:<older>, visual?, limit?}`, `doc_compare_mark`, `doc_compare_report {path}`.

## Standards, size, print
`pdfa_verify {level}`, `pdfa_convert {level}`, `print_readiness`, `doc_optimize {path, preset, color, gray, discard...}`,
`doc_reduce {path}`, `doc_audit_space`, `doc_print`, `printers`, `printer_options`.

## Security
`doc_protect {open_password?, permissions_password?, printing, changes, copy, accessibility, compatibility}` (applied at next
save), `doc_unprotect`, `doc_revisions`, `doc_open_revision`.

## Measure / other
`measure_distance/perimeter/area/scale/info/list/export`, `action_list`/`action_run` (Action Wizard), `command_list`/
`command_run`/`command_batch`.
