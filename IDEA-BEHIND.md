# Smart-SDLC

**Smart-SDLC** is an AI-driven software delivery framework built around **installable personas, sequential phase progression, governed artifacts, and structured collaboration**.

It is designed for teams that want more than prompt-driven roleplay. Instead of casually switching between analyst, architect, developer, and tester in a single chat, Smart-SDLC enforces **one active persona at a time**, **clear phase boundaries**, and **controlled movement forward and backward** through the delivery lifecycle.

The goal is simple:

> turn software delivery from loose AI-assisted conversations into a disciplined, artifact-driven execution model.

---

## Why Smart-SDLC

Most AI software-delivery approaches look impressive in demos but fall apart in real use.

Common problems:

- one assistant tries to behave like every role at once
- requirements, design, code, and test planning get blended together
- artifact ownership is unclear
- traceability is weak
- phase discipline breaks down
- delivery becomes prompt chaos instead of execution

Smart-SDLC addresses that by introducing:

- **installable personas**
- **single-persona execution**
- **sequential phase progression**
- **controlled backward movement**
- **party mode for structured collaboration**
- **governed artifact ownership**
- **execution boundaries by persona**

This makes Smart-SDLC better suited for real-world SDLC usage, especially where teams need structure, accountability, and handoffs that actually make sense.

---

## Core Principles

### 1. One Persona at a Time
Only **one persona** can be active in a working context.

A user cannot act as Business Analyst, Architect, and Developer all at once.  
That defeats role separation and destroys workflow discipline.

### 2. Personas Are Installed, Not Switched Casually
Smart-SDLC does not treat roles like a lightweight prompt toggle.

A persona must be **installed** before work begins.

Examples:

- Install BA Persona
- Install Architect Persona
- Install Developer Persona

This makes persona selection intentional and controlled.

### 3. Sequential Progression
Smart-SDLC moves **forward by default** through the delivery lifecycle.

Example:

- BA
- Architect
- Product / Planning
- Developer
- QA
- Release / Ops

Each phase builds on approved outputs from previous phases.

### 4. Backward Movement Is Allowed
Backward movement is possible, but it is not a casual live switch.

If an Architect finds missing requirements, the system does not simply “act like a BA for a minute.”

Instead:

- exit current context
- install the required prior persona
- update the relevant artifacts
- return to the current phase with revised inputs

This preserves traceability and clean role boundaries.

### 5. Persona Defines Permission Boundary
The installed persona determines:

- what can be read
- what can be written
- which artifacts can be modified
- which actions are allowed
- which validations must pass

### 6. Party Mode Enables Controlled Collaboration
Not all work is solo.

Some activities require multiple personas to participate together in a structured way.

Smart-SDLC calls this **Party Mode**.

Party Mode is used for ceremonies like:

- architecture review
- backlog refinement
- sprint planning
- design walkthrough
- release readiness review

Each Party Mode session defines:

- purpose
- participating personas
- allowed artifacts
- expected outputs
- boundaries of participation

Party Mode is **not open-ended multi-agent chatter**.  
It is governed collaboration.

---

## How Smart-SDLC Works

Smart-SDLC has three operating layers:

### Persona Layer
Defines **who is allowed to act**.

### Phase Layer
Defines **where the work currently is** in the SDLC.

### Mode Layer
Defines **how the work is being performed**.

Modes include:

- **Solo Persona Mode**
- **Party Mode**

Together, these layers create a structured delivery system rather than a generic AI chat workflow.

Smart-SDLC Persona Model

1. Analyst

Icon: magnifying glass or clipboard
Purpose: understand the problem before solutioning starts

Owns

* business problem
* goals
* scope
* assumptions
* constraints
* stakeholder summary
* risks at discovery level

Reads

* raw notes
* meeting transcripts
* business requests
* legacy docs
* intake forms

Writes

* Problem Statement
* Scope Definition
* Assumptions & Constraints
* Functional Requirements draft
* Open Questions log

Cannot do

* finalize architecture
* write stories directly without requirements baseline
* choose tech stack without architectural input

Exit criteria

* problem is defined
* scope is bounded
* assumptions documented
* unresolved questions clearly listed

⸻

2. Product Owner

Icon: target, checklist, or roadmap board
Purpose: convert requirements into delivery-ready work structure

Owns

* feature breakdown
* epics
* stories
* acceptance criteria
* prioritization
* release grouping

Reads

* analyst output
* architecture constraints
* business priorities

Writes

* Epics
* User Stories
* Acceptance Criteria
* Prioritization tags
* Dependency mapping
* Release slicing draft

Cannot do

* invent requirements outside approved scope
* override architecture constraints
* create technical design decisions on behalf of architect

Exit criteria

* requirements decomposed into execution units
* each story has acceptance criteria
* dependency chain visible
* priorities assigned

⸻

3. Architect

Icon: blueprint, building blocks, or connected nodes
Purpose: design the solution shape and technical decision path

Owns

* architecture design
* component model
* interfaces
* data flow
* NFR mapping
* technology choices
* ADRs

Reads

* analyst requirements
* product decomposition
* legacy system context
* enterprise standards

Writes

* Solution Architecture
* Context/Container/Component views
* ADRs
* Data flow design
* Integration model
* Security/NFR mapping
* Technical assumptions

Cannot do

* redefine business scope casually
* convert all work into delivery stories without PO collaboration
* generate production code as final authority

Exit criteria

* architecture baseline approved
* major decisions captured
* NFRs addressed
* interfaces and dependencies identified

⸻

4. Developer

Icon: code brackets or terminal
Purpose: turn approved designs and stories into implementation-ready outputs

Owns

* code scaffolds
* implementation plans
* module-level logic
* API skeletons
* data contracts
* technical task breakdown

Reads

* approved stories
* architecture artifacts
* ADRs
* data contracts
* coding standards

Writes

* implementation plan
* code skeletons
* API contracts
* module specs
* technical subtasks
* developer notes

Cannot do

* bypass architecture decisions
* change requirements silently
* mark work done without validation signals

Exit criteria

* implementation artifacts align to stories
* architecture compliance maintained
* technical dependencies surfaced
* readiness for QA review

⸻

5. QA / Test Engineer

Icon: shield, bug, or checkmark in box
Purpose: validate that outputs satisfy requirements and reduce risk

Owns

* test coverage model
* test scenarios
* edge cases
* validation criteria
* defect classification

Reads

* stories
* acceptance criteria
* architecture constraints
* implementation artifacts

Writes

* test cases
* test scenarios
* edge case matrix
* validation checklist
* defect summaries
* traceability of test to story

Cannot do

* rewrite requirements
* approve ambiguous stories as testable
* silently infer missing acceptance criteria without flagging them

Exit criteria

* stories mapped to test cases
* gaps in requirements exposed
* validation coverage visible
* release risk summarized

⸻

6. Release / DevOps / SRE

Icon: rocket, gear, or pulse line
Purpose: make sure solution is deployable, observable, and supportable

Owns

* deployment readiness
* pipeline checks
* environment config
* observability
* rollback strategy
* runbooks

Reads

* architecture
* implementation outputs
* test summary
* environment requirements

Writes

* deployment plan
* pipeline checklist
* monitoring/alerts setup
* rollback plan
* operational runbook
* support handoff summary

Cannot do

* define business features
* fill missing test coverage by assumption
* approve unsafe release posture without flagging it

Exit criteria

* deployment path is clear
* observability exists
* rollback is defined
* ops risks documented

---

## Operating Model

### Solo Persona Mode
In Solo Persona Mode:

- one persona is installed
- only that persona’s actions are available
- only that persona’s artifacts can be modified
- work progresses within the active phase

Example:

1. Install BA Persona
2. Create problem statement and requirements
3. Exit BA Persona
4. Install Architect Persona
5. Create solution design and ADRs

### Party Mode
In Party Mode:

- multiple approved personas participate
- collaboration is bounded by the meeting type
- outputs are structured and expected
- not every persona is allowed in every session

Example:

**Architecture Review Party**
- Participants: BA, Architect, Security
- Outputs: architecture decision summary, risks, open issues

**Sprint Planning Party**
- Participants: Product, Architect, Developer, QA
- Outputs: story readiness, dependency alignment, delivery concerns

---

## Persona Model

Smart-SDLC personas are not cosmetic identities.  
They are **execution roles with explicit boundaries**.

---

### Business Analyst Persona

**Purpose**  
Define and refine business need, scope, and requirement intent.

**Can Read**
- intake notes
- stakeholder inputs
- transcripts
- existing documentation
- business context

**Can Write**
- problem statement
- functional requirements
- scope definition
- assumptions
- constraints
- open questions

**Cannot**
- finalize architecture
- produce implementation outputs
- act as developer or tester

**Typical Outputs**
- `problem-statement.md`
- `requirements.md`
- `scope.md`
- `assumptions.md`
- `open-questions.md`

---

### Architect Persona

**Purpose**  
Translate approved requirements into technical solution structure.

**Can Read**
- BA artifacts
- legacy architecture context
- technical constraints
- standards and patterns

**Can Write**
- architecture definition
- system views
- ADRs
- interface design
- data flow
- NFR mapping

**Cannot**
- silently redefine business scope
- directly behave as BA
- bypass previous requirements artifacts

**Typical Outputs**
- `architecture.md`
- `adrs/`
- `interfaces.md`
- `data-flow.md`
- `nfr-mapping.md`

---

### Product / Planning Persona

**Purpose**  
Convert requirements and architecture into execution-ready delivery units.

**Can Read**
- requirements
- architecture
- constraints
- dependencies

**Can Write**
- epics
- stories
- acceptance criteria
- dependency mapping
- release grouping

**Cannot**
- invent requirements outside scope
- replace architect decisions
- generate developer outputs as a substitute for planning

**Typical Outputs**
- `epics.md`
- `stories.md`
- `acceptance-criteria.md`
- `release-plan.md`

---

### Developer Persona

**Purpose**  
Build implementation-aligned outputs from approved design and planned work.

**Can Read**
- stories
- acceptance criteria
- architecture
- interfaces
- design decisions

**Can Write**
- implementation plans
- code scaffolds
- technical task breakdowns
- API contracts
- module design notes

**Cannot**
- rewrite requirements casually
- redesign architecture without proper re-entry
- skip planning boundaries

**Typical Outputs**
- `implementation-plan.md`
- `module-design.md`
- `api-contracts.md`
- `code-scaffold/`

---

### QA Persona

**Purpose**  
Validate that planned and built outputs align to expected behavior and quality.

**Can Read**
- stories
- acceptance criteria
- implementation outputs
- architecture constraints

**Can Write**
- test cases
- validation matrix
- edge case coverage
- defect summaries
- test traceability

**Cannot**
- invent requirements
- silently fill requirement gaps
- approve ambiguous behavior without flagging it

**Typical Outputs**
- `test-cases.md`
- `validation-matrix.md`
- `defect-log.md`

---

### Release / Ops Persona

**Purpose**  
Ensure the solution is deployable, observable, and operationally ready.

**Can Read**
- architecture
- implementation outputs
- test summaries
- environment requirements

**Can Write**
- deployment plan
- monitoring checklist
- rollback strategy
- runbook
- operational readiness summary

**Cannot**
- replace earlier delivery roles
- assume missing validation is acceptable
- approve unsafe release posture without flagging risk

**Typical Outputs**
- `deployment-plan.md`
- `runbook.md`
- `monitoring-checklist.md`
- `rollback-plan.md`

---

## Sequential Phase Flow

Smart-SDLC is designed to move forward in a structured order.

A common baseline flow is:

1. Business Analysis
2. Architecture
3. Planning
4. Development
5. QA
6. Release

This does **not** mean phases are locked forever.  
It means forward progression is the default path.

If a gap is discovered later:

- re-enter through the correct persona
- update the governed artifacts
- continue from there

This keeps the system disciplined while still supporting real-life iteration.

---

## Backward Re-Entry Model

Backward movement is supported, but it follows rules.

### Example
An Architect discovers missing functional clarity.

Incorrect approach:
- casually act as BA and patch requirements inline

Correct approach:
1. Exit Architect execution
2. Install BA Persona
3. Update requirement artifacts
4. Exit BA Persona
5. Re-enter Architect Persona with revised inputs

This preserves:

- artifact integrity
- ownership boundaries
- auditability
- delivery discipline

---

## Party Mode

Party Mode is one of Smart-SDLC’s defining ideas.

It allows structured collaboration between multiple personas for specific purposes.

### Why Party Mode Exists

Some activities need more than one perspective:

- requirements review
- architecture debate
- backlog grooming
- sprint planning
- test readiness review
- release approval discussion

### What Makes Party Mode Different

Party Mode is not freeform multi-agent discussion.

It is governed by:

- allowed participants
- meeting purpose
- expected outputs
- artifact scope
- session boundaries

### Example Party Types

#### Requirements Review Party
**Participants**
- BA
- Architect
- Product

**Outputs**
- requirement clarifications
- assumptions review
- scope decisions

#### Architecture Review Party
**Participants**
- Architect
- BA
- Security
- Platform / Ops

**Outputs**
- architecture decisions
- design gaps
- risk log
- ADR updates

#### Sprint Planning Party
**Participants**
- Product
- Architect
- Developer
- QA

**Outputs**
- story readiness
- implementation concerns
- test dependencies
- sprint alignment

#### Release Readiness Party
**Participants**
- Developer
- QA
- Release / Ops
- Architect

**Outputs**
- deployment readiness
- validation status
- rollback readiness
- release risks

---

## What Smart-SDLC Is Not

Smart-SDLC is **not**:

- a generic prompt pack
- casual role-play between fake personas
- one assistant pretending to be every team member at once
- a random collection of templates
- ungoverned AI coding

Smart-SDLC is intended to become a **delivery operating model**.

---

## Example Usage Pattern

### Scenario
A team starts a new feature initiative.

### Flow
1. Install BA Persona
2. Create problem statement, scope, and requirements
3. Exit BA Persona
4. Install Architect Persona
5. Design solution, integrations, and ADRs
6. Exit Architect Persona
7. Install Planning Persona
8. Generate epics, stories, and acceptance criteria
9. Exit Planning Persona
10. Install Developer Persona
11. Build implementation scaffolds and contracts
12. Exit Developer Persona
13. Install QA Persona
14. Create tests and validation matrix
15. Exit QA Persona
16. Install Release Persona
17. Produce deployment and observability artifacts

If a gap is found at step 10, the system does not break discipline.  
It re-enters through the right prior persona.

---

## Key Differentiators

### 1. Persona Installation Instead of Role Switching
This creates intention, control, and discipline.

### 2. Single Active Persona
No mixed-mode confusion.

### 3. Sequential Delivery Orientation
The framework mirrors how real delivery progresses.

### 4. Backward Re-Entry Instead of Ad-Hoc Reversal
This preserves traceability.

### 5. Party Mode
Structured collaboration becomes a first-class operating concept.

### 6. Artifact Governance
Every persona owns specific outputs.

### 7. Enterprise Readiness
The model fits environments where SDLC artifacts, review gates, and approvals matter.

---

## Design Philosophy

Smart-SDLC is built around a blunt reality:

> AI is useful in software delivery, but without boundaries it becomes chaos.

The framework assumes:

- humans still need role clarity
- artifacts still matter
- execution still needs discipline
- AI should accelerate delivery, not blur accountability

---

## Who This Is For

Smart-SDLC is useful for:

- solution architects
- engineering leaders
- product and delivery teams
- AI-assisted software teams
- enterprise transformation groups
- internal platform teams
- organizations trying to operationalize AI inside SDLC

Especially where teams want to move from:

- loose docs → governed artifacts
- disconnected prompts → controlled workflows
- “AI helped write this” → traceable delivery outputs

---

## Future Direction

Smart-SDLC can evolve beyond documentation into a full execution platform.

Possible expansion areas:

- persona installation engine
- artifact schema enforcement
- markdown-to-Jira flow
- approval gates
- traceability graph
- structured handoff summaries
- policy-aware AI actions
- party mode orchestration
- enterprise integrations

---

## Artifact Paths

When Smart-SDLC initialises a project it sets an `output_path` (default: `docs/`).
Each persona writes its artifacts under a phase-specific sub-folder.

| Phase | Sub-folder | Config key | Typical artifacts |
|-------|-----------|------------|-------------------|
| Product / BA | `{output_path}/planning/` | `planning_artifacts` | `prd.md`, `business-rules.md`, `user-stories.md`, `prd-validation.md` |
| Architect | `{output_path}/planning/` | `planning_artifacts` | `architecture.md`, `adrs/`, `context-diagram.md` |
| Team Lead | `{output_path}/planning/` | `planning_artifacts` | `epics.md`, `sprint-plan.md`, `sprint-status.md` |
| Developer | `{output_path}/implementation/` | `implementation_artifacts` | `stories/`, `dev-story.md`, `review-notes.md` |
| QA | `{output_path}/qa/` | `qa_artifacts` | `test-plan.md`, `test-execution.md`, `bug-triage.md`, `qa-signoff.md` |
| Release | `{output_path}/release/` | `release_artifacts` | `release-checklist.md`, `deploy-runbook.md`, `release-notes.md` |
| Modernization | `{output_path}/modernize/` | `modernize_artifacts` | `legacy-inventory.md`, `domain-model.md`, `validated-rules.md`, `target-architecture.md`, `migration-epics.md` |

Phase audit events are appended to `_superml/audit.log` on every `sml persona`, `sml persona exit`, `sml reenter`, and `sml init` invocation.

---

## Suggested Repository Structure

```text
smart-sdlc/
├── README.md
├── docs/
│   ├── operating-model.md
│   ├── personas/
│   │   ├── ba.md
│   │   ├── architect.md
│   │   ├── planning.md
│   │   ├── developer.md
│   │   ├── qa.md
│   │   └── release.md
│   ├── modes/
│   │   ├── solo-persona-mode.md
│   │   └── party-mode.md
│   ├── phases/
│   │   ├── analysis.md
│   │   ├── architecture.md
│   │   ├── planning.md
│   │   ├── development.md
│   │   ├── qa.md
│   │   └── release.md
│   └── artifacts/
│       ├── requirements.md
│       ├── architecture.md
│       ├── stories.md
│       ├── implementation.md
│       ├── validation.md
│       └── deployment.md
└── roadmap.md