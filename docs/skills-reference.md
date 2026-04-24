# Skills Reference — Smart SDLC

Every skill in the framework, with its type, persona access, activation method, and what it produces.

**Skill types:**
- **Agent** — activates a full persona with menu-driven interaction
- **Workflow** — drives a specific multi-step task
- **Utility** — cross-cutting tools available to all personas
- **Integration** — connects to external systems (JIRA, Confluence, GitHub, etc.)

**Activation methods (GitHub Copilot):**
- `@sml-<name>` — agent picker (for agent-type skills)
- `/sml-<name>` — slash command
- `#file:_superml/skills/<path>/SKILL.md` — direct file attachment

---

## Phase 0 — Relearn (Brownfield Onboarding)

*All skills in this phase are unrestricted — any persona can use them.*

| Skill | Command | Type | What It Does | Output |
|---|---|---|---|---|
| **agent-scout** | `@sml-agent-scout` | Agent | Code Archaeologist persona. Onboarding to unfamiliar codebases, reverse-engineering docs. | Interactive menu |
| **relearn-codebase** | `/sml-relearn-codebase` | Workflow | Full 5-step reverse-engineering: scan structure, architecture, data/API, patterns, produce docs. | `docs/legacy/*.md` or `docs/*.md` |
| **generate-readme** | `/sml-generate-readme` | Workflow | Generate or refresh README.md from the actual codebase — setup, env, scripts, project structure. | `README.md` |
| **generate-api-docs** | `/sml-generate-api-docs` | Workflow | Generate API reference documentation (markdown or OpenAPI YAML) from route files and schemas. | `docs/api-reference.md` or `openapi.yaml` |
| **reverse-adr** | `/sml-reverse-adr` | Workflow | Reverse-engineer Architecture Decision Records from code evidence — document WHY things are this way. | `docs/decisions/ADR-*.md` |

### relearn-codebase — Step Detail

| Step | What Scout Does |
|---|---|
| 01 — Scan | File tree, tech stack detection, entry points, test coverage indicators |
| 02 — Architecture | Component diagram, layer map, external service dependencies |
| 03 — Data & API | Data models, DB schemas, API routes and contracts |
| 04 — Patterns | Coding conventions, error handling patterns, naming rules, anti-patterns found |
| 05 — Document | Consolidates all above into structured markdown suite |

---

## Phase 1 — Analysis

| Skill | Command | Type | Persona | What It Does | Output |
|---|---|---|---|---|---|
| **agent-analyst** | `@sml-agent-analyst` | Agent | product | Business Analyst persona. Requirements elicitation, codebase analysis, competitive research. | Interactive menu |
| **document-project** | `/sml-document-project` | Workflow | All | Analyse an existing codebase and produce structured project documentation for human and AI consumption. | `docs/project-overview.md` |
| **product-brief** | `/sml-product-brief` | Workflow | product | Guided discovery to create a product brief: problem, users, metrics, scope. | `_superml-output/planning/product-brief.md` |

---

## Phase 2 — Planning

| Skill | Command | Type | Persona | What It Does | Output |
|---|---|---|---|---|---|
| **agent-pm** | `@sml-agent-pm` | Agent | product | Product Manager persona. PRD creation, requirements discovery, stakeholder alignment. | Interactive menu |
| **create-prd** | `/sml-create-prd` | Workflow | product | 3-step guided PRD: goals & users, features & flows, non-functional requirements. | `_superml-output/planning/prd-<name>.md` |
| **edit-prd** | `/sml-edit-prd` | Workflow | product | Refine an existing PRD section by section without rewriting the whole document. | Updated `prd-*.md` |
| **validate-prd** | `/sml-validate-prd` | Workflow | product | Validate PRD for completeness, consistency, and implementation readiness. Flags gaps. | Validation report inline |

### create-prd — Step Detail

| Step | What Gets Written |
|---|---|
| Goals & Users | Objective, user segments, user journeys, success criteria |
| Features & Flows | Feature list, user flows per feature, acceptance criteria |
| Non-Functional | Performance, security, compatibility, constraints, timeline |

---

## Phase 3 — Solutioning

| Skill | Command | Type | Persona | What It Does | Output |
|---|---|---|---|---|---|
| **agent-architect** | `@sml-agent-architect` | Agent | architect | System Architect persona. Technical architecture, system design, technology decisions. | Interactive menu |
| **create-architecture** | `/sml-create-architecture` | Workflow | architect | Full architecture document: components, data, API, ADRs, non-functional, risks. | `_superml-output/planning/architecture-*.md` |
| **create-epics-stories** | `/sml-create-epics-stories` | Workflow | architect, team_lead | Break PRD + architecture into epics and detailed user stories with acceptance criteria. | `_superml-output/planning/epics-stories.md` |
| **generate-context** | `/sml-generate-context` | Workflow | architect | Generate a compact `project-context.md` optimised for AI context loading across sessions. | `project-context.md` |

### create-architecture — Section Detail

| Section | Content |
|---|---|
| System Context | What the system does, who uses it, external dependencies |
| Component Design | Services / modules / layers, responsibilities, contracts |
| Data Design | Entity model, schema, storage choices, migration plan |
| API Design | Endpoints, request/response contracts, versioning, auth |
| Infrastructure | Deployment topology, environments, CI/CD |
| ADRs | Key technical decisions with rationale and rejected alternatives |
| Non-Functional | Security, performance, observability, scalability |
| Implementation Notes | Phasing suggestions, risks, open questions |

---

## Phase 4 — Implementation

| Skill | Command | Type | Persona | What It Does | Output |
|---|---|---|---|---|---|
| **agent-developer** | `@sml-agent-developer` | Agent | developer | Senior Developer persona. Story execution, TDD, code quality. | Interactive menu |
| **dev-story** | `/sml-dev-story` | Workflow | developer | Implement a story using TDD (Red → Green → Refactor). | Implemented code + commit |
| **code-review** | `/sml-code-review` | Workflow | developer | Structured code review against acceptance criteria, ADRs, and coding standards. | Review report inline |
| **create-story** | `/sml-create-story` | Workflow | developer, team_lead | Write a single detailed story with full acceptance criteria and technical notes. | Story doc or JIRA ticket |
| **sprint-planning** | `/sml-sprint-planning` | Workflow | developer, team_lead | Plan a sprint: select stories, estimate, assign, set sprint goal. | `{output_path}/implementation/sprint-<n>.md` |
| **agent-lead** | `@sml-agent-lead` | Agent | team_lead | Team Lead / PM persona. Sprint health, delivery coordination, progress tracking. | Interactive menu |
| **sprint-status** | `/sml-sprint-status` | Workflow | team_lead | Generate a sprint status report from current story state — progress, blockers, risks. | `{output_path}/implementation/sprint-status.md` |
| **retrospective** | `/sml-retrospective` | Workflow | team_lead | Facilitate a structured sprint retrospective: what went well, what to improve, actions. | `{output_path}/implementation/retrospective-<n>.md` |

### dev-story — Loop Detail

| Step | What Happens |
|---|---|
| Load | Read story, acceptance criteria, architecture context, coding standards |
| Red | Write failing tests covering acceptance criteria |
| Green | Write minimum implementation to pass tests |
| Refactor | Improve structure, naming, readability while tests stay green |
| Review gate | Self-checklist: AC ✔, code quality ✔, no console logs/dead code ✔ |
| Commit | Semantic commit message referencing story ID |
| JIRA (if enabled) | Transition ticket to `In Review` |

---

## Phase 6 — Quality Assurance

**Persona:** `qa` — prerequisite: `implementation_signed_off: true`

| Skill | Command | Type | Persona | What It Does | Output |
|---|---|---|---|---|---|
| **test-plan** | `/sml-test-plan` | Workflow | qa | Create a test plan: scope, strategy, test cases mapped to acceptance criteria, risk areas. | `{output_path}/qa/test-plan.md` |
| **test-execution** | `/sml-test-execution` | Workflow | qa | Execute the test plan and record pass/fail results with evidence and defect references. | `{output_path}/qa/test-execution.md` |
| **bug-triage** | `/sml-bug-triage` | Workflow | qa | Log, classify (P1–P4), and track bugs. P1/P2 bugs block release sign-off. | `{output_path}/qa/bug-triage.md` |
| **qa-signoff** | `/sml-qa-signoff` | Workflow | qa | Formal QA sign-off checklist. Records tester identity and date. Sets `qa_signed_off: true`. | `{output_path}/qa/qa-signoff.md` |

---

## Phase 7 — Release

**Persona:** `release` — prerequisite: `qa_signed_off: true`

| Skill | Command | Type | Persona | What It Does | Output |
|---|---|---|---|---|---|
| **release-checklist** | `/sml-release-checklist` | Workflow | release | Structured pre-release checklist: environment, config, migrations, feature flags, monitoring. | `{output_path}/release/release-checklist.md` |
| **deploy-runbook** | `/sml-deploy-runbook` | Workflow | release | Step-by-step deployment guide with rollback procedures and post-deploy smoke tests. | `{output_path}/release/deploy-runbook.md` |
| **release-notes** | `/sml-release-notes` | Workflow | release | Draft user-facing release notes from sprint and story artifacts. | `{output_path}/release/release-notes.md` |

---

| Skill | Command | Type | Persona | What It Does | Output |
|---|---|---|---|---|---|
| **agent-sage** | `@sml-agent-sage` | Agent | modernization | Modernization Lead persona. Legacy analysis, migration planning, knowledge extraction. | Interactive menu |
| **read-legacy-code** | `/sml-read-legacy-code` | Workflow | modernization | Structured deep-read of legacy programs: entry points, control flow, business rules, data flows. | `docs/legacy/program-inventory.md`, `business-rules-raw.md` |
| **build-knowledge-graph** | `/sml-build-knowledge-graph` | Workflow | modernization | Structure extracted rules into entity model, rule catalogue, process flows, decision tables. | `docs/legacy/knowledge-graph.md`, `process-flows/`, `decision-tables/` |
| **validate-business-rules** | `/sml-validate-business-rules` | Workflow | modernization | Walk stakeholders through extracted rules — confirm, dispute, or flag as incomplete. | `docs/legacy/business-rules-validated.md` |
| **define-target-architecture** | `/sml-define-target-architecture` | Workflow | modernization | Assess legacy pain points, choose migration strategy, design target state, plan cut-over. | `_superml-output/planning/target-architecture.md` |
| **create-migration-epics** | `/sml-create-migration-epics` | Workflow | modernization | Break migration plan into epics and stories with traceability back to business rules. | `_superml-output/planning/migration-epics.md` |

---

## Core Utility Skills

*Available to all personas.*

| Skill | Command | Type | What It Does |
|---|---|---|---|
| **help** | `/sml-help` | Utility | Context-aware guidance. Reads `config.yml` and `persona.yml` to tell you what to do next based on current project state. |
| **brainstorming** | `/sml-brainstorming` | Utility | Facilitated brainstorming using diverge/converge technique. Useful before product brief or architecture. |
| **elicitation** | `/sml-elicitation` | Utility | Advanced requirements elicitation: assumption surfacing, five-whys, stakeholder mapping, jobs-to-be-done. |
| **review-adversarial** | `/sml-review-adversarial` | Utility | Stress-test any deliverable by playing devil's advocate — surfaces blind spots, weak assumptions, and edge cases. |

### /sml-help — State Logic

`/sml-help` reads `_superml/config.yml` and `_superml/persona.yml` to detect which of three states the project is in:

| State | Condition | What Help Says |
|---|---|---|
| **State A** — No config | Neither config.yml nor persona.yml exists | Run `init` first |
| **State B** — Config exists, no persona | `config.yml` exists but no `persona.yml` | Run `persona` to set up your role |
| **State C** — Fully configured | Both files exist | Shows your persona's next recommended action based on artifact completion flags |

---

## Integration Skills

See [Integrations](./integrations.md) for full setup and usage.

### JIRA

| Skill | Command | What It Does |
|---|---|---|
| **jira-connect** | `/sml-jira-connect` | Set up JIRA connectivity — choose REST API (email + token) or MCP Server (Atlassian Remote / `@sooperset/mcp-atlassian` / custom URL) |
| **jira-create-epic** | `/sml-jira-create-epic` | Create an epic in JIRA from a Smart SDLC epics artifact |
| **jira-create-story** | `/sml-jira-create-story` | Create a JIRA story from a Smart SDLC story file |
| **jira-sync** | `/sml-jira-sync` | Sync all epics and stories from planning artifacts to JIRA |
| **jira-conflict-detect** | `/sml-jira-conflict-detect` | Check JIRA ticket status before branch creation to prevent work conflicts |

### Confluence

| Skill | Command | What It Does |
|---|---|---|
| **confluence-connect** | `/sml-confluence-connect` | Set up Confluence connectivity — REST API or MCP Server; auto-detects if JIRA is already using Atlassian MCP and offers to reuse it |
| **confluence-push-doc** | `/sml-confluence-push-doc` | Push a planning artifact (PRD, architecture, etc.) to a Confluence page |

### GitHub

| Skill | Command | What It Does |
|---|---|---|
| **github-connect** | `/sml-github-connect` | Verify `gh` CLI authentication and repo access |
| **github-create-branch** | `/sml-github-create-branch` | Create a feature branch following the configured naming convention |
| **github-create-pr** | `/sml-github-create-pr` | Create a PR from current branch with auto-filled template |

### Company Knowledge

*Available to all personas.*

| Skill | Command | What It Does | Output |
|---|---|---|---|
| **company-knowledge-connect** | `/sml-company-knowledge-connect` | Register internal knowledge sources — framework docs, platform libraries, developer portals — via URL (with optional auth) or a company MCP server | `company_knowledge.sources[]` in `_superml/config.yml` |
| **company-knowledge-fetch** | `/sml-company-knowledge-fetch` | Pull a registered knowledge source into the current AI session; handles URL auth and MCP tool calls; summarises what was loaded and suggests next actions | Knowledge in AI context |

---

## Skill Activation Quick Reference

### GitHub Copilot

```
@sml-agent-pm               # Activate Product / BA agent
@sml-agent-architect        # Activate Architect agent
@sml-agent-developer        # Activate Developer agent
@sml-agent-lead             # Activate Team Lead agent
@sml-agent-qa               # Activate QA agent
@sml-agent-release          # Activate Release agent
@sml-agent-sage             # Activate Modernization Lead agent
@sml-agent-scout            # Activate Scout agent

/sml-help                   # What to do next
/sml-create-prd             # Write a PRD
/sml-create-architecture    # Design architecture
/sml-create-epics-stories   # Break into epics and stories
/sml-sprint-planning        # Plan a sprint
/sml-sprint-status          # Sprint status report
/sml-retrospective          # Sprint retrospective
/sml-dev-story              # Implement a story
/sml-code-review            # Review code
/sml-test-plan              # Create a test plan
/sml-test-execution         # Execute tests
/sml-qa-signoff             # QA sign-off
/sml-release-checklist      # Release readiness checklist
/sml-deploy-runbook         # Deployment runbook
/sml-release-notes          # Release notes
/sml-relearn-codebase       # Onboard to codebase
/sml-read-legacy-code       # Deep-read legacy system
/sml-build-knowledge-graph  # Extract business rules
/sml-review-adversarial     # Stress-test any deliverable
/sml-company-knowledge-fetch # Pull internal docs into AI context
```

### Other AI Assistants (Claude, Cursor, etc.)

```
Load skill at: _superml/skills/2-planning/agent-pm/SKILL.md
Load skill at: _superml/skills/3-solutioning/create-architecture/SKILL.md
Load skill at: _superml/skills/4-implementation/dev-story/SKILL.md
Load skill at: _superml/skills/6-quality/test-plan/SKILL.md
```
