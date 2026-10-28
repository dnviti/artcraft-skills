# Contributing

Thanks for helping improve the ArtCraft skills. Keep changes small and verified against the real app.

## Layout

```text
skills/<name>/SKILL.md      the skill (frontmatter + instructions, under ~500 lines)
skills/<name>/references/   detail loaded on demand (command catalog, recipes, gotchas)
.claude-plugin/             Claude Code plugin and marketplace manifests
scripts/validate-skills.mjs validator run locally and in CI
```

## Rules for a skill

- Folder name equals the frontmatter `name` (lowercase letters, digits, single hyphens, max 64 chars).
- `description` is 1 to 1024 chars, quoted (descriptions contain colons), keeps the trigger keywords and the
  "belongs to X" routing to sibling skills.
- Every `SKILL.md` carries `license: MIT` and the `metadata` block, exactly as in the existing skills. Do not
  edit the version by hand; release-please updates the line marked `# x-release-please-version`.
- Keep `SKILL.md` under about 500 lines; move overflow to `references/`.
- State only behaviour you verified against the app. Mark anything else as unverified.
- No personal or machine-specific content: no home-directory paths, user names, tokens or private setup. Use
  `~`, `$HOME` or `/path/to/...`, and generic wording ("if your MCP server was registered without
  `--automation-read-root`...").

## Commits

This repo uses [Conventional Commits](https://www.conventionalcommits.org/). `main` is the release channel:
release-please reads the commit history to choose the next version and write the changelog.

| Prefix | Effect | Example |
|---|---|---|
| `feat:` | minor release, listed under Features | `feat(figcraft-design): add a prototype-flow recipe` |
| `fix:` | patch release, listed under Bug Fixes | `fix(soundcraft-audio): correct the bounce loudness check` |
| `docs:` | listed under Documentation | `docs: clarify MCP root flags in the README` |
| `feat!:` or `BREAKING CHANGE:` footer | major release | |
| `chore:`, `ci:`, `refactor:`, `test:` | no release on their own | |

Use the skill name as the scope when a change touches one skill.

## Pull request flow

1. Fork and branch from `main`.
2. Make the change and run the validator:

   ```bash
   node scripts/validate-skills.mjs
   ```

   It needs Node 20 or newer and no dependencies. It must exit 0 (CI runs it on every push and pull request).
3. Optionally check discovery without installing anything: `npx -y skills add ./ --list`.
4. Open a pull request against `main` with a conventional-commit title (squash merges use the title).

## Releases

Maintainers do not edit versions or `CHANGELOG.md`. When releasable commits land on `main`, the
`release-please` workflow opens a release pull request that bumps the version in every `SKILL.md`,
`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and `.release-please-manifest.json`, and
updates `CHANGELOG.md`. Merging it creates the tag and the GitHub release.
