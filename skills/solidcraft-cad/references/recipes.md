# SolidCraft recipes

All batches below use commands verified in a headless session (SolidCraft 0.21 line). Run each stage
as its own `batch` with `"verbose": false`, then `measure`.

## A. Plate with a hole, parametric (smoke test, verified)

```json
{"commands":[
 {"command":"parameters.add","params":{"name":"L","expression":"20 mm"}},
 {"command":"parameters.add","params":{"name":"T","expression":"5 mm"}},
 {"command":"sketch.create","params":{"plane":"XY","name":"PlateSketch"}},
 {"command":"sketch.draw.dimensioned","params":{"command":"sketch.rectangle.center","params":{"center":[0,0],"corner":[10,10]},"dimensions":{"width":"L","height":"L"}}},
 {"command":"sketch.finish","params":{}},
 {"command":"solid.extrude","params":{"distance":"T","name":"Plate"}},
 {"command":"sketch.create","params":{"plane":"XY","name":"HoleSk","offset":"T"}},
 {"command":"sketch.circle.center","params":{"center":[0,0],"radius":2}},
 {"command":"sketch.dimension","params":{"entities":["c1"],"type":"diameter","value":"4"}},
 {"command":"sketch.finish","params":{}},
 {"command":"solid.hole","params":{"sketch":"HoleSk","diameter":4,"name":"Hole"}}]}
```
Expected: volume 20*20*5 - pi*2^2*5 = 1937.18 mm3, 7 faces (6 planes + 1 cylinder), bbox
[-10,-10,0]..[10,10,5]. `set_parameter L=30` rebuilds with `errors: []`. Both sketches reach dof 0 (a
circle created at [0,0] snaps to the origin; no extra coincident needed).

## B. Rounded open box (enclosure body), verified

Stage 1+2 in one batch: parameters `w d h wall`, sketch `rectangle.center` dimensioned `w` x `d`,
extrude `h`, then `solid.fillet` on the 4 vertical corner edges (picks `[+-w/2, +-d/2, h/2]` as numbers),
then `solid.shell {faces:[[0,0,h]], thickness:"wall"}` (point on the top face to remove).

For w=60 d=40 h=25 wall=2, corner radius 4: volume 13367.5 mm3, 19 faces, COM z 9.04 (verified:
(59656 outer - 46289 inner), matches the analytic value). Fillet outside edges first; round the open
rim after the shell if wanted.

Next stages: lid = second body (new sketch on `{plane:"XY",offset:"h"}`, `solid.extrude ... operation:"new"
body_name:"Lid"`) with a lip inset by `wall + clearance` (`clearance` 0.2-0.3 mm); screw posts =
`solid.cylinder {..., operation:"join", base:["w/2-8","d/2-8","wall"]}` then pilot hole; vent slots =
`sketch.slot.overall` + `solid.extrude {operation:"cut", through_all:true}` on a wall sketch (XZ plane: sketch y
is -Z); connector cut-outs likewise; mount holes with `solid.hole` + `references:[{edge,distance}]`.
Always `measure` after each cut: unchanged volume = missed cut.

## C. Bracket / L-profile

Sketch the L profile on `YZ` with `sketch.line {points, closed:true}` (or two rectangles joined),
dimension every segment from `origin` with parameters (`leg_a`, `leg_b`, `thick`), extrude `width`
`direction:"symmetric"`, fillet the inner bend (radius >= `thick/2`), add holes on each leg with
`solid.hole` on `references` or a point sketch, gusset with an extruded triangle `operation:"join"`.
Check: volume = (leg_a + leg_b - thick) * thick * width - holes.

## D. Revolved part (shaft, knob, bushing)

Sketch the half profile on `XZ`/`XY` including a line on the axis, dimension it fully, then
`solid.revolve {axis:"<axis line id>", angle:"360 deg"}`. Volume check by Pappus (area * 2*pi*centroid r).
Keyways/flats: sketch + extrude cut. Gears: use `list_commands {filter:"gear"}` to see whether a gear
generator exists in this build, else a tooth profile + `solid.pattern.circular {features, axis:"Z", count:"n"}`
(count is a parameter; keep it >= 1).

## E. Parameter-walk check (solidcraft-checking)

Before showing a parametric part, run both ends of each driving parameter's range: one `batch` of
`parameters.change` steps plus `inspect_design {measure:true}` between them, expect no failed feature,
sketch dof 0, volumes matching your formula, then back to defaults.

## F. Printing orientation and splitting

Z up is the print direction. Put the largest flat face at Z=0, avoid overhangs > 45 deg, split big parts
with a boolean `intersect`/cut (check `list_commands {filter:"split"}`) and add alignment pins (3 mm, 0.15 mm clearance). Export one body
per STL/3MF.
