# Contributing to Smart SDLC

Thank you for your interest in contributing! Smart SDLC is a community-driven framework — contributions to skills, integrations, documentation, and tooling are all welcome.

---

## Ways to Contribute

| Type | Examples |
|---|---|
| **New skills** | Additional workflow skills, new integration skills, utility skills |
| **Improve existing skills** | Better instructions, clearer steps, edge case handling |
| **Integrations** | New system integrations (Linear, Notion, ServiceNow, etc.) |
| **CLI commands** | New `bin/` commands or enhancements to existing ones |
| **Documentation** | Corrections, examples, guides, translations |
| **Bug reports** | Unexpected AI behaviour, skill logic errors, CLI issues |

---

## Getting Started

### 1. Fork and clone

```bash
git clone https://github.com/supermldev/smart-sdlc.git
cd smart-sdlc
```

### 2. Install

No dependencies — but make sure you're on Node.js 16+:

```bash
node --version   # >= 16
```

### 3. Run locally

```bash
node bin/superml.js help
node bin/superml.js init
```

Or link globally to test `npx`-style:

```bash
npm link
smart-sdlc help
```

---

## Skill Contributions

Skills are the core of Smart SDLC. A skill is a `SKILL.md` file with YAML frontmatter and structured AI instructions.

### Skill file format

```markdown
---
skill: your-skill-name
title: "Human-readable title"
phase: "0-relearn | 1-analysis | 2-planning | 3-solutioning | 4-implementation | 5-modernize | core | integrations"
persona: "all | product | architect | developer | modernization | team_lead"
type: "workflow | utility | integration | agent"
---

## Skill: Your Skill Name

Brief description of what this skill does and when to use it.

## Activation

...

## Instructions for the AI

...
```

### Skill placement

```
skills/
├── 0-relearn/         # Brownfield onboarding, codebase exploration
├── 1-analysis/        # Problem analysis, research
├── 2-planning/        # PRDs, requirements, UX
├── 3-solutioning/     # Architecture, stories, context
├── 4-implementation/  # Coding, review, sprint
├── 5-modernize/       # Legacy analysis, migration
├── core/              # Utilities available to all personas
└── integrations/      # External system connections
```

Each skill lives in its own folder: `skills/<phase>/<skill-name>/SKILL.md`.

Multi-step workflows can include a `workflow.md` and a `steps/` subdirectory with numbered step files.

### Registering a new skill

After adding the `SKILL.md`, register it in `lib/commands/init.js`:

1. Add the skill path to `SKILL_PERSONA_ACCESS` — use `null` for unrestricted or a persona name to restrict access:
   ```js
   'integrations/your-skill/action': null,          // all personas
   'integrations/your-skill/action': 'developer',   // developer only
   ```

2. If it's an integration with a connect step, add it to the `INTEGRATIONS` array in `init.js`.

---

## Integration Contributions

New integrations follow the same pattern as existing ones in `skills/integrations/`. Each integration should include:

- `connect/SKILL.md` — set up and verify connectivity; support both REST and MCP modes if applicable
- Action skills (e.g. `create-story/SKILL.md`, `sync/SKILL.md`, `push-doc/SKILL.md`)

If the integration supports MCP, follow the pattern in `skills/integrations/jira/connect/SKILL.md` — offer REST vs MCP path, generate `.vscode/mcp.json` entries, and write `connection_mode` to `_superml/config.yml`.

---

## Pull Request Guidelines

1. **One feature or fix per PR** — keep changes focused and reviewable
2. **Test your skill manually** — open GitHub Copilot Chat, attach your SKILL.md, and run through the workflow. Note the result in the PR description
3. **No breaking changes to existing config keys** — additive changes only; deprecate with a comment if a key needs renaming
4. **Update docs if needed** — if you add a skill, add a row to `docs/skills-reference.md`; if you add an integration, update `docs/integrations.md`
5. **Commit messages** — use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`

### PR description template

```markdown
## What this adds / fixes

Brief description.

## Skill / command affected

e.g. `skills/integrations/linear/connect/SKILL.md`, `lib/commands/init.js`

## Manual test

- Opened Copilot Chat, ran `/sml-your-skill`
- Step 1: [what happened]
- Step 2: [what happened]
- Result: [outcome]

## Checklist
- [ ] SKILL.md follows the standard frontmatter format
- [ ] Skill registered in `SKILL_PERSONA_ACCESS` in `init.js`
- [ ] `docs/skills-reference.md` updated (if new skill)
- [ ] `docs/integrations.md` updated (if new integration)
- [ ] No credentials or tokens hardcoded anywhere
```

---

## Reporting Issues

Open a GitHub Issue with:

- **Smart SDLC version**: `npx @supermldev/smart-sdlc --version`
- **AI assistant**: GitHub Copilot / Claude / Cursor / other
- **Skill or command**: which skill or CLI command is affected
- **What happened vs what was expected**
- **Config snippet** (redact any tokens): relevant section of `_superml/config.yml`

---

## Community

Join the Smart SDLC Discord for questions, ideas, and real-time discussion with maintainers and other contributors:

[discord.gg/26XMXkEt](https://discord.gg/26XMXkEt)

## Code of Conduct

Be respectful, collaborative, and constructive. We follow the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating you agree to abide by its terms.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
