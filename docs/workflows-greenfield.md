# Greenfield Workflow — Smart SDLC

This workflow covers **net-new products** built from a blank canvas — no existing codebase to onboard to, no legacy constraints. Everything is defined and discovered through the SDLC process itself.

**Applies to project type:** `greenfield`

---

## Workflow Overview

```
[Product / BA]    Define the problem, research the market, create product brief
   ↓
[Product / BA]    Write the PRD (requirements, users, features, constraints)
   ↓
[Architect]       Design the system architecture and key technical decisions
   ↓
[Architect / TL]  Break into epics and user stories
   ↓
[Team Lead]       Sprint planning, capacity, prioritisation
   ↓
[Developer]       Implement story by story using TDD
```

Greenfield is the **cleanest path** through Smart SDLC — no pre-existing archaeology or legacy constraints. The entire design is produced forward from first principles.

---

## Phase 0 — Project Initialisation

**Who runs it:** Team Lead or PM (once per project)

```bash
npx @supermldev/smart-sdlc init
```

During init, select:
- **Project type:** `greenfield`
- **AI tool:** GitHub Copilot, Claude, Cursor, or other
- **Team names:** Customise the name for each persona (e.g. rename Aria to "Jordan")
- **Integrations:** Enable JIRA / Confluence / GitHub if applicable
- **Artifact paths:** Where planning and implementation outputs are saved

Then each team member runs their personal setup:

```bash
npx @supermldev/smart-sdlc persona
```

---

## Phase 1 — Product Discovery

**Persona:** `product`
**Goal:** Understand the problem deeply before writing a single requirement.

### Step 1 — Activate the BA Agent

```
@sml-agent-pm
```

Aria greets you and presents the discovery menu.

### Step 2 — Elicitation (optional but valuable)

```
/sml-elicitation
```

If the problem is fuzzy or assumptions are unvalidated, run the elicitation skill first. Aria will guide you through:
- Stakeholder mapping (who needs this, who is affected)
- Five-whys analysis (why is this a problem, root causes)
- Assumption surfacing (what are we taking for granted)
- Jobs-to-be-done framing

**Output:** A set of validated problem statements and assumptions to carry forward into the product brief.

### Step 3 — Brainstorming (optional)

```
/sml-brainstorming
```

Structured ideation using diverge/converge technique. Useful if the solution space is wide and the team wants to explore before committing to an approach.

### Step 4 — Create Product Brief

```
/sml-product-brief
```

A focused brief that captures:
- The problem and why it matters
- Target user segments and their goals
- Success metrics (quantitative and qualitative)
- Scope boundaries — what's in, what's explicitly out
- Risks and open questions

**Output artifact:** `_superml-output/planning/product-brief.md`

### Step 5 — Create the PRD

```
/sml-create-prd
```

Aria runs the 3-step guided PRD workflow:

| Step | What Gets Written |
|---|---|
| **Goals & Users** | Objective, user personas, user journeys, success criteria |
| **Features & Flows** | Feature list, user flows, acceptance criteria per feature |
| **Non-Functional & Constraints** | Performance targets, security requirements, tech constraints, timeline |

**Output artifact:** `_superml-output/planning/prd-v1.md`

> Mark `prd_complete: true` in `_superml/config.yml` when the PRD is reviewed and approved.

---

## Phase 2 — Architecture & Technical Design

**Persona:** `architect`
**Prerequisite:** `prd_complete: true`

### Step 1 — Activate the Architect

```
@sml-agent-architect
```

Rex loads the PRD and presents the solutioning menu.

### Step 2 — Architecture document

```
/sml-create-architecture
```

Starting from a blank canvas, Rex designs:

| Section | What Gets Designed |
|---|---|
| **System context** | What the system does, who uses it, external dependencies |
| **Component architecture** | Services, modules, layers — with responsibilities and contracts |
| **Data architecture** | Entity model, storage choices, schema design |
| **API design** | Interface contracts (REST, event-driven, or otherwise) |
| **Infrastructure design** | Deployment topology, CI/CD, environments |
| **ADRs** | Key technology choices with rationale |
| **Cross-cutting concerns** | Auth, logging, error handling, observability |

**Output artifact:** `_superml-output/planning/architecture-v1.md`

> Mark `architecture_complete: true` in `_superml/config.yml` when approved.

### Step 3 — Generate project context

```
/sml-generate-context
```

Produces `project-context.md` — a compact, AI-optimised project summary. Every agent loads this on activation to maintain consistency across sessions.

### Step 4 — Epics and stories

```
/sml-create-epics-stories
```

Rex reads the PRD and architecture, then breaks the product into delivery units:

1. **Epics** — major functional areas (e.g. User Authentication, Payment Processing)
2. **Stories** — independent, deliverable user stories per epic
3. **Acceptance criteria** — testable conditions per story
4. **Technical notes** — implementation guidance referencing architectural decisions
5. **Dependencies** — which stories must be done before others
6. **Suggested sequence** — phasing recommendation

**Output artifact:** `_superml-output/planning/epics-stories-v1.md`

> Mark `epics_complete: true` in `_superml/config.yml` when done.

---

## Phase 3 — Sprint Planning

**Persona:** `team_lead`
**Prerequisite:** `epics_complete: true`

### Step 1 — Activate the Team Lead

```
@sml-agent-lead
```

### Step 2 — Plan the first sprint

```
/sml-sprint-planning
```

For greenfield projects, Sprint 1 is typically focused on **foundation** stories:
- Project scaffolding (repo, CI/CD, environments)
- Core infrastructure (auth, database, logging)
- Walking skeleton — the simplest possible end-to-end flow

Team Lead guides you through:
1. Backlog review — which stories are ready (no unresolved dependencies)
2. Capacity — team size, days available, expected interruptions
3. Story selection — focus on highest-value, least-dependent stories
4. Sprint goal — one sentence describing what the sprint achieves

**Output artifact:** `_superml-output/implementation/sprint-1.md`

If JIRA is enabled, the sprint is created and stories are assigned automatically.

---

## Phase 4 — Implementation

**Persona:** `developer`
**Prerequisite:** Sprint stories are planned

### Step 1 — Activate the Developer Agent

```
@sml-agent-developer
```

Nova loads `project-context.md`, the sprint doc, and the epics file, then presents the story queue.

### Step 2 — Pick a story and implement

```
/sml-dev-story
```

For greenfield projects, Nova applies a **test-first discipline** from the very first line of code:

| Step | Nova Does |
|---|---|
| **Load context** | Read story, acceptance criteria, architecture notes |
| **Define tests** | Write unit/integration test stubs covering acceptance criteria |
| **Red** | Confirm tests fail (no implementation yet) |
| **Green** | Implement the minimum code to pass the tests |
| **Refactor** | Improve code quality with tests still green |
| **Checklist** | Self-review: acceptance criteria ✔, code quality ✔, no dead code ✔ |
| **Commit** | Semantic commit message referencing the story |
| **JIRA** | Move ticket to `In Review` (if JIRA enabled) |

### Step 3 — Code review

```
/sml-code-review
```

At PR time, Nova reviews the diff against:
- Acceptance criteria from the story
- Architectural conventions (ADRs)
- Team coding standards from `_superml/reference/developer/`
- Security considerations (OWASP surface scan)

---

## Recommended Sprint Sequence for Greenfield

| Sprint | Focus |
|---|---|
| **Sprint 0** | Tooling: repo, CI/CD, environments, scaffolding, walking skeleton |
| **Sprint 1** | Core infrastructure: auth, data storage, logging, health checks |
| **Sprint 2** | First user-facing feature (highest value story from Epic 1) |
| **Sprint N** | Feature-complete epics, integrations |
| **Final sprints** | Non-functional hardening, performance, security, launch readiness |

---

## Cross-Persona Collaboration

| When | Do This |
|---|---|
| Dev discovers an architectural assumption is wrong | `/sml-meeting` with `architect` |
| BA wants to add/change a requirement mid-sprint | `/sml-meeting` with `product` + `team_lead` |
| Architect needs feedback on API design usability | `/sml-meeting` with `developer` + `product` |
| Team Lead needs to re-prioritise after scope change | `/sml-meeting` with `product` + `architect` |

```bash
npx @supermldev/smart-sdlc meeting
```

---

## Artifact Chain

```
product-brief.md
    → prd-v1.md                        (prd_complete: true)
        → architecture-v1.md           (architecture_complete: true)
        → project-context.md
            → epics-stories-v1.md      (epics_complete: true)
                → sprint-1.md
                → sprint-2.md
                    → implementation
```

---

## Greenfield vs General Workflow

| | Greenfield | General |
|---|---|---|
| Phase 0 | No Scout needed (no codebase yet) | Scout always required |
| Product Brief | Mandatory starting point | Optional (product may already exist) |
| Architecture | Designed from scratch | Extends existing architecture |
| Stories | All new | Mix of new and change stories |
| Sprint 0 | Scaffolding and infrastructure | Usually skipped |
| Dev context | `project-context.md` only | `project-context.md` + existing docs |

---

## Other Workflows

Not the right workflow for your project type? Choose below:

| Workflow | Project Type | When to Use |
|---|---|---|
| [General & API](workflows-general) | `general`, `api` | Feature work on an existing product or new API on an established codebase |
| **Greenfield** *(this page)* | `greenfield` | Net-new product built from a blank canvas — no existing codebase |
| [Modernization](workflows-modernization) | `modernization` | Migrating or re-platforming a legacy system — understand, extract, redesign, deliver |
