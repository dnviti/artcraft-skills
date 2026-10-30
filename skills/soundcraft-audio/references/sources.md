# Sources and attribution

This skill is original writing. Command behaviour comes from the installed app; library facts come from
the pages below (sizes from HEAD requests and pages checked on 2026-10-30). Licences can change: re-read
the licence shipped with a library before relying on it.

| Source | What was used | Licence |
|---|---|---|
| Installed `soundcraft-cli` 0.14.0 and the `soundcraft` MCP server (`commands`, `describe`, `engine.plugins`) | Command ids, parameter docs, sampler parameters in `command-catalog.md` and `sample-libraries.md` | n/a (observed behaviour) |
| Throwaway headless sessions (CLI and a private MCP process with a narrow read root), October 2026 | Verified: `mix.sampler_load` with WAV and FLAC, key tracking, key ranges and velocity ranges across sampler tracks, samples copied to `Audio Files/` as WAV on save, symlinks out of the read root rejected, 960 ticks per quarter note, `file.export_midi` writes 960 PPQ with no program changes | n/a (observed behaviour) |
| FigCraft skill in this repository (`skills/figcraft-design/SKILL.md`, "Uniqueness is the default" and §2) | The idea adapted to music in SKILL.md §2 and §5: an outside reference, arbitrary constraints, divergent sketches chosen by the user, a clean-context critique | MIT (this repository) |
| GeneralUser GS, author page https://schristiancollins.com/generaluser.php, repository https://github.com/mrbumpy409/GeneralUser-GS | Version, size, licence terms (free for commercial music, link the author page) | GeneralUser GS licence |
| MuseScore handbook, https://musescore.org/en/handbook/4/soundfonts-and-sfz-files; file on ftp.osuosl.org | MuseScore_General.sf3 size and licence | MIT |
| FreePats, https://freepats.zenvoid.org/ (Upright Piano KW, Salamander Grand Piano V3, FreePats GM), https://github.com/freepats/muldjordkit | Files, sizes, licences | CC0, CC-BY 3.0/4.0, GPLv3+ with exception (per item) |
| AVL Drumkits, https://www.bandshed.net/sounds/AVLDrumkits_SF2/ | SF2 kits, licence and the vendor's note on selling music | CC-BY-SA 3.0 |
| Fedora packages, https://packages.fedoraproject.org/pkgs/fluid-soundfont/fluid-soundfont-gm/ and https://packages.fedoraproject.org/pkgs/fluidsynth/fluidsynth/ | Package names; FluidR3_GM path (file size measured on a Fedora 44 system) | MIT (FluidR3_GM), LGPL-2.1 (fluidsynth) |
| FluidSynth, https://www.fluidsynth.org/ | Command-line render flags (`-n`, `-i`, `-F`, `-r`), SF3 support | LGPL-2.1 |
| sfizz, https://sfz.tools/sfizz/ | SFZ player plugin formats | BSD-2-Clause |
| VSCO 2 CE https://github.com/sgossner/VSCO-2-CE, VCSL https://github.com/sgossner/VCSL | Orchestral and percussion samples | CC0 |
| Sonatina Symphonic Orchestra, https://github.com/peastman/sso; licence text https://creativecommons.org/licenses/sampling+/1.0/ | Size, licence (retired CC Sampling Plus 1.0) | CC Sampling Plus 1.0 |
| Philharmonia sound samples, https://philharmonia.co.uk/resources/sound-samples/ | Size and terms (free incl. commercial, no resale as samples) | Philharmonia terms |
| Karoryfer Samples, https://www.karoryfer.com/ | Drum libraries | CC0 |
| DrumGizmo, https://drumgizmo.org/ | DRSKit size, licence, MD5 | CC-BY 4.0 |
| Freesound API, https://freesound.org/docs/api/ and https://freesound.org/apiv2/apply | Token vs OAuth2 access, rate limits, licence filtering | Freesound terms; each sound has its own CC licence |

Not verified against the app or a live service: the fluidsynth render (fluidsynth was not installed on
the test system), fluidsynth command files together with `-F`, sfizz installation and loading an `.sfz`
headless, the Freesound API calls (they need the user's account), and the extracted sizes of the 7z/tar
archives.
