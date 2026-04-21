# Modernization Workflow — Smart SDLC

This workflow covers **migrating legacy systems** — understanding what the system does, extracting business rules, designing a target architecture, and planning the migration delivery.

**Applies to project type:** `modernization`

Modernization is the most complex workflow in Smart SDLC. It involves all personas and spans weeks to months. The key difference from the general workflow is that **understanding and documenting the legacy system is itself a phase** before any new architecture is designed.

---

## Workflow Overview

```
[Scout]               Inventory the legacy codebase (structure, entry points, dependencies)
   ↓
[Modernization Lead]  Read legacy code deeply (data flows, business logic, rules)
   ↓
[Modernization Lead]  Build knowledge graph (entities, rules, processes)
   ↓
[Modernization Lead]  Validate business rules against stakeholders
   ↓
[Architect + Lead]    Define target architecture and migration strategy
   ↓
[Team Lead / Arch]    Create migration epics and stories
   ↓
[Developer]           Implement sprint by sprint (parallel-run or phased cut-over)
```

---

## Phase 0 — Legacy Inventory (Scout)

**Persona:** Any (Scout is unrestricted)
**Goal:** Produce a navigable map of the legacy system.

### Step 1 — Activate Scout

```
@sml-agent-scout
```

### Step 2 — Run full codebase relearn

```
/sml-relearn-codebase
```

Scout runs all 5 steps and produces:
- `docs/legacy/structure.md` — directory and module map
- `docs/legacy/architecture.md` — component and layer diagram
- `docs/legacy/data-api.md` — data models, DB schemas, API contracts (if any)
- `docs/legacy/patterns.md` — coding conventions, anti-patterns, tech debt
- `docs/legacy/summary.md` — consolidated overview

**This is the mandatory starting point.** The Modernization Lead's skills depend on Scout's output.

Set `legacy_inventory_complete: true` in `_superml/config.yml` when Scout's docs are complete.

---

## Phase 1 — Deep Legacy Analysis (Modernization Lead)

**Persona:** `modernization`
**Prerequisite:** `legacy_inventory_complete: true`

### Step 1 — Activate the Modernization Lead

```
@sml-agent-sage
```

Sage loads Scout's inventory and presents the modernization menu. It checks which analysis artifacts exist before proceeding.

### Step 2 — Read legacy code

```
/sml-read-legacy-code
```

This skill guides Sage through a **structured deep-read of legacy programs**, going beyond Scout's surface scan:

| Sub-step | What Sage Produces |
|---|---|
| **Entry-point analysis** | How programs start, batch jobs, scheduled tasks, triggers |
| **Control flow mapping** | Major execution paths, branching logic |
| **Business rule extraction** | Inline business rules, validation logic, calculations |
| **Data flow tracing** | How data enters, transforms, and leaves the system |
| **Dependency catalog** | External systems, file formats, message queues, DB tables |

**Output artifacts:**
- `docs/legacy/program-inventory.md` — one entry per legacy program/module
- `docs/legacy/business-rules-raw.md` — extracted rules in their raw form

### Step 3 — Build the knowledge graph

```
/sml-build-knowledge-graph
```

Sage takes the raw business rules and structures them into a **navigable knowledge model**:

| Component | What It Contains |
|---|---|
| **Entity model** | Key business entities and their relationships |
| **Business rules catalogue** | Named, numbered rules with source references |
| **Process flows** | End-to-end business processes the system implements |
| **Decision trees** | Complex conditional logic modelled as decision tables |
| **Integration map** | All systems this legacy system talks to |

**Output artifacts:**
- `docs/legacy/knowledge-graph.md` — the full structured model
- `docs/legacy/process-flows/` — one file per major business process
- `docs/legacy/decision-tables/` — complex rules as decision tables

Set `knowledge_graph_complete: true` in `_superml/config.yml` when done.

---

## Phase 2 — Business Rule Validation

**Persona:** `modernization` + stakeholders (human)
**Prerequisite:** `knowledge_graph_complete: true`

This phase is the **most critical** in the entire modernization project. Errors here propagate to every subsequent phase.

### Step 1 — Validate business rules

```
/sml-validate-business-rules
```

Sage guides a structured validation session:

1. **Present rules to stakeholders** — walk through each named rule
2. **Confirm or correct** — stakeholder marks rules as Confirmed / Wrong / Incomplete / Unknown
3. **Resolve unknowns** — Sage generates clarifying questions for each Unknown rule
4. **Update catalogue** — rules are updated with validation status and notes

**Output artifact:** `docs/legacy/business-rules-validated.md` — each rule with `status: confirmed | disputed | incomplete`

### Step 2 — Cross-persona rule review (optional but recommended)

```bash
npx @supermldev/smart-sdlc meeting
```

Run a meeting with `product` and `modernization` personas to:
- Review disputed rules with the BA
- Clarify domain intent behind legacy logic
- Decide whether disputed rules should be carried forward or deliberately changed

---

## Phase 3 — Target Architecture (Architect + Modernization Lead)

**Persona:** `architect` (with input from `modernization`)
**Prerequisite:** `knowledge_graph_complete: true`, business rules validated

### Step 1 — Define target architecture

```
/sml-define-target-architecture
```

This skill is run by the **Modernization Lead** but produces input for the Architect. It covers:

| Section | Content |
|---|---|
| **Legacy assessment** | Pain points, tech debt score, risk assessment |
| **Migration strategy** | Strangler fig, big-bang rewrite, parallel-run, lift-and-shift |
| **Target state vision** | What the system will look like post-migration |
| **Component mapping** | Legacy component → target component |
| **Data migration plan** | How data moves from legacy to target storage |
| **Integration migration** | How integrations are re-platformed |
| **Cut-over strategy** | Blue/green, gradual traffic shift, or hard cut |

**Output artifact:** `_superml-output/planning/target-architecture.md`

### Step 2 — Architect creates the detailed architecture

```
@sml-agent-architect
/sml-create-architecture
```

Rex reads `target-architecture.md` and the knowledge graph, then produces the full technical architecture with:
- Component design and contracts
- Data schema design for the target system
- API design (internal and external)
- ADRs for the key migration technology decisions
- Non-functional requirements (performance parity, security, observability)

**Output artifact:** `_superml-output/planning/architecture-modernization.md`

Set `architecture_complete: true` in `_superml/config.yml` when approved.

---

## Phase 4 — Migration Planning (Epics & Stories)

**Persona:** `modernization` or `team_lead`
**Prerequisite:** `architecture_complete: true`

### Step 1 — Create migration epics

```
/sml-create-migration-epics
```

Sage (or Team Lead) breaks the migration plan into delivery-ready epics and stories:

| Epic Category | Example Epics |
|---|---|
| **Foundation** | Set up target infrastructure, CI/CD pipeline |
| **Data migration** | Schema creation, data extraction, transformation, load |
| **Business logic** | Re-implement each validated business rule |
| **Integrations** | Re-platform each external integration |
| **Cut-over** | Parallel-run instrumentation, traffic switching, decommission |
| **Validation** | UAT scripts based on business-rules-validated.md |

Each story references the specific legacy program and business rule(s) it replaces, creating full traceability.

**Output artifact:** `_superml-output/planning/migration-epics.md`

Set `epics_complete: true` in `_superml/config.yml` when done.

---

## Phase 5 — Implementation (same as General Workflow)

**Persona:** `developer`
**Prerequisite:** `epics_complete: true`

The implementation phase follows the same sprint-based pattern as the general workflow. See [General & API Workflow](./workflows-general.md) — Phase 3 onwards.

**Key differences for modernization:**

- **Parallel-run testing** — Developer implements target code but also runs the legacy system alongside. Both outputs are compared before cut-over.
- **Business rule tracing** — Every story links to the validated business rule it replaces. The Developer skill checks this traceability during code review.
- **Regression reference** — `docs/legacy/business-rules-validated.md` is loaded by Nova as the acceptance criteria baseline.

---

## Artifact Chain

```
docs/legacy/structure.md             (legacy_inventory_complete: true)
docs/legacy/architecture.md
docs/legacy/data-api.md
    →
docs/legacy/program-inventory.md
docs/legacy/business-rules-raw.md
docs/legacy/knowledge-graph.md       (knowledge_graph_complete: true)
docs/legacy/process-flows/
docs/legacy/decision-tables/
docs/legacy/business-rules-validated.md
    →
_superml-output/planning/target-architecture.md
_superml-output/planning/architecture-modernization.md  (architecture_complete: true)
    →
_superml-output/planning/migration-epics.md             (epics_complete: true)
    →
Implementation (sprint by sprint)
```

---

## Modernization-Specific Config Flags

```yaml
# _superml/config.yml
artifact_readiness:
  legacy_inventory_complete: false     # Scout has mapped the codebase
  knowledge_graph_complete: false      # Business rules extracted and structured
  prd_complete: false                  # Used for net-new features added during modernization
  architecture_complete: false         # Target architecture approved
  epics_complete: false                # Migration stories ready for sprint
```

---

## Common Pitfalls

| Pitfall | Mitigation |
|---|---|
| Skipping Scout and going straight to legacy read | Scout's structured inventory makes Sage's deep-read 3× faster |
| Treating unvalidated rules as ground truth | Always run `/sml-validate-business-rules` before architecture |
| Creating one giant epic for data migration | Break data migration into per-entity or per-domain stories |
| Big-bang rewrite without parallel-run | Use the strangler-fig pattern and run systems in parallel |
| Losing traceability between legacy rule and new code | Every story must reference the business rule ID from the validated catalogue |
