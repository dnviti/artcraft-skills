# Sampled instruments and sample libraries

Detail for SKILL.md section 3 "Sampled instruments". Catalogue sizes come from HEAD requests on 2026-10-30.
Licences change: re-read the licence file that ships with each library before relying on it. Source pages
are listed in `sources.md`.

## What SoundCraft can load (installed build 0.14.0)

- Built-in instruments: `subtractive_synth` and `drum_synth` (both synthesised, no samples) and `sampler`
  (one audio file per track). There is **no SoundFont (SF2/SF3), SFZ or DecentSampler player and no LV2
  hosting**. CLAP/VST3/AU instruments load with `mix.instrument {track, plugin:"clap:…"|"vst3:…"}`; list
  them with `engine.clap_plugins {rescan:true}` / `engine.vst3_plugins {rescan:true}`.
- Audio import: WAV, AIFF, FLAC, MP3, OGG, AAC/M4A, ALAC, CAF. MIDI: `file.import_midi {path, at}`,
  `file.export_midi {path, tracks}`.

### Sampler, verified live

- `track.new {kind:"instrument", name, instrument:"sampler"}`, then `mix.sampler_load {track, path,
  params}` → `{track, source, name, frames, channels, sample_rate}`. WAV and FLAC both loaded.
  `mix.sampler_clear {track}` removes the sample.
- Parameters (`engine.plugins`, id `sampler`): `root_note` 0..127 (60), `transpose` ±48 st, `fine_tune`
  ±100 ct, `key_track` 0/1, `key_low`/`key_high` 0..127, `vel_low`/`vel_high` 1..127, `velocity` (sens.
  %, 70), `attack`/`decay`/`release` ms, `sustain` %, `play_mode` (0 Gate, 1 One Shot), `start` %,
  `loop_mode` (0 Off, 1 Forward, 2 Ping-Pong), `loop_start`/`loop_end` %, `level` dB. Change one later
  with `mix.instrument_param {track, param, value}`.
- Verified: a 440 Hz sample with `root_note:69` played 440/494/1046/1174 Hz for notes 69/71/84/86 (key
  tracking). Two sampler tracks with `key_low/key_high` 0..76 and 77..127 and the same notes on both:
  each track sounded only inside its range (solo bounces), so **one track per zone works as a crude
  multisample**. `vel_high:64` silenced a velocity-100 note, so velocity layers work the same way. Key
  ranges and samples survive save/reopen.
- On `save_session` every loaded sample is **copied into `Audio Files/` as WAV** (a FLAC became
  `c1046.wav`): a large multisample set grows the project folder by its uncompressed size.
- Paths are checked against `--automation-read-root` **after resolving links**: a symlink inside the
  root pointing outside it was rejected (`outside the read root`).
- MIDI timing: **960 ticks per quarter note** (a note at 960 ticks started at 1.00 s at 60 BPM).
  `file.export_midi` writes 960 PPQ and **no program changes**; there is no program/patch command.

## The three routes

| Route | Status | Use for |
|---|---|---|
| 1. WAV/FLAC into the sampler, one sample per track | **verified** | drum and FX one-shots, simple pitched instruments, a few zones of a piano or string patch |
| 2. SF2/SF3 rendered with fluidsynth, then imported as audio | command per fluidsynth docs, **not run here** (fluidsynth not installed) | full General MIDI arrangements, many instruments at once |
| 3. SFZ via an SFZ player plugin (sfizz) | **unverified**, optional | full SFZ libraries with round robins and many layers |

**Route 1, one-shots**: one track per sound, `params:{root_note:N, key_low:N, key_high:N, play_mode:1}`
(N = the note that triggers it, e.g. 36 kick, 38 snare, 42 hat); put the drum tracks in a folder
(`track.new {kind:"folder"}`, `track.move_to_folder`) and route them to a bus.
**Route 1, multisample**: pick zones every 4–7 semitones (fewer tracks, slight stretch is inaudible on
most material), one track per zone with `root_note` = the sample's pitch and adjacent, non-overlapping
`key_low`/`key_high`; optional second layer per zone with `vel_low`/`vel_high`. Write the part once,
copy the same MIDI clip to every zone track (`edit.copy`/`edit.paste` or the same `midi.note_add` calls);
the ranges decide which track sounds. Inside an SFZ tree read the `.sfz` file **as text** to map regions:
`sample=` (path relative to the .sfz, or to `default_path`), `pitch_keycenter=`, `lokey=`/`hikey=`
(or `key=`), `lovel=`/`hivel=`; note names (`c4`) follow the SFZ convention c4 = 60. Ignore opcodes the
sampler has no equivalent for (round robins, release triggers, crossfades).

**Route 2, SF2/SF3 through fluidsynth** (needs `fluidsynth`, a system package: ask, then the user
installs it with the system package manager (e.g. `sudo dnf install fluidsynth` on Fedora) in their own
terminal, never you):

```bash
# one part per file, exported from the session (each track rendered separately keeps the mix editable)
#   SoundCraft: file.export_midi {path:"/abs/proj/midi/bass.mid", tracks:["Bass"]}
fluidsynth -ni -F /abs/proj/render/bass.wav -r 48000 /path/to/bank.sf2 /abs/proj/midi/bass.mid
```

Then `import_audio {path:"/abs/proj/render/bass.wav", track:"Bass audio", at:0}` and mute or delete the
MIDI track. `-n` no MIDI input, `-i` no shell, `-F` fast render to file, `-r` sample rate (match the
session). Because exported MIDI carries **no program change**, every channel except 10 plays GM program 0
(piano) and channel 10 plays the drum kit: write drum parts with `midi.note_add {..., channel:9}`. For
another instrument prepend a program change to the file (a few lines of Python writing `0xC0|ch, program`
at delta 0 of the track, or `mido` if installed) or load a fluidsynth command file with `prog <chan>
<program>` (`-f file`; unverified together with `-F`). fluidsynth renders quietly (default gain 0.2):
fix the level in the mix, not with `-g` near clipping. fluidsynth ≥ 2 reads SF3.

**Route 3, SFZ player**: sfizz (https://sfz.tools/sfizz/) ships VST3 and LV2 builds; LV2 is unusable
here and sfizz is **not in the Fedora repositories**, so the install route is unverified. Choosing the
`.sfz` file inside the plugin headless (without its GUI) is also unverified. Treat it as optional: offer
it only to a user who already has sfizz, check `engine.vst3_plugins {rescan:true}`, and otherwise use
the WAV/FLAC files of the SFZ tree through route 1.

## Catalogue

### Starter pack, ~200 MB download, commercial use allowed with credits (see licences), plain `curl`

| Library | Size | Licence | Format, route | URL |
|---|---|---|---|---|
| GeneralUser GS v2.0.3 (the repo has no tags: the URL follows `main`, so check the version on download) | 32 MB | GeneralUser GS licence: free for commercial music; credit by linking the author page, never hot-link the file | SF2, route 2 | https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/main/GeneralUser-GS.sf2 |
| MuseScore_General | 40 MB | MIT | SF3, route 2 | https://ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General/MuseScore_General.sf3 |
| Upright Piano KW | 28.8 MB | CC0 | SF2 in .7z, route 2 | https://freepats.zenvoid.org/Piano/UprightPianoKW/UprightPianoKW-SF2-20220221.7z |
| MuldjordKit | 54.9 MB | CC-BY 4.0 | SF2 in .7z, route 2 (SFZ+FLAC variant 165 MB: route 1) | https://github.com/freepats/muldjordkit/releases/download/2020-10-18/MuldjordKit-SF2-20201018.7z |
| AVL Drumkits (Black Pearl 19 MB, Red Zeppelin 25 MB) | 44 MB | CC-BY-SA 3.0; per the vendor, music made with them may be sold without attribution | SF2, route 2 | index: https://www.bandshed.net/sounds/AVLDrumkits_SF2/ |
| FluidR3_GM (optional / if already installed; not in the ~200 MB) | 148 MB file (measured) | MIT | SF2, route 2; system package `fluid-soundfont-gm`, already present on some Fedora systems at `/usr/share/soundfonts/FluidR3_GM.sf2` | system package manager, run by the user (e.g. `sudo dnf install fluid-soundfont-gm` on Fedora; ask first) |

The starter pack is SF2/SF3, so it is only playable through route 2. Without fluidsynth, offer the
sampler-ready (WAV/FLAC) items instead: MuldjordKit SFZ+FLAC, Salamander SFZ+FLAC, VSCO 2 CE.

### Upgrades

- Salamander Grand Piano V3, CC-BY 3.0: SF2 310 MB
  https://freepats.zenvoid.org/Piano/SalamanderGrandPiano/SalamanderGrandPiano-SF2-V3+20200602.tar.xz ;
  SFZ+FLAC 742 MB in the same folder, `SalamanderGrandPiano-SFZ+FLAC-V3+20200602.tar.gz` (route 1).

### Full pack, ~8–10 GB

| Library | Size | Licence | Notes |
|---|---|---|---|
| VSCO 2 CE | ~2.3–3 GB | CC0 | orchestral, SFZ + WAV, route 1 or 3: https://github.com/sgossner/VSCO-2-CE/archive/refs/tags/1.1.0.zip |
| VCSL | ~4 GB | CC0 | optional; percussion and other instruments, SFZ + WAV: https://github.com/sgossner/VCSL |
| Sonatina Symphonic Orchestra v4.0 | 1.39 GB | CC Sampling Plus 1.0 (retired licence; commercial use is uncertain: say so, let the user decide) | https://api.github.com/repos/peastman/sso/zipball/v4.0 |
| FreePats GM SF2 | 238 MB | GPLv3+ with an exception for music made with it | route 2 |
| Karoryfer drums | 0.1–2.3 GB each | CC0 | route 1 |
| Philharmonia samples | 261 MB, MP3 | free including commercial use, but no resale as samples | lossy one-shots; route 1 after `ffmpeg` to WAV if needed |
| DrumGizmo DRSKit | 2.8 GB | CC-BY 4.0, MD5 `8c4d4b61ad9d354b3b845edd5da9c133` | made for the DrumGizmo engine: skip unless the user asks |

### Freesound one-shots (unverified: needs the user's account)

- Needs a free account and an API key (https://freesound.org/apiv2/apply). Text search and **previews**
  (lossy MP3/OGG) need only the token; **original files** need an OAuth2 step in the browser that the
  user completes. Limits: 60 requests/min, 2000/day.
- The key lives in an environment variable (e.g. `FREESOUND_API_KEY`) that the user sets; never write it
  to a file, a script, the manifest or a log, and keep it out of command lines that other processes can
  read: `printf 'Authorization: Token %s\n' "$FREESOUND_API_KEY" | curl -fsS -H @- "<api url>"`.
- Keep only CC0 and CC-BY sounds: filter on licence in the query and check each result's `license`
  field again; drop NonCommercial and Sampling+. Record every sound used in `CREDITS.txt` (id, name,
  author, licence, URL).

### Excluded by default

Licence unclear or restrictive: Arachno, Timbres of Heaven, Splendid Grand, Virtual Playing Orchestra.
Browser-only or gated: 99Sounds, Black Octopus, Sonniss (no redistribution, no AI training). Mention them
only if the user asks, with the reason.

## Install locations and the read root

- Per user: `~/.local/share/sounds/sf2/` (SF2/SF3 files) and `~/.local/share/sounds/sfz/<library>/`
  (one folder per SFZ/WAV library). Create a folder only when installing into it. System-wide:
  `/usr/share/soundfonts/` (package-managed; never write there yourself).
- Route 1 reads samples through SoundCraft, so they must be inside an `--automation-read-root` (links
  are resolved first, see "Sampler, verified live"). If the read root does not
  contain `~/.local/share/sounds`, either install into a folder inside the read root (and record that
  path in the manifest) or ask the user to add `--automation-read-root ~/.local/share/sounds` to the MCP
  server arguments; do not edit their configuration yourself. The CLI route has no roots.
- Route 2 does not need the root for the bank: fluidsynth reads the SF2 directly and writes its WAV into
  the project folder, which is inside the roots.

## Download safety checklist (every pack)

1. **Check first, never re-download**: read the manifest, confirm each listed file still exists (and its
   SHA-256 if in doubt); look in `~/.local/share/sounds/` and `/usr/share/soundfonts/`.
2. **Consent per pack**: before any download state the items, the total download size, the extracted
   size where known, and each licence; get a yes for that pack. Package installs (`fluidsynth`,
   `fluid-soundfont-gm`) need their own yes and go through the system package manager (e.g. `sudo dnf
   install …` on Fedora), which the user runs in their own terminal; never run sudo yourself.
3. **Space**: `df -h` on the target filesystem must show at least **2× the download size** free
   (archive plus extraction); for the full pack, 20 GB.
4. **Download into a new, empty temporary directory** (the session scratchpad or `mktemp -d`):
   `curl -fL --proto '=https' --retry 3 -o "$tmp/<file>" "<url>"`. One download at a time; report
   progress on large ones.
5. **Hash**: `sha256sum "$tmp/<file>"` and store it in the manifest (no upstream checksums are published,
   except the DrumGizmo MD5: compare it with `md5sum`). On a later re-install a mismatch means the file
   changed upstream: tell the user, do not install silently.
6. **Test before extracting**: `7z t`, `xz -t`, `gzip -t`, `unzip -tq`; list members (`7z l -slt`,
   `tar -tvf`, `unzip -Z1`) and refuse archives with absolute paths, `..` components, device files or
   symlinks pointing outside the archive.
7. **Extract each archive into its own new, empty folder** (`7z x -o"$dest"`, `tar -xf … -C "$dest"
   --no-same-owner --no-same-permissions`, `unzip -q -d "$dest"`), then move the result into the install
   location. Never run, source or `make` anything from an extracted tree (scripts, installers, `.exe`,
   Python): sample libraries are data. Parse `.sfz` files as text only.
8. **Keep licence files** (`LICENSE`, `README`, `*.txt` licence notes) beside the library; delete the
   downloaded archive and the temporary folder once the install is recorded.
9. **Record** the library in the manifest (below).

## Manifest

`~/.local/share/sounds/artcraft-libraries.json` (or the same name in the chosen install root), read at the
start of every music task so the question is skipped when what the brief needs is installed:

```json
{
  "version": 1,
  "libraries": [
    {
      "id": "muldjordkit-sf2",
      "name": "MuldjordKit SF2 2020-10-18",
      "kind": "sf2",
      "route": 2,
      "path": "~/.local/share/sounds/sf2/MuldjordKit.sf2",
      "licence": "CC-BY 4.0",
      "licence_file": "~/.local/share/sounds/sf2/MuldjordKit-LICENSE.txt",
      "attribution": "<credit line as given in the library's README or licence>",
      "source": "https://github.com/freepats/muldjordkit",
      "url": "https://github.com/freepats/muldjordkit/releases/download/2020-10-18/MuldjordKit-SF2-20201018.7z",
      "sha256": "<sha256 of the downloaded archive>",
      "bytes": 54900000,
      "installed": "2026-10-30"
    }
  ]
}
```

Write it with a small script that loads, appends and rewrites the JSON (keep a backup of the previous
version during the write). Take the attribution text from the library's own licence/readme, not from
memory. Never store API keys or tokens in it.

## Credits

Every song or sound that uses CC-BY or CC-BY-SA material gets `CREDITS.txt` in the project folder, next
to the session: one line per library or sound actually used (title, author, licence with its URL, source
URL, changes made such as "pitched, edited"). Include CC0 items as a courtesy, marked CC0. Tell the user
the file exists and that the credits must travel with the published work (description, liner notes).
GeneralUser GS: credit by linking the author page, never the raw download URL.
