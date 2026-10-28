---
name: figcraft-design
description: "Design UI in FigCraft (ArtCraft's Figma-class design app, driven through the `figcraft` MCP server) and turn FigCraft designs into frontend code. Use whenever the user mentions FigCraft or the figcraft MCP tools, or asks to design a screen, app screen, mobile screen, landing page, dashboard, UI mockup, wireframe, design system, design tokens, color/text styles, variables, Light/Dark themes, components with variants, a clickable prototype or user flow; or to implement, build, code up or hand off a FigCraft design (design to code, React, Tailwind, CSS variables, export assets/icons). Covers the brief → tokens → components → screens → screenshot-verify → prototype workflow, distinctive (non-generic) visual design, and pixel-faithful implementation in the user's stack."
license: MIT
metadata:
  author: dnviti
  version: "1.0.0" # x-release-please-version
---

# FigCraft design

FigCraft is an open-source, Figma-class interface design app (frames, auto layout, components and
variants, styles, variables with modes, prototyping, Dev Mode code). You drive it through the
`figcraft` MCP server. This skill tells you **what to build, in what order, to what quality bar**,
and how to carry a design into code.

- Detailed command ids and params: `references/command-catalog.md`
- Step-by-step recipes (mobile screen, design system, landing page, prototype flow): `references/workflows.md`
- Design → code in the user's stack: `references/design-to-code.md`
- Traps and fixes: `references/gotchas.md`
- Attribution: `references/sources.md`

## 0. Ground rules for the tools

The MCP tools: `create_node`, `set_properties`, `get_node`, `inspect_document`, `screenshot`,
`run_command`, `batch`, `list_commands`, `select`, `export`, `open_file`, `save_file`, `undo`,
`redo`, `pointer`, `key`, `type_text`, `inspect_ui`. They are deferred: load the schemas you need
with ToolSearch (`select:mcp__figcraft__batch,mcp__figcraft__run_command,...`) before calling them.

- **Discover before guessing.** Every menu action is a command. Run `list_commands {filter}` with a
  narrow filter (`"variable."`, `"style."`, `"component."`, `"proto."`, `"inspect."`, `"export"`)
  and trust its param doc over memory or over the online docs: the installed server can be older
  or newer than the repo docs (e.g. some builds lack `inspect.code` `tailwind`/`vue`).
- **Coordinates**: page units (1 unit = 1 px), x right, **y down**. `x`/`y` are **relative to
  the parent frame** (groups don't count). `absoluteBounds` in inspect output is page space.
- **Auto layout owns position**: inside an auto-layout frame, never set x/y; set `layout`
  (`horizontal|vertical|grid`), `gap`, `padding` (n or `[t,r,b,l]`), `mainAlign`
  (`min|center|max|spaceBetween|spaceAround|spaceEvenly`), `crossAlign` (`min|center|max|baseline`),
  `sizingH`/`sizingV` (`fixed|hug|fill`), `wrap`, `crossGap`, min/max sizes.
- **Colours** are `"#RRGGBB"` or `"#RRGGBBAA"`. `fill`/`stroke` accept a hex, `"none"` or null;
  gradients `{"type":"linearGradient","stops":["#hex","#hex"]}`. On text, `fill` is the text colour.
- **Batch for atomicity**: `batch {commands:[{command, params}], label}` runs as **one undo step**
  and rolls back entirely on failure. Refer to an earlier step's result id with `{"$step": n}`
  (zero-based); `{"$step": n, "field": "ids/0"}` picks another field. Build whole subtrees this way.
- Commands act on `ids` when given, else on the selection; new layers become the selection.
- Programmatic calls never open dialogs. A failing command leaves the document unchanged.
- **Headless vs attached**: with `figcraft-cli mcp` there is no window (screenshots render the
  document); with `--attach <port>` the user watches the live app. File reads/writes may be
  confined to read/write roots; a refused path returns a readable error: pick an allowed folder.

## 1. Workflow overview

Scale the work to the request (one screen ≠ a full library). For anything non-trivial follow:

1. **Brief** → understand the product, audience, primary job, platform, content.
2. **Design plan** → tokens (colour, type, spacing, radius, elevation) + layout concept; critique
   it against the brief for genericness *before* building.
3. **Foundations in FigCraft** → variable collections with modes, paint/text/effect styles.
4. **Components** → base components, variants, properties, token bindings.
5. **Screens** → device frames with nested auto layout, built from component instances and real copy.
6. **Verify loop** → `get_node`/`inspect_document` for numbers, `screenshot` for pixels; fix; repeat.
7. **Prototype** → interactions, flow starting point, device settings.
8. **Show and approve** (mandatory, always last) → save the design to a `.figcraft` file, open it
   in the FigCraft app, then stop and wait for the user's explicit acceptance (section 9).
9. **Handoff / code** (if asked, and only after acceptance) → mark ready for dev, export assets,
   generate and adapt code.

State a short scope + acceptance checklist before mutating; give updates at phase boundaries, not
per call. Stop when the checklist passes; don't silently grow a screen request into a design system.

### Starting points

- Empty document: work on the current page; add pages for structure when the work is large
  (`page.add {name:"Foundations"}`, `"Components"`, `"Screens"`, `"Prototype"`).
- Existing file: `open_file {path}`, then `inspect_document {depth: 2}` and `style.list`,
  `variable.list`, `component.list` to reuse what exists. **Never redraw what a component, style or
  variable already provides.**
- Fast start: `run_command template.list`, then `file.newFromTemplate {template}` (`mobile-app`,
  `landing-page`, `dashboard`, `design-system`, `wireframe-kit`, `social-posts`, `slides`,
  `icon-set`). Templates are fully editable; restyle them so the result isn't the template.
- Built-in MCP prompts (`prompts/list`): `mobile_screen`, `design_system`, `landing_page`,
  `prototype_flow`. Their recipes, upgraded with this skill's quality bar, are in
  `references/workflows.md`; use them as skeletons, not as the visual direction.

## 2. Brief and design plan (do this before any node exists)

If the brief doesn't name the subject, audience and primary job, propose one concrete answer for
each and confirm when the work is substantial. The subject's world (industry, materials,
vocabulary, users' context) is where distinctive choices come from: a field-service app for
plumbers and a meditation app should not share a look.

Write a compact plan (in chat, a few lines each):

- **Colour**: 4–6 named hex values (background, surface, text, muted text, primary/accent, one
  status colour if needed), plus the Dark mode counterpart when theming is in scope.
- **Type**: one or two families with clear roles, a modular scale (e.g. 12/14/16/20/24/32/48),
  weights, line heights (≈1.4–1.6 body, ≈1.1–1.25 display), letter spacing for large sizes.
  Check availability with `text.fonts {family}` / `text.missingFonts`; don't assume Inter.
- **Spacing & shape**: 4- or 8-pt scale; radius scale tied to hierarchy (not one radius
  everywhere); elevation used sparingly.
- **Layout**: frame size (`frame.presets`), grid/columns, alignment, a quick ASCII wireframe.
- **The one memorable thing**: where boldness is spent (the hero type, an illustration, a data
  visual, a colour field). Everything else stays quiet.

Then review the plan: if a part is what you'd produce for *any* similar brief, change it and say
what you changed. The user's explicit direction always wins over these defaults.

## 3. Design quality bar

Distinctive, intentional, accessible. Generic AI-looking design is the main failure mode.

**Typography carries personality.** Pick faces deliberately for this subject; build a real scale;
make headlines an active design element. Keep line length under ~80 characters (set `maxWidth`
or a fixed text width). Serif body text gets a bit more line height.

**Avoid default tells** unless the brief asks for them:
- one word in a headline accented by colour/italic/bold; ALL-CAPS tracked eyebrow labels above
  every heading; labels joined with middle dots; `→` appended to every link/button;
- the SaaS card kit: everything chopped into identical rounded cards with one radius and the same
  soft grey shadow, gradient washes as decoration;
- stock palettes that read as "AI default": warm cream + serif + terracotta accent; near-black +
  one acid-green accent; hairline-ruled newspaper grids;
- big number + small label + gradient accent as the reflexive hero; 01/02/03 markers on content
  that is not a sequence; monospace for small data labels by habit.

**Structure is information.** Borders, dividers, numbering, labels and eyebrows must encode
something real. Use proximity and spacing for grouping first.

**Hierarchy**: one primary action per view; size, weight and contrast define reading order; align
to a grid; generous, consistent spacing from the scale (no 13 px or 27 px one-offs).

**Colour**: build from tokens; neutrals with a slight tint toward the brand are fine, but contrast
must pass WCAG AA (4.5:1 body text, 3:1 large text and UI boundaries). Status colours never carry
meaning alone (pair with text/icon).

**Restraint**: one bold idea; remove one accessory before finishing. Motion in prototypes only
where it explains a change (Smart Animate between states, a single entrance moment).

**Copy is design**: real, specific content for the subject (no lorem ipsum). Name things the way
users think of them; sentence case; active verbs on buttons ("Save changes", not "Submit"); the
same action keeps its name across the flow ("Publish" → "Published"); errors say what happened and
how to fix it; empty states invite the next action.

**Quality floor (state coverage)**: components show default/hover/pressed/disabled/focus (visible
focus ring) and, where relevant, error/empty/loading; touch targets ≥ 44×44 on mobile.

## 4. Foundations: variables and styles

Prefer **variables** for raw values and themes, **styles** for composite typography and effects.

```json
batch {"label":"Foundations","commands":[
 {"command":"variable.createCollection","params":{"name":"Color","modes":["Light","Dark"]}},
 {"command":"variable.create","params":{"collection":"Color","name":"color/bg","type":"color","values":{"Light":"#FBFAF7","Dark":"#121417"}}},
 {"command":"variable.create","params":{"collection":"Color","name":"color/fg","type":"color","values":{"Light":"#1B1D21","Dark":"#ECEDEF"}}},
 {"command":"variable.create","params":{"collection":"Color","name":"color/primary","type":"color","values":{"Light":"#1F5C4A","Dark":"#7CC4A8"}}},
 {"command":"variable.createCollection","params":{"name":"Space","modes":["Default"]}},
 {"command":"variable.create","params":{"collection":"Space","name":"space/4","type":"number","value":16}},
 {"command":"variable.create","params":{"collection":"Space","name":"radius/md","type":"number","value":10}}]}
```

- Name with slash paths (`color/bg`, `space/4`, `radius/md`): `variable.export {format:"css"}`
  turns `color/primary` into `--color-primary`, so names become your code tokens.
- Set `codeSyntax` (`variable.update {variable, codeSyntax:{WEB:"--color-primary"}}`) when the
  codebase already has token names, and `scopes` so pickers only offer sensible variables.
- Semantic layer: alias with `variable.set {variable, mode, value:{"alias": <primitive>}}`.
- **Text styles**: make a text layer with the exact props, then
  `style.create {type:"text", name:"Text/Heading L", from:<id>}`; or pass `value`
  (`{"fontSize":32,"lineHeight":"120%","letterSpacing":"-1%"}`). Same for `paint` and `effect`.
  `style.bind` binds a variable inside a style (e.g. a paint style's `fill`).
- Bind layers: `variable.bind {ids, field, variable}`; fields include `fill`, `stroke`,
  `cornerRadius`, `gap`, `paddingHorizontal`, `width`, `opacity`, `fontSize`, `characters`,
  `visible`. Check `boundVariables` in `get_node`.
- Theme check: `variable.setMode {ids:[frame], collection:"Color", mode:"Dark"}`, screenshot, then
  set back (`mode: null` = Auto).

## 5. Components and variants

Build components **on a Components page or an empty canvas area, never inside a screen's
auto-layout flow** (a component set dropped into a flow resizes and clips it).

1. Build the base as an auto-layout frame (hug height, sensible padding), with tokens bound.
2. `component.create {ids:[frame]}` → main component.
3. `component.addVariant {id}` duplicates it into a set; variants are first named
   `Property 1=Default`, `Property 1=Variant2`. Rename right away:
   `component.editProperty {id:<set>, name:"Property 1", newName:"Variant"}`, then
   `{name:"Variant", value:"Variant2", newValue:"Secondary"}`. Add another axis with
   `component.addProperty {id:<set>, name:"State", type:"variant", default:"Default"}`, then
   `component.addVariant {id:<variant>, property:"State", value:"Hover"}` (addVariant refuses a
   property that doesn't exist yet). Alternative: separate components named
   `Variant=Primary, State=Hover` and `component.combineVariants`.
4. Edit each variant **fully** (fill *and* text colour *and* stroke): restyling one property
   detaches its variable; rebind the variant's own token.
5. Text/boolean/instance-swap properties: `component.addProperty {id, name, type:"text"|"boolean"|
   "instanceSwap"|"slot", layer}`; slots via `component.makeSlot` for free-form content areas.
6. Use instances in screens: `instance.create {component:<set or variant>, parent, x?, y?}`;
   configure with `instance.setProperties {ids, properties:{Variant:"Secondary"}}`; override text
   with `type_text {id:<text layer in instance>, text}` (read the inner id with `get_node`).
7. Verify: `component.properties {id}` (check `conflicts`), `component.playground {id, properties}`
   to preview a combination and its code without touching the document.

Name layers semantically (`Button`, `Label`, `Icon`), because names drive generated code,
`data.fill` keys and override matching on swap.

## 6. Screens with auto layout

- Device frames: `frame.create {preset:"iPhone 16", x, y, name, props}` (`frame.presets` lists
  them: iPhone 16 393×852, Android Compact 412×917, Desktop 1440×1024, MacBook Air 1280×832…).
  Place screens side by side ~100 px apart on y = 0.
- Make the screen a vertical auto-layout frame; nest section frames with `sizingH:"fill"` and their
  own layout. Rows are horizontal frames; use `mainAlign:"spaceBetween"` for bars, `grid` layout
  (`gridColumns`, `columnTracks:["1fr","1fr","1fr"]`, `columnGap`) for card grids.
- Text: set a fixed width or `sizingH:"fill"` for paragraphs so they wrap; `hug` for labels;
  `textAutoResize:"height"` for growing copy; `text.fit {ids, maxLines}` for headlines in fixed boxes.
- Scrolling content taller than the device: let the frame grow (`sizingV:"hug"`) for a long page,
  or keep the device height and set `overflow` for prototype scrolling; fixed headers via
  `absolute: true` + constraints.
- Images: `image.place {path|data, parent, width, height, mode:"fill"}` (needs a readable path).
  Don't use third-party logos or copyrighted images; use neutral placeholders the user can swap.
- Repeated content: build one card, then `data.fill {id, rows:[{Title:"…", Price:"…"}]}` or
  instances; apply repeated styling to many ids in one `batch`.
- Build section by section (one `batch` per section), verifying after each.

## 7. Verify loop (mandatory)

After each major step:

1. `get_node {id:<frame>, depth:3}`: check sizes, `sizing`, `layout`, fills, `boundVariables`,
   text props, `overrides`. Look for width 0/1 text, children wider than parents, unexpected
   `fixed` sizing, unbound hex values that should be tokens.
2. `screenshot {ids:[frame], maxSize:1200}` and **look at it** critically: alignment, rhythm,
   contrast, clipping, truncated text, empty boxes, the hierarchy you planned.
3. Fix with `set_properties` / `batch`; use `undo` for a bad batch (one step).
4. At the end: screenshot every deliverable frame, both theme modes if themed, and report the frame
   ids, what was built and any known limitations.

A picture beats a JSON diff for aesthetics; JSON beats a picture for exact values. Use both.

## 8. Prototype

- Wire clicks: `proto.interaction.add {id:<button>, trigger:{type:"onClick"},
  action:{type:"navigate", dest:<frame>}, transition:{type:"smartAnimate"}, durationMs:300,
  easing:"easeOut"}`; back buttons `action:{type:"back"}`; overlays `openOverlay` /
  `closeOverlay`; hover states via `onHover` + `changeTo` on component variants.
- Flow start: `proto.flow.add {start:<first frame>, name:"Main flow"}`; device:
  `proto.settings {device:"iPhone 16"}`.
- Stateful prototypes: `setVariable` / `conditional` actions with text expressions
  (`"count + 1"`, `"count >= 3"`); test with `proto.evaluate`.
- Verify: `get_node` shows `interactions` on triggers, `inspect_document` shows the page `flows`.
  Smart Animate matches layers by name: keep names identical across screens for elements that move.

## 9. Show and approve (mandatory final phase)

Every design ends here, after the verify loop (and after the prototype, if any). The headless
`figcraft-cli mcp` session has no window, so the user cannot see the design until you save it and
open the real app on it.

1. **Save** with `save_file {path}` (or `file.saveAs {path}`; no extension adds `.figcraft`) into
   the project directory, or the path the user named. Use a descriptive name (`login-screen.figcraft`)
   and an allowed write root. Note the full absolute path.
2. **Open FigCraft on that file**, detached so it doesn't block:
   `setsid figcraft /abs/path/design.figcraft >/dev/null 2>&1 &`
   (`figcraft [FILE]` is the desktop app binary, `/usr/bin/figcraft`; the MIME type is
   `application/x-figcraft`, so `setsid xdg-open /abs/path/design.figcraft >/dev/null 2>&1 &` works
   too.) If the app is already bridged/open on this design (`--attach`/`--control` session), don't
   launch another copy: the user already sees it, so just bring that file up (`file.open {path}`
   returns the index of an already-open file instead of opening it twice).
3. **Stop and ask.** Give the user the full file path and ask them to accept the design or describe
   the changes. Never continue on your own: no implementation, code, asset export or handoff
   before explicit acceptance. Silence or a vague reaction is not acceptance.
4. **Loop on changes.** Apply the requested changes, re-run the verify loop for what changed,
   `save_file` again, reopen/refresh FigCraft on the file, and ask again. Repeat until the user
   accepts.
5. **Inside a subagent** (it cannot talk to the user): do steps 1 and 2, then return the file path
   and a short summary of the design to the orchestrator, stating clearly that **user approval is
   pending**. The orchestrator asks the user and relays any requested changes back (to this agent
   or a new one); handoff/code waits for the acceptance.

## 10. Design → code

Follow `references/design-to-code.md`. Summary:

1. **Get the target**: frame/component id (ask, or find via `inspect_document`/`component.list`,
   or `inspect.readyForDev`).
2. **Context**: `get_node {id, depth}` (fetch big trees section by section),
   `inspect.properties {id}` (values with style/variable names), and a reference
   `screenshot {ids:[id], scale:2}` kept as the visual source of truth.
3. **Tokens**: `variable.export {format:"css"}` → CSS custom properties (default mode on `:root`,
   others on `[data-<collection>="<mode>"]`); map them into the project's token system
   (Tailwind theme, CSS vars, TS theme), reusing existing tokens when values match.
4. **Generated code as a spec, not as final code**: `inspect.code {id, language:"react"}` (also
   `css`, `html`, `leptos`, `swiftui`, `compose`; check `list_commands {filter:"inspect.code"}` for
   what this build supports, `tailwind`/`vue` may exist), `inspect.componentCode` for props.
   Translate into the project's components, layout primitives and conventions.
5. **Assets**: `inspect.assets {ids}` then `file.exportLayers {ids, assets:true, dir}` (icons SVG,
   images PNG) or `export {ids, format:"svg"|"png", scale:2, path}` into the project's asset
   folder (must be an allowed write root). Never redraw icons by hand or add icon packages when
   the design provides them.
6. **Reuse first**: search the codebase for existing Button/Input/Card/tokens before writing new
   ones; map FigCraft components to code with `codeConnect.set` / `codeConnect.import` so later
   `inspect.code` emits the real component calls.
7. **Validate** the running UI against the reference screenshot: spacing, typography, colours,
   radii, states, responsive behaviour, assets; fix every in-scope mismatch, document intended
   deviations (accessibility, platform constraints).

Code → design (recreating an existing UI in FigCraft): read the source for structure, fonts and
tokens first, recreate it as editable layers (never paste a screenshot as the design), reuse the
file's components and variables.

## 11. Top gotchas (more in `references/gotchas.md`)

- x/y inside auto layout are ignored; children follow the flow. Use `absolute:true` to opt out.
- A child can't `fill` an axis its parent `hug`s: setting fill makes the parent fixed on that axis.
- Text without width hugs one long line; give paragraphs a width or `sizingH:"fill"`.
- Editing a bound/styled field (a new fill, font size…) **detaches** the variable or style. Re-bind
  afterwards, or change the variable/style instead of the layer.
- Instances refuse structural edits (move/resize/add children) outside slots: edit the main.
- `component.addVariant` without an existing property creates `Property 1=…` names; rename them.
- A whole `batch` rolls back on one bad step: read the error (it names the step), fix, rerun.
- `inspect_document` on big files truncates (`truncated` key): use `get_node` on subtrees.
- `screenshot` defaults to 1600 px max side; pass `ids` to focus and `scale` for detail.
- Fonts: missing families fall back silently; check `text.missingFonts` and pick installed ones.
- Exports/saves outside allowed roots fail; `export` without `path` returns data inline.
- Don't `save_file` unless the user wants the file saved or section 9 requires it; save where they say.
