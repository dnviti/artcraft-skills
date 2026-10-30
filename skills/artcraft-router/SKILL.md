---
name: artcraft-router
description: "Selector for the ArtCraft skills: picks which ArtCraft skill(s) to load for a request and loads nothing else itself. Use when a creative request spans several ArtCraft apps (FigCraft, VectorCraft, DesignCraft, DeckCraft, PhotoCraft, LightCraft, FilmCraft, EffectCraft, SoundCraft, WordCraft, GridCraft, PdfCraft, CadCraft, SolidCraft) or when it is unclear which one fits: brand identity, landing page with custom icons, video with narration or animated titles, podcast from a script, magazine with retouched photos, report or deck with data, part plus drawing. Skip it when one skill clearly matches."
license: MIT
metadata:
  author: dnviti
  version: "1.0.0" # x-release-please-version
---

# ArtCraft router

Load only the skills listed below for the request.

## Primary skill by intent

| Request | Skill |
|---|---|
| UI, app/web screens, landing page, dashboard mockup, wireframe, design system, prototype, design to code | `figcraft-design` |
| Logo, icon set, badge, vector illustration, pattern, poster, business card, SVG/AI/EPS artwork | `vectorcraft-illustration` |
| Multi-page print: magazine, book, brochure, catalogue, spreads, PDF/X, IDML, EPUB | `designcraft-layout` |
| Slide deck, pitch, talk, .pptx | `deckcraft-presentations` |
| Raster retouch, background/object removal, compositing, layers, PSD | `photocraft-images` |
| Photo library, culling, keywords, albums, raw development, batch photo export | `lightcraft-photos` |
| Video editing on a timeline, captions, colour grade, video export | `filmcraft-video` |
| Motion graphics, animated titles, lower thirds, VFX, keying, Lottie | `effectcraft-motion` |
| Audio editing, mixing, mastering, MIDI, songs, beats, sampled instruments | `soundcraft-audio` |
| Text to speech, synthetic voice-over or narration from a script | `soundcraft-tts` + `soundcraft-audio` (needed at the import/master step) |
| Single-flow document: letter, report, CV, contract, .docx | `wordcraft-documents` |
| Spreadsheet, workbook, budget, financial model, pivot, .xlsx/.csv | `gridcraft-spreadsheets` |
| Existing PDF: merge, edit, fill, sign, redact, OCR, PDF/A | `pdfcraft-documents` |
| 2D technical drawing, floor plan, DXF/DWG, plot at scale | `cadcraft-drawings` |
| 3D part, enclosure, bracket, STEP/STL/3MF | `solidcraft-cad` |

Boundaries: screens never go to vectorcraft or photocraft; single-flow documents go to wordcraft, not
designcraft; footage cutting goes to filmcraft, animation to effectcraft; editing existing recordings goes to
soundcraft-audio, generating speech to soundcraft-tts; pixel retouching goes to photocraft, library and raw
work to lightcraft.

## Common combos

| Request | Primary | Add secondary when |
|---|---|---|
| Landing page or app UI with original icons/illustrations | `figcraft-design` | `vectorcraft-illustration` when drawing the custom assets |
| Brand identity | `vectorcraft-illustration` (the mark) | `figcraft-design` for UI/design system, or `designcraft-layout` for print collateral, once the mark is approved |
| Video with narration | `filmcraft-video` | `soundcraft-tts` + `soundcraft-audio` (import/master step) for a separately mastered voice-over; otherwise FilmCraft's own `tts.*` commands |
| Video with an animated title | `filmcraft-video` | `effectcraft-motion` when building the title |
| Podcast from a script | `soundcraft-tts` + `soundcraft-audio` (needed at the import/master step) | `soundcraft-audio` also covers music beds, multi-track mix and edits beyond the TTS master |
| Magazine with retouched photos | `designcraft-layout` | `photocraft-images` for pixel retouch, or `lightcraft-photos` for raw development |
| Deck with custom charts | `deckcraft-presentations` (native charts) | `gridcraft-spreadsheets` only if a workbook is a deliverable or the data needs modelling |
| Part plus drawing | `solidcraft-cad` | `cadcraft-drawings` when drafting the dimensioned 2D sheet (CadCraft redraws from the part's parameters) |
| Report with data | `wordcraft-documents` | `gridcraft-spreadsheets` when the numbers need a workbook |

## Rule

Load a secondary skill only when that step is actually reached, not upfront.
