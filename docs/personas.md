# Personas — Smart SDLC

Personas are named AI roles, each with a defined skill set, communication style, and domain focus. Every team member picks one persona as their `primary_persona` during `npx @supermldev/smart-sdlc persona`.

---

## The 6 Personas

### Scout — Code Archaeologist

| | |
|---|---|
| **Default name** | Scout |
| **Copilot agent** | `@sml-agent-scout` |
| **Slash command** | `/sml-agent-scout` |
| **Skill file** | `_superml/skills/0-relearn/agent-scout/SKILL.md` |
| **Persona key** | *(shared — all personas can use Scout)* |

Scout is the universal starting point for any brownfield project. It reads the existing codebase and produces living documentation — structure maps, architecture summaries, API references, and reverse-engineered ADRs.

**Primary skills:**

| Skill | What It Does |
|---|---|
| `relearn-codebase` | Full 5-step reverse-engineering: scan, architecture, data/API, patterns, docs |
| `generate-readme` | Generate or refresh README.md from the actual codebase |
| `generate-api-docs` | Auto-generate API reference (markdown or OpenAPI) |
| `reverse-adr` | Recover Architecture Decision Records from code evidence |

**When to use:** Always at the start of any brownfield project, before any other persona activates. Also useful when onboarding new team members.

---

### Product / BA — Agent PM

| | |
|---|---|
| **Default name** | Aria |
| **Copilot agent** | `@sml-agent-pm` |
| **Slash command** | `/sml-agent-pm` |
| **Skill file** | `_superml/skills/2-planning/agent-pm/SKILL.md` |
| **Persona key** | `product` |

The Product Manager / Business Analyst persona handles requirements discovery, product thinking, and documentation. It bridges business needs and technical execution.

**Primary skills:**

| Skill | What It Does | Access |
|---|---|---|
| `agent-analyst` | Analyse existing projects, write product briefs | product |
| `product-brief` | Guided product brief creation | product |
| `create-prd` | Full 3-step PRD creation workflow | product |
| `edit-prd` | Refine an existing PRD section by section | product |
| `validate-prd` | Check PRD for completeness and implementation-readiness | product |
| `document-project` | Produce structured project documentation | all |
| `elicitation` | Advanced requirements elicitation technique | all |

**Cross-persona collaboration:**
- Call `@sml-agent-architect` when architecture and technical design decisions are needed
- Call `@sml-agent-developer` to validate implementation feasibility

---

### Architect

| | |
|---|---|
| **Default name** | Rex |
| **Copilot agent** | `@sml-agent-architect` |
| **Slash command** | `/sml-agent-architect` |
| **Skill file** | `_superml/skills/3-solutioning/agent-architect/SKILL.md` |
| **Persona key** | `architect` |

The Architect persona translates requirements into technical designs. It creates architecture documents, Architecture Decision Records (ADRs), and breaks work into implementable epics and stories.

**Primary skills:**

| Skill | What It Does | Access |
|---|---|---|
| `create-architecture` | Full architecture document with diagrams and ADRs | architect |
| `create-epics-stories` | Break architecture + PRD into epics and user stories | architect, team_lead |
| `generate-context` | Produce `project-context.md` optimised for AI loading | architect |
| `reverse-adr` | Extract ADRs from existing codebase | all |

**Prerequisites:** Architect expects a completed PRD (`prd_complete: true` in `config.yml`). If no PRD exists, activate `@sml-agent-pm` first.

**Cross-persona collaboration:**
- Call `@sml-agent-pm` for requirements clarification and product decisions
- Call `@sml-agent-developer` to validate implementation approach

---

### Developer

| | |
|---|---|
| **Default name** | Nova |
| **Copilot agent** | `@sml-agent-developer` |
| **Slash command** | `/sml-agent-developer` |
| **Skill file** | `_superml/skills/4-implementation/agent-developer/SKILL.md` |
| **Persona key** | `developer` |

The Developer persona implements stories using test-driven development, reviews code, and manages technical debt. It operates sprint by sprint.

**Primary skills:**

| Skill | What It Does | Access |
|---|---|---|
| `dev-story` | TDD implementation loop: Red → Green → Refactor | developer |
| `code-review` | Structured review against acceptance criteria and quality standards | developer |
| `create-story` | Write a detailed story with acceptance criteria | developer, team_lead |
| `sprint-planning` | Select, estimate, and assign stories for a sprint | developer, team_lead |

**Prerequisites:** Developer expects epics and stories to exist (`epics_complete: true`). Use `@sml-agent-scout` first if working on an unfamiliar codebase.

**Cross-persona collaboration:**
- Call `@sml-agent-architect` for design decisions during implementation
- Call `@sml-agent-pm` to clarify acceptance criteria

---

### Modernization Lead — Agent Sage

| | |
|---|---|
| **Default name** | Sage |
| **Copilot agent** | `@sml-agent-sage` |
| **Slash command** | `/sml-agent-sage` |
| **Skill file** | `_superml/skills/5-modernize/agent-sage/SKILL.md` |
| **Persona key** | `modernization` |

The Modernization Lead handles legacy system analysis and migration planning. It has its own multi-phase workflow distinct from the standard SDLC — see [Modernization Workflow](./workflows-modernization.md) for the full journey.

**Primary skills:**

| Skill | What It Does | Access |
|---|---|---|
| `read-legacy-code` | Step-by-step analysis of legacy programs, data structures, and flows | modernization |
| `build-knowledge-graph` | Map entities, business rules, and processes into a knowledge graph | modernization |
| `define-target-architecture` | Assess legacy state, design target architecture, plan migration | modernization |
| `validate-business-rules` | Verify extracted business rules against the legacy system | modernization |
| `create-migration-epics` | Break the migration plan into actionable epics and stories | modernization |

**Cross-persona collaboration:**
- Call `@sml-agent-architect` for target architecture design decisions
- Call `@sml-agent-pm` for domain business rules and stakeholder requirements

---

### Team Lead / PM — Agent Lead

| | |
|---|---|
| **Default name** | Lead |
| **Copilot agent** | `@sml-agent-lead` |
| **Slash command** | `/sml-agent-lead` |
| **Skill file** | `_superml/skills/4-implementation/sprint-planning/SKILL.md` |
| **Persona key** | `team_lead` |

The Team Lead / PM persona focuses on delivery coordination — breaking architecture into epics, planning sprints, managing capacity, and tracking progress.

**Primary skills:**

| Skill | What It Does | Access |
|---|---|---|
| `create-epics-stories` | Break PRD + architecture into epics and stories | architect, team_lead |
| `sprint-planning` | Sprint setup, capacity, story selection | developer, team_lead |
| `create-story` | Write an individual story with full acceptance criteria | developer, team_lead |

**Cross-persona collaboration:**
- Call `@sml-agent-pm` for requirements and product direction
- Call `@sml-agent-architect` for technical planning and feasibility

---

## Persona Guard — How Skill Access Is Enforced

Each generated skill file (`.github/skills/<name>/SKILL.md`) contains a **Persona Guard** block. When the skill is activated:

1. The AI reads `_superml/persona.yml` silently
2. If `primary_persona` matches the skill's allowed list → proceeds normally
3. If not → stops and presents this message:

> **This skill is outside your role.**
> This skill is designed for: **[Role Name]**.
> Your current persona does not typically use it.
>
> To collaborate with the right persona:
> `/sml-meeting` — bring other personas into the conversation
>
> To see your own skills:
> `/sml-help` — context-aware guidance for your role

### Access Map

| Skill | Allowed Personas |
|---|---|
| `agent-scout`, `relearn-codebase`, `generate-readme`, `generate-api-docs` | All |
| `reverse-adr`, `brainstorming`, `elicitation`, `document-project`, `help` | All |
| `agent-analyst`, `product-brief`, `create-prd`, `edit-prd`, `validate-prd` | product |
| `agent-architect`, `create-architecture`, `generate-context` | architect |
| `agent-developer`, `dev-story`, `code-review` | developer |
| `agent-sage`, `read-legacy-code`, `build-knowledge-graph` | modernization |
| `define-target-architecture`, `validate-business-rules`, `create-migration-epics` | modernization |
| `create-epics-stories` | architect, team_lead |
| `sprint-planning`, `create-story` | developer, team_lead |

### Escape Hatch — Meetings

When you need a skill outside your role, use `/sml-meeting` to bring the correct persona into a shared AI session. This keeps collaboration explicit and traceable rather than letting any persona silently drift into another's domain.

---

## Choosing Your Persona

| Your actual job | Choose |
|---|---|
| Product Manager, Business Analyst, UX Lead | `product` |
| Software Architect, Tech Lead, Solutions Architect | `architect` |
| Software Developer, Engineer, Full-stack Dev | `developer` |
| Modernization Consultant, Legacy Migration Lead | `modernization` |
| Engineering Manager, Scrum Master, Delivery Manager | `team_lead` |

You can change your persona at any time:

```bash
npx @supermldev/smart-sdlc persona
```
