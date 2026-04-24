# Smart SDLC — Documentation

> Built by [Superml.dev](https://superml.dev) & [superml.org](https://superml.org) by crazyaiml

Smart SDLC is an AI-driven development framework delivered as skill files your AI assistant reads and follows — no runtime, no plugins, no external services required.

---

## Documentation Index

| Document | What It Covers |
|---|---|
| [Personas](./personas.md) | The 8 AI personas, their roles, skills, and how the persona-lock system works |
| [General & API Workflow](./workflows-general.md) | End-to-end workflow for new product, feature, or API projects |
| [Modernization Workflow](./workflows-modernization.md) | Full legacy analysis → migration planning → delivery workflow |
| [Greenfield Workflow](./workflows-greenfield.md) | Workflow for net-new projects starting from a blank canvas |
| [Skills Reference](./skills-reference.md) | Every skill: what it does, which persona owns it, how to activate it |
| [Integrations](./integrations.md) | JIRA, Confluence, GitHub, GitLab, Azure DevOps setup and usage |

---

## Core Concepts

### Skills

A **skill** is a markdown file (`SKILL.md`) containing structured instructions. When your AI reads a skill file, it adopts that workflow — no code execution required. Skills have two forms:

- **Agent skills** (e.g. `agent-pm/SKILL.md`) — define a persona that handles a whole domain
- **Workflow skills** (e.g. `create-prd/SKILL.md`) — drive a specific multi-step task

### Personas

A **persona** is a named AI role with a defined skill set. Each persona has:
- A primary agent skill that loads on activation
- A curated set of workflow skills it can access
- A **Persona Guard** on every skill — prevents accidentally using skills outside your role

Eight personas ship with Smart SDLC: Scout, Product/BA, Architect, Developer, Team Lead, QA, Release, and Modernization Lead. Default names are overridden during `init`.

### Persona Guard

Every generated skill (in `.github/skills/`) includes a **Persona Guard** section. When activated, the AI:

1. Reads `_superml/persona.yml` silently
2. If the user's `primary_persona` matches the skill's allowed personas → proceeds
3. If not → stops and redirects:
   - `/sml-meeting` — bring the right persona into the session
   - `/sml-help` — see skills for your own role

### Meetings

The `meeting` command generates a **multi-persona context prompt** that brings two or more personas into one AI session. This is the correct way to do cross-persona work (e.g. Architect reviewing BA's PRD, or Developer asking BA to clarify acceptance criteria).

### Artifact Readiness

`_superml/config.yml` tracks which artifacts are complete:

| Flag | Meaning |
|---|---|
| `prd_complete` | A PRD exists and is approved |
| `architecture_complete` | Architecture doc and ADRs are done |
| `epics_complete` | Epics and stories are broken down |
| `implementation_signed_off` | Implementation is complete and peer-reviewed |
| `qa_signed_off` | QA sign-off is recorded — all P1/P2 bugs resolved |
| `release_complete` | Deployment is confirmed and release notes published |
| `legacy_inventory_complete` | Legacy codebase has been inventoried (modernization) |
| `knowledge_graph_complete` | Business rules and process graph built (modernization) |

The `/sml-help` skill reads these flags to give you context-aware guidance on what to do next.

### Artifact Paths

Artifact output is written to sub-folders under `output_path` (configured in `_superml/config.yml`):

| Phase | Sub-folder | Config key |
|---|---|---|
| Product/BA, Architect, Team Lead | `{output_path}/planning/` | `planning_artifacts` |
| Developer | `{output_path}/implementation/` | `implementation_artifacts` |
| QA | `{output_path}/qa/` | `qa_artifacts` |
| Release | `{output_path}/release/` | `release_artifacts` |
| Modernization Lead | `{output_path}/modernize/` | `modernize_artifacts` |

All paths are created automatically by `init`. The `output_path` defaults to `_superml-output/` but can be changed during setup.

### Audit Trail

Every significant event is appended to `_superml/audit.log`:

```
2025-01-15T09:00:00Z  INIT        project=acme-payments type=general
2025-01-15T09:01:00Z  PERSONA     user=alice persona=product
2025-01-16T14:22:00Z  REENTER     user=alice from=developer to=product
2025-01-16T14:30:00Z  PERSONA     user=alice persona=developer
```

The file is git-ignored and stays local to each team member.

---

## Two-Phase Setup

### Phase 1 — Project Setup (run once by the team lead or PM)

```bash
npx @supermldev/smart-sdlc init
```

- Creates `_superml/config.yml` with project name, type, team names, and integration settings
- Installs skills into `_superml/skills/`
- Generates `.github/agents/` and `.github/skills/` for GitHub Copilot users
- Scaffolds `_superml/reference/` folders for company documentation

### Phase 2 — Personal Setup (each team member)

```bash
npx @supermldev/smart-sdlc persona
```

- Creates `_superml/persona.yml` (git-ignored, stays local)
- Captures: your name, role (`primary_persona`), AI tool, skill level
- If Copilot is selected and `.github/` files don't exist yet, they are generated

---

## Project Types

| Type | Use When | First Skill |
|---|---|---|
| `general` | Feature work on an existing product | `@sml-agent-analyst` |
| `api` | Building or extending an API | `@sml-agent-analyst` → `@sml-agent-architect` |
| `greenfield` | Net-new product from scratch | `@sml-agent-pm` (Product Brief → PRD) |
| `modernization` | Migrating legacy systems | `@sml-agent-scout` → `/sml-read-legacy-code` |

---

## Quick Reference — CLI

```bash
npx @supermldev/smart-sdlc init             # Set up project (run once)
npx @supermldev/smart-sdlc persona          # Install or update your persona
npx @supermldev/smart-sdlc persona status   # Show your current persona without wizard
npx @supermldev/smart-sdlc persona exit     # Confirm and remove your persona
npx @supermldev/smart-sdlc reenter          # Re-enter a prior phase with backward-entry guard
npx @supermldev/smart-sdlc help             # Context-aware: what to do next
npx @supermldev/smart-sdlc list             # Browse all skills
npx @supermldev/smart-sdlc meeting          # Generate multi-persona meeting context
npx @supermldev/smart-sdlc update           # Sync skills to latest version
npx @supermldev/smart-sdlc clean            # Remove generated files
```

### Persona Lifecycle

```bash
# See who you are
npx @supermldev/smart-sdlc persona status

# Exit your current persona (e.g., before switching to another)
npx @supermldev/smart-sdlc persona exit

# Re-enter a prior phase (used for backward re-entry)
npx @supermldev/smart-sdlc reenter
# → choose phase → install persona for that phase → update artifact → exit → come back
```

Each of these commands appends a log line to `_superml/audit.log`.
