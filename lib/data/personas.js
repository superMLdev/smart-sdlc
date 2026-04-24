'use strict';

/**
 * Persona definitions — shared between init, persona, and meeting commands.
 *
 * Each persona represents a role in the Smart SDLC framework.
 *
 * Core fields:
 *   name              — default display name (overridden by persona_name_* in config.yml)
 *   configKey         — config.yml key for custom name
 *   referenceFolder   — subfolder under _superml/reference/ for persona-specific docs
 *   role              — human-readable role title
 *   label             — wizard choice list label
 *   description       — one-line description of perspective
 *   brings            — what this persona contributes to a meeting
 *   outputSubfolder   — subfolder under output_path for this persona's artifacts
 *   signOffFlag       — artifact flag this persona sets when their phase is complete
 *
 * Sequencing:
 *   phaseOrder        — position in the default SDLC workflow (0 = independent track)
 *   prerequisites     — artifact flags that must be true before activating this persona
 *   prerequisiteLabels— human-readable explanation for each prerequisite
 *
 * Skills:
 *   skillSequence     — ordered list of skills for this persona:
 *                       { order, key, path, description, deliverable, validation, artifactFlag, required }
 *   skills            — flat skill path list (derived from skillSequence, kept for backwards compat)
 *   starterSkill      — first skill file to load after persona activation
 *
 * docPaths            — artifact file paths (use {output_path} placeholder)
 */

const PERSONAS = [
  {
    key:             'product',
    name:            'Aria',
    configKey:       'persona_name_product',
    referenceFolder: 'product',
    role:            'Product / BA',
    label:           'Product / BA       — PRDs, requirements, user stories',
    description:     'Requirements, acceptance criteria, and business value',
    outputSubfolder: 'planning',
    signOffFlag:     'prd_signed_off',
    phaseOrder:         1,
    prerequisites:      [],
    prerequisiteLabels: [],
    brings: [
      'Product Requirements Document (PRD)',
      'Business rules',
      'User stories',
      'Acceptance criteria',
    ],
    docPaths: [
      '{output_path}/planning/prd.md',
      '{output_path}/planning/business-rules.md',
      '{output_path}/planning/user-stories.md',
    ],
    owns: [
      'Problem statement',
      'Functional requirements (PRD)',
      'Scope definition',
      'Assumptions & constraints log',
      'Open questions log',
    ],
    reads: [
      'Stakeholder inputs and intake notes',
      'Business requests and meeting transcripts',
      'Existing product documentation',
      'Business context and legacy docs',
    ],
    cannotDo: [
      'Finalize architecture or technology decisions',
      'Write implementation code',
      'Create stories without an approved requirements baseline',
      'Act as Architect, Developer, or QA',
    ],
    exitCriteria: [
      'Problem is defined and agreed by stakeholders',
      'Scope is bounded with explicit in-scope / out-of-scope items',
      'Functional requirements written with testable acceptance criteria',
      'Assumptions and constraints documented',
      'Unresolved questions listed in open-questions.md',
      'PRD signed off — set artifacts.prd_signed_off: true',
    ],
    skillSequence: [
      { order: 1, key: 'agent-analyst',    path: '1-analysis/agent-analyst',    description: 'Analyse the project and produce a product brief',          deliverable: '{output_path}/planning/product-brief.md',         validation: 'Brief covers problem, goals, users, and constraints',           artifactFlag: null,           required: false },
      { order: 2, key: 'create-prd',       path: '2-planning/create-prd',       description: 'Create the Product Requirements Document (PRD)',            deliverable: '{output_path}/planning/prd.md',                    validation: 'All sections complete, every AC testable, stakeholders reviewed', artifactFlag: 'prd_complete', required: true  },
      { order: 3, key: 'edit-prd',         path: '2-planning/edit-prd',         description: 'Refine an existing PRD section by section',                deliverable: '{output_path}/planning/prd.md',                    validation: 'Changes tracked, reason documented',                             artifactFlag: null,           required: false },
      { order: 4, key: 'validate-prd',     path: '2-planning/validate-prd',     description: 'Validate PRD for completeness and implementation-readiness', deliverable: '{output_path}/planning/prd-validation.md',         validation: 'All checklist items pass, sign-off recorded',                    artifactFlag: 'prd_signed_off', required: true },
      { order: 5, key: 'document-project', path: '1-analysis/document-project', description: 'Produce structured project documentation',                  deliverable: '{output_path}/planning/project-docs.md',           validation: 'Covers context, goals, stakeholders',                            artifactFlag: null,           required: false },
      { order: 6, key: 'elicitation',      path: 'core/elicitation',            description: 'Advanced requirements elicitation techniques',              deliverable: '{output_path}/planning/elicitation-notes.md',      validation: 'Assumptions surfaced and captured',                              artifactFlag: null,           required: false },
    ],
    skills:       ['1-analysis/agent-analyst', '2-planning/agent-pm', '2-planning/create-prd', '2-planning/edit-prd', '2-planning/validate-prd', '1-analysis/document-project', 'core/elicitation'],
    starterSkill: '_superml/skills/2-planning/agent-pm/SKILL.md',
  },
  {
    key:             'architect',
    name:            'Rex',
    configKey:       'persona_name_architect',
    referenceFolder: 'architect',
    role:            'Architect',
    label:           'Architect          — system design, ADRs, architecture docs',
    description:     'Technical design, constraints, and non-functional requirements',
    outputSubfolder: 'planning',
    signOffFlag:     'architecture_signed_off',
    phaseOrder:         2,
    prerequisites:      ['prd_complete'],
    prerequisiteLabels: ['PRD must be complete — run the Product / BA phase first'],
    brings: [
      'Architecture document',
      'Architecture Decision Records (ADRs)',
      'Technical constraints',
      'Design decisions',
    ],
    docPaths: [
      '{output_path}/planning/architecture.md',
      '{output_path}/adr/',
      '{output_path}/planning/tech-constraints.md',
    ],
    owns: [
      'Solution architecture document',
      'Architecture Decision Records (ADRs)',
      'System context / container / component views',
      'Interface contracts',
      'NFR mapping',
    ],
    reads: [
      'PRD and functional requirements',
      'Business constraints from Product',
      'Legacy architecture context',
      'Enterprise technical standards',
    ],
    cannotDo: [
      'Redefine business scope without re-entering the Product phase',
      'Convert all work to delivery stories without Team Lead collaboration',
      'Generate production code as final delivery authority',
      'Approve an architecture without documented trade-offs (ADRs required)',
    ],
    exitCriteria: [
      'Architecture baseline documented and reviewed',
      'All major decisions captured as ADRs with trade-offs',
      'NFRs addressed — performance, security, scalability',
      'Interfaces and dependencies identified',
      'Epics and stories defined — set artifacts.epics_complete: true',
    ],
    skillSequence: [
      { order: 1, key: 'create-architecture',    path: '3-solutioning/create-architecture',   description: 'Create a full architecture document with diagrams and ADRs',           deliverable: '{output_path}/planning/architecture.md',          validation: 'All components documented, ADRs written, NFRs captured',           artifactFlag: 'architecture_complete',  required: true  },
      { order: 2, key: 'create-epics-stories',   path: '3-solutioning/create-epics-stories',  description: 'Break architecture + PRD into epics and user stories',                 deliverable: '{output_path}/planning/epics.md',                 validation: 'All epics have stories, every story has ACs',                      artifactFlag: 'epics_complete',         required: true  },
      { order: 3, key: 'generate-context',       path: '3-solutioning/generate-context',      description: 'Produce project-context.md optimised for AI loading',                  deliverable: '{output_path}/project-context.md',                validation: 'File loads cleanly, all key references present',                   artifactFlag: null,                     required: false },
      { order: 4, key: 'reverse-adr',            path: '0-relearn/reverse-adr',               description: 'Recover ADRs from existing code evidence',                             deliverable: '{output_path}/adr/',                              validation: 'Each ADR has context, decision, and consequences',                  artifactFlag: null,                     required: false },
    ],
    skills:       ['3-solutioning/agent-architect', '3-solutioning/create-architecture', '3-solutioning/create-epics-stories', '3-solutioning/generate-context', '0-relearn/reverse-adr'],
    starterSkill: '_superml/skills/3-solutioning/agent-architect/SKILL.md',
  },
  {
    key:             'developer',
    name:            'Nova',
    configKey:       'persona_name_developer',
    referenceFolder: 'developer',
    role:            'Developer',
    label:           'Developer          — implementation, code review, tech debt',
    description:     'Implementation details, code quality, and technical feasibility',
    outputSubfolder: 'implementation',
    signOffFlag:     'implementation_signed_off',
    phaseOrder:         4,
    prerequisites:      ['architecture_complete', 'epics_complete'],
    prerequisiteLabels: [
      'Architecture must be complete — run the Architect phase first',
      'Epics & stories must be defined — run create-epics-stories first',
    ],
    brings: [
      'Implementation notes',
      'Tech debt backlog',
      'Test coverage report',
      'Code constraints',
    ],
    docPaths: [
      '{output_path}/implementation/',
      '{output_path}/tech-debt.md',
    ],
    owns: [
      'Implementation code',
      'Technical task breakdown',
      'API contracts',
      'Module design',
      'Code review records',
    ],
    reads: [
      'Approved stories and acceptance criteria',
      'Architecture document and ADRs',
      'Data contracts and interface specs',
      'Coding standards and approved patterns',
    ],
    cannotDo: [
      'Bypass architecture decisions without formal re-entry through the Architect phase',
      'Change requirements silently — must raise to Product',
      'Mark a story done without passing tests',
      'Skip acceptance criteria during implementation',
    ],
    exitCriteria: [
      'All stories implemented with passing tests (Red → Green → Refactor)',
      'Architecture compliance maintained throughout',
      'All ACs verified by tests',
      'PRs reviewed and merged',
      'Implementation signed off — set artifacts.implementation_signed_off: true',
    ],
    skillSequence: [
      { order: 1, key: 'dev-story',    path: '4-implementation/dev-story',    description: 'Implement a story using TDD: Red → Green → Refactor', deliverable: 'Working, tested code committed',              validation: 'All ACs have passing tests, PR created',     artifactFlag: null,                       required: true  },
      { order: 2, key: 'code-review',  path: '4-implementation/code-review',  description: 'Structured review against ACs and quality standards', deliverable: '{output_path}/implementation/review-notes.md', validation: 'Review checklist complete, findings actioned', artifactFlag: null,                       required: true  },
      { order: 3, key: 'create-story', path: '4-implementation/create-story', description: 'Write a detailed story with full acceptance criteria', deliverable: '{output_path}/implementation/stories/',       validation: 'AC testable, story points assigned',          artifactFlag: null,                       required: false },
    ],
    skills:       ['4-implementation/agent-developer', '4-implementation/dev-story', '4-implementation/code-review', '4-implementation/create-story'],
    starterSkill: '_superml/skills/4-implementation/agent-developer/SKILL.md',
  },
  {
    key:             'modernization',
    name:            'Sage',
    configKey:       'persona_name_modernization',
    referenceFolder: 'modernization',
    role:            'Modernization Lead',
    label:           'Modernization Lead — legacy analysis, migration planning',
    description:     'Legacy system knowledge, domain rules, and migration strategy',
    outputSubfolder: 'modernize',
    signOffFlag:     'modernization_signed_off',
    phaseOrder:         0,
    prerequisites:      [],
    prerequisiteLabels: [],
    brings: [
      'Legacy code inventory',
      'Domain knowledge graph',
      'Validated business rules',
      'Migration plan / epics',
    ],
    docPaths: [
      '{output_path}/modernize/legacy-inventory.md',
      '{output_path}/modernize/domain-model.md',
      '{output_path}/modernize/validated-rules.md',
      '{output_path}/modernize/migration-plan.md',
    ],
    owns: [
      'Legacy code inventory',
      'Domain knowledge graph',
      'Validated business rules',
      'Migration plan and target architecture',
    ],
    reads: [
      'Legacy source code (COBOL, JCL, RPG, J2EE, legacy .NET)',
      'Legacy design specifications and user manuals',
      'Business documentation and runbooks',
      'Existing database schemas and data dictionaries',
    ],
    cannotDo: [
      'Guess business rules without code or document evidence',
      'Bypass BA validation of extracted rules',
      'Assume modern technology equivalents without Architect confirmation',
      'Modify or overwrite legacy code — read-only on the legacy system',
    ],
    exitCriteria: [
      'Legacy program inventory complete — set artifacts.legacy_inventory_complete: true',
      'Domain knowledge graph built — set artifacts.knowledge_graph_complete: true',
      'Business rules validated with domain experts',
      'Target architecture defined',
      'Migration epics created with traceability to legacy programs',
    ],
    skillSequence: [
      { order: 1, key: 'read-legacy-code',           path: '5-modernize/read-legacy-code',           description: 'Step-by-step analysis of legacy programs, data, and flows', deliverable: '{output_path}/modernize/legacy-inventory.md',    validation: 'All modules catalogued, entry points documented',              artifactFlag: 'legacy_inventory_complete', required: true  },
      { order: 2, key: 'build-knowledge-graph',      path: '5-modernize/build-knowledge-graph',      description: 'Map entities, business rules, and processes',               deliverable: '{output_path}/modernize/domain-model.md',         validation: 'All domain entities and rules captured',                       artifactFlag: 'knowledge_graph_complete',  required: true  },
      { order: 3, key: 'validate-business-rules',    path: '5-modernize/validate-business-rules',    description: 'Verify extracted rules against the legacy system',           deliverable: '{output_path}/modernize/validated-rules.md',      validation: 'Each rule verified with evidence or exception noted',           artifactFlag: null,                        required: false },
      { order: 4, key: 'define-target-architecture', path: '5-modernize/define-target-architecture', description: 'Design target architecture and migration plan',              deliverable: '{output_path}/modernize/target-architecture.md',  validation: 'Gap analysis complete, migration approach decided',             artifactFlag: null,                        required: true  },
      { order: 5, key: 'create-migration-epics',     path: '5-modernize/create-migration-epics',     description: 'Break migration plan into actionable epics and stories',    deliverable: '{output_path}/modernize/migration-epics.md',      validation: 'Epics cover full migration scope, stories estimated',           artifactFlag: 'epics_complete',            required: true  },
    ],
    skills:       ['5-modernize/agent-sage', '5-modernize/read-legacy-code', '5-modernize/build-knowledge-graph', '5-modernize/validate-business-rules', '5-modernize/define-target-architecture', '5-modernize/create-migration-epics'],
    starterSkill: '_superml/skills/5-modernize/agent-sage/SKILL.md',
  },
  {
    key:             'team_lead',
    name:            'Lead',
    configKey:       'persona_name_team_lead',
    referenceFolder: 'team_lead',
    role:            'Team Lead / PM',
    label:           'Team Lead / PM     — epics, stories, sprint planning',
    description:     'Delivery planning, prioritization, and team coordination',
    outputSubfolder: 'planning',
    signOffFlag:     'sprint_signed_off',
    phaseOrder:         3,
    prerequisites:      ['epics_complete'],
    prerequisiteLabels: ['Epics & stories must be defined — run the Architect phase first'],
    brings: [
      'Epic backlog',
      'Sprint plan',
      'Delivery roadmap',
      'Team velocity / capacity',
    ],
    docPaths: [
      '{output_path}/planning/epics.md',
      '{output_path}/planning/sprint-plan.md',
      '{output_path}/planning/roadmap.md',
    ],
    owns: [
      'Epic backlog',
      'User stories with acceptance criteria',
      'Sprint plan',
      'Delivery roadmap',
      'Dependency map',
    ],
    reads: [
      'PRD and functional requirements',
      'Architecture document and constraints',
      'Technical dependencies from Architect',
      'Team velocity and capacity data',
    ],
    cannotDo: [
      'Invent requirements outside the approved PRD scope',
      'Override architecture decisions',
      'Generate developer or testing outputs as a substitute for planning',
      'Start a sprint without complete stories with acceptance criteria',
    ],
    exitCriteria: [
      'Requirements decomposed into executable epics and stories',
      'Every story has clear acceptance criteria',
      'Dependency chain is visible and documented',
      'Priorities assigned to all backlog items',
      'Sprint planned with capacity checked and goal defined',
    ],
    skillSequence: [
      { order: 1, key: 'agent-lead',          path: '4-implementation/agent-lead',          description: 'Activate Lead persona and review your workflow',         deliverable: null,                                              validation: 'Persona understood, workflow confirmed',                 artifactFlag: null,                required: false },
      { order: 2, key: 'create-epics-stories', path: '3-solutioning/create-epics-stories', description: 'Break architecture into epics and user stories',    deliverable: '{output_path}/planning/epics.md',          validation: 'All epics scoped, stories have story points',           artifactFlag: 'epics_complete',    required: false },
      { order: 3, key: 'sprint-planning',      path: '4-implementation/sprint-planning',   description: 'Select, estimate, and assign stories for a sprint', deliverable: '{output_path}/planning/sprint-plan.md',    validation: 'Capacity checked, goal defined, stories assigned',       artifactFlag: null,                required: true  },
      { order: 4, key: 'create-story',         path: '4-implementation/create-story',      description: 'Write a single story with full acceptance criteria', deliverable: '{output_path}/implementation/stories/',   validation: 'AC testable, story points assigned, dependencies noted', artifactFlag: null,                required: false },
      { order: 5, key: 'sprint-status',        path: '4-implementation/sprint-status',     description: 'Report on sprint progress, blockers, and burn-down',  deliverable: '{output_path}/planning/sprint-status.md', validation: 'Status accurate, blockers identified and escalated',     artifactFlag: null,                required: false },
      { order: 6, key: 'retrospective',        path: '4-implementation/retrospective',     description: 'Run a sprint retrospective and capture action items',  deliverable: '{output_path}/planning/retro.md',         validation: 'Action items are owned, specific, and time-bound',       artifactFlag: null,                required: false },
    ],
    skills:       ['4-implementation/agent-lead', '3-solutioning/create-epics-stories', '4-implementation/sprint-planning', '4-implementation/create-story', '4-implementation/sprint-status', '4-implementation/retrospective'],
    starterSkill: '_superml/skills/4-implementation/agent-lead/SKILL.md',
  },

  // ── Phase 5: Quality Assurance ─────────────────────────────────────────────
  {
    key:             'qa',
    name:            'Quinn',
    configKey:       'persona_name_qa',
    referenceFolder: 'qa',
    role:            'QA / Test Lead',
    label:           'QA / Test Lead     — test plans, execution, bug triage, sign-off',
    description:     'Quality assurance, test coverage, and release readiness',
    outputSubfolder: 'qa',
    signOffFlag:     'qa_signed_off',
    phaseOrder:         5,
    prerequisites:      ['epics_complete', 'implementation_signed_off'],
    prerequisiteLabels: [
      'Epics & stories must be defined — run the Architect phase first',
      'Implementation must be signed off by Developer before QA starts',
    ],
    brings: [
      'Test plan',
      'Test execution report',
      'Bug triage log',
      'QA sign-off certificate',
    ],
    docPaths: [
      '{output_path}/qa/test-plan.md',
      '{output_path}/qa/test-execution.md',
      '{output_path}/qa/bug-triage.md',
      '{output_path}/qa/qa-signoff.md',
    ],
    owns: [
      'Test plan',
      'Test execution report',
      'Defect / bug triage log',
      'QA sign-off certificate',
    ],
    reads: [
      'User stories and acceptance criteria',
      'Architecture constraints',
      'Implementation artifacts and code',
      'Developer notes and known edge cases',
    ],
    cannotDo: [
      'Rewrite requirements or acceptance criteria',
      'Approve ambiguous stories as testable without flagging the gaps',
      'Silently infer missing acceptance criteria',
      'Sign off on a release with open P1 or P2 bugs',
    ],
    exitCriteria: [
      'Every story mapped to at least one test case',
      'All test cases executed with pass/fail recorded',
      'Zero open P1 or P2 bugs',
      'Requirement gaps explicitly logged and communicated',
      'QA sign-off complete — set artifacts.qa_signed_off: true',
    ],
    skillSequence: [
      { order: 1, key: 'test-plan',      path: '6-quality/test-plan',      description: 'Create a test plan covering scope, strategy, and test cases', deliverable: '{output_path}/qa/test-plan.md',      validation: 'All ACs covered by at least one test case, risk areas identified', artifactFlag: null,          required: true  },
      { order: 2, key: 'test-execution', path: '6-quality/test-execution', description: 'Execute test plan and record pass/fail results',               deliverable: '{output_path}/qa/test-execution.md', validation: 'All test cases executed, results documented',                      artifactFlag: null,          required: true  },
      { order: 3, key: 'bug-triage',     path: '6-quality/bug-triage',     description: 'Log, prioritise, and track bugs found during testing',         deliverable: '{output_path}/qa/bug-triage.md',     validation: 'All bugs classified by severity, blockers resolved',                artifactFlag: null,          required: false },
      { order: 4, key: 'qa-signoff',     path: '6-quality/qa-signoff',     description: 'Formal QA sign-off — release readiness assessment',           deliverable: '{output_path}/qa/qa-signoff.md',     validation: 'All P1/P2 bugs resolved, sign-off checklist complete',              artifactFlag: 'qa_signed_off', required: true },
    ],
    skills:       ['6-quality/agent-qa', '6-quality/test-plan', '6-quality/test-execution', '6-quality/bug-triage', '6-quality/qa-signoff'],
    starterSkill: '_superml/skills/6-quality/agent-qa/SKILL.md',
  },

  // ── Phase 6: Release / DevOps ──────────────────────────────────────────────
  {
    key:             'release',
    name:            'Riley',
    configKey:       'persona_name_release',
    referenceFolder: 'release',
    role:            'Release Manager / DevOps',
    label:           'Release Manager    — release checklist, deploy runbook, release notes',
    description:     'Deployment coordination, release governance, and operational readiness',
    outputSubfolder: 'release',
    signOffFlag:     'release_complete',
    phaseOrder:         6,
    prerequisites:      ['qa_signed_off'],
    prerequisiteLabels: [
      'QA must sign off before release — run the QA phase first',
    ],
    brings: [
      'Release checklist',
      'Deploy runbook',
      'Release notes',
      'Rollback plan',
    ],
    docPaths: [
      '{output_path}/release/release-checklist.md',
      '{output_path}/release/deploy-runbook.md',
      '{output_path}/release/release-notes.md',
      '{output_path}/release/rollback-plan.md',
    ],
    owns: [
      'Release checklist',
      'Deployment runbook',
      'Release notes',
      'Rollback strategy',
      'Operational readiness summary',
    ],
    reads: [
      'Architecture document and infrastructure requirements',
      'Implementation artifacts and change log',
      'QA test summary and sign-off certificate',
      'Environment requirements and config',
    ],
    cannotDo: [
      'Define business features or requirements',
      'Fill missing test coverage by assumption',
      'Approve an unsafe release posture without flagging risk explicitly',
      'Deploy without confirmed QA sign-off',
    ],
    exitCriteria: [
      'Deployment path verified and documented',
      'Rollback strategy defined and validated',
      'Observability and monitoring confirmed live',
      'Release notes published',
      'Post-deployment smoke tests passed',
      'Release complete — set artifacts.release_complete: true',
    ],
    skillSequence: [
      { order: 1, key: 'release-checklist', path: '7-release/release-checklist', description: 'Generate and verify a pre-release checklist',               deliverable: '{output_path}/release/release-checklist.md', validation: 'All checklist items verified and signed',                          artifactFlag: null,              required: true  },
      { order: 2, key: 'deploy-runbook',    path: '7-release/deploy-runbook',    description: 'Create a step-by-step deployment runbook with rollback plan', deliverable: '{output_path}/release/deploy-runbook.md',    validation: 'Steps tested in staging, rollback plan validated',                 artifactFlag: null,              required: true  },
      { order: 3, key: 'release-notes',    path: '7-release/release-notes',    description: 'Generate user-facing and internal release notes',             deliverable: '{output_path}/release/release-notes.md',    validation: 'All user-facing changes described, known issues listed',           artifactFlag: 'release_complete', required: true },
    ],
    skills:       ['7-release/agent-release', '7-release/release-checklist', '7-release/deploy-runbook', '7-release/release-notes'],
    starterSkill: '_superml/skills/7-release/agent-release/SKILL.md',
  },
];

/** Map of key → persona for O(1) lookup. */
const PERSONA_MAP = Object.fromEntries(PERSONAS.map(p => [p.key, p]));

/**
 * Workflow definitions — ordered sequences of persona keys for each project type.
 * These can be overridden in config.yml under `workflow.phases`.
 */
const WORKFLOWS = {
  general: {
    label:       'General — standard software project',
    description: 'Product → Architecture → Team Lead → Development → QA → Release',
    phases:      ['product', 'architect', 'team_lead', 'developer', 'qa', 'release'],
  },
  modernization: {
    label:       'Modernization — legacy system migration or rewrite',
    description: 'Modernization Lead → Architecture → Team Lead → Development → QA → Release',
    phases:      ['modernization', 'architect', 'team_lead', 'developer', 'qa', 'release'],
  },
  greenfield: {
    label:       'Greenfield — brand new, no existing codebase',
    description: 'Product → Architecture → Team Lead → Development → QA → Release',
    phases:      ['product', 'architect', 'team_lead', 'developer', 'qa', 'release'],
  },
  api: {
    label:       'API / Platform — API-first or platform engineering',
    description: 'Product → Architecture → Development → QA → Release',
    phases:      ['product', 'architect', 'developer', 'qa', 'release'],
  },
};

/**
 * Resolve the active workflow phases from config.
 * If config.workflow.phases is defined, use it; else fall back to WORKFLOWS[projectType].
 */
function resolveWorkflowPhases(config) {
  const projectType = (config && config.project_type) || 'general';

  // Explicit override in config.yml wins
  const override = config && config.workflow && config.workflow.phases;
  if (Array.isArray(override) && override.length > 0) return override;

  // Default from workflow definitions
  const wf = WORKFLOWS[projectType] || WORKFLOWS.general;
  return wf.phases;
}

module.exports = { PERSONAS, PERSONA_MAP, WORKFLOWS, resolveWorkflowPhases };

