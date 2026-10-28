# Sources and attribution

This skill is original writing that adapts ideas and workflows from the sources below. No source
was copied in bulk; short command examples follow FigCraft's own documented API.

| Source | What was used | License |
|---|---|---|
| FigCraft, github.com/storytold/figcraft: `CLAUDE.md`/`AGENTS.md`, `docs/mcp.md` (conventions, tools, prompts, Dev Mode, prototypes, examples), `crates/mcp/src/prompts.rs` (the 4 built-in workflows `mobile_screen`, `design_system`, `landing_page`, `prototype_flow`, adapted in `workflows.md`) | Tool conventions, command semantics, workflow steps | MIT OR Apache-2.0 (repo reports Apache-2.0; `LICENSE-MIT`, `LICENSE-APACHE`, `NOTICE`) |
| Installed `figcraft` MCP server, `list_commands` output (October 2026) | Command ids and parameter docs in `command-catalog.md`; behaviour notes in `gotchas.md` from a throwaway test session | n/a (observed behaviour) |
| Anthropic `frontend-design` skill, github.com/anthropics/skills (`skills/frontend-design/SKILL.md`) | Design principles: grounding in the subject, plan-then-critique process, typography guidance, list of generic AI-design tells, restraint, quality floor, UX writing guidance (paraphrased in SKILL.md §2–3) | Apache-2.0 (`LICENSE.txt` in the skill folder) |
| Figma MCP server guide, github.com/figma/mcp-server-guide: `figma-power/steering/implement-design.md`, `create-design-system-rules.md`, `code-connect-components.md`; `skills/figma-design-to-code`, `figma-generate-design`, `figma-generate-library`, `figma-use/references/gotchas.md` | Workflow structure only: fetch context → screenshot reference → assets → translate to project conventions → 1:1 validation checklist; scope contract for design-system work; reuse-before-create; rules-file idea; Code Connect concept | No license file found in the repository at the time of reading: treated as all rights reserved, so only ideas were used, rewritten in original words, with nothing copied |

Trademarks: Figma is a trademark of Figma, Inc.; FigCraft and ArtCraft names/logos belong to their
owners. This skill is not affiliated with or endorsed by them.
