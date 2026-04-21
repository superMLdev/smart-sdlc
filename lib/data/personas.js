'use strict';

/**
 * Persona definitions — shared between init (wizard choices) and meeting (context generator).
 *
 * Each persona represents a role a user or AI agent takes in the Agentic SDLC framework.
 * name           — default display name (overridden by config `persona_name_*`)
 * configKey      — config.yml key to read a custom name from
 * referenceFolder— subfolder under _superml/reference/ for this persona's docs
 * role           — human-readable role title
 * label          — choice list label shown in the wizard
 * description    — one-line description of their perspective
 * brings         — what this persona contributes to a meeting
 * docPaths       — artifact file paths (use {docsPath} placeholder)
 * skills         — skill folder paths (relative to skills/)
 * starterSkill   — the first skill to reference after init
 */

const PERSONAS = [
  {
    key:            'product',
    name:           'Aria',
    configKey:      'persona_name_product',
    referenceFolder:'product',
    role:           'Product / BA',
    label:       'Product / BA       — PRDs, requirements, user stories',
    description: 'Requirements, acceptance criteria, and business value',
    brings: [
      'Product Requirements Document (PRD)',
      'Business rules',
      'User stories',
      'Acceptance criteria',
    ],
    docPaths: [
      '{docsPath}/planning/prd.md',
      '{docsPath}/planning/business-rules.md',
      '{docsPath}/planning/user-stories.md',
    ],
    skills:       ['2-planning/agent-pm', '1-analysis/agent-analyst', '2-planning/create-prd'],
    starterSkill: '_superml/skills/2-planning/agent-pm/SKILL.md',
  },
  {
    key:            'architect',
    name:           'Rex',
    configKey:      'persona_name_architect',
    referenceFolder:'architect',
    role:           'Architect',
    label:       'Architect          — system design, ADRs, architecture docs',
    description: 'Technical design, constraints, and non-functional requirements',
    brings: [
      'Architecture document',
      'Architecture Decision Records (ADRs)',
      'Technical constraints',
      'Design decisions',
    ],
    docPaths: [
      '{docsPath}/planning/architecture.md',
      '{docsPath}/adr/',
      '{docsPath}/planning/tech-constraints.md',
    ],
    skills:       ['3-solutioning/agent-architect', '3-solutioning/create-architecture'],
    starterSkill: '_superml/skills/3-solutioning/agent-architect/SKILL.md',
  },
  {
    key:            'developer',
    name:           'Nova',
    configKey:      'persona_name_developer',
    referenceFolder:'developer',
    role:           'Developer',
    label:       'Developer          — implementation, code review, tech debt',
    description: 'Implementation details, code quality, and technical feasibility',
    brings: [
      'Implementation notes',
      'Tech debt backlog',
      'Test coverage report',
      'Code constraints',
    ],
    docPaths: [
      '{docsPath}/implementation/',
      '{docsPath}/tech-debt.md',
    ],
    skills:       ['4-implementation/agent-developer', '4-implementation/dev-story'],
    starterSkill: '_superml/skills/4-implementation/agent-developer/SKILL.md',
  },
  {
    key:            'modernization',
    name:           'Sage',
    configKey:      'persona_name_modernization',
    referenceFolder:'modernization',
    role:           'Modernization Lead',
    label:       'Modernization Lead — legacy analysis, migration planning',
    description: 'Legacy system knowledge, domain rules, and migration strategy',
    brings: [
      'Legacy code inventory',
      'Domain knowledge graph',
      'Validated business rules',
      'Migration plan / epics',
    ],
    docPaths: [
      '{docsPath}/modernize/legacy-inventory.md',
      '{docsPath}/modernize/domain-model.md',
      '{docsPath}/modernize/validated-rules.md',
      '{docsPath}/modernize/migration-plan.md',
    ],
    skills:       ['5-modernize/agent-sage', '5-modernize/build-knowledge-graph', '5-modernize/create-migration-epics'],
    starterSkill: '_superml/skills/5-modernize/agent-sage/SKILL.md',
  },
  {
    key:            'team_lead',
    name:           'Lead',
    configKey:      'persona_name_team_lead',
    referenceFolder:'team_lead',
    role:           'Team Lead / PM',
    label:       'Team Lead / PM     — epics, stories, sprint planning',
    description: 'Delivery planning, prioritization, and team coordination',
    brings: [
      'Epic backlog',
      'Sprint plan',
      'Delivery roadmap',
      'Team velocity / capacity',
    ],
    docPaths: [
      '{docsPath}/planning/epics.md',
      '{docsPath}/planning/sprint-plan.md',
      '{docsPath}/planning/roadmap.md',
    ],
    skills:       ['4-implementation/sprint-planning', '3-solutioning/create-epics-stories'],
    starterSkill: '_superml/skills/4-implementation/sprint-planning/SKILL.md',
  },
];

/** Map of key → persona for O(1) lookup. */
const PERSONA_MAP = Object.fromEntries(PERSONAS.map(p => [p.key, p]));

module.exports = { PERSONAS, PERSONA_MAP };
