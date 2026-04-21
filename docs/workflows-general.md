# General & API Workflow — Smart SDLC

This workflow covers new feature work on an **existing product** or building out a **new API** on an established codebase. It is the most common day-to-day workflow.

**Applies to project types:** `general`, `api`

---

## Workflow Overview

```
[Scout]           Onboard to the codebase
   ↓
[Product / BA]    Understand the problem, write a PRD
   ↓
[Architect]       Design the solution, create epics & stories
   ↓
[Developer]       Implement story by story
   ↓
[Team Lead]       Sprint planning & delivery tracking
```

Each phase produces an **artifact** that the next phase depends on. The `/sml-help` skill reads artifact completion flags from `config.yml` to tell you which phase is next.

---

## Phase 0 — Codebase Onboarding

**Persona:** Any (Scout is unrestricted)
**When to run:** First time on the project, or when the codebase has changed significantly.

### Step 1 — Activate Scout

```
@sml-agent-scout
```

Scout introduces itself and presents a menu of onboarding tasks.

### Step 2 — Relearn the codebase

```
/sml-relearn-codebase
```

Scout runs the 5-step brownfield analysis:

| Step | Output |
|---|---|
| **01 — Scan** | File tree, tech stack, entry points |
| **02 — Architecture** | Component diagram, layer map, external dependencies |
| **03 — Data & API** | Data models, API routes, contracts |
| **04 — Patterns** | Coding conventions, error patterns, naming rules |
| **05 — Document** | `docs/architecture.md`, `docs/api-reference.md`, updated `README.md` |

### Step 3 — Reverse-engineer ADRs (optional)

```
/sml-reverse-adr
```

Surfaces *why* key technical decisions were made, based on code evidence. Produces `docs/decisions/` ADR files.

**Output artifact:** `docs/architecture.md`, `README.md`, `docs/api-reference.md`

---

## Phase 1 — Analysis & Problem Definition

**Persona:** `product`
**Prerequisite:** Codebase is understood (Phase 0 done or docs already exist)

### Step 1 — Activate the BA Agent

```
@sml-agent-pm
```

Aria greets you, checks what artifacts already exist, and presents her menu.

### Step 2 — Document the existing project (optional, brownfield)

```
/sml-document-project
```

Produces structured project documentation for AI and human consumption: feature inventory, user journeys, integration points. Useful before writing a PRD for a new feature.

### Step 3 — Create a Product Brief

```
/sml-product-brief
```

Guided discovery session to capture:
- The problem being solved
- Target users and their goals
- Success metrics
- Out-of-scope decisions

**Output artifact:** `_superml-output/planning/product-brief.md`

### Step 4 — Create the PRD

```
/sml-create-prd
```

3-step guided PRD creation:

| Step | Content |
|---|---|
| **Goals & Users** | Objective, user segments, jobs-to-be-done |
| **Features & Flows** | Functional requirements, user flows, acceptance criteria |
| **Non-Functional & Constraints** | Performance, security, compatibility, timeline |

Aria checks the product brief and existing architecture before writing to maintain consistency.

**Output artifact:** `_superml-output/planning/prd-<feature>.md`

Set `prd_complete: true` in `_superml/config.yml` when approved.

---

## Phase 2 — Architecture & Solutioning

**Persona:** `architect`
**Prerequisite:** `prd_complete: true`

### Step 1 — Activate the Architect

```
@sml-agent-architect
```

Rex loads the PRD and existing architecture docs, then presents his menu.

### Step 2 — Create the architecture document

```
/sml-create-architecture
```

Rex produces a full architecture document:

| Section | Content |
|---|---|
| **Context** | What we're building and why |
| **Component Design** | New or changed components, their contracts |
| **Data Design** | Schema changes, migration plan |
| **API Design** | New endpoints, payloads, versioning |
| **ADRs** | Key decisions with rationale and rejected alternatives |
| **Non-functional Design** | Security, performance, observability |
| **Implementation Notes** | Suggested phasing, risks, open questions |

**Output artifact:** `_superml-output/planning/architecture-<feature>.md`

Set `architecture_complete: true` in `_superml/config.yml` when approved.

### Step 3 — Generate project context (optional but recommended)

```
/sml-generate-context
```

Produces `project-context.md` — a compact, AI-optimised summary of the entire project state. Loaded by the Developer agent on every activation.

### Step 4 — Break into epics and stories

```
/sml-create-epics-stories
```

Rex (or Team Lead) reads the PRD + architecture and produces:
- Epic list with goals and acceptance criteria
- User story breakdown per epic
- Story-level acceptance criteria and technical notes
- Suggested sequencing and dependencies

**Output artifact:** `_superml-output/planning/epics-stories-<feature>.md`

Set `epics_complete: true` in `_superml/config.yml` when approved.

---

## Phase 3 — Sprint Planning

**Persona:** `team_lead` or `developer`
**Prerequisite:** `epics_complete: true`

### Step 1 — Activate the Team Lead (or Developer)

```
@sml-agent-lead
```

Lead loads the epics, checks current sprint state, and presents capacity and priority options.

### Step 2 — Plan the sprint

```
/sml-sprint-planning
```

The sprint planning skill guides you through:

1. **Backlog review** — select candidate stories from epics
2. **Capacity check** — enter developer count and days
3. **Estimation** — story-point or day estimates per story
4. **Assignment** — assign stories to team members
5. **Sprint goal** — define the sprint objective
6. **JIRA sync** — push the sprint backlog to JIRA (if enabled)

**Output artifact:** `_superml-output/implementation/sprint-<n>.md`

---

## Phase 4 — Implementation

**Persona:** `developer`
**Prerequisite:** Sprint stories exist

### Step 1 — Activate the Developer Agent

```
@sml-agent-developer
```

Nova loads the sprint stories, checks the git branch state, and presents the story queue.

### Step 2 — Implement a story (TDD loop)

```
/sml-dev-story
```

Nova guides you through the full TDD loop for a single story:

| Step | What Happens |
|---|---|
| **Read** | Load story, acceptance criteria, architecture context |
| **Red** | Write failing tests first |
| **Green** | Write minimum implementation to pass |
| **Refactor** | Clean up code with tests green |
| **Review gate** | Self-review against acceptance criteria |
| **Commit** | Guided commit message based on story |

If JIRA is enabled, Nova transitions the story ticket from `In Progress` to `In Review` after commit.

### Step 3 — Code review

```
/sml-code-review
```

Structured review against:
- Story acceptance criteria
- Architecture decisions (ADRs)
- Team coding standards (loaded from `_superml/reference/developer/`)
- Security checks (OWASP Top 10 surface scan)

---

## Cross-Persona Collaboration Points

| Situation | What To Do |
|---|---|
| Developer needs requirements clarified | `/sml-meeting` → bring in `product` persona |
| Developer hits architectural uncertainty | `/sml-meeting` → bring in `architect` persona |
| Architect needs feasibility input | `/sml-meeting` → bring in `developer` persona |
| BA needs to understand existing system | `/sml-meeting` → bring in `architect` persona |
| Team Lead needs capacity input | `/sml-meeting` → bring in `developer` persona |

```bash
npx @supermldev/smart-sdlc meeting
```

This generates a context prompt that activates all selected personas in one AI session.

---

## Artifact Chain Summary

```
product-brief.md
    → prd-<feature>.md                 (prd_complete: true)
        → architecture-<feature>.md    (architecture_complete: true)
            → epics-stories.md         (epics_complete: true)
                → sprint-<n>.md
                    → implementation   (story by story)
```

Each artifact in the chain is loaded by the next phase's agent automatically if it exists at the configured path in `_superml/config.yml`.

---

## API-Specific Notes

For `api` project type, the workflow is the same but with these additions:

- **Phase 0:** Run `/sml-generate-api-docs` after Scout analysis to produce an OpenAPI baseline
- **Phase 2 Architecture:** Rex focuses the architecture document on API contract design — endpoint specs, request/response schemas, versioning strategy, auth model
- **Phase 4:** Nova applies API-specific conventions (status codes, error envelopes, idempotency) loaded from `_superml/reference/developer/`

---

## Other Workflows

Not the right workflow for your project type? Choose below:

| Workflow | Project Type | When to Use |
|---|---|---|
| **General & API** *(this page)* | `general`, `api` | Feature work on an existing product or new API on an established codebase |
| [Greenfield](workflows-greenfield) | `greenfield` | Net-new product built from a blank canvas — no existing codebase |
| [Modernization](workflows-modernization) | `modernization` | Migrating or re-platforming a legacy system — understand, extract, redesign, deliver |
