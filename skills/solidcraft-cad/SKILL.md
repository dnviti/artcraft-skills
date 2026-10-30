---
name: solidcraft-cad
description: "Design parametric 3D parts in SolidCraft (ArtCraft's parametric CAD app, driven through the `solidcraft` MCP server, tools `mcp__solidcraft__*`; units mm, Z up). Use whenever the user mentions SolidCraft or its MCP tools, or asks to design, model or build a 3D part: bracket, mount, plate, flange, enclosure/box with lid, gear, standoff, clip, adapter, jig, anything 3D-printable or machinable; or to change a parameter of, measure, check, import (STEP/STL/3MF) or export (STEP/STL/3MF) a SolidCraft design. Covers parameters-first modeling, fully constrained sketches, extrude/revolve/fillet/shell/hole/pattern/mirror, printability rules, the measure-against-spec verify loop, saving, and the mandatory \"show and approve\" phase (save the .solidcraft file, open the desktop app, wait for the user's acceptance)."
license: MIT
metadata:
  author: dnviti
  version: "1.1.0" # x-release-please-version
---

# SolidCraft CAD

SolidCraft is an independent parametric 3D CAD app (sketch, constrain, dimension, features, a
parameters table that rebuilds the model). You drive it through the `solidcraft` MCP server. This
skill says **what to build, in what order, to what quality bar**, and how to finish (show, approve,
export). The MCP ships its own command reference; this skill folds in the essentials and tells you
when to read more.

- Command shapes, ids, traps and a worked example (read it once per task if unsure):
  `skill_reference {"skill":"solidcraft-modeling"}` (default `reference.md`; `SKILL.md` has the
  build recipe). Also `solidcraft-editing`, `solidcraft-checking` (parameter-range walks, STEP
  comparison), `solidcraft-mechanisms` (assemblies, joints).
- More detail and recipes: `references/recipes.md`; traps: `references/gotchas.md` (in this skill).

## 0. Ground rules for the tools

Tools are deferred: load schemas with ToolSearch (`+solidcraft`, max_results 30) before calling.

`batch`, `execute`, `list_commands`, `describe_command`, `inspect_design`, `measure`,
`body_topology`, `set_parameter`, `screenshot`, `save`, `open`, `export`, `new_design`, `undo`,
`redo`, `running`, `pending`, `crash_reports`, `skill_reference`.

- **Never call `list_commands` unfiltered** (over 100 KB). Filter on a distinctive word (`"hole"`,
  `"slot"`, `"sketch.constraint"`, `"pattern"`). `describe_command {id}` gives one command's params.
- **Check what you are driving first**: `inspect_design {"measure":false,"sketches":false}`. The
  server instructions end with `Backend: headless` (in-process session, the user sees nothing) or
  `Backend: connected to the SolidCraft app` (the user watches). If the design already has
  timeline features, do not `new_design`/`open` without asking: both discard unsaved work.
- **Batch for atomicity**: `batch {commands:[{command, params}]}` is all-or-nothing (rolled back on
  the first error; reply names `failed.index` and `failed.error`). Build a stage per batch:
  (1) parameters, sketch, dimensions, finish, first feature; (2) fillets/shell; (3) holes, cuts,
  patterns. Put a risky step (booleans between curved faces) in its own batch. Pass
  `"verbose": false` to keep replies small.
- **Lengths are mm**, unit suffixes work (`"1 in"`, `"30 deg"`); any numeric field may be an
  expression naming parameters (`"w/2 - wall - 6"`). A plain number never follows a parameter.
- **Sketch ids are predictable**: `l1`, `c1`, `a1`, `p1`, `c1.center`, `l1.start`, `origin`;
  `rectangle.center` makes `l1-l6` + `p1-p5` (2 construction diagonals). Read `created` instead of
  guessing when unsure.
- **"still running:" / `pending`**: a call whose error starts `still running:` was **not
  cancelled**. Never resend it. Call `pending` (waits up to 60 s; `done:false` means call it
  again). `running` shows what the app is executing/queued, answering at once; use it when a call
  timed out or the app feels slow, before re-sending a change. Other calls queue behind a running
  one.
- **Failures leave the design unchanged**; a feature that "succeeds" can still have missed (a cut
  that hits nothing). Only `measure` against your numbers proves it.

## 1. Workflow overview

1. **Brief**: purpose, material/process (FDM, resin, CNC, sheet), the mating parts (screw sizes,
   board dimensions, shaft diameters), envelope limits, load/orientation. Ask only what you truly
   cannot assume; otherwise state assumptions in one line.
2. **Plan on paper** (before any call): parameters with defaults, placement (centre the part on
   the origin so patterns/mirrors use the principal planes), feature list with the world point for
   every edge/face pick, **expected volume and bounding box** (compute by hand).
3. **Build** in 3-4 batches (section 3-4).
4. **Verify loop** after each stage (section 5).
5. **Parameter test**: `set_parameter` to a very different value, expect `errors: []`, `measure`
   again, then set back.
6. **Show and approve** (mandatory, always last): save, open the desktop app, stop and wait for the
   user's explicit acceptance (section 8).
7. **Export / handoff** (STEP, STL, 3MF) only after acceptance, unless the user asked for it up
   front.

State a short scope + acceptance checklist before mutating. Stop when the checklist passes; don't
grow a bracket request into an assembly.

## 2. Design intent: parameters first

- **Every dimension that the user or the mating part cares about is a named parameter**:
  `parameters.add {name, expression, unit?, comment?}` (`unit:""` for counts). Names: `wall`,
  `hole_d`, `board_w`, `clearance`, `n_holes`. Derived values are expressions of other parameters
  (`inner_w = board_w + 2*clearance`), never retyped numbers. Comment each driving parameter with
  its allowed range ("whole number, 2 or more"): SolidCraft enforces no range.
- **Fully constrained sketches (dof 0)**: a sketch with dof left can silently solve to a different
  shape after a parameter change. Prefer `sketch.draw.dimensioned` (shape + dimensions in one
  step; roles: rectangle `width`/`height`, circle `diameter`/`radius`, line `length`/`angle`, slot
  `length`/`width`, polygon `radius`). Dimension positions **from `origin`** with expression values
  so holes follow parameters. Check `sketch.solve` (under 100 B: dof, status, profile count).
- **Avoid dimensions that can reach 0** across the parameter range (a point loses its side and may
  jump). Count parameters must stay at 1 or more.
- **Distances are unsigned**: draw the geometry on the correct side first, the dimension keeps it.
- **Name every feature and sketch, uniquely** (`"name":"Plate"`, `"name":"MountHoles"`).
  `timeline.roll_to` and pattern `features:[...]` pick by name.
- **One feature per thing the user thinks of** (a port, a row of standoffs), so it can be edited
  alone.
- Prefer sketch profile + `solid.extrude` for cuts that touch curved faces; primitive
  (`solid.box`/`solid.cylinder`) cuts against curved faces can fail ("planar faces only").
- Expressions: `+ - * / ^ %`, trig, `sqrt abs min max floor ceil round mod`, `pi`, units; no `if`.

## 3. Sketch planes and picking things

| `plane` | sketch x | sketch y | normal |
|---|---|---|---|
| `"XY"` | +X | +Y | +Z |
| `"XZ"` | +X | **-Z** | +Y |
| `"YZ"` | +Y | +Z | +X |
| `{origin,x_dir,y_dir}` | x_dir | y_dir | x_dir x y_dir |

`offset:"expr"` on `sketch.create` moves the plane along its normal and follows parameters. Top
face of a part of height `h`: `{plane:"XY", offset:"h"}`. A feature at world height z drawn on an XZ
sketch sits at sketch y = **-z**. A hole sketch must be on the face the hole starts from.

- **Edge/face picks** for `solid.fillet`, `chamfer`, `shell`: plain numeric `[x,y,z]` points that
  snap to the *nearest* edge/face (refused if farther than 5% of body size). Compute exact
  midpoints from your geometry (vertical corner edge of a centred box: `[w/2, d/2, h/2]`). One pick
  takes the whole tangent chain (a rounded rim needs 1 point). Faces can be named
  (`"F1:+z"`). `body_topology {body}` lists edges/faces with midpoints (25-45 KB, last resort).
- A pick is resolved once, then follows its edge when parameters change.

## 4. Key commands (params)

| Command | Params and notes |
|---|---|
| `sketch.create` | `plane`, `name?`, `offset?` |
| `sketch.rectangle.two_point` / `.center` | `p0,p1` / `center,corner` |
| `sketch.circle.center` | `center, radius` (makes `c1`, `c1.center`) |
| `sketch.line` | `points, closed` ; also arcs, slots (`sketch.slot.overall`/`center_to_center` `p0,p1,width`), polygons, `sketch.point` |
| `sketch.dimension` | `entities, value, type?` (`horizontal`/`vertical`/`diameter`); `["origin","c1.center"]`, `["l1"]`, `["l1","c1"]` |
| `sketch.constraint.*` | `coincident, horizontal_vertical, tangent, equal, parallel, perpendicular, symmetry (line:"y"), midpoint, concentric, collinear, fix, polygon` |
| `sketch.finish` | closes the sketch editing |
| `solid.extrude` | `distance`; `operation` new/join/cut/intersect/auto; `direction` positive/negative/symmetric; `through_all`; `profiles` (default: every region; nested region = hole); `start_offset`; `taper` |
| `solid.revolve` | `axis` (sketch line id, `x`/`y`, world `X|Y|Z`, `{origin,dir}`), `angle?` (default 360 deg), `direction?: symmetric` |
| `solid.box` | `length,width,height`, `center` or `corner`, `body_name`, `operation`, `targets` |
| `solid.cylinder` | `radius|diameter, height`, `base` (centre of bottom), `axis`, `operation` (always pass it) |
| `solid.fillet` / `solid.chamfer` | `edges:[[x,y,z]]`, `radius` / `distance` |
| `solid.shell` | `faces:[[x,y,z]]` to remove, `thickness`. Fillet outside edges first; round the open rim after |
| `solid.hole` | `sketch`(+`points`) or `position:[x,y,z]` (expressions ok) + `diameter` or `clearance:"M3"`; `type` simple/drilled/counterbore (`cb_diameter`,`cb_depth`)/countersink (`cs_diameter`,`cs_angle`); `depth` default through; `references:[{edge,distance}]` ties position to edges |
| `solid.pattern.rectangular` | `features:[names], dir1, count1, spacing1` (+`dir2,count2,spacing2`); expressions/params ok |
| `solid.pattern.circular` | `features, axis ("Z"|{origin,dir}), count, angle?` |
| `solid.mirror` | `features:[names]` or `bodies:[names]`, `plane` XY/XZ/YZ or `{origin,normal}`, `combine?`; cannot mirror/pattern a pattern/mirror feature |
| `solid.loft` | `sections:[{sketch,...}]`, `rails?` ; sweep, draft, split, boolean (`list_commands` filter) |
| `parameters.add` / `parameters.change` | `name, expression, unit, comment`; one change: `set_parameter`; many: one `batch` of `parameters.change` (`coalesce_parameters:true`) |
| `body.rename` | `{body, name}` |
| `file.insert_step` / `file.insert_mesh` | insert into the current design (tool `open` replaces it) |
| `view.pick` | `{pixels:[[x,y]]}` on a screenshot: body, face, world point |

Worked example (plate with counterbored holes on a parametric pattern) is in the MCP's
`reference.md`; a compact enclosure recipe is in `references/recipes.md`.

## 5. Verify loop (mandatory)

After each stage:

1. `measure {}` (about 0.9 KB per body): compare **volume, bounding box, COM, face count** with the
   numbers you computed. Volumes agree to 0.001-0.01% when right. A hole or cut that leaves volume
   unchanged **missed**. Compare logical `faces`, not `kernel.faces`.
2. `inspect_design {"measure":false,"sketches":false}`: timeline `error`/`warning` per feature
   (a `Boolean retry:` warning means check the volume; geometry may be wrong with no error).
3. Positions: asymmetric part, check the COM shift; symmetric/patterned layouts, take a `top`
   screenshot and compare pixel distances against a known size. `measure {items:[...]}` gives
   distances between faces/edges/centres, circle diameters, wall thickness.
4. `screenshot {"source":"model","view":"iso","width":480,"height":320}` and **look at it**; use
   `top`/`front` for features inside walls. When bridged, without `source:"model"` you get the
   whole app window and `view` moves the user's camera; leave `view` out unless asked.
5. `set_parameter` on a driving parameter to the other end of its range, expect `errors: []`,
   re-`measure`, then restore.
6. Check against the spec: every user-stated dimension, wall >= printable minimum, hole sizes
   with clearance, mating features line up. Report the numbers.

## 6. Printability and manufacturing know-how

Defaults for FDM (state the assumption, adjust to the user's printer/material):

- **Walls**: >= 1.2 mm (3 perimeters at 0.4 mm nozzle); structural 2-3 mm. Floors/lids >= 1.2 mm.
  Ribs >= 1 mm, ideally 0.5-0.6x the wall they stiffen. Check the thinnest wall with `measure
  {items:[face,face]}`.
- **Clearances**: sliding/lid fit 0.2-0.3 mm per side, press fit 0.1 mm, loose fit 0.4-0.5 mm.
  Make `clearance` a parameter and add it to the mating part's pocket, not the nominal size.
- **Holes**: printed holes come out ~0.1-0.2 mm small; M3 clearance 3.4 mm (3.2 tight), M4 4.5 mm,
  M5 5.5 mm; heat-set insert holes per the insert's datasheet (M3: about 4.0-4.2 mm, depth + 1 mm).
  Counterbore/countersink via `solid.hole`. `clearance:"M3"` is available.
- **Overhangs**: keep <= 45 deg from vertical without supports; bridges <= 10 mm; use chamfers
  (not fillets) on the bottom edges that face the build plate; teardrop or diamond horizontal
  holes. Orient the flattest large face on Z=0 (Z is up = print direction).
- **Fillets/chamfers**: 0.5-1 mm on the first layer edge (elephant-foot chamfer), larger on
  vertical corners (stress, nicer print). Radius must be smaller than half the thinnest wall
  adjacent.
- **Min feature**: text/emboss >= 0.6 mm deep, 1 mm line width; pins >= 3 mm diameter.
- **Snap-fits / lids**: lip height 1.5-2 mm, 0.2 mm clearance, draft the lead-in.
- **Machining/CNC**: inside corner radius >= tool radius, pocket depth <= 3x tool diameter, keep
  tolerances realistic; sheet metal via the sheet commands (`list_commands {filter:"sheet"}`).
- Put the print-critical numbers in the summary you return (wall, clearance, hole diameters).

## 7. Save and export

- **Native**: `save {path}` writes `.solidcraft` (container); `.json` path writes plain JSON (git
  friendly). Without `path` it saves to the design's current file.
- **Headless save is path-restricted**: the headless MCP may only write to its own folders (an
  error lists them: `~/.local/share/solidcraft/recovery` and a
  `/tmp/solidcraft-mcp-<pid>-<hash>` dir; "allow another folder with `--allow-path DIR`"). If the
  target path is refused: `save` to the allowed temp dir, then `cp` it with Bash to the
  project/user path. Always report the final absolute path and verify the file exists.
- **Export** (`export {path, bodies?, format?}`): `.step/.stp` for CAD/CNC, `.stl` (binary) or
  `.stla` (ASCII), `.3mf` for printing (`3mf-tagged` keeps names), `.obj`, `.urdf` (assemblies with
  joints). The same path restriction applies; the same copy workaround works. Export only after
  acceptance unless asked up front; pick units mm; export one body per file for multi-part prints
  (`bodies:["Base"]`).
- Import: `open {path}` (.solidcraft, .step/.stp, .3mf/.stl/.obj/.glb/.gltf; `up:"y"` for Y-up
  STEP) replaces the design. Insert into the current one with `file.insert_step` /
  `file.insert_mesh`.
- CLI (no MCP needed): `solidcraft-cli run script.json --out part.step`, `solidcraft-cli snapshot
  design.solidcraft --out shot.png --view iso`, `solidcraft-cli script design.solidcraft` (design
  history as a replayable command script).

## 8. Show and approve (mandatory final phase)

Every design ends here, after the verify loop. A headless session has no window: the user cannot
see the part until you save it and open the real app on it.

1. **Save** the design to the project directory, or the path the user named, as
   `<descriptive-name>.solidcraft` (e.g. `esp32-case.solidcraft`). If `save` refuses the path (see
   section 7), save to the allowed temp dir and `cp` it there. Note the full absolute path and
   confirm the file exists.
2. **Open SolidCraft on that file**, detached so it does not block:
   `setsid solidcraft /abs/path/part.solidcraft >/dev/null 2>&1 &`
   (verified: `solidcraft [--control PORT] [--sample] [--crash-log] [--safe-mode] [design.solidcraft |
   part.step]` is the desktop app, `/usr/bin/solidcraft`; desktop id
   `ai.storyteller.solidcraft.desktop`; MIME `application/x-solidcraft`, extension `.solidcraft`
   (legacy `.solvecraft`), so `setsid xdg-open /abs/path/part.solidcraft >/dev/null 2>&1 &` also
   works). The app then listens on a local control port (127.0.0.1; set it with `--control PORT`). The MCP
   bridges to the app only if it was running when the MCP server started, or if the session has no
   features yet; a headless session that already has work stays headless, so the saved file is
   what the user sees. If the server is already `Backend: connected to the SolidCraft app`, the
   user is already watching: save, and don't launch a second copy.
3. **Stop and ask.** Give the user the full file path, the key dimensions (envelope, wall, hole
   sizes, volume/mass) and ask them to accept or describe changes. Never continue on your own: no
   STEP/STL/3MF export or handoff before explicit acceptance (unless the user asked for the
   export up front). Silence or a vague reaction is not acceptance.
4. **Loop on changes.** Apply them (prefer `set_parameter` for dimension changes), rerun the
   verify loop for what changed, `save` again (same path), tell the user to reopen/refresh the file
   (close and reopen the app on it if it holds an older copy), and ask again until accepted.
5. **Inside a subagent** (it cannot talk to the user): do steps 1 and 2, then return the file path,
   a short summary, the key dimensions and parameter names, and the plain statement **"awaiting
   user approval"** to the orchestrator, who asks the user and relays changes. Export waits for
   acceptance.
6. **Cleanup**: do not leave app instances you started for testing running. Leave the app open
   on the user's file only for the approval step (that is the deliverable). Remove scratch designs
   and screenshots you created.

## 9. Top gotchas (more in `references/gotchas.md`)

- Never unfiltered `list_commands`; never `body_topology` just to check positions (use `measure`).
- A `still running:` error was not cancelled: use `pending`, never resend.
- `rectangle.center` corners join 3 lines: `sketch.fillet {point}` fails; use `{a,b,radius}` or 3D
  `solid.fillet`.
- `sketch.dimension` on a circle already placed at the origin needs no extra coincident constraint
  (`sketch.constraint.coincident` wants `a`,`b`; a circle centre created at [0,0] snaps to origin).
- `solid.extrude` takes **every** region by default; select with `profiles:[{point:[x,y]}]`.
- Always pass `operation` on `solid.cylinder`/`solid.box` cuts; cuts that miss report success.
- XZ sketch y is **-Z**; a hole drills from the face nearest the sketch.
- Headless `save`/`export` are path-restricted; copy from the allowed temp dir.
- Fillet before shell; shell fails on fillets between curved faces; mirror/pattern of a mirror or
  pattern feature is refused (pattern the original, or mirror `bodies`).
- Expression dimensions must stay > 0 over the parameter's allowed range; a plain number never
  follows a parameter.
- Repeated `body_name`s are silently renamed; read names from `created_bodies`.
- `new_design` and `open` discard unsaved work; ask when the session has features.
