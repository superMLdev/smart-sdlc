'use strict';

/**
 * Predefined meeting templates for Smart SDLC.
 *
 * Each template represents a common meeting type in the SDLC workflow.
 *
 * key              — unique identifier
 * label            — display label in the wizard list
 * title            — full human-readable title (used in the generated doc)
 * purpose          — one-paragraph description of the meeting's goal
 * defaultPersonas  — persona keys pre-selected when this template is chosen
 * optionalPersonas — persona keys suggested as "optional to invite"
 * agenda           — ordered list of agenda items
 * output           — where to save the meeting document
 *   type           — output file prefix
 *   pathTemplate   — path relative to project root; use {docsPath} and {slug}
 * topicPrompt      — question to ask the user for the meeting topic/subject
 * discussionStarters — template-specific discussion starter phrases
 *   use {persona0}, {persona1}, {persona2}, {topic} as placeholders
 */

const MEETING_TEMPLATES = [
  {
    key:  'brainstorming',
    label: 'Brainstorming Session     — explore ideas before committing',
    title: 'Brainstorming Session',
    purpose:
      'Explore solution options, surface assumptions, and align on direction before ' +
      'committing to an approach. This is a diverge-then-converge session — all ideas ' +
      'are welcome, criticism is deferred until the converge phase.',
    defaultPersonas:  ['product', 'architect'],
    optionalPersonas: ['developer', 'team_lead'],
    agenda: [
      'Define the problem or question to explore',
      'Diverge — each persona shares ideas and perspectives independently (no critique yet)',
      'Theme mapping — identify common threads and promising directions',
      'Converge — discuss trade-offs and narrow to 2-3 options',
      'Decide — agree on a direction or list open questions to resolve next',
      'Document — capture ideas, decisions, and next steps',
    ],
    output: {
      type:         'brainstorm',
      pathTemplate: '{docsPath}/meetings/brainstorm-{slug}.md',
    },
    topicPrompt: 'What topic or problem are you brainstorming?',
    discussionStarters: [
      '"{persona0}, what problem are we really trying to solve here?"',
      '"{persona1}, what solutions have you seen work in similar situations?"',
      '"Let\'s hear all ideas first — no filtering yet. {persona0}, you start."',
      '"We have these options on the table. {persona1}, which has the fewest hidden risks?"',
      '"What would we need to be true for the boldest option to work?"',
    ],
  },

  {
    key:  'requirements-elicitation',
    label: 'Requirements Elicitation  — uncover and validate requirements',
    title: 'Requirements Elicitation',
    purpose:
      'Uncover requirements through structured questioning. Surface hidden assumptions, ' +
      'align on scope boundaries, and produce a clear, testable requirements list that ' +
      'the whole team agrees on.',
    defaultPersonas:  ['product', 'architect'],
    optionalPersonas: ['developer'],
    agenda: [
      'State the feature or problem area to elicit requirements for',
      'BA: present known requirements and user needs',
      'Architect: surface technical constraints and non-functional requirements',
      'Developer (if present): flag implementation risks and ambiguities',
      'Five-whys round — drill into the root goal behind each requirement',
      'Define acceptance criteria for the top 3 requirements',
      'Identify and park any out-of-scope items',
    ],
    output: {
      type:         'requirements',
      pathTemplate: '{docsPath}/meetings/requirements-{slug}.md',
    },
    topicPrompt: 'What feature or area are you eliciting requirements for?',
    discussionStarters: [
      '"{persona0}, who is the primary user and what outcome do they need?"',
      '"{persona1}, what technical constraints shape what\'s possible here?"',
      '"Why does the user need this? Let\'s ask why five times."',
      '"What happens if we do nothing? What\'s the cost of inaction?"',
      '"How will we know this requirement is met? What\'s the acceptance test?"',
    ],
  },

  {
    key:  'architecture-review',
    label: 'Architecture Review       — challenge and validate architecture decisions',
    title: 'Architecture Review',
    purpose:
      'Review an architecture proposal or decision. Surface risks, challenge assumptions, ' +
      'validate non-functional requirements, and agree on any Architecture Decision Records ' +
      '(ADRs) that need to be written.',
    defaultPersonas:  ['architect', 'developer'],
    optionalPersonas: ['product', 'team_lead'],
    agenda: [
      'Architect presents the design or decision under review',
      'Developer: feasibility, implementation complexity, and maintainability assessment',
      'Product (if present): alignment with business requirements and timeline',
      'Challenge round: identify failure modes, risks, and edge cases',
      'Non-functional review: scalability, security, observability, cost',
      'Agree on open questions — assign owner and due date for each',
      'List ADRs that need to be written',
    ],
    output: {
      type:         'arch-review',
      pathTemplate: '{docsPath}/meetings/arch-review-{slug}.md',
    },
    topicPrompt: 'What architecture decision or component are you reviewing?',
    discussionStarters: [
      '"{persona0}, walk us through the design — what problem does it solve?"',
      '"{persona1}, what are your implementation concerns or unknowns?"',
      '"What are the top 3 risks with this approach?"',
      '"What would have to go wrong for this to fail at 10x load?"',
      '"Is there a simpler design? What are we trading off by going complex?"',
    ],
  },

  {
    key:  'sprint-planning',
    label: 'Sprint Planning           — plan the upcoming sprint together',
    title: 'Sprint Planning',
    purpose:
      'Select, estimate, and commit to sprint stories. Agree on the sprint goal, team ' +
      'capacity, and inter-story dependencies before the sprint begins.',
    defaultPersonas:  ['team_lead', 'developer'],
    optionalPersonas: ['product'],
    agenda: [
      'State the sprint goal and team capacity',
      'Walk through backlog candidates — Team Lead presents, Developer estimates',
      'Product (if present): clarify acceptance criteria for ambiguous stories',
      'Identify inter-story dependencies and blockers',
      'Flag any stories that need to be split or need a spike first',
      'Commit to sprint scope and document the sprint goal',
    ],
    output: {
      type:         'sprint-plan',
      pathTemplate: '{docsPath}/meetings/sprint-plan-{slug}.md',
    },
    topicPrompt: 'Sprint number or name (e.g. "Sprint 3" or "Q2 Sprint 1")?',
    discussionStarters: [
      '"{persona0}, what is the sprint goal in one sentence?"',
      '"{persona1}, which stories have the most unknowns?"',
      '"Are there any dependencies between stories that affect sequencing?"',
      '"What would put this sprint at risk? What\'s our contingency?"',
      '"Is the scope achievable given capacity, or do we need to cut something?"',
    ],
  },

  {
    key:  'retrospective',
    label: 'Retrospective             — reflect and improve after a sprint',
    title: 'Sprint Retrospective',
    purpose:
      'Reflect on the last sprint. Identify what went well, what to improve, and ' +
      'agree on concrete, owned action items for the next sprint.',
    defaultPersonas:  ['team_lead', 'developer', 'product'],
    optionalPersonas: [],
    agenda: [
      'Set the safe-to-speak ground rules — this is a blame-free session',
      'What went well? — each persona shares one or more positives',
      'What to improve? — each persona shares their main friction point',
      'Root cause: pick the top 2 improvement areas and run a 5-whys',
      'Action items: one specific action per area, one owner, one due date',
      'Appreciation round — each persona thanks one other',
    ],
    output: {
      type:         'retro',
      pathTemplate: '{docsPath}/meetings/retro-{slug}.md',
    },
    topicPrompt: 'Sprint number or period (e.g. "Sprint 3" or "April 2026")?',
    discussionStarters: [
      '"Let\'s start with positives. {persona0}, what went well for you?"',
      '"{persona1}, what was your biggest source of friction last sprint?"',
      '"We\'ve named the top friction point. Why did it happen? Let\'s ask why five times."',
      '"Who owns the action item to improve this? What specifically will change?"',
      '"Before we close — one appreciation each. {persona0}, you start."',
    ],
  },

  {
    key:  'migration-planning',
    label: 'Migration Planning        — plan a legacy system migration',
    title: 'Migration Planning Session',
    purpose:
      'Align on legacy system migration strategy, validate business rules, and ' +
      'produce a migration roadmap. This meeting brings the domain expert together ' +
      'with the architect to turn legacy knowledge into a structured migration plan.',
    defaultPersonas:  ['modernization', 'architect'],
    optionalPersonas: ['product', 'team_lead'],
    agenda: [
      'Modernization Lead: present legacy inventory and validated business rules',
      'Architect: present target architecture proposal',
      'Align on migration strategy: strangler fig, big-bang, or parallel-run',
      'Identify highest-risk rules and components to migrate first',
      'Agree on cut-over approach and rollback plan',
      'Define success criteria and monitoring plan',
      'Produce the migration epic list',
    ],
    output: {
      type:         'migration-plan',
      pathTemplate: '{docsPath}/meetings/migration-plan-{slug}.md',
    },
    topicPrompt: 'What system or component are you planning to migrate?',
    discussionStarters: [
      '"{persona0}, what are the top 3 business rules we must not break during migration?"',
      '"{persona1}, what does the target architecture look like?"',
      '"What\'s the safest sequence for migrating these components?"',
      '"What triggers the cut-over? What\'s the rollback trigger?"',
      '"How will we know the migration is working correctly in production?"',
    ],
  },

  {
    key:  'technical-feasibility',
    label: 'Technical Feasibility     — assess an approach before committing',
    title: 'Technical Feasibility Assessment',
    purpose:
      'Assess whether a proposed technical approach is feasible, estimate complexity, ' +
      'and surface risks before committing. Output is a clear go / spike-needed / reject ' +
      'decision with documented rationale.',
    defaultPersonas:  ['architect', 'developer'],
    optionalPersonas: ['product'],
    agenda: [
      'Define the approach or technology being assessed',
      'Architect: design-level feasibility and fit with existing architecture',
      'Developer: implementation complexity, unknowns, and effort estimate',
      'Product (if present): business constraints — deadline, budget, scope tradeoffs',
      'Risk assessment: high / medium / low with rationale',
      'Decision: proceed / spike needed / reject with alternatives',
    ],
    output: {
      type:         'feasibility',
      pathTemplate: '{docsPath}/meetings/feasibility-{slug}.md',
    },
    topicPrompt: 'What approach or technology are you assessing?',
    discussionStarters: [
      '"{persona0}, is this approach architecturally sound? What would need to change?"',
      '"{persona1}, how long would a spike take to validate the unknowns?"',
      '"What\'s the worst case if we start down this path and it doesn\'t work?"',
      '"Is there a simpler alternative that achieves 80% of the goal?"',
      '"Given the risks, should we proceed, run a spike, or reject?"',
    ],
  },

  {
    key:  'stakeholder-alignment',
    label: 'Stakeholder Alignment     — align on a direction or trade-off',
    title: 'Stakeholder Alignment Session',
    purpose:
      'Surface disagreements on direction, scope, or trade-offs. Reach an explicit ' +
      'shared decision the team can execute on, with documented rationale and any ' +
      'dissenting opinions noted.',
    defaultPersonas:  ['product', 'team_lead'],
    optionalPersonas: ['architect', 'developer'],
    agenda: [
      'State the decision or trade-off to align on',
      'Each persona presents their position and constraints',
      'Identify where positions differ — name the disagreement explicitly',
      'Explore middle-ground options',
      'Reach a decision with documented rationale',
      'Capture any dissenting opinions and why the decision was made anyway',
    ],
    output: {
      type:         'alignment',
      pathTemplate: '{docsPath}/meetings/alignment-{slug}.md',
    },
    topicPrompt: 'What decision or trade-off needs alignment?',
    discussionStarters: [
      '"{persona0}, what outcome do you need from this decision?"',
      '"{persona1}, where do you see this differently?"',
      '"Let\'s name the disagreement precisely. What exactly do we not agree on?"',
      '"Is there a middle option that satisfies the core need of each position?"',
      '"We need to decide today. What\'s the least-regret choice?"',
    ],
  },

  {
    key:  'design-review',
    label: 'Design Review             — review a feature design before building',
    title: 'Feature Design Review',
    purpose:
      'Review a feature design end-to-end before implementation starts. Validate ' +
      'requirements coverage, technical approach, and implementation readiness. ' +
      'Output is a clear "ready to build" or "needs revision" decision.',
    defaultPersonas:  ['product', 'architect', 'developer'],
    optionalPersonas: ['team_lead'],
    agenda: [
      'Product: walk through the user flow and acceptance criteria',
      'Architect: present technical design and component changes',
      'Developer: implementation plan, risks, and estimated effort',
      'Challenge round: what could go wrong? What are the edge cases?',
      'Assign owners for open questions',
      'Decision: ready to build / needs revision / needs spike',
    ],
    output: {
      type:         'design-review',
      pathTemplate: '{docsPath}/meetings/design-review-{slug}.md',
    },
    topicPrompt: 'What feature or component are you reviewing?',
    discussionStarters: [
      '"{persona0}, walk us through the user flow. What does the user need to achieve?"',
      '"{persona1}, does the technical design fully cover the acceptance criteria?"',
      '"{persona2}, what are the top implementation risks?"',
      '"What edge cases haven\'t we considered yet?"',
      '"Are we ready to build, or do we need a revision cycle first?"',
    ],
  },
];

/** Map of key → template for O(1) lookup. */
const TEMPLATE_MAP = Object.fromEntries(MEETING_TEMPLATES.map(t => [t.key, t]));

module.exports = { MEETING_TEMPLATES, TEMPLATE_MAP };
