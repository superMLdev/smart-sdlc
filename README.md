# Smart SDLC — AI-Driven Development Framework

> Built by [Superml.dev](https://superml.dev) & [superml.org](https://superml.org) by crazyaiml

A standalone AI-driven agile development framework that works natively inside GitHub Copilot, Claude, or any AI coding assistant. No external runtime — your AI assistant IS the engine.

## What It Is

Smart SDLC is a skills framework that gives your AI assistant structured expertise across the full software development lifecycle — from analysis and requirements through architecture, story creation, and implementation — with native integrations to JIRA, Confluence, GitHub, GitLab, and Azure DevOps.

Each **skill** is a markdown file (`SKILL.md`) containing structured instructions the AI reads and follows. No code execution, no installed tooling — just skills your AI activates on demand.

## Capabilities

| Capability | What It Does |
|---|---|
| **Persona-based agents** | 5 AI personas (Product, Architect, Developer, Modernization Lead, Team Lead) — each with a distinct role, communication style, and skill set. Appear natively in the GitHub Copilot agent picker as `.agent.md` files. |
| **Two-phase project setup** | `init` sets up the project for the whole team; `persona` lets each member configure their own workspace and role independently |
| **Custom role names** | Team can name each persona (e.g. "Aria", "Rex", "Nova") — names flow through meeting docs and agent greetings |
| **Company reference docs** | Drop company-specific guidelines, standards, and context into `_superml/reference/` — agents load them automatically on activation |
| **Multi-persona meetings** | `npx @supermldev/smart-sdlc meeting` generates a structured context prompt bringing all personas into one AI session |
| **Artifact readiness guards** | Agents check prerequisites before starting work — warns if PRD, architecture, or epics are missing for the selected role |
| **Full SDLC coverage** | Skills for analysis, requirements (PRD), architecture, ADRs, epics & stories, implementation, sprint planning, and modernization |
| **Integration skills** | Native JIRA, Confluence, GitHub, GitLab, and Azure DevOps workflows — via REST API or MCP Server |
| **Company Knowledge** | Register internal framework docs, platform libraries, and developer portals — fetch via URL (bearer/basic/header auth) or company MCP server — pulled into AI context on demand |
| **Company Knowledge** | Register internal framework docs, platform libraries, and developer portals — fetch via URL (with bearer/basic/header auth) or a company MCP server — pulled into AI context on demand |
| **Conflict prevention** | JIRA ticket lock, git branch lock, and Confluence version traceability prevent parallel work conflicts |
| **Copilot slash commands** | Skills are generated as `.github/skills/<name>/SKILL.md` — each appears as a `/skill-name` slash command in GitHub Copilot Chat |
| **Zero dependencies** | Pure Node.js CLI — no external packages required |

## How It Works

1. The **project Initiator** runs `npx @supermldev/smart-sdlc init` once to set up project config, team role names, and reference folders
2. Each **team member** runs `npx @supermldev/smart-sdlc persona` to configure their own name, role, AI tool, and skill level
3. Point your AI assistant at a skill: _"Load skill: sml-agent-pm"_ or attach in Copilot: `#file:_superml/skills/2-planning/agent-pm/SKILL.md`
4. The AI reads the skill, loads config and persona settings, loads company reference docs, and activates the persona
5. For integration skills (JIRA, Confluence, GitHub), the AI uses REST API calls or MCP server tool calls, depending on your configured connection mode

## Quick Start

### 1. Set up the project (run once — team lead or PM)

```bash
npx @supermldev/smart-sdlc init
```

Installs skills into `_superml/skills/`, creates `_superml/config.yml` with team role names and artifact readiness, scaffolds `_superml/reference/` for company docs. When **GitHub Copilot** is selected:
- Generates `.github/agents/<persona>.agent.md` — each persona appears in the Copilot agent picker
- Generates `.github/skills/<skill>/SKILL.md` — each skill appears as a `/skill-name` slash command
- Generates `.github/copilot-instructions.md` and `.github/pull_request_template.md`

### 2. Set up your personal workspace (each team member)

```bash
npx @supermldev/smart-sdlc persona
```

Creates `_superml/persona.yml` with your name, role, AI tool preference, and skill level. This file is personal and stays out of git. If GitHub Copilot is selected and `.github/agents/` or `.github/skills/` don't exist yet, they are generated automatically.

### 3. Add company reference docs (optional but powerful)

Drop markdown files into `_superml/reference/` — shared docs go in `all/`, role-specific docs in the role subfolder. Agents load these automatically on every activation.

```
_superml/reference/
├── all/                 ← every persona reads these (coding standards, glossary, etc.)
├── product/             ← Product / BA persona
├── architect/           ← Architect persona
├── developer/           ← Developer persona
├── modernization/       ← Modernization Lead persona
└── team_lead/           ← Team Lead / PM persona
```

### 4. Activate an agent in your AI chat

Three ways to activate a persona in **GitHub Copilot Chat**:

```
@sml-agent-pm               ← agent picker (recommended)
/sml-agent-pm               ← slash command
#file:_superml/skills/2-planning/agent-pm/SKILL.md  ← direct reference
```

In **Claude, Cursor, or any other AI assistant**:
```
Load the skill at _superml/skills/2-planning/agent-pm/SKILL.md
```

Each agent greets you by your configured name, explains what it can do, and presents a menu. Choose a workflow and the agent guides you step by step.

### 5. Run a multi-persona meeting

```bash
npx @supermldev/smart-sdlc meeting
```

Generates a structured context prompt that brings multiple personas into a single AI session for design reviews, sprint planning, or architecture discussions.

## Project Structure

```
_superml/
├── skills/
│   ├── 0-relearn/           Codebase onboarding and exploration
│   ├── 1-analysis/          Phase 1 — Understand the problem
│   ├── 2-planning/          Phase 2 — Define requirements and UX
│   ├── 3-solutioning/       Phase 3 — Design architecture and break down work
│   ├── 4-implementation/    Phase 4 — Build, test, ship
│   ├── 5-modernize/         Legacy analysis and migration planning
│   ├── core/                Cross-cutting utility skills
│   └── integrations/        JIRA, Confluence, GitHub, GitLab, Azure DevOps
├── module.yaml              Skill registry
├── config.yml               Project config (gitignored) — team names, paths, integrations
├── persona.yml              Personal config (gitignored) — your name, role, preferences
├── meetings/                Generated multi-persona meeting context docs
└── reference/               Company-specific docs loaded by agents on activation

.github/                     Generated by init when GitHub Copilot is selected
├── agents/
│   ├── sml-agent-pm.agent.md         Copilot agent picker entry — Product / BA
│   ├── sml-agent-architect.agent.md  Copilot agent picker entry — Architect
│   ├── sml-agent-developer.agent.md  Copilot agent picker entry — Developer
│   ├── sml-agent-sage.agent.md       Copilot agent picker entry — Modernization Lead
│   ├── sml-agent-lead.agent.md       Copilot agent picker entry — Team Lead / PM
│   └── sml-agent-scout.agent.md      Copilot agent picker entry — Code Archaeologist
├── skills/
│   └── <skill-name>/SKILL.md     One per skill — appears as /sml-skill-name slash command
├── copilot-instructions.md       Project-level Copilot context
└── pull_request_template.md      PR template
```

## Personas

| Persona | Default Name | Role | Starter Skill |
|---------|-------------|------|---------------|
| Persona | Default Name | Copilot Agent | Role | Starter Skill |
|---------|-------------|---------------|------|---------------|
| Product / BA | Aria | `@sml-agent-pm` | Requirements, PRDs, user stories | `_superml/skills/2-planning/agent-pm/SKILL.md` |
| Architect | Rex | `@sml-agent-architect` | System design, ADRs, architecture | `_superml/skills/3-solutioning/agent-architect/SKILL.md` |
| Developer | Nova | `@sml-agent-developer` | Implementation, code review, tech debt | `_superml/skills/4-implementation/agent-developer/SKILL.md` |
| Modernization Lead | Sage | `@sml-agent-sage` | Legacy analysis, migration planning | `_superml/skills/5-modernize/agent-sage/SKILL.md` |
| Team Lead / PM | Lead | `@sml-agent-lead` | Epics, sprint planning, delivery | `_superml/skills/4-implementation/sprint-planning/SKILL.md` |
| Code Archaeologist | Scout | `@sml-agent-scout` | Codebase onboarding, reverse-engineer docs | `_superml/skills/0-relearn/agent-scout/SKILL.md` |

Default names are overridden at project setup — your team picks the names.

## CLI Commands

```bash
npx @supermldev/smart-sdlc init       # Set up Smart SDLC project for your team
npx @supermldev/smart-sdlc persona    # Configure your personal workspace and role
npx @supermldev/smart-sdlc help       # What to do next — context-aware SDLC guidance
npx @supermldev/smart-sdlc list       # List all available skills and agents
npx @supermldev/smart-sdlc meeting    # Set up a multi-persona meeting context
npx @supermldev/smart-sdlc update     # Update skills to the latest installed version
npx @supermldev/smart-sdlc clean      # Remove generated Smart SDLC files
```

## Configuration

Two separate config files keep project settings and personal settings independent:

**`_superml/config.yml`** — project-wide, shared setup by the Initiator:
- Project name, type, team name
- Team role names (`persona_name_product`, `persona_name_architect`, etc.)
- Docs paths, integrations (JIRA, Confluence, GitHub, etc.)
- Artifact readiness flags (PRD, architecture, epics, etc.)

**`_superml/persona.yml`** — personal, one per team member:
- `user_name` — your display name
- `primary_persona` — your role (product / architect / developer / modernization / team_lead)
- `use_github_copilot` — true / false
- `user_skill_level` — beginner / intermediate / expert
- `communication_language` / `document_output_language`

Both files are gitignored. See `config/config.example.yml` for all available options.

## Multi-Member Conflict Prevention

Built-in conflict detection at 3 layers:

1. **JIRA ticket lock** — before starting a story, check its JIRA status. `In Progress` + assigned = locked to another team member.
2. **Git branch lock** — before creating a branch, `git ls-remote` checks the branch name (pattern: `{JIRA-KEY}-{slug}`) to detect parallel work.
3. **Confluence version traceability** — generated stories embed the source document version; stale-doc conflicts surface at story creation time.

See `_superml/integrations/jira/conflict-detect/SKILL.md` for full workflow.

## Skill Registry

See `_superml/module.yaml` for the complete list of all skills with descriptions.

## Community

Join us on Discord: [discord.gg/26XMXkEt](https://discord.gg/26XMXkEt)

Ask questions, share workflows, and connect with other Smart SDLC users and contributors.

## Contributing

Contributions are welcome — new skills, integrations, CLI commands, and documentation improvements.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- How to add a skill or integration
- Skill file format and placement
- PR guidelines and checklist
- How to report issues

## Security

Please do not open public issues for security vulnerabilities. See [SECURITY.md](./SECURITY.md) for the responsible disclosure process.

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating you agree to abide by its terms.

## License

[MIT](./LICENSE) © 2026 [Superml.dev](https://superml.dev)

