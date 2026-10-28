# SolidCraft gotchas

## Tool behaviour
- `list_commands` unfiltered is over 100 KB: always filter. `body_topology` is 25-45 KB: last resort.
- `still running:` errors mean the request is queued or running and was NOT cancelled. Use `pending`
  (waits up to 60 s) and `running` (instant); never resend, or the change applies twice.
- A bridged server (connected to the app) returns the full app window from `screenshot` unless you pass
  `source:"model"`, and `view` moves the user's camera. Headless renders are CPU model renders.
- `new_design`/`open` discard unsaved changes; ask first if the session already has features.
- The headless session is chosen when the MCP server starts: if the app was not running then, you are
  headless even if you launch the app later (the next call bridges only while the session has no features).
- Headless `save` and `export` are confined to the server's own folders (error: "outside the folders this
  agent may use ... allow another folder with `--allow-path DIR`"). Save to the listed temp dir, then `cp`.
- Subagents share the session's one MCP design; parallel agents should use `solidcraft-cli` scripts
  (`solidcraft-cli run script.json --out part.step`) instead of the shared session.

## Sketching
- `sketch.constraint.coincident` needs `a` and `b`; a shape drawn exactly on the origin or another point
  already snaps to it (connect defaults to true), so you rarely need it.
- `rectangle.center` adds 2 construction diagonals: corners join 3 lines, so `sketch.fillet {point}` fails
  (use `{a:"l1", b:"l4", radius}` or the 3D fillet).
- Over-constraining is refused ("neither entity can move to satisfy it"): symmetry already makes two circles
  equal, etc. Read `created` for ids; dimensions share the `k` counter with constraints.
- Slots: after `length` and `width`, 3 dof remain; dimension `origin` to `a1.center` horizontally and
  vertically and `origin` to `a2.center` vertically (for a slot along Y dimension `a2.center` horizontally).
- A sketch dimension that reaches 0 loses its side; keep every distance expression > 0 over the full parameter
  range. A fractional count rounds silently; use `round(n)`.
- Distances are unsigned; draw on the correct side first.
- `sketch.polygon.circumscribed` keeps 1 dof; add `sketch.constraint.polygon` for a regular polygon.

## Features
- `solid.extrude` uses every region by default (a region inside another is a hole). Choose with `profiles`.
- Cuts that miss report success: always compare volume.
- Primitive cuts against curved faces can fail ("planar faces only"): cut with a sketch profile.
- Fillet before shell. Exceptions: the rim of a removed face (round after), fillets between two curved faces
  (shell first; the inner corner stays sharp).
- Fillet/chamfer picks snap to the nearest edge and are refused beyond 5% of body size; one pick takes a tangent chain.
- A mirror or pattern feature cannot be listed in another mirror/pattern's `features`; pattern the original,
  or mirror `bodies`. `solid.mirror features:[...]` copies only the listed features (a later cut is left out).
  Put joins before the cuts that must stay open: a pattern of a join repeats that join.
- A full circular pattern keeps COM on the axis: verify bolt-circle radius with a top screenshot.
- `Boolean retry:` warning: the geometry may be wrong with no error; verify volume. Start cutters ~1 mm past
  the faces they pierce, sink joins ~1 mm into the body.
- Repeated `body_name` is renamed silently (`Body1`) so `targets` reach only the first.
- `solid.hole` drills from the face nearest the sketch: hole sketch on the face it starts from.
- Expressions have no `if` or comparisons; use `floor mod min max sign`.

## Files
- `.solidcraft` is a binary container; `.json` path saves plain JSON (git-friendly, makes `.bak` on overwrite).
- STEP from Y-up systems opens on its back: `open {path, up:"y"}`.
- 3MF/STL/OBJ import gives mesh bodies (not parametric); keep the native design as the source.
