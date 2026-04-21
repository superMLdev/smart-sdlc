'use strict';

const path = require('path');
const fs   = require('fs');
const { log, col, c } = require('../utils/logger');

// ── SDLC flow per persona ──────────────────────────────────────────────────
const FLOWS = {
  product: {
    role:  'Product / BA',
    agent: 'agent-pm',
    steps: [
      { label: 'Analyse existing project',  slash: 'agent-analyst',   file: '1-analysis/agent-analyst'          },
      { label: 'Write product brief',       slash: 'agent-analyst',   file: '1-analysis/agent-analyst'          },
      { label: 'Create PRD',                slash: 'agent-pm',        file: '2-planning/agent-pm'               },
      { label: 'Validate PRD',              slash: 'validate-prd',    file: '2-planning/validate-prd'           },
      { label: 'Edit / refine PRD',         slash: 'edit-prd',        file: '2-planning/edit-prd'               },
    ],
  },
  architect: {
    role:  'Architect',
    agent: 'agent-architect',
    steps: [
      { label: 'Create architecture',       slash: 'agent-architect',   file: '3-solutioning/agent-architect'    },
      { label: 'Create epics & stories',    slash: 'create-epics-stories', file: '3-solutioning/create-epics-stories' },
      { label: 'Generate context doc',      slash: 'generate-context',  file: '3-solutioning/generate-context'   },
    ],
  },
  developer: {
    role:  'Developer',
    agent: 'agent-developer',
    steps: [
      { label: 'Onboard to codebase',       slash: 'agent-scout',     file: '0-relearn/agent-scout'             },
      { label: 'Sprint planning',           slash: 'sprint-planning', file: '4-implementation/sprint-planning'  },
      { label: 'Develop story (TDD)',        slash: 'agent-developer', file: '4-implementation/agent-developer'  },
      { label: 'Code review',               slash: 'code-review',     file: '4-implementation/code-review'      },
    ],
  },
  modernization: {
    role:  'Modernization Lead',
    agent: 'agent-sage',
    steps: [
      { label: 'Onboard to codebase',        slash: 'agent-scout',                  file: '0-relearn/agent-scout'                         },
      { label: 'Read legacy code',            slash: 'read-legacy-code',             file: '5-modernize/read-legacy-code'                  },
      { label: 'Build knowledge graph',       slash: 'build-knowledge-graph',        file: '5-modernize/build-knowledge-graph'             },
      { label: 'Define target architecture',  slash: 'define-target-architecture',   file: '5-modernize/define-target-architecture'        },
      { label: 'Validate business rules',     slash: 'validate-business-rules',      file: '5-modernize/validate-business-rules'           },
      { label: 'Create migration epics',      slash: 'create-migration-epics',       file: '5-modernize/create-migration-epics'            },
    ],
  },
  team_lead: {
    role:  'Team Lead / PM',
    agent: 'agent-lead',
    steps: [
      { label: 'Create epics & stories',    slash: 'create-epics-stories',  file: '3-solutioning/create-epics-stories'  },
      { label: 'Sprint planning',           slash: 'sprint-planning',       file: '4-implementation/sprint-planning'    },
      { label: 'Create a story',            slash: 'create-story',          file: '4-implementation/create-story'       },
    ],
  },
};

// ── Agents reference ───────────────────────────────────────────────────────
const AGENTS = [
  { name: 'agent-scout',     role: 'Code Archaeologist',  desc: 'Codebase onboarding & exploration'       },
  { name: 'agent-pm',        role: 'Product Manager',     desc: 'PRDs, prioritization, requirements'      },
  { name: 'agent-architect', role: 'Architect',           desc: 'System design, ADRs, epics & stories'    },
  { name: 'agent-developer', role: 'Developer',           desc: 'Implementation, TDD, code review'        },
  { name: 'agent-sage',      role: 'Modernization Lead',  desc: 'Legacy analysis, migration planning'     },
  { name: 'agent-lead',      role: 'Team Lead / PM',      desc: 'Epics, sprint planning, delivery'        },
];

// ── Cross-cutting skills ───────────────────────────────────────────────────
const UTILITY_SKILLS = [
  { slash: 'brainstorming',    desc: 'Open-ended ideation with structure'         },
  { slash: 'elicitation',      desc: 'Guided requirements discovery'              },
  { slash: 'generate-readme',  desc: 'Auto-generate README from codebase'         },
  { slash: 'generate-api-docs',desc: 'Auto-generate API documentation'            },
  { slash: 'reverse-adr',      desc: 'Extract ADRs from an existing codebase'     },
  { slash: 'relearn-codebase', desc: 'Structured deep-dive into a codebase'       },
  { slash: 'help',             desc: 'Contextual SDLC guidance (this screen)'     },
];

// ── Artifact readiness labels ──────────────────────────────────────────────
const ARTIFACT_LABELS = {
  prd_complete:              'PRD',
  architecture_complete:     'Architecture doc',
  epics_complete:            'Epics & stories',
  legacy_inventory_complete: 'Legacy code inventory',
  knowledge_graph_complete:  'Knowledge graph',
  migration_plan_complete:   'Migration plan',
};

// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  const projectRoot = process.cwd();

  log.banner();

  const config  = readYml(path.join(projectRoot, '_superml', 'config.yml'));
  const persona = readYml(path.join(projectRoot, '_superml', 'persona.yml'));

  // ── State 0: not initialised ────────────────────────────────────────────
  if (!config) {
    log.warn('This project has not been initialised yet.');
    log.line('');
    log.line('  Run the setup wizard first:');
    log.line('');
    log.line('      npx @supermldev/agentic-sdlc init');
    log.line('');
    log.line('  Then set up your personal workspace:');
    log.line('');
    log.line('      npx @supermldev/agentic-sdlc persona');
    log.line('');
    return;
  }

  // ── Project header ──────────────────────────────────────────────────────
  const projectName = config.project_name || path.basename(projectRoot);
  const projectType = config.project_type || '';
  log.badge('Project', projectName);
  if (projectType) log.badge('Type', projectType);
  log.line('');

  // ── State 1: no persona yet ─────────────────────────────────────────────
  if (!persona) {
    log.warn('You haven\'t set up your personal workspace yet.');
    log.line('');
    log.line('  Run:');
    log.line('');
    log.line('      npx @supermldev/agentic-sdlc persona');
    log.line('');
    log.line('  This takes 2 minutes — sets your name, role, and AI tool.');
    log.line('');
    printAgentsSection(false, null);
    printFooter();
    return;
  }

  // ── State 2: fully configured ───────────────────────────────────────────
  const primaryPersona = persona.primary_persona || 'developer';
  const userName       = persona.user_name       || '';
  const aiTools        = parseYmlList(persona.ai_tools) || (persona.use_github_copilot !== 'false' ? ['github_copilot'] : []);
  const useCopilot     = aiTools.includes('github_copilot');
  const flow           = FLOWS[primaryPersona];
  const artifacts      = config.artifacts || {};

  // Your setup
  log.section('Your setup');
  log.summary([
    { label: 'You',       value: userName || '(not set)'                                           },
    { label: 'Role',      value: flow ? flow.role : primaryPersona                                 },
    { label: 'AI Tools',  value: aiTools.length ? aiTools.map(formatTool).join(', ') : 'not set'  },
  ]);

  // Readiness checklist
  const hasSkills = fs.existsSync(path.join(projectRoot, '_superml', 'skills'));
  const checks    = [{ label: 'Skills installed', done: hasSkills }];
  for (const [key, label] of Object.entries(ARTIFACT_LABELS)) {
    if (artifacts[key] !== undefined) {
      checks.push({ label, done: artifacts[key] === true || artifacts[key] === 'true' });
    }
  }

  if (checks.length > 1) {
    log.section('Readiness checklist');
    log.line('');
    for (const check of checks) {
      const icon  = check.done ? col(c.bgreen, '✔') : col(c.byellow, '○');
      const label = col(check.done ? c.gray : c.bwhite, check.label);
      console.log(`      ${icon}  ${label}`);
    }
    log.line('');
  }

  // Your SDLC flow
  if (flow) {
    log.section(`Your SDLC flow  (${flow.role})`);
    log.line('');
    flow.steps.forEach((step, i) => {
      const num       = col(c.bold + c.bcyan, String(i + 1).padStart(2));
      const label     = (step.label + ' ').padEnd(32);
      // If the skill itself IS an agent (slash starts with "agent-"), use @that-agent.
      // Otherwise show @persona-agent  or  /specific-skill-slash.
      const agentName = step.slash.startsWith('agent-') ? step.slash : flow.agent;
      const hint      = useCopilot
        ? col(c.cyan, `@${agentName}`) + col(c.gray, '  or  ') + col(c.cyan, `/${step.slash}`)
        : col(c.gray, `#file:_superml/skills/${step.file}/SKILL.md`);
      console.log(`    ${num}  ${label}${hint}`);
    });
    log.line('');
  }

  // All agents
  printAgentsSection(useCopilot, primaryPersona);

  // Utility skills
  log.section('Other skills — available anytime');
  log.line('');
  for (const s of UTILITY_SKILLS) {
    const name = (useCopilot ? `/${s.slash}` : s.slash).padEnd(26);
    console.log(`      ${col(c.cyan, name)}  ${col(c.gray, s.desc)}`);
  }
  log.line('');

  printFooter();
}

// ── Agents section ─────────────────────────────────────────────────────────

function printAgentsSection(useCopilot, activePersonaAgent) {
  log.section('All agents');
  log.line('');
  for (const a of AGENTS) {
    const activation = useCopilot ? `@${a.name}` : `_superml/skills/…/${a.name}/SKILL.md`;
    const tag        = useCopilot
      ? col(c.bold + c.cyan, `@${a.name}`.padEnd(22))
      : col(c.cyan, a.name.padEnd(22));
    const isActive   = activePersonaAgent && a.name === activePersonaAgent;
    const roleLabel  = col(c.gray, a.desc);
    const marker     = isActive ? col(c.bold + c.bgreen, ' ◄ your role') : '';
    console.log(`      ${tag}  ${roleLabel}${marker}`);
    if (!useCopilot) {
      console.log(`      ${col(c.gray, '  #file:_superml/skills/…/' + a.name + '/SKILL.md')}`);
    }
  }
  log.line('');
}

// ── Footer ─────────────────────────────────────────────────────────────────

function printFooter() {
  log.divider();
  log.line('');
  log.item(`npx @supermldev/agentic-sdlc list      — browse all skills`);
  log.item(`npx @supermldev/agentic-sdlc meeting   — multi-persona session`);
  log.item(`npx @supermldev/agentic-sdlc persona   — change your role or AI tool`);
  log.item(`npx @supermldev/agentic-sdlc update    — update skills to latest`);
  log.line('');
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTool(t) {
  const labels = {
    github_copilot: 'GitHub Copilot',
    cursor:         'Cursor',
    claude:         'Claude',
    codex:          'Codex / ChatGPT',
    windsurf:       'Windsurf',
    gemini:         'Gemini',
    other:          'Other',
  };
  return labels[t] || t;
}

function parseYmlList(raw) {
  if (!raw) return [];
  if (typeof raw === 'string') {
    const inline = raw.match(/^\[(.+)\]$/);
    if (inline) return inline[1].split(',').map(s => s.trim()).filter(Boolean);
    return raw.split('\n').map(s => s.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
  }
  return Array.isArray(raw) ? raw : [];
}

function readYml(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const text   = fs.readFileSync(filePath, 'utf8');
  const config = { artifacts: {}, ai_tools: [] };
  let inArtifacts = false;
  let inAiTools   = false;

  for (const line of text.split('\n')) {
    if (/^artifacts:\s*$/.test(line)) { inArtifacts = true;  inAiTools = false;  continue; }
    if (/^ai_tools:\s*$/.test(line))  { inAiTools   = true;  inArtifacts = false; continue; }

    if (inArtifacts && /^\s{2}[a-z]/.test(line)) {
      const m = line.match(/^\s{2}([a-z_]+):\s*(true|false)/);
      if (m) config.artifacts[m[1]] = m[2] === 'true';
      continue;
    }

    if (inAiTools && /^\s{2}-/.test(line)) {
      const m = line.match(/^\s{2}-\s*(.+)$/);
      if (m) config.ai_tools.push(m[1].trim());
      continue;
    }

    if (/^[a-z_]/.test(line)) { inArtifacts = false; inAiTools = false; }

    const m = line.match(/^([a-z_]+):\s*"?([^"#\n]*?)"?\s*(?:#.*)?$/);
    if (m) config[m[1]] = m[2].trim();
  }

  return config;
}

module.exports = { run };
