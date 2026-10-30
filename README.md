# ArtCraft skills

[![skills.sh](https://skills.sh/b/dnviti/artcraft-skills)](https://skills.sh/b/dnviti/artcraft-skills)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Community [Agent Skills](https://agentskills.io) for the [ArtCraft](https://getartcraft.com) creative apps.
ArtCraft is a suite of desktop apps (design, documents, spreadsheets, slides, PDF, images, vector art, CAD,
page layout, motion graphics, video, photos and audio) that each expose an MCP server. These skills teach an
AI coding agent such as Claude Code how to drive those MCP servers well: which tools to call, in what order,
how to verify the result, and which gotchas to avoid.

> **Unofficial.** These are community skills for ArtCraft apps. They are written and maintained independently.
> ArtCraft is made by [storytold](https://github.com/storytold); names and logos belong to their owners.
> Community chat: [discord.gg/artcraft](https://discord.gg/artcraft).

The skills.sh badge above starts rendering after the first installs are recorded.

## Skills

| App | Skill | Purpose |
|---|---|---|
| FigCraft | [`figcraft-design`](skills/figcraft-design) | Design UI screens, design systems and prototypes, and turn designs into frontend code |
| WordCraft | [`wordcraft-documents`](skills/wordcraft-documents) | Write and format letters, reports, CVs and contracts as .docx/.pdf |
| DeckCraft | [`deckcraft-presentations`](skills/deckcraft-presentations) | Build and restyle slide decks (.deckcraft/.pptx/.pdf) |
| GridCraft | [`gridcraft-spreadsheets`](skills/gridcraft-spreadsheets) | Build workbooks with formulas, tables, charts and validation |
| PdfCraft | [`pdfcraft-documents`](skills/pdfcraft-documents) | Edit, redact, fill, sign, OCR and make existing PDFs accessible |
| PhotoCraft | [`photocraft-images`](skills/photocraft-images) | Retouch and composite raster images with layers, masks and filters |
| VectorCraft | [`vectorcraft-illustration`](skills/vectorcraft-illustration) | Draw logos, icons and illustrations; export SVG/PDF/PNG |
| SolidCraft | [`solidcraft-cad`](skills/solidcraft-cad) | Model parametric 3D parts; export STEP/STL/3MF |
| CadCraft | [`cadcraft-drawings`](skills/cadcraft-drawings) | Draft dimensioned 2D technical drawings; DXF/DWG; plot to PDF |
| DesignCraft | [`designcraft-layout`](skills/designcraft-layout) | Lay out magazines, books and brochures; print-ready PDF/X |
| EffectCraft | [`effectcraft-motion`](skills/effectcraft-motion) | Build motion graphics, titles and composites; render MP4/ProRes/GIF |
| FilmCraft | [`filmcraft-video`](skills/filmcraft-video) | Cut, grade and mix video; export video and EDL/XML/AAF/OTIO |
| LightCraft | [`lightcraft-photos`](skills/lightcraft-photos) | Cull and organise photo libraries; develop raw files non-destructively |
| SoundCraft | [`soundcraft-audio`](skills/soundcraft-audio) | Edit, mix and master audio and MIDI to a loudness target |
| SoundCraft | [`soundcraft-tts`](skills/soundcraft-tts) | Text to speech (local Kokoro/Piper or ElevenLabs, Google, Polly), mastered in SoundCraft; needs `soundcraft-audio` |
| All apps | [`artcraft-router`](skills/artcraft-router) | Pick which skill(s) to load for multi-app or ambiguous requests, and load only those |

Each skill's `description` also states which sibling skill owns neighbouring jobs (for example UI mockups belong
to `figcraft-design`, not `vectorcraft-illustration`), so the agent routes work to the right app.

## Prerequisites

Tested on Linux (Fedora); binary paths may differ on other systems.

1. **The ArtCraft apps you want to use**, installed. The skills call the apps through their CLI binaries
   (for example `/usr/bin/figcraft-cli`); see [getartcraft.com](https://getartcraft.com) for downloads.
2. **Each app's MCP server registered in your agent.** In Claude Code:

   ```bash
   claude mcp add --scope user figcraft -- /usr/bin/figcraft-cli mcp
   ```

   Use the same pattern for the other apps (`wordcraft`, `deckcraft`, `gridcraft`, `pdfcraft`, `vectorcraft`,
   `solidcraft`, `cadcraft`, `filmcraft`, `lightcraft`). Adjust the binary path if your install differs
   (`command -v figcraft-cli`).

3. **File access roots for the apps that confine files.** `photocraft`, `soundcraft`, `designcraft` and
   `effectcraft` can restrict the MCP server to directories you choose. Pass the roots when registering:

   ```bash
   claude mcp add --scope user soundcraft -- /usr/bin/soundcraft-cli mcp \
     --automation-read-root "$HOME/Projects" --automation-write-root "$HOME/Projects"
   ```

   - `soundcraft`, `designcraft` and `effectcraft` accept the flags **repeatedly**, so you can grant several folders.
   - `photocraft`'s flags are **not repeatable**: one read root and one write root only. Pick a directory that
     contains your working files.
   - If a server was registered without these flags, behaviour differs per app (for example `photocraft` and
     `soundcraft` then have no file access at all, while `effectcraft` is unrestricted but refuses scripting once
     roots are set). Each skill's file-access section explains what to expect and the `*-cli` fallback from
     Bash. The skills tell the agent to ask you to change the registration rather than edit your configuration.

   Restart Claude Code after changing MCP registrations.

## Install

Install with [skills.sh](https://skills.sh) (works with Claude Code and other agents that support the format):

```bash
# list the skills in this repo without installing anything
npx skills add dnviti/artcraft-skills --list

# install one skill, globally, for Claude Code
npx skills add dnviti/artcraft-skills --skill figcraft-design -a claude-code -g

# install all 16 skills, globally, non-interactively
npx skills add dnviti/artcraft-skills --skill '*' -a claude-code -g -y
```

Run `npx skills add dnviti/artcraft-skills` without flags for the interactive picker.

### As a Claude Code plugin

This repo is also a Claude Code plugin marketplace with a single plugin that bundles all 16 skills:

```text
/plugin marketplace add dnviti/artcraft-skills
/plugin install artcraft-skills@artcraft-skills
```

Plugin skills are namespaced, for example `/artcraft-skills:figcraft-design`.

## Updates

```bash
npx skills check     # report installed skills that have changed upstream
npx skills update    # update them
```

Updates are content-based: the skills CLI compares your installed copy with the current `main` branch, so a
change merged to `main` is available to `npx skills update` immediately. Tagged releases and the
[CHANGELOG](CHANGELOG.md) (generated by release-please) give the human-readable history, and are what the
plugin marketplace version follows.

## How the skills behave: show and approve

Every skill ends in the same mandatory phase. The agent does the work, saves the file, opens it in the
desktop app and then **stops and asks you to accept it or describe changes**. Final exports (PDF, video, STEP,
print files and so on) wait for your explicit acceptance, and experiments are written to a temp directory and
removed. Skills also avoid recording from a microphone, never write over your originals or source media, and
never create passwords or signing identities on your behalf.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the commit convention, the
release flow and how to run the validator (`node scripts/validate-skills.mjs`).

## License

[MIT](LICENSE) (c) 2026 Daniele Viti
