---
name: effectcraft-motion
description: "Build motion graphics, animated titles, lower thirds, logo stings, kinetic typography, compositing and visual effects in EffectCraft (ArtCraft's After Effects-class compositor, via the `effectcraft` MCP server (mcp__effectcraft__*) or `effectcraft-cli`). Use whenever the user mentions EffectCraft or the effectcraft MCP tools, or asks for an animated composition, motion graphics, animated title/intro/lower third, keyframes, expressions, text animators, shape layers, particles, glow/blur/distortion, green-screen keying, rotoscoping, motion tracking, stabilizing, 3D cameras/lights, Lottie export, or to render a comp to MP4/ProRes/WebM/GIF/PNG sequence (with alpha); also .ecproj files. Covers comp, layers, keyframes, effects, frame-preview verify, render and the mandatory show-and-approve phase. Cutting/assembling footage on a timeline and colour grading belong to filmcraft-video, audio-only work to soundcraft-audio, still images to photocraft-images, static vector artwork to vectorcraft-illustration."
license: MIT
metadata:
  author: dnviti
  version: "1.1.0" # x-release-please-version
---

# EffectCraft motion graphics

EffectCraft is an open-source, After Effects-class compositor (alpha, v0.18): compositions made of
layers (solid, shape, text, footage, null, adjustment, camera, light, 3D primitives, nested comps),
keyframes and expressions, 307 effects, masks, roto, tracking, text animators, 3D, Essential
Graphics templates, a render queue, Lottie import/export. Project file: `.ecproj` (versioned JSON).
You drive it with the `effectcraft` MCP server (headless engine, no window) or with `effectcraft-cli`
from Bash. This skill says what to build, in what order, to what quality bar, and how to hand it over.

**Motion has an accent; the default one is the preset pack.** Left alone you will ease everything in
and out, slide it up with a fade, add a glow and spin the logo. Distinctive motion borrows its
physics from somewhere real (how a rubber stamp lands, how a split-flap board flips, how a theatre
curtain drags), obeys a rule that bans the reflex move, is chosen by the user from short tests that
move differently, and is judged by someone who did not keyframe it. Brand motion guidelines and the
user's direction win.

- Command ids and params by area: `references/command-catalog.md`
- Recipes (title card, lower third, kinetic type, logo sting, keying, tracking, Lottie, alpha render): `references/recipes.md`
- Siblings: `filmcraft-video` (cut/assemble/grade/mix/export a video; it can place EffectCraft renders),
  `soundcraft-audio` (audio only), `photocraft-images` (stills), `vectorcraft-illustration` (static vector art).

## 0. Ground rules for the tools

MCP tools: `command_list`, `command_run`, `command_batch`, `batch`, `list_commands`/`execute_command`
(aliases of the first two), `describe_command`, `doc_inspect`, `get_project`, `get_comp`, `get_layer`,
`get_property`, `set_property`, `add_keyframe`, `add_effect`, `list_effects`, `list_fonts`, `get_state`,
`render_frame`/`render_preview`, `open_project`, `save_project`, `undo`, `redo`, `history`, `run_script`,
`script_ui`. They are deferred: load schemas with ToolSearch (`+effectcraft`, max_results 30) first.

- **Every action is a command** (735). Discover with `command_list {filter:"keys."}` (id, label, `params`
  doc, `why` when disabled). Never call it unfiltered (135 KB). `describe_command {command}` returns a
  JSON schema; `execute_command`/`command_run` reject unknown keys. Trust the installed `params` doc.
- **Times are seconds.** `set_property`/`add_keyframe` `time` = comp seconds; the command `prop.set`
  takes layer seconds by default (`timeBase:"comp"` to switch). Pixels: comp space, origin top-left, y down.
- **Ids**: `comp.new` returns `{comp:id}`, `layer.new*` returns `{layer:id}` (a stable uid like 27, **not**
  the stack index). A layer reference accepts the id, `"#n"` (1-based index from the top, shifts as layers
  are added) or the exact name. Keep ids; names can duplicate.
- **Property paths** come from `get_layer {layer, flat:true}`: `transform/position`,
  `transform/opacity`, `transform/scale`, `transform/rotation`, `effects/#1/blurriness`, `masks/#1/feather`,
  `text/sourceText`, `@<uid>`. Colours `"#rrggbb"`, vectors `[x,y]` or `[x,y,z]`, scalars numbers.
- **Keyframes**: `add_keyframe {layer, path, keys:[{time,value}], interpolation:"easyEase"}` (linear, bezier,
  hold, easyEase/In/Out) is the fast route; `set_property` with `time` adds one key. Never leave default
  linear motion for UI-style animation.
- **Effects**: `add_effect {layer, effect:"Gaussian Blur"|"ec.blur.gaussian", values:{blurriness:12}}`; the reply
  lists every param path. `list_effects {filter}` for ids, categories (Keying, Blur & Sharpen, Color
  Correction, Distort, Generate, Simulation, Stylize, Transition, Time, Perspective...), and
  `command_run effect.list {filter:"Glow"}` for param ids, ranges, enum options.
- **Atomic multi-step**: `batch {steps:[{command,params}], label}` = one undo step, rolls back on failure;
  a string param `"$N"`/`"$N.key"` is the result of step N (1-based). `command_batch {steps:[{id,params}]}` is not atomic.
- A failing command leaves the project unchanged; read the error. Programmatic calls never open dialogs.

## 1. File access: check this first

`effectcraft-cli mcp` accepts `--automation-read-root DIR` / `--automation-write-root DIR` (repeatable).
- **Without roots**: unrestricted (verified), scripts allowed.
- **With roots** (MCP registered with `--automation-read-root/--automation-write-root`): reads must be under a
  read or write root, writes under a write root, anything else fails with `cannot read/write ...: it is
  outside the automation roots`. **While confined, scripting is refused**: `run_script`, `file.runScript`,
  `script.run` fail with "not available while file access is confined". Do not try to work around it:
  express the work with commands (everything a script does has a command), or tell the user once.
- **Preflight** at the start: `get_state`, then try the real `open_project`/`save_project` path. If a
  path is refused, put files in an allowed folder (the project dir, or a scratch dir inside a granted
  root) and tell the user once that widening the roots is the cleaner fix (add
  `"--automation-read-root","/abs/dir","--automation-write-root","/abs/dir"` to the MCP server args, e.g.
  re-register it with `claude mcp add`, restart Claude Code). Never edit the user's config yourself.
- **CLI route** (Bash, not confined, works anywhere; each call is a full pipeline on a project file):
  ```bash
  effectcraft-cli info --project /abs/x.ecproj                      # summary
  effectcraft-cli exec comp.new '{"name":"Main"}' --project /abs/x.ecproj --save
  effectcraft-cli set Main '#1' transform/position '[100,360]' --time 0 /abs/x.ecproj --save
  effectcraft-cli render-frame --comp Main --time 1.2 --max-side 960 --out /scratch/f.png --project /abs/x.ecproj
  effectcraft-cli render --project /abs/x.ecproj --comp Main --out /abs/out.mp4 --format h264
  effectcraft-cli script FILE.jsx /abs/x.ecproj      # JSX/AE object model; only here, user-visible; use sparingly
  ```
  `--save`/`--save-as F` persist; `--json` machine output; `run <id> <json> ...` chains commands.

## 2. Workflow

1. **Brief**: what is it for (social 9:16/1:1/16:9, broadcast, web overlay with alpha, Lottie), size, frame
   rate, duration, brand colours/fonts/logo files, existing footage, where it ends up (alone, or placed in a
   FilmCraft edit). Ask only what you cannot infer; propose defaults (1920x1080, 30 fps, 5 s, sRGB).
2. **Safe start**: footage and assets are only *referenced* by an `.ecproj`, never modified. Keep sources
   where they are; save the project in the project directory (descriptive name). Existing project: `open_project`,
   `get_project`, `get_comp`, reuse comps/footage.
3. **Plan** (a few lines): comp spec, layer stack (bottom to top), the motion (what moves, when, how long,
   easing), palette/type, the one memorable moment. Timing sheet in seconds before keyframing. Add a
   **physical motion source** from the subject's world and what it dictates (a press: hard hit, no
   overshoot, 2-frame squash; a tide: slow, layered, never fully still), plus **1-2 rules** that block
   the reflex (one axis of motion only; no opacity fades, only cuts and masks; hold keys on twos at
   12 fps; one custom ease curve for the whole piece). Each move should trace to the brief, the source
   or a rule.
4. **Motion tests** (skip for small edits or when brand motion is fixed): 2-3 directions (one quick
   comparison for a single lower third), each a style frame plus a 1-2 s test of the key move, in
   separate comps of one project, differing in motion character, type and palette. Build the options
   sequentially in the one headless session, never in parallel subagents. Save and open the project
   (section 8), point to each comp, then ask with the multiple-choice question tool (AskUserQuestion in
   Claude Code; else a numbered list), multi-select for hybrids. Never pick for the user. This rule
   covers creative directions, while technical options may carry a labelled recommendation. Inside a
   subagent, return the options (project path, comp names, brief) to the orchestrator, which asks the
   user.
5. **Build** foundation first (comp, background, assets), then layers, then animation, then effects, then polish.
6. **Verify loop** after each block (section 5). 7. **Save** the `.ecproj`, then **Show and approve** (section 8).
8. **Final render** only after acceptance (section 7), unless the user asked for the render up front.

Scale to the request: a title card is one comp, 3 layers and 6 keyframes, not a 40-layer project.

## 3. Craft know-how

- **Comp first**: `comp.new {name,width,height,frameRate,duration,background}`. Frame rate to the destination
  (24/25/30/60). Even pixel sizes. Pick the duration with a tail (hold the end 0.5-1 s).
- **Layers, not baked pixels**: solids/shapes/text stay editable. Name every layer (`name` param or
  `project.rename`), parent with `layer.setParent` (nulls for rigs), group repeated motion in precomps
  (`layer.precompose`) and reuse; use `layer.newAdjustment` for global grade/glow/vignette on top.
- **Motion principles**: no unshaped linear moves; start from `easyEase`, then give the curve the plan's
  character with `keys.setEase` influence rather than leaving the same ease on every key. 12-24 frame
  moves for UI-scale motion, overshoot sparingly, stagger (offset 2-4 frames per item; `layer.sequence`, text animators
  with range selectors), anticipation + settle, a clear read time (titles hold >= 1.5 s per line). Animate
  anchor/scale from the right anchor point. Motion blur on (`comp.setSwitch motionBlur` + per-layer `layer.setSwitch`).
- **Text**: `layer.newText {text,font,style,size,fill,position|box,justify,tracking}`; check fonts with
  `list_fonts {query}` / `text.fonts` (missing families fall back silently). Animate with text animators
  (`layer.addTextAnimator {properties:[...]}` + `layer.addTextSelector`) or `anim.applyBuiltinPreset`
  (`anim.builtinPresets` lists fadeIn, wipeInFromLeft, ...). Keep safe margins (about 5%) and legible contrast.
- **Shapes**: `layer.newShape {kind,size,fill,stroke}` / `shape.newShape` / `layer.addShapeItem` (trim paths,
  repeaters, wiggle, zigzag, offset) for strokes that draw on and icon-style loops.
- **Effects stack order matters** (top to bottom per layer): key/matte -> clean-up -> colour -> blur/glow -> distort -> stylize.
  Prefer GPU-flagged effects (`list_effects` shows `gpu`); headless renders on the CPU, so heavy simulation
  (CC Particle World, Caustics, Fractal Noise at 4K) previews slowly: preview small.
- **Expressions** for rigs and loops: `prop.setExpression {layer,path,expression}` (AE-style JS, e.g.
  `wiggle(2,20)`, `loopOut("cycle")`, `Math.sin(time*3)*10`); validate with `expr.errors`. Use pick-whip
  (`prop.pickWhip`) and Slider/Point controls (Expression Controls effects) for one-knob adjustments.
- **Keying** (green screen): Key Light (`ec.keying.keylight`: screenColour, screenGain, screenBalance, clip
  black/white, `view` to inspect the matte, despill) or Color Difference Key / Screen Key, then Advanced Spill
  Suppressor, Matte Choker / Refine Soft Matte; garbage mask first (`layer.addMask` / `mask.new`) and view
  Screen Matte/Final Result. Roto: `roto.*` (Roto Brush; the MobileSAM model is an optional download, ask before
  `roto.model.download`), `objectMatte.apply`, `track.mask`.
- **Tracking**: `track.new {layer, kind:transform|stabilize|affine|perspective}` -> `track.setPoint` ->
  `track.analyze {wait:true}` -> `track.apply` (writes keyframes to a target layer: `track.setTarget`);
  `track.warpStabilizer` / `warp.analyze` for shaky footage; `track.camera` (3D Camera Tracker) then
  `camera.createFromSolve`. Analysis is slow on long clips: work on the work area.
- **3D**: `layer.newCamera`, `layer.newLight`, `layer.new3dPrimitive`, `layer.newModel` (gltf/obj/stl/fbx), `layer.setSwitch threeD`;
  `comp.renderer advanced3d` for PBR/shadows.
- **Colour & bit depth**: `file.projectSettings {bitDepth:8|16|32, colorEngine, workingSpace, linearize}`; default 8 bpc
  sRGB. 16/32 bpc for glow/gradients that band, or HDR/linear work; ACES via `colorEngine:"ocio"`.
- **Footage**: `file.import {paths, addToComp:true}` (stills, video, audio, image sequences with `sequence:true`,
  PSD/AI/PDF with `importAs`, Lottie via `file.importLottie`, `.ecproj` via `file.importProject`); pick
  `file.interpretFootage` for frame rate/alpha/colour profile; heavy footage: `file.createProxy` +
  `file.useProxy`, render with proxies off (`renderQueue.setRenderSettings proxyUse:"none"`).
  Missing media: `footage.missing`, `file.relinkFootage {folder, dryRun:true}`.
- **Reusable assets**: `essential.*` builds Essential Graphics controls and `.ectemplate` templates
  (`essential.exportTemplate`); `templates.create` instantiates; `effectcraft-cli render --template T.ectemplate --values V.json`
  renders one instance (batch many titles with different text). `anim.savePreset` stores `.ecpreset`.
- **Default tells** (preset-pack giveaways; use only when the brief asks):
  - the same `easyEase` on every key, and every element fading in while sliding up a few pixels;
  - lens flares, light leaks, generic outer glow or bokeh/particle loops as background filler;
  - the logo that spins, flips in 3D or punches out of a particle burst, with a whoosh;
  - typewriter reveals and per-word scale-pops by reflex in kinetic type;
  - a lower third as a gradient bar sliding in from the left with a drop shadow;
  - RGB-split glitches, camera shake or `wiggle()` on everything as "energy";
  - all items staggered by the same offset in the same direction.
- **Do not fabricate evidence**: no fake news/official graphics, no deceptive impersonation of real brands or people.

## 4. Building blocks

| Goal | Commands / tools |
|---|---|
| New comp / project | `file.newProject`, `comp.new {name,width,height,frameRate,duration,background}`, `comp.settings`, `comp.workArea {start,end}` |
| Layers | `layer.newSolid/newShape/newText/newNull/newAdjustment/newCamera/newLight/new3dPrimitive`, `layer.addItem {item}`, `layer.precompose`, `layer.setParent`, `layer.setBlendMode`, `layer.setTrackMatte {matte,kind}`, `layer.setSwitch` |
| Animate | `add_keyframe`, `set_property`, `prop.setExpression`, `keys.easyEase`, `keys.setEase`, `keys.wiggle`, `keys.smooth`, `motion.sketch`, `layer.sequence` |
| Effects | `add_effect`, `effect.apply/remove/reorder/toggle/reset`, `effect.pickColor`, `list_effects` |
| Masks / matte | `layer.addMask`, `mask.new {vertices}`, `mask.featherPoint.*`, `layer.setMask`, `objectMatte.apply`, `roto.*` |
| Type | `layer.newText`, `layer.setText`, `layer.addTextAnimator`, `anim.applyBuiltinPreset` |
| Track | `track.new/analyze/apply`, `track.warpStabilizer`, `track.camera`, `track.mask`, `puppet.addPin` |
| Look | `view` commands are UI only; use effects (`ec.color.*`, Glow, Curves, Tint, Vignette via CC Vignette) |
| Inspect | `get_project`, `get_comp`, `get_layer {flat}`, `comp.info`, `project.summary`, `expr.errors`, `jobs.list` |
| Output | `render_frame`, `renderQueue.add/render`, `comp.saveFrameAs`, `comp.saveFrameAsPsd`, `file.exportLottie`, `file.exportTimeline` |

## 5. Verify loop (mandatory)

After each block, not only at the end:
1. **Numbers**: `get_comp` (layer order, in/out points, switches, parents, mattes), `get_layer {flat:true}` (values,
   keyframes, expressions, `effects/#n`). Look for the active comp being the wrong one (most common slip: `comp`
   omitted acts on the active comp), a layer shorter than the comp, an unparented child, an effect applied to the wrong layer.
2. **Look**: `render_frame {time, max_side:960}` (PNG inline; add `path` to keep it; `transparent:true` for alpha).
   Check at least first frame, a mid-motion frame, the settled frame and the last frame; for fast motion also
   2-3 neighbouring frames. Check safe margins, text legibility and edges/halos (keying), banding in gradients,
   blown glow, aliasing, text clipped by its box, unintended black/transparent areas.
3. **Expressions**: `expr.errors` returns the list; fix or remove failing ones.
4. **Motion**: sample positions at several times (`get_property {path, time}`) to confirm easing and end values;
   a few frame previews at `time` 0.1 s apart reveal pops, overshoot and holds.
5. **Cheap clip check** (optional, once): render a quarter-res few-second clip with `effectcraft-cli render
   --start 0 --end 2 --resolution quarter --out /scratch/p.mp4`, then extract frames with
   `ffmpeg -v error -i p.mp4 -vf fps=4 /scratch/p_%02d.png` and Read a few; `ffprobe` confirms size/fps/frames.
6. Before saving: no stray test layers, layer names sensible, comp duration/work area right, footage online (`footage.missing`).
7. **Fresh-eyes review** (anything beyond a small edit, before section 8): a fresh subagent with a clean
   context, not a fork, gets only a frame strip (frames every 0.1-0.25 s across the key moves, from step
   2 or 5), the plan with its motion source and rules, and the tells in section 3. Its prompt: a motion
   director who did not make this lists what looks like a preset or template, where the motion source
   is lost, and any legibility or timing failure, ordered by severity with a one-line direction for
   each fix; no praise, no re-animation. Address the severe ones; report what you skip and why.
   Inside a subagent, return the critique inputs (frame strip paths, plan, tells) to the orchestrator,
   which starts the reviewer.

## 6. Save

`save_project {path}` (or `file.save`, `file.saveAs`, `file.saveCopy`); `open_project {path}` / `{new:true}`.
Descriptive names (`brand-intro-v2.ecproj`). `file.saveCopyAsXml` writes a diffable `.ecprojx`. Before
sharing the project with someone else, `file.collectFiles {folder}` gathers footage next to it. The headless
session is lost when the MCP server stops: save before finishing (the server can also run with `--autosave`).

## 7. Render / export (after acceptance)

Render queue (what the app uses): `renderQueue.add {comp, format, output, resolution, timeSpan, channels, ...}` then
`renderQueue.render {wait:true}` (`renderQueue.list/stop`, `jobs.list`). Quick: `effectcraft-cli render --comp Main
--out FILE --format F [--start S --end E | --work-area] [--fps N] [--resolution full|half|third|quarter|K]
[--quality best|draft] [--channels rgb|rgba]`.
- Formats (verified list): `h264`, `hevc`, `av1` (mp4), `prores` (mov, `proresProfile` proxy|lt|standard|hq|4444|4444xq),
  `uncompressed` (mov), `webm` (VP9/AV1 + Opus), `gif`, sequences `png`/`jpeg`/`tiff`/`exr`, audio `wav`/`aiff`.
  Alpha (`channels:"rgba"`): ProRes 4444, WebM, PNG/TIFF/EXR sequences, GIF; not H.264/HEVC/AV1. Run
  `renderQueue.formats` for what this build offers.
- Defaults: H.264 15 Mbps "Match Render Settings". Tune with `bitrate` (kbps), `rateControl`, `keyframeInterval`,
  `audio:on|off`, `audioBitrate`. Web/social: H.264 MP4, 8-15 Mbps for 1080p, AAC audio comes from the comp's audio layers.
  Editing handoff (to filmcraft-video or another NLE): ProRes 422 HQ (opaque) or 4444 (alpha), or a PNG/EXR sequence.
  Transparent overlay for web: WebM (VP9) with alpha. Looping badge/sticker: GIF (small) or WebM/APNG-like PNG sequence.
  Vector-friendly delivery: `file.exportLottie {comp, path}` (shape/solid/text-as-shapes comps; check support).
- A PNG sequence `--out seq.png` writes `seq_00000.png, seq_00001.png...`: render into a dedicated empty folder.
- Render at `full` resolution and with proxies off for finals; previews at half/quarter. Verify the output
  with `ffprobe` (size, fps, frame count, codec) and look at a frame; report the absolute path.
- `renderQueue.add` appends to a queue that exists only in the open project/session; clear stale items.

## 8. Show and approve (mandatory final phase)

Every task ends here, after the verify loop. The headless session has no window, so the user cannot see the
work until it is saved and the real app is opened on it.

1. **Save** the project as `.ecproj` in the project directory or the path the user named, with a descriptive
   name, never over an existing project unless asked. Optionally also render a small preview clip or still
   next to it. Note full absolute paths.
2. **Open EffectCraft on that file, detached** (verified: `/usr/bin/effectcraft`, `effectcraft [FILE]`):
   `setsid effectcraft /abs/path/project.ecproj >/dev/null 2>&1 &`
   `.ecproj` has **no registered MIME type or desktop MimeType**, so `xdg-open` will not open it: always launch the
   binary with the path. If the app is already open on this project (bridge/`--control`), do not launch a second
   copy; tell the user to reload/open the file. Do not leave an instance you started running unless the user wants it.
3. **Stop and ask.** Give the full path and ask the user to accept or describe changes. No final render
   (other sizes/codecs/alpha variants), Lottie export or handoff before explicit acceptance. Silence or a vague
   reaction is not acceptance. (If the user asked for the render up front, deliver it, and still show and approve.)
4. **Loop on changes**: apply them, redo the verify loop for what changed, save again, reopen (tell the user to
   reload if the file is already open), ask again.
5. **Inside a subagent** (cannot talk to the user): do steps 1 and 2, then return the file path(s), a short
   summary of the composition (size, fps, duration, layers, effects), and state clearly **"awaiting user
   approval"**. The orchestrator asks the user and relays changes; final render/handoff waits for acceptance.

## 9. Top gotchas (more in `references/command-catalog.md`)

- Confined MCP (`--automation-*-root`): scripting is refused and paths outside the roots fail; do not retry, change path.
- `comp` omitted = active comp; after `open_project` or `file.newProject` the active comp may be null: `comp.open`/`comp.new` first.
- Layer ids are uids; `#n` indexes shift when layers are added; re-read `get_comp` after structural edits.
- `prop.set` time defaults to *layer* seconds, `set_property`/`add_keyframe` to comp seconds; a layer starting at t>0 offsets them.
- `set_property` without `time` on an animated property sets/creates a key at the current time (the comp's playhead,
  often 0): pass `time` explicitly or you overwrite the first key.
- `add_effect` with a bad value name applies nothing (atomic): copy ids from the returned `params` paths.
- A layer is only as long as its in/out: a layer made when the comp is 5 s keeps that length if you extend the comp.
- Text boxes: no `box` = point text; long copy needs a `box` or it runs off-screen. Missing fonts fall back silently.
- Footage with alpha needs `file.interpretFootage alpha:straight|premultiplied`; halos usually mean the wrong mode.
- Headless render is CPU (`--gpu` flag on the CLI); big comps are slow: preview at `max_side` 480-960 and render quarter-res drafts.
- Renders write beside `--out`; a relative path is relative to the working directory: use absolute paths.
- `help.*`, `view.*`, `window.*`, `shortcuts.*` commands are UI-only in headless; they do nothing useful.
- Roto/face models are optional downloads (`roto.model.download`, `face.model.download` use curl and the network): ask first.
- Alpha status: some effects/parity gaps exist (`docs/gaps.md` in the app repo); if an effect misbehaves, try the
  Legacy/Obsolete variant or another route and note it for the user.
- Cleanup: close nothing the user opened; delete only scratch files you created.
