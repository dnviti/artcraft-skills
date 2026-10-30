---
name: lightcraft-photos
description: "Organise photo libraries and develop raw/JPEG photos non-destructively in LightCraft (ArtCraft's Lightroom-class photo library and raw developer, via the `lightcraft` MCP server (mcp__lightcraft__*) or `lightcraft-cli`). Use whenever the user mentions LightCraft or the lightcraft MCP tools, or asks to import, cull, rate, flag, colour-label, keyword, caption or search a photo library or shoot; build albums, stacks or smart albums; develop raw files (DNG, CR2/CR3, ARW, NEF, RAF, RW2, ORF, PEF) or JPEGs (exposure, white balance, highlights/shadows, tone curve, colour grading, B&W, crop/straighten, masks, spot removal, presets, profiles, HDR/panorama merge); sync edits across a shoot; batch develop/export web or print sizes, contact sheets, print layouts. Covers the library-first non-destructive workflow, render-and-verify, export and the mandatory show-and-approve phase. Pixel-level retouching, layers and compositing belong to photocraft-images; vector art to vectorcraft-illustration."
license: MIT
metadata:
  author: dnviti
  version: "1.0.0" # x-release-please-version
---

# LightCraft photos

LightCraft is an open-source (alpha), non-destructive photo library and raw developer: library
(albums, folders, stacks, ratings, flags, labels, keywords, smart search), develop (light, colour,
curves, grading, detail, optics, geometry, masks, spots), presets/profiles, merge (HDR, panorama),
export (JPEG, PNG, TIFF, WebP, AVIF, JPEG XL, PSD flat, DNG, original + XMP), contact sheets, print
layouts, slideshows. Edits are a list of settings stored in the *library catalog*; the original files
are never rewritten. You drive it with the `lightcraft` MCP server (headless engine) or with
`lightcraft-cli` from Bash. This skill says what to do, in what order, and how to hand the result
to the user.

**A shoot deserves its own look, not the feed's.** Culling and organising are bookkeeping; the
develop look is where you will drift to the preset average: one stock look pushed over every
frame, milky blacks, a heavy vignette. A look that belongs to these photos comes from a reference
outside photo apps, a limit on which controls you touch, virtual-copy alternatives the user
chooses between, and a viewer who did not develop them. The photographer's own look or reference wins.

- Develop control ids, mask/crop/export params, search filters: `references/command-catalog.md`
- Recipes (cull a shoot, quick develop, batch web export, B&W, sky mask, sync edits): `references/recipes.md`

## 0. Ground rules for the tools

MCP tools (names as `mcp__lightcraft__<tool>`): helpers `import`, `query_photos`, `select_photos`,
`list_controls`, `get_develop`, `set_develop`, `apply_preset`, `crop`, `render_preview`,
`render_photo`, `export`, `doc_inspect`, and the generic `list_commands` (= `command_list`),
`run_command` (= `command_run`), `command_batch`. Every command is *also* a tool `cmd_<id with . as _>`
(~376 of them, e.g. `cmd_photo_rate`): ignore those, use `run_command`. All tools are deferred: load the
schemas you need with ToolSearch (`select:mcp__lightcraft__run_command,mcp__lightcraft__list_commands,...`
or query `+lightcraft`, max_results 30) before calling them.

- **Discover before guessing.** `list_commands {filter:"mask."}` (or `"keyword."`, `"album."`,
  `"export."`) returns id, label, `params` doc, `enabled`/`disabled_reason`. Never call it unfiltered
  (376 commands). The `params` doc is authoritative; the installed build (0.15.x) can differ from docs.
- **Photos are integer ids.** Most develop commands act on the **active** photo (`select_photos
  {ids, active}`); `set_develop`/`crop`/`export` with an explicit `id` make that photo active and
  replace the selection. `get_develop`, `render_photo`, `render_preview` don't change the selection.
- **Coordinates** (crop rects, mask points, strokes) are normalised 0..1, origin top-left.
- **Edits are undoable** (`edit.undo`/`edit.redo`, `history.list`); a slider burst is one step.
- Failures come back as `isError:true` with a readable message; a failed command changes nothing.
  Params are strict: unknown or malformed values are errors (e.g. `crop.aspect` wants `"16x9"`, not
  `"16:9"`; `develop.treatment` takes `{bw:true}`; a wrong key like `treatment` is *ignored* and can
  toggle instead, so read back with `get_develop`).
- Long operations (export of many photos, merge, previews) block in headless mode: pass sensible
  batches, and check `activity.list` when a desktop app is attached.

## 1. Library, persistence and file access: check this first (critical)

Default registration: `claude mcp add --scope user lightcraft -- /usr/bin/lightcraft-cli mcp` (no `--library`).
Findings from the installed build (0.15.0):

- **No `--library` means an in-memory session** (`library.info` -> `"persistent": false`). Imports,
  ratings, keywords and develop settings **vanish when the MCP server exits**. Fine for a one-off
  "develop this photo and export it"; wrong for culling or organising work that must last.
- **Persistent work needs a library directory**: `lightcraft-cli run --library DIR ...` (CLI route,
  below) or an MCP started with `--library DIR`. A library is a folder with `catalog.snap`,
  `catalog.log` (append-only edit log), `prefs.json`, thumbnails; it **references** the photo files
  in place (`import mode:add`, the default). The app's default library is `~/Pictures/LightCraft
  Library` (seeded with demo photos on first launch). **Never create or touch libraries the user did
  not ask for**: ask where the library should live, or whether the user already has one
  (`~/Pictures/LightCraft Library`, or the last one the app opened). Tests and scratch work use a
  library in a temp dir.
- **A library can be open in one process only** (lock file; the error says "already open in ...").
  So an MCP session started with `--library` blocks the CLI and the desktop app on that library, and
  the other way round. To work with a library the app has open, the app must run with `--control PORT`
  and the MCP/CLI must connect with `--connect 127.0.0.1:PORT` (not how the MCP is registered by default, so use
  the CLI route, below, when the user wants the library seen in the app).
- **File access**: unlike PhotoCraft there are no automation roots: any path the OS user can read or
  write works (imports, `export path`, `dir`). Writes outside what the user can write give an OS
  "Permission denied". `export` refuses to overwrite a catalogued original or its XMP sidecar.
  Relative paths resolve against the server's working directory: always pass absolute paths.
- Headless runs write nothing in `~/.config` or `~/.cache` (verified); settings folders only come from
  the desktop app (`LIGHTCRAFT_CONFIG_DIR` relocates it).
- **XMP sidecars** are the only thing written next to originals, and only if auto-write is on
  (`library.xmpPreferences {autoWrite}`, off by default in a fresh library) or on request
  (`photo.saveMetadataToFile`). Ask before writing sidecars into the user's photo folders.

**CLI route (persistent, scriptable, releases the library lock after each call)**:

```bash
LIB=/abs/path/to/library
lightcraft-cli run --library "$LIB" --import /abs/shoot \
  library.selectAll photo.setMeta 'addKeywords=["trip","2026"]' \
  library.select 'ids=[3]' develop.set control=light.exposure value=0.4 preset.apply id=lc.cinematic amount=60 \
  app.export path=/abs/out/p3.jpg longEdge=1600 quality=85
```

Each word without `=` starts a command, `key=value` pairs follow (JSON when parseable, `'{json}'`
as a whole param object). One JSON line per command; exit status non-zero on a failure (`--keep-going`
continues). `--script FILE` takes JSON lines `{"command":id,"params":{...}}`. Selection state does
not survive between runs: select inside the same run. One-off: `lightcraft-cli render IN -o OUT --set
light.exposure=0.5 --preset lc.teal-orange --size 2000` develops and exports a single file with no
library at all (good for "just develop this raw").

## 2. Workflow

1. **Brief**: what is the job (cull, organise, develop one hero image, batch for web/print), which
   folder, which library, what output size/format, what must not change. Ask only what you cannot infer.
2. **Safe start**: originals are never modified by develop; still, never import with `mode:move`
   (it removes the originals after copying) or `copy` unless the user asked for that, and never
   `photo.rename` (renames files on disk) or `photo.deletePermanently` / `library.emptyRecentlyDeleted`
   without explicit consent. `photo.delete` only moves to Recently Deleted (reversible).
3. **Organise first** (sections 3 and recipe 1), **develop second** (section 4), **export last**.
4. **Look options** before syncing a creative develop (skip for corrective edits, library-only jobs or a
   given look): name a **reference outside photo apps** (a painter's palette, a faded postcard, the real
   light of that place at that hour) and **1-2 limits** (tone curve and white balance only, no
   saturation slider; one grading hue; at most one mask). Develop 2-3 virtual copies of the hero
   (`photo.virtualCopy`) that differ in tone, colour and contrast, put them in an album, show and open
   it (section 7), then ask with the multiple-choice question tool (AskUserQuestion in Claude Code; else
   a numbered list), multi-select for blends. Never pick for the user. This rule covers creative
   directions, while technical options may carry a labelled recommendation. Inside a subagent, return
   the options (album, virtual copy ids, preview paths, brief) to the orchestrator, which asks the user.
   Sync only the chosen look.
5. **Verify loop** after each meaningful step (section 5).
6. **Show and approve** (section 7), then the final export (section 6).

Scale the work: "brighten this photo" is `set_develop` + a preview, not a library project.

## 3. Library know-how (organise, cull, find)

- **Import**: `import {paths}` (folders are scanned recursively, duplicates skipped, sidecars read).
  Returns `imported` ids, `duplicates`, `failed` (a missing path is reported in `failed`, not as an
  error). Check `query_photos` after importing mixed raw+JPEG folders: each file is a photo.
- **Cull fast**: `query_photos` to list (id, file, size, rating, flag, edited, keywords); look at
  candidates with `render_preview {id, max_side:900, format:"jpeg"}` (small and cheap); then
  `photo.flag {flag:"pick"|"reject"|"none", ids}`, `photo.rate {rating:0..5, ids}`,
  `photo.label {label:"red|yellow|green|blue|purple|none", ids}`. Pass `ids` explicitly (without it
  the *selection* is used and `advance` may move it). Rejects are flags, not deletions.
  `library.findSimilar {id}` groups near-duplicates; `stack.auto {gap}` stacks bursts by capture time
  (`preview:true` first).
- **Metadata**: `photo.setMeta {ids, title, caption, creator, copyright, location, city, country,
  gps, keywords | addKeywords | removeKeywords}`; keyword hierarchy via `keyword.*`
  (`keyword.create`, `keyword.rename`, `keyword.merge`, `keyword.suggest`). Keep keywords specific
  (subject, place, event), lower-case or consistently cased.
- **Albums**: `album.create {name, folder:false, addSelected}`, `album.addPhotos {id, ids}`,
  smart albums via `album.createSmart` + `album.setRules` (`album.ruleFields` lists fields).
- **Search/filter** (`query_photos {filter}`, or `library.filter`, which changes the app view):
  `{rating:3, ratingOp:"atLeast"|"exactly"|"atMost", flag:"pick", label, keyword, camera, lens,
  edited, kind, date, text}`. Note `minRating` is *not* a filter key (silently ignored). `text` takes
  the field syntax: `rating:>3 flag:pick iso:>800 camera:x2 date:2026-04 keyword:mountains
  person:"Jane Doe"`. `limit`/`offset` page the result (default 200).
- **Source/sort**: `library.source {kind:all|picks|recentlyAdded|album|libraryFolder|missing, id}`,
  `library.sort {key, ascending}`. These change the view only.
- **Missing files**: `library.missing`, `photo.relink`, `library.findMissing`; never assume a moved
  folder means lost edits (edits live in the catalog).

## 4. Develop know-how (non-destructive, order of operations)

Controls are ids from `list_controls` (ranges in the catalogue): `light.exposure` (EV, -5..5),
`light.contrast/highlights/shadows/whites/blacks` (-100..100), `wb.temp` (Kelvin 2000..50000 for raw;
relative for JPEG) and `wb.tint`, `color.vibrance/saturation`, `effects.texture/clarity/dehaze`,
`vignette.*`, `grain.*`, `detail.sharpen*`/`detail.nr*`, `optics.*`, `geometry.*`, `crop.angle`,
`mixer.<band>.hue|sat|lum`, `bw.<band>`, `grading.<zone>.hue|sat|lum`. Set several at once with
`set_develop {values:{...}}`; deep-merge any partial settings JSON (as in `get_develop`) with
`set_develop {settings:{...}, label}`; reset with `develop.resetControl`/`develop.resetSection`/
`develop.reset`.

Order of operations (matches how the pipeline reads best and avoids fighting yourself):
1. **Geometry first**: `crop {rect:[x0,y0,x1,y1], angle}` or `crop.aspect {aspect:"4x5"}`,
   `crop.autoStraighten`, `geometry.upright {mode}` for architecture. Crop is just settings; reset with
   `crop {reset:true}`.
2. **Profile/camera look** (`develop.profile {id:"lc.vivid"}`, amount `profile.amount`), then
   **white balance** (`develop.wb {mode:"auto"|"asShot"|"daylight"|..., temp, tint}`; neutralise casts
   before stylising).
3. **Tone**: `develop.auto` is a starting point (it can over-push: it gave contrast 68 on a plain
   gradient), then exposure, highlights/shadows, whites/blacks. Recover blown highlights with
   negative `light.highlights` (edge-aware, no halos) rather than lowering exposure.
4. **Colour**: vibrance before saturation (vibrance protects skin); targeted work with the 8-band
   `mixer.*`; looks with `grading.*` (shadows/midtones/highlights wheels) or a preset at a reduced
   `amount` (presets scale 0..200 %: `apply_preset {preset:"lc.teal-orange", amount:60}`).
5. **Local**: masks (`mask.add {kind:"linear|radial|brush|sky|subject|background|luminanceRange|
   colorRange"}` then `mask.adjust {id, values:{exposure,...}}`; combine with `mask.addComponent {op:
   add|subtract|intersect}`, `mask.invert`; paint with `mask.brushStroke {points,size,feather,erase}`; Object/Describe kinds need an optional SAM 3 model that is
   not bundled: they fail without it, tell the user instead of retrying). Spots: `spot.findDust`,
   `spot.add {mode:"remove|heal|clone|fill", points, size}`; `redeye.add`.
6. **Effects and detail last**: clarity/texture/dehaze sparingly, then sharpening and noise reduction
   judged at 100 % crops (`render_preview` is downscaled; sharpening at full size is only visible in
   an export), then vignette/grain as style.
7. **B&W**: `develop.treatment {bw:true}` then `bw.*` mix (darken skies with `bw.blue` negative) and
   grading for toning.
- **Sync across a shoot**: develop one hero photo, `develop.copy {groups}` / `develop.paste {ids,
  groups}` or `develop.sync` (to the selection). Keep WB/exposure per photo, sync the look.
  Exclude crop and masks unless they truly apply (default copy excludes crop, masks, spot removal).
- **Versions and virtual copies**: `version.create {name}` snapshots settings; `photo.virtualCopy`
  gives an independent edit of the same file (e.g. colour + B&W) without duplicating pixels.
- **Default tells** (preset-feed looks; use only when the brief asks): `lc.teal-orange` or any
  look preset at full amount; clarity, dehaze and shadows pushed together into grunge; masked skies more saturated than the light on the ground; lifted, milky blacks on every
  frame; a heavy dark vignette by default; vibrance pumped until skin goes orange; one colour kept
  on a black-and-white frame; `develop.auto` or one preset at 100 % across a shoot shot in different
  light. Every slider you move should trace back to the brief, the reference or a limit.
- **Honesty**: cosmetic and dust/blemish work is fine; do not alter photos to fake evidence.

## 5. Verify loop (mandatory)

After each major step:
1. **Numbers**: `get_develop` (confirm the values landed on the right photo: the active-photo
   mix-up is the most common error), `doc_inspect` / `library.state` (selection, active, filter,
   undo label), `query_photos` (rating/flag/keywords/edited).
2. **Look**: `render_preview {id, max_side:1400, format:"jpeg"}` returns an image you can see (png
   default, `max_side` up to 4096); `render_photo {id, size, path}` also saves a file (path must not be a
   catalogued original). Check clipped highlights/blocked shadows, halos around masks, banding in
   skies, skin tones, colour casts, over-sharpening, noise, crop framing and horizon.
3. **Compare** with the original: render once before editing (or `beforeAfter.*` in the app); fix with
   `edit.undo`, `develop.resetControl`, or by adjusting the value; repeat.
4. **Batch checks**: after a batch develop/sync, preview at least the first, a mid and the most
   extreme photo (darkest/brightest), not only the hero.
5. Before exporting: right photos selected, crop/rotation as intended, rating/flag filters not hiding
   photos from a `dir` export (`export {ids}` is explicit and safest).
6. **Second opinion on the look** (creative develops of a hero or shoot, before section 7): a fresh
   subagent with a clean context, not a fork, gets only before/after previews of the hero and of 3-4
   synced photos, the reference and limits, and the tells in section 4. As a photo editor who did not
   develop them, it says what looks like a stock preset, where the look fails on particular photos
   (skin, skies, shadows), and any artefact, ranked by severity with a one-line fix direction; no
   praise. Fix the serious items; tell the user which ones you leave and why. Inside a subagent,
   return the critique inputs (preview paths, brief, tells) to the orchestrator, which starts the
   reviewer.

## 6. Save and export

- **Edits are saved in the library** (`--library DIR`; each command is persisted to the catalog
  log); in-memory sessions save nothing: export or write XMP before the session ends.
- **Export** `export {path | dir, ids, format, longEdge|shortEdge|width+height|percent|megapixels,
  quality, colorSpace, bitDepth, metadata, naming, conflict, ppi, preset}` (same as `app.export`):
  - Web: `jpeg` quality 82-88, `longEdge` 1600-2400, `colorSpace:"srgb"`, `metadata:"copyright"`
    or `"allExceptCamera"` to strip location; `webp`/`avif` for smaller files.
  - Print: `tiff` 16-bit (`bitDepth:16`), `colorSpace:"adobeRgb"`/`"proPhoto"`, `longEdge:0` (full size),
    `ppi:300`; soft proofing is not available, say so.
  - Archive/hand-off to other apps: `format:"original"` (copy + XMP sidecar with the edits), `dng`
    (raw as DNG with edits embedded), `rendereddng` (baked 16-bit float DNG), `psd` (flat).
  - Default size when none is given is long edge 3000; `longEdge:0` is full resolution; `dontEnlarge`
    defaults to true. `limitKb` fits a JPEG under a size. Presets: `export.presets` (e.g. "JPEG
    (Small)" 2048 q85, "JPEG (Large)" full q92, "Original + Settings").
  - Batch: `dir` with `naming:"{name}-web"` (tokens `{name} {seq:3} {date:%Y%m%d} {title} {camera}
    {rating}`...), `conflict:"unique"` (default) | `overwrite` | `skip`. Result lists every file with
    size and dimensions: report absolute paths.
  - `export.contactSheet {path, paper:"a4", columns, rows, captions}` for a PDF proof sheet;
    `print.set` / `print.layout.autoLayout` / `print.exportPdf` for print layouts.
  - HDR-edited photos (`develop.hdr`): `hdr:true` for gain-map JPEG / PQ AVIF.
- Descriptive names (`milan-0412-web.jpg`), a dedicated output folder, never into the originals'
  folder unless asked; a catalogued original is refused by design.
- Merge: `merge.hdr`, `merge.panorama`, `merge.hdrPanorama` write a DNG next to the first source
  file (so a write into the user's photo folder: say so first).

## 7. Show and approve (mandatory final phase)

Every task ends here, after the verify loop and before final exports. The MCP/CLI session is headless,
so the user cannot see the work until the real app opens the library it was saved in.

1. **Save to a library the app can open**: the edits must live in a persistent library (the user's own
   library when they asked for the work to be done there, otherwise a project library at a descriptive
   path such as `<project>/<job>-lightcraft-library`). If you worked in an in-memory MCP session,
   replay the final state with the CLI route (`lightcraft-cli run --library DIR --import ...`) or
   export the result and say that edits themselves were not kept. Make sure no MCP session holds the
   library lock (an MCP started with `--library DIR` does until it exits), otherwise the app cannot
   open it. Also write flat previews/deliverable candidates if useful. Note the full absolute paths.
2. **Open LightCraft on it, detached** (verified: `/usr/bin/lightcraft`, `lightcraft [OPTIONS]
   [FILES/FOLDERS...]`; desktop entry `ai.storyteller.lightcraft`):
   `setsid lightcraft --library /abs/path/library >/dev/null 2>&1 &`
   Passing photo files or folders *imports* them into the opened library (so never pass the user's
   originals with a different library than intended; with no `--library` the app opens its last or
   default library, `~/Pictures/LightCraft Library`, creating it with demo photos if absent).
   Associated types (desktop entry): JPEG, PNG, TIFF, WebP, HEIC/HEIF, DNG and the Sony ARW, Canon
   CR2/CR3, Nikon NEF, Fuji RAF, Olympus ORF, Panasonic RW2/RW, Pentax PEF raw MIME types; there is no
   LightCraft-specific project file or MIME type, the library *folder* is the project. If the user
   already has LightCraft running, a second launch on the same library fails with the lock message:
   tell them the library is open there and, if edits were made by the CLI meanwhile, to reopen/refresh
   it. Do not leave extra app instances you started running beyond the task if the user did not
   ask for the app.
3. **Stop and ask.** Give the full library path (and the photo ids / album to look at) and ask the user
   to accept or describe changes. No final export, delivery in other sizes, sidecar writing or
   cleanup before explicit acceptance. Silence or a vague reaction is not acceptance. Unless the user
   asked up front for the export to be produced straight away, the final export happens after
   acceptance.
4. **Loop on changes**: apply them (CLI route against the library, with the app closed or via
   `--control`), redo the verify loop for what changed, reopen/refresh, ask again.
5. **Inside a subagent** (cannot talk to the user): do steps 1 and 2, then return the library path,
   the photo ids / output paths, a short summary of what was done, and state clearly that **user
   approval is pending**. The orchestrator asks the user and relays changes; the final export waits
   for acceptance.

## 8. Top gotchas

- No `--library` = in-memory: nothing persists. A library is open in one process at a time.
- Never import, create libraries or write sidecars in the user's real photo folders / `~/Pictures`
  without being asked. `import mode:move` deletes originals after copying; `photo.rename` renames
  files on disk; `photo.deletePermanently` and `library.emptyRecentlyDeleted` are irreversible.
- Develop acts on the active photo; `library.select`/`select_photos` first, then verify with `get_develop`.
- `develop.auto` and presets are starting points; judge the preview and back off.
- Raw support is uneven (see the app's raw parity notes): some cameras fall back to a neutral matrix or
  embedded JPEG preview (`previewOnly` in `query_photos`); tell the user instead of promising raw quality.
- Object/Describe masks, face detection/recognition and AI denoise need optional models that are not
  installed; do not trigger downloads (`*.models.download`, `segment.model.download`) without asking.
- `edit.undo` undoes the last action of any kind (ratings, metadata, albums, crop, develop): check the
  undo label in `doc_inspect` before undoing.
- `photo.moveToFolder`, `folder.create`, `photo.duplicate`, `photo.rename` and merges write to disk
  next to the originals: only on request.
- Unknown param keys are ignored by some commands and errors in others: read values back.
- Preview size caps at 4096; judge sharpening/noise from an export crop at 100 %.
- Do not leave test libraries or exports around; never delete user photos or libraries.
