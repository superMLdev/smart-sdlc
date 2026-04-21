'use strict';

const path    = require('path');
const fs      = require('fs');
const { log } = require('../utils/logger');
const { createRL, ask, askChoice, askMulti, confirm } = require('../utils/prompt');
const { copyRecursive, addGitignoreEntry, isGitRepo, dirExists, fileExists } = require('../utils/fs-utils');
const { PERSONAS } = require('../data/personas');

// Root of the npm package (superml-ai), two levels up from lib/commands/
const PACKAGE_ROOT = path.join(__dirname, '../../');
const SKILLS_SRC   = path.join(PACKAGE_ROOT, 'skills');
const MODULE_YAML  = path.join(PACKAGE_ROOT, 'module.yaml');

async function run() {
  const projectRoot = process.cwd();
  const rl = createRL();

  try {
    await runInit(rl, projectRoot);
  } finally {
    rl.close();
  }
}

async function runInit(rl, projectRoot) {
  // ── Welcome Banner ─────────────────────────────────────────────────────────
  log.banner();
  log.line('  Setting up Agentic SDLC for your project team.');
  log.line('');
  log.line('  What will be created:');
  log.item('_superml/skills/      — AI agent skill library');
  log.item('_superml/module.yaml  — skill registry');
  log.item('_superml/config.yml   — project config (gitignored)');
  log.item('_superml/reference/   — company docs per persona');
  log.item('.github/agents/       — Copilot agent persona files (if GitHub Copilot)');
  log.item('.github/skills/       — Copilot /skill slash commands (if GitHub Copilot)');
  log.item('.github/              — Copilot instructions & PR template (if applicable)');
  log.line('');
  log.line('  After setup, each team member runs:');
  log.line('');
  log.line('      npx @supermldev/agentic-sdlc persona');
  log.line('');

  // ── Preflight ──────────────────────────────────────────────────────────────
  if (!fs.existsSync(SKILLS_SRC)) {
    log.error('Could not find the skills/ folder in the SuperML package.');
    log.info('Try reinstalling:  npm install -g @supermldev/agentic-sdlc');
    process.exit(1);
  }

  const skillsDest = path.join(projectRoot, '_superml', 'skills');
  const configDest = path.join(projectRoot, '_superml', 'config.yml');
  const supermlDir = path.join(projectRoot, '_superml');

  let overwriteSkills = true;
  let overwriteConfig = true;

  if (dirExists(skillsDest)) {
    log.warn('_superml/skills/ already exists in this project.');
    overwriteSkills = await confirm(rl, 'Overwrite with the latest skills?', false);
    if (!overwriteSkills) log.info('Keeping existing _superml/skills/.');
  }

  if (fileExists(configDest)) {
    log.warn('_superml/config.yml already exists.');
    overwriteConfig = await confirm(rl, 'Re-run setup and overwrite config?', false);
    if (!overwriteConfig) log.info('Keeping existing config.');
  }

  // ── Step 1: Project identity ───────────────────────────────────────────────
  log.step(1, 5, 'Project identity');

  const projectName = await ask(rl, 'Project name', path.basename(projectRoot));
  const teamName    = await ask(rl, 'Team / org name (optional)', '');

  const projectType = await askChoice(rl, 'What type of project is this?', [
    { label: 'General         — standard software project',          value: 'general'       },
    { label: 'Modernization   — legacy system migration or rewrite', value: 'modernization' },
    { label: 'Greenfield      — brand new, no existing codebase',    value: 'greenfield'    },
    { label: 'API / Platform  — API-first or platform engineering',  value: 'api'           },
  ], 0);

  const docsPath = await ask(rl, 'Where should agents save docs (PRDs, ADRs, architecture)?', 'docs');

  // ── Step 2: AI tools ──────────────────────────────────────────────────────
  log.step(2, 5, 'AI tools & assistants');
  log.line('  Which AI tools does your team use?');
  log.line('  (Used to tailor skill activation instructions for your team)');

  const AI_TOOLS = [
    { label: 'GitHub Copilot    — VS Code, JetBrains, Visual Studio', value: 'github_copilot' },
    { label: 'Cursor            — AI-native code editor',             value: 'cursor'         },
    { label: 'Claude            — Anthropic chat / API',              value: 'claude'         },
    { label: 'Codex / ChatGPT   — OpenAI models',                     value: 'codex'          },
    { label: 'Windsurf          — Codeium AI editor',                 value: 'windsurf'       },
    { label: 'Gemini            — Google AI',                         value: 'gemini'         },
    { label: 'Other / Custom',                                         value: 'other'          },
  ];

  const aiTools = await askMulti(rl, 'Select AI tools your team uses (comma-separated):', AI_TOOLS);

  // ── Step 3: Team role names ────────────────────────────────────────────────
  log.step(3, 5, 'Team role names');
  log.line('  Name each agent role — used in meetings, docs, and greetings.');
  log.line('  Press Enter to keep the default.');
  log.line('');

  const personaNames = {};
  for (const p of PERSONAS) {
    const custom = await ask(rl, p.role, p.name);
    personaNames[p.key] = custom.trim() || p.name;
  }

  // ── Step 4: What already exists? ──────────────────────────────────────────
  let readyArtifacts = [];
  if (projectType !== 'greenfield') {
    log.step(4, 5, 'What already exists?');
    log.line('  Agents use these flags to check prerequisites before starting work.');
    log.line('');

    const artifactChoices = [
      { label: 'PRD — Product Requirements Document is approved',          value: 'prd'              },
      { label: 'Architecture doc — high-level design is defined',          value: 'architecture'     },
      { label: 'ADRs — Architecture Decision Records exist',               value: 'adrs'             },
      { label: 'Epics & stories — backlog is broken down',                 value: 'epics'            },
      ...(projectType === 'modernization' ? [
        { label: 'Legacy inventory — code inventory / tech radar done',    value: 'legacy_inventory' },
        { label: 'Domain knowledge graph — built by Sage',                 value: 'knowledge_graph'  },
      ] : []),
    ];

    readyArtifacts = await askMulti(rl, 'Which artifacts are already complete? (skip if none)', artifactChoices);
  } else {
    log.step(4, 5, 'What already exists?');
    log.info('Greenfield project — skipping artifact readiness check.');
  }

  // ── Step 5: Integrations ──────────────────────────────────────────────────
  log.step(5, 5, 'Integrations');

  const INTEGRATIONS = [
    { label: 'JIRA',          value: 'jira'         },
    { label: 'Confluence',    value: 'confluence'   },
    { label: 'GitHub',        value: 'github'       },
    { label: 'GitLab',        value: 'gitlab'       },
    { label: 'Azure DevOps',  value: 'azure_devops' },
  ];

  const enabledIntegrations = await askMulti(rl, 'Enable integrations (comma-separated, or Enter to skip):', INTEGRATIONS);

  // ── Installing ─────────────────────────────────────────────────────────────
  log.section('Installing');

  // 1. Copy skills/
  if (overwriteSkills) {
    const fileCount = copyRecursive(SKILLS_SRC, skillsDest);
    log.success(`Skills installed  →  _superml/skills/  (${fileCount} files)`);
  } else {
    log.info('Skills unchanged.');
  }

  // 2. Copy module.yaml
  const moduleYamlDest = path.join(supermlDir, 'module.yaml');
  if (fs.existsSync(MODULE_YAML)) {
    fs.mkdirSync(supermlDir, { recursive: true });
    fs.copyFileSync(MODULE_YAML, moduleYamlDest);
    log.success('Skill registry installed  →  _superml/module.yaml');
  }

  // 3. Write config.yml
  if (overwriteConfig) {
    fs.mkdirSync(supermlDir, { recursive: true });
    const configContent = buildConfig({
      projectName, teamName, projectType, docsPath,
      enabledIntegrations, personaNames, readyArtifacts, aiTools,
    });
    fs.writeFileSync(configDest, configContent, 'utf8');
    log.success('Config created  →  _superml/config.yml');
  }

  // 4. .gitignore
  if (isGitRepo(projectRoot)) {
    const addedConfig  = addGitignoreEntry(projectRoot, '_superml/config.yml');
    const addedPersona = addGitignoreEntry(projectRoot, '_superml/persona.yml');
    if (addedConfig || addedPersona) {
      log.success('Gitignore updated  →  _superml/config.yml, _superml/persona.yml');
    } else {
      log.info('Gitignore entries already present.');
    }
  } else {
    log.warn('Not a git repo — add _superml/config.yml and _superml/persona.yml to .gitignore manually');
  }

  // 5. Reference folder structure
  const refRoot = path.join(supermlDir, 'reference');
  const refFolders = ['all', ...PERSONAS.map(p => p.referenceFolder)];
  for (const folder of refFolders) {
    fs.mkdirSync(path.join(refRoot, folder), { recursive: true });
  }
  const refReadmePath = path.join(refRoot, 'README.md');
  if (!fs.existsSync(refReadmePath)) {
    fs.writeFileSync(refReadmePath, buildReferenceReadme(), 'utf8');
  }
  log.success('Reference folders created  →  _superml/reference/');

  // 6. GitHub Copilot instructions (whenever Copilot is an AI tool) + PR template (when GitHub integration)
  const usesCopilot = aiTools.includes('github_copilot');
  const usesGithub  = enabledIntegrations.includes('github');

  if (usesCopilot || usesGithub) {
    const githubDir = path.join(projectRoot, '.github');
    fs.mkdirSync(githubDir, { recursive: true });

    if (usesCopilot) {
      const copilotInstructionsPath = path.join(githubDir, 'copilot-instructions.md');
      if (!fs.existsSync(copilotInstructionsPath)) {
        fs.writeFileSync(copilotInstructionsPath, buildCopilotInstructions(personaNames), 'utf8');
        log.success('Copilot instructions created  →  .github/copilot-instructions.md');
      } else {
        log.info('.github/copilot-instructions.md already exists — skipping.');
      }
    }

    if (usesGithub) {
      const prTemplatePath = path.join(githubDir, 'pull_request_template.md');
      if (!fs.existsSync(prTemplatePath)) {
        fs.writeFileSync(prTemplatePath, buildPrTemplate(), 'utf8');
        log.success('PR template created  →  .github/pull_request_template.md');
      }
    }
  }

  // 7. Agent files + skill slash-command files for GitHub Copilot
  if (usesCopilot) {
    const agentsDir       = path.join(projectRoot, '.github', 'agents');
    const githubSkillsDir = path.join(projectRoot, '.github', 'skills');

    const agentCount = buildAgentFiles(agentsDir, personaNames);
    if (agentCount > 0) {
      log.success(`Agent personas created  →  .github/agents/  (${agentCount} agents)`);
    } else {
      log.info('Agent persona files already exist — skipping.');
    }

    const skillCount = buildSkillFiles(githubSkillsDir, Object.keys(personaNames));
    if (skillCount > 0) {
      log.success(`Skill commands created  →  .github/skills/  (${skillCount} skills)`);
    } else {
      log.info('Skill command files already exist — skipping.');
    }
  }

  // ── Credentials reminder ───────────────────────────────────────────────────
  const credentialFields = buildCredentialReminder(enabledIntegrations);
  if (credentialFields.length > 0) {
    log.section('Credentials needed');
    log.line('  Edit _superml/config.yml and fill in:');
    log.line('');
    credentialFields.forEach(f => log.item(f));
  }

  // ── Setup summary ──────────────────────────────────────────────────────────
  log.section('Setup summary');
  log.summary([
    { label: 'Project',      value: projectName },
    { label: 'Type',         value: projectType },
    { label: 'AI tools',     value: aiTools.length ? aiTools.join(', ') : 'not specified' },
    { label: 'Integrations', value: enabledIntegrations.length ? enabledIntegrations.join(', ') : 'none' },
    { label: 'Skills',       value: '_superml/skills/',      ok: true },
    { label: 'Config',       value: '_superml/config.yml',   ok: true },
    { label: 'Reference',    value: '_superml/reference/',   ok: true },
    ...(usesCopilot ? [
      { label: 'Agents', value: '.github/agents/', ok: true },
      { label: 'Skills', value: '.github/skills/', ok: true },
    ] : []),
  ]);

  log.section('Next steps');
  log.line('');
  log.item('git add _superml/ && git commit -m "chore: add Agentic SDLC"');
  log.item('Drop company docs into _superml/reference/  (see README inside)');
  log.item('Share this with your team — each member runs:');
  log.line('');
  log.line('      npx @supermldev/agentic-sdlc persona');
  log.line('');
  log.line('  Other commands:');
  log.line('');
  log.item('npx @supermldev/agentic-sdlc meeting  — generate multi-persona context');
  log.item('npx @supermldev/agentic-sdlc list     — browse all skills');
  log.line('');
  log.done('Agentic SDLC is ready.');
  log.line('');
}

// ── Config builder ─────────────────────────────────────────────────────────

function enabled(integrations, key) {
  return integrations.includes(key) ? 'true' : 'false';
}

function buildConfig({ projectName, teamName, projectType, docsPath, enabledIntegrations, personaNames = {}, readyArtifacts = [], aiTools = [] }) {
  const ts = new Date().toISOString().slice(0, 10);
  const aiToolsYaml = aiTools.length
    ? aiTools.map(t => `\n  - ${t}`).join('')
    : '\n  - github_copilot';

  return `# Agentic SDLC — Project Configuration
# Generated: ${ts}
# ⚠  This file may contain API tokens. It is in your .gitignore.
# Personal settings (name, role, AI tool) are in _superml/persona.yml
# Built by Superml.dev & superml.org | crazyaiml

# ─── Project Identity ────────────────────────────────────────────────────────
project_name: "${projectName}"
team_name: "${teamName}"
project_type: "${projectType}"      # general | modernization | greenfield | api

# ─── AI Tools ────────────────────────────────────────────────────────────────
# AI assistants used by this team. Agents tailor skill activation instructions
# for the selected tools (e.g. #file: syntax for Copilot vs plain path for Claude).
ai_tools:${aiToolsYaml}

# ─── Team Role Names ─────────────────────────────────────────────────────────
# Used in meeting docs, generated files, and agent greetings.
# Each person's individual name/role is in their own _superml/persona.yml
persona_name_product: "${personaNames.product || 'Aria'}"
persona_name_architect: "${personaNames.architect || 'Rex'}"
persona_name_developer: "${personaNames.developer || 'Nova'}"
persona_name_modernization: "${personaNames.modernization || 'Sage'}"
persona_name_team_lead: "${personaNames.team_lead || 'Lead'}"

# ─── Artifact Paths ─────────────────────────────────────────────────────────
planning_artifacts: "${docsPath}/planning"
implementation_artifacts: "${docsPath}/implementation"
project_knowledge: "${docsPath}"

# ─── Reference Documents ─────────────────────────────────────────────────────
# Company-specific docs, best practices, and guidelines loaded by agents on activation.
# Shared docs → _superml/reference/all/      (every persona reads these)
# Role docs   → _superml/reference/{role}/   (only that persona reads these)
reference_path: "_superml/reference"

# ─── Artifact Readiness ──────────────────────────────────────────────────────────────────
# Agents use these flags to check prerequisites before starting work.
# Update these as your project progresses.
artifacts:
  prd_complete: ${readyArtifacts.includes('prd')}                    # PRD approved and signed off
  architecture_complete: ${readyArtifacts.includes('architecture')}  # Architecture doc exists
  adrs_available: ${readyArtifacts.includes('adrs')}                 # ADRs written
  epics_complete: ${readyArtifacts.includes('epics')}                # Epics & stories in backlog
  legacy_inventory_complete: ${readyArtifacts.includes('legacy_inventory')}  # Code inventory done
  knowledge_graph_complete: ${readyArtifacts.includes('knowledge_graph')}    # Domain knowledge graph built

# ─── JIRA ───────────────────────────────────────────────────────────────────
jira:
  enabled: ${enabled(enabledIntegrations, 'jira')}
  base_url: "https://your-org.atlassian.net"
  project_key: "PROJ"
  email: "you@yourorg.com"
  api_token: ""  # https://id.atlassian.com/manage-profile/security/api-tokens
  epic_issue_type: "Epic"
  story_issue_type: "Story"
  task_issue_type: "Task"
  board_id: ""
  default_assignee: ""

# ─── Confluence ─────────────────────────────────────────────────────────────
confluence:
  enabled: ${enabled(enabledIntegrations, 'confluence')}
  base_url: "https://your-org.atlassian.net/wiki"
  space_key: "PROJ"
  email: "you@yourorg.com"
  api_token: ""  # Same token as JIRA if Atlassian Cloud
  root_page_title: "Project Docs"
  prd_page_parent: "Requirements"
  architecture_page_parent: "Architecture"
  stories_page_parent: "Stories"

# ─── GitHub ─────────────────────────────────────────────────────────────────
github:
  enabled: ${enabled(enabledIntegrations, 'github')}
  # Uses GitHub CLI (gh) — run: gh auth login
  owner: "your-org"
  repo: "your-repo"
  default_base_branch: "main"
  branch_pattern: "{jira_key}-{story_slug}"
  pr_template: ".github/pull_request_template.md"

# ─── GitLab ─────────────────────────────────────────────────────────────────
gitlab:
  enabled: ${enabled(enabledIntegrations, 'gitlab')}
  # Uses GitLab CLI (glab) — run: glab auth login
  namespace: "your-group/your-repo"
  default_base_branch: "main"
  branch_pattern: "{jira_key}-{story_slug}"

# ─── Azure DevOps ───────────────────────────────────────────────────────────
azure_devops:
  enabled: ${enabled(enabledIntegrations, 'azure_devops')}
  # Uses Azure CLI (az devops) — run: az login
  organization: "https://dev.azure.com/your-org"
  project: "${projectName}"
  default_area_path: ""
  default_iteration_path: ""
`;
}

function buildCredentialReminder(integrations) {
  const fields = [];

  if (integrations.includes('jira')) {
    fields.push('jira.email       — your Atlassian email');
    fields.push('jira.api_token   — https://id.atlassian.com/manage-profile/security/api-tokens');
    fields.push('jira.project_key — e.g. MYAPP');
  }
  if (integrations.includes('confluence')) {
    fields.push('confluence.space_key — your Confluence space key');
  }
  if (integrations.includes('github')) {
    fields.push('github.owner  — your GitHub org or username');
    fields.push('github.repo   — your repository name');
    fields.push('(also run: gh auth login)');
  }
  if (integrations.includes('gitlab')) {
    fields.push('gitlab.namespace — e.g. myorg/myrepo');
    fields.push('(also run: glab auth login)');
  }
  if (integrations.includes('azure_devops')) {
    fields.push('azure_devops.organization — your Azure DevOps org URL');
    fields.push('(also run: az login)');
  }

  return fields;
}

function buildCopilotInstructions(personaNames = {}) {
  const product       = personaNames.product       || 'Aria';
  const architect     = personaNames.architect     || 'Rex';
  const developer     = personaNames.developer     || 'Nova';
  const modernization = personaNames.modernization || 'Sage';
  const teamLead      = personaNames.team_lead     || 'Lead';

  return `# Agentic SDLC — GitHub Copilot Instructions

This repository uses the **Agentic SDLC** framework. All skills and agents are in \`_superml/skills/\`.
Load the project config for full context: \`#file:_superml/config.yml\`
Load your personal persona: \`#file:_superml/persona.yml\`

## Activate an Agent Persona

Reference a skill file in Copilot Chat to activate that persona:

| Persona | File |
|---------|------|
| ${product} — Product / BA | \`#file:_superml/skills/2-planning/agent-pm/SKILL.md\` |
| ${architect} — Architect | \`#file:_superml/skills/3-solutioning/agent-architect/SKILL.md\` |
| ${developer} — Developer | \`#file:_superml/skills/4-implementation/agent-developer/SKILL.md\` |
| ${modernization} — Modernization Lead | \`#file:_superml/skills/5-modernize/agent-sage/SKILL.md\` |
| ${teamLead} — Team Lead / PM | \`#file:_superml/skills/4-implementation/sprint-planning/SKILL.md\` |
| Scout — Code Archaeologist | \`#file:_superml/skills/0-relearn/agent-scout/SKILL.md\` |

## Browse All Skills

\`\`\`bash
npx @supermldev/agentic-sdlc list
\`\`\`

## Key Skill Paths

- Analysis: \`_superml/skills/1-analysis/\`
- Planning & PRD: \`_superml/skills/2-planning/\`
- Architecture: \`_superml/skills/3-solutioning/\`
- Implementation: \`_superml/skills/4-implementation/\`
- Modernization: \`_superml/skills/5-modernize/\`
- Integrations (JIRA, Confluence, GitHub): \`_superml/skills/integrations/\`
`;
}

function buildPrTemplate() {
  return `## Summary

<!-- What does this PR do? Link to the story/ticket. -->

## JIRA / Ticket

<!-- e.g. PROJ-42 -->

## Changes

- 

## Acceptance Criteria Verified

- [ ] 

## Screenshots / Evidence

<!-- Optional: attach screenshots, test output, or relevant logs -->

## Checklist

- [ ] Tests pass
- [ ] Code reviewed locally
- [ ] Docs updated if needed
- [ ] No debug/temp code left in
`;
}

function buildReferenceReadme() {
  return `# SuperML Reference Documents

Company-specific documentation, best practices, and guidelines for your AI personas.

## Structure

| Folder           | Used by                    |
|------------------|----------------------------|
| \`all/\`           | Every persona              |
| \`product/\`       | Product / BA persona       |
| \`architect/\`     | Architect persona          |
| \`developer/\`     | Developer persona          |
| \`modernization/\` | Modernization Lead persona |
| \`team_lead/\`     | Team Lead / PM persona     |

## How agents use these docs

When an agent skill activates it automatically loads:
1. All files in \`_superml/reference/all/\` — shared context for every persona
2. All files in \`_superml/reference/{persona}/\` — context specific to that role

## What to put here

**\`all/\`** — Company-wide standards and glossaries
- \`company-glossary.md\`, \`coding-standards.md\`, \`architecture-principles.md\`

**\`product/\`** — Product and requirements context
- \`brand-guidelines.md\`, \`product-vision.md\`, \`stakeholder-map.md\`

**\`architect/\`** — Technical decisions and constraints
- \`preferred-tech-stack.md\`, \`security-standards.md\`, \`approved-patterns.md\`

**\`developer/\`** — Implementation conventions
- \`testing-conventions.md\`, \`git-workflow.md\`, \`local-setup.md\`

**\`modernization/\`** — Legacy system context
- \`legacy-system-overview.md\`, \`known-issues.md\`, \`migration-constraints.md\`

**\`team_lead/\`** — Delivery context
- \`sprint-template.md\`, \`team-capacity.md\`, \`escalation-matrix.md\`

> Drop or edit files at any time — agents re-read them on each activation.
`;
}

// ── Persona agent config ──────────────────────────────────────────────────────

const PERSONA_AGENT_CONFIG = {
  product: {
    agentName:    'sml-agent-pm',
    description:  'Product Manager and Business Analyst for this project. Use for PRDs, product requirements, user stories, acceptance criteria, product brief, feature analysis, requirements gathering, elicitation, backlog creation, create-prd workflow, business analysis.',
    tools:        ['read', 'search', 'edit', 'todo'],
    primarySkill: '2-planning/agent-pm',
    skills: [
      { label: 'Analyst',          path: '1-analysis/agent-analyst'    },
      { label: 'Create PRD',       path: '2-planning/create-prd'       },
      { label: 'Edit PRD',         path: '2-planning/edit-prd'         },
      { label: 'Validate PRD',     path: '2-planning/validate-prd'     },
      { label: 'Product Brief',    path: '2-planning/product-brief'    },
      { label: 'Document Project', path: '1-analysis/document-project' },
      { label: 'Elicitation',      path: 'core/elicitation'            },
    ],
    role:      'Product / BA',
    crossover: [
      '@sml-agent-architect for architecture and technical design decisions',
      '@sml-agent-developer for implementation feasibility',
    ],
  },
  architect: {
    agentName:    'sml-agent-architect',
    description:  'Architect persona for this project. Use for system design, architecture documents, ADRs, architecture decision records, technical design, technology selection, create architecture, epics and stories breakdown, architecture review, technical constraints.',
    tools:        ['read', 'search', 'edit', 'todo'],
    primarySkill: '3-solutioning/agent-architect',
    skills: [
      { label: 'Create Architecture',    path: '3-solutioning/create-architecture'   },
      { label: 'Create Epics & Stories', path: '3-solutioning/create-epics-stories'  },
      { label: 'Generate Context',       path: '3-solutioning/generate-context'      },
      { label: 'Reverse ADR',            path: '0-relearn/reverse-adr'               },
    ],
    role:      'Architect',
    crossover: [
      '@sml-agent-pm for requirements and product decisions',
      '@sml-agent-developer for implementation details',
    ],
  },
  developer: {
    agentName:    'sml-agent-developer',
    description:  'Developer persona for this project. Use for implementing stories, dev tasks, code review, tech debt, sprint tasks, dev-story creation, implementation, coding, story breakdown, create story, development workflow.',
    tools:        ['read', 'search', 'edit', 'execute', 'todo'],
    primarySkill: '4-implementation/agent-developer',
    skills: [
      { label: 'Dev Story',       path: '4-implementation/dev-story'       },
      { label: 'Create Story',    path: '4-implementation/create-story'    },
      { label: 'Code Review',     path: '4-implementation/code-review'     },
      { label: 'Sprint Planning', path: '4-implementation/sprint-planning' },
    ],
    role:      'Developer',
    crossover: [
      '@sml-agent-architect for design and architecture decisions',
      '@sml-agent-pm for requirements and acceptance criteria',
    ],
  },
  modernization: {
    agentName:    'sml-agent-sage',
    description:  'Modernization Lead persona for this project. Use for legacy system analysis, migration planning, knowledge graph, legacy code reading, validate business rules, define target architecture, migration epics, legacy modernization.',
    tools:        ['read', 'search', 'edit', 'todo'],
    primarySkill: '5-modernize/agent-sage',
    skills: [
      { label: 'Build Knowledge Graph',      path: '5-modernize/build-knowledge-graph'      },
      { label: 'Create Migration Epics',     path: '5-modernize/create-migration-epics'     },
      { label: 'Define Target Architecture', path: '5-modernize/define-target-architecture' },
      { label: 'Read Legacy Code',           path: '5-modernize/read-legacy-code'           },
      { label: 'Validate Business Rules',    path: '5-modernize/validate-business-rules'    },
    ],
    role:      'Modernization Lead',
    crossover: [
      '@sml-agent-architect for target architecture decisions',
      '@sml-agent-pm for business requirements and domain rules',
    ],
  },
  team_lead: {
    agentName:    'sml-agent-lead',
    description:  'Team Lead and Project Manager persona for this project. Use for sprint planning, delivery planning, roadmap, team coordination, epics management, capacity planning, create epics, project status, release planning.',
    tools:        ['read', 'search', 'edit', 'todo'],
    primarySkill: '4-implementation/sprint-planning',
    skills: [
      { label: 'Create Epics & Stories', path: '3-solutioning/create-epics-stories' },
    ],
    role:      'Team Lead / PM',
    crossover: [
      '@sml-agent-pm for requirements and product direction',
      '@sml-agent-architect for technical planning',
    ],
  },
};

const SCOUT_AGENT_CONFIG = {
  agentName:    'sml-agent-scout',
  description:  'Code Archaeologist and codebase onboarding guide. Use for exploring a new codebase, codebase onboarding, relearn codebase, generate API docs, generate README, reverse-engineer ADRs from existing code, understand legacy system structure.',
  tools:        ['read', 'search', 'todo'],
  primarySkill: '0-relearn/agent-scout',
  skills: [
    { label: 'Relearn Codebase',  path: '0-relearn/relearn-codebase'  },
    { label: 'Generate API Docs', path: '0-relearn/generate-api-docs'  },
    { label: 'Generate README',   path: '0-relearn/generate-readme'    },
    { label: 'Reverse ADR',       path: '0-relearn/reverse-adr'        },
    { label: 'Help',              path: 'core/help'                    },
  ],
  role:      'Code Archaeologist',
  crossover: [
    '@sml-agent-architect for architecture decisions based on findings',
    '@sml-agent-sage for legacy modernization planning',
  ],
};

function buildAgentFileContent(agentConfig, customName) {
  const skillsTable = agentConfig.skills
    .map(s => `| ${s.label.padEnd(28)} | \`_superml/skills/${s.path}/SKILL.md\` |`)
    .join('\n');

  const crossoverLines = agentConfig.crossover.map(c => `- ${c}`).join('\n');

  return `---
description: "${agentConfig.description}"
tools: [${agentConfig.tools.join(', ')}]
---
You are **${customName}**, the ${agentConfig.role} for this project.

## Activation Sequence

When this agent is selected:
1. Read \`#file:_superml/config.yml\` — load project context.
2. Read \`#file:_superml/persona.yml\` — load the user's name and preferences (skip if missing).
3. Load your primary skill: \`#file:_superml/skills/${agentConfig.primarySkill}/SKILL.md\`
4. Follow the primary skill's instructions — greet the user by their name and present your menu.

## Skill Set

| Skill                         | Path |
|-------------------------------|------|
| **${customName} — primary**   | \`_superml/skills/${agentConfig.primarySkill}/SKILL.md\` |
${skillsTable}

To activate a skill: read its SKILL.md and follow its instructions.

## Constraints

- Stay in the **${agentConfig.role}** role — do not switch personas mid-conversation.
- For cross-persona work, recommend the right agent:
${crossoverLines}
`;
}

function buildAgentFiles(agentsDir, personaNames) {
  fs.mkdirSync(agentsDir, { recursive: true });
  let count = 0;

  for (const persona of PERSONAS) {
    const agentConfig = PERSONA_AGENT_CONFIG[persona.key];
    if (!agentConfig) continue;

    const customName = personaNames[persona.key] || persona.name;
    const filepath   = path.join(agentsDir, `${agentConfig.agentName}.agent.md`);
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, buildAgentFileContent(agentConfig, customName), 'utf8');
      count++;
    }
  }

  // Scout — not in PERSONAS array
  const scoutPath = path.join(agentsDir, `${SCOUT_AGENT_CONFIG.agentName}.agent.md`);
  if (!fs.existsSync(scoutPath)) {
    fs.writeFileSync(scoutPath, buildAgentFileContent(SCOUT_AGENT_CONFIG, 'Scout'), 'utf8');
    count++;
  }

  return count;
}

// ── GitHub Copilot skill files (.github/skills/) ──────────────────────────

/**
 * Read the description field from a skill's SKILL.md frontmatter.
 * Returns empty string if the file is missing or has no description.
 */
function readSkillDescription(skillRelPath) {
  const file = path.join(SKILLS_SRC, skillRelPath, 'SKILL.md');
  if (!fs.existsSync(file)) return '';
  try {
    const src = fs.readFileSync(file, 'utf8');
    const fm  = src.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) return '';
    const m = fm[1].match(/^description:\s*(.+)$/m);
    return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : '';
  } catch {
    return '';
  }
}

function buildSkillFileContent(skillRelPath, skillName, description) {
  const safeDesc   = description.replace(/'/g, "\\'");
  const isAgent    = skillName.startsWith('sml-agent-');

  // ── sml-help gets a full contextual AI skill, not a generic stub ──────────
  if (skillName === 'sml-help') {
    return `---
name: sml-help
description: 'Context-aware next-step guidance. Reads your config and persona to determine exactly where you are in the SDLC journey and what to do next.'
argument-hint: 'optional: what are you trying to do?'
---

# Agentic SDLC — Smart Help

You are the **Agentic SDLC Guide**. Your job is to read the user's project state and give them a SHORT, precise answer: where they are and exactly what to do next.

---

## Step 1 — Read Context (do this silently)

Read both files immediately. Do not ask the user first — just read them.

1. \`#file:_superml/config.yml\` — project name, type, primary_persona, artifacts readiness
2. \`#file:_superml/persona.yml\` — user name, role, skill_level, ai_tools *(may not exist yet)*

---

## Step 2 — Determine Which State Applies

### State A — persona.yml is missing

The user ran \`init\` but hasn't personalised their workspace.

Respond with:
> **You're almost set up.** Run this in your terminal to finish:
> \`\`\`
> npx @supermldev/agentic-sdlc persona
> \`\`\`
> This takes 2 minutes — it sets your name, role, and AI tool.
> While you wait, you can already explore the codebase: \`/sml-agent-scout\`

---

### State B — persona.yml exists, no artifacts done

All artifact flags in config.yml are \`false\` or missing.
Use \`primary_persona\` + \`project_type\` to pick the right first skill:

| primary_persona | project_type | First step | Command |
|---|---|---|---|
| product | any | Analyse project or describe idea | \`/sml-agent-analyst\` |
| architect | any | Need a PRD before architecture | Ask \`@sml-agent-pm\` to create one, then \`/sml-agent-architect\` |
| developer | any | Onboard to codebase first | \`/sml-agent-scout\` |
| modernization | any | Explore legacy codebase | \`/sml-agent-scout\` → \`/sml-read-legacy-code\` |
| team_lead | any | Break down work into epics | \`/sml-create-epics-stories\` |

**Project type overrides** (when persona isn't set or is generic):
- \`general\` → Start with \`/sml-agent-analyst\` to understand the problem space
- \`api\` → Start with \`/sml-agent-analyst\` → \`/sml-agent-architect\`
- \`modernization\` → Start with \`/sml-agent-scout\` to map the legacy system
- \`greenfield\` → Start with \`/sml-agent-pm\` to write the Product Brief → PRD

---

### State C — Some artifacts are done (partial progress)

Check the \`artifacts:\` block in config.yml and follow this decision tree:

**Modernization projects** (project_type: modernization):
1. \`legacy_inventory_complete: false\` → \`/sml-read-legacy-code\`
2. \`legacy_inventory_complete: true\`, \`knowledge_graph_complete: false\` → \`/sml-build-knowledge-graph\`
3. \`knowledge_graph_complete: true\`, \`architecture_complete: false\` → \`/sml-define-target-architecture\`
4. \`architecture_complete: true\`, \`epics_complete: false\` → \`/sml-create-migration-epics\`
5. \`epics_complete: true\` → \`/sml-agent-developer\` or \`/sml-sprint-planning\`

**All other projects** (general / api / greenfield):
1. \`prd_complete: false\` → \`/sml-agent-pm\` → use \`/sml-create-prd\` workflow
2. \`prd_complete: true\`, \`architecture_complete: false\` → \`/sml-agent-architect\`
3. \`architecture_complete: true\`, \`epics_complete: false\` → \`/sml-create-epics-stories\`
4. \`epics_complete: true\` → \`/sml-sprint-planning\` then \`/sml-agent-developer\`

---

## Step 3 — Respond

Keep it short and direct:

1. **One sentence** — where the user is right now (e.g. "You have a PRD but no architecture yet.")
2. **The next 1–2 skills** — slash commands with a one-line reason
3. **One follow-up** — what comes after that

Example format:
> **Where you are:** PRD is complete, architecture not started.
>
> **Do this next:**
> - \`/sml-agent-architect\` — create the architecture doc and ADRs
>
> **After that:** \`/sml-create-epics-stories\` to break architecture into epics and stories.

Do NOT dump a wall of text. Be a concise guide.

---

## Quick Reference — Full Skill List

\`\`\`bash
npx @supermldev/agentic-sdlc list
\`\`\`

For contextual guidance at any time, use \`/sml-help\` or ask: *"what should I do next?"*
`;
  }

  const body = isAgent
    ? `## On Activation

1. Read \`_superml/config.yml\` — load project context.
2. Read \`_superml/persona.yml\` — load user name and preferences.
3. Load the full skill: \`_superml/skills/${skillRelPath}/SKILL.md\`

Follow the activation sequence in the full skill to greet the user and present your menu.`
    : `## Activate

Load the full skill workflow and follow its steps:

\`_superml/skills/${skillRelPath}/SKILL.md\`

Also load for context: \`_superml/config.yml\` and \`_superml/persona.yml\``;

  return `---
name: ${skillName}
description: '${safeDesc}'
argument-hint: 'task or goal'
---

# ${skillName} — Agentic SDLC

${description}

${body}
`;
}

/**
 * Collect all unique skill rel-paths from given persona keys + Scout.
 */
function collectSkillPaths(personaKeys) {
  const seen   = new Set();
  const result = [];

  function add(relPath) {
    if (!seen.has(relPath)) { seen.add(relPath); result.push(relPath); }
  }

  // Scout is always useful
  add(SCOUT_AGENT_CONFIG.primarySkill);
  for (const s of SCOUT_AGENT_CONFIG.skills) add(s.path);

  for (const key of personaKeys) {
    const cfg = PERSONA_AGENT_CONFIG[key];
    if (!cfg) continue;
    add(cfg.primarySkill);
    for (const s of cfg.skills) add(s.path);
  }

  return result;
}

/**
 * Create .github/skills/<name>/SKILL.md for each skill in the given persona keys.
 * Skips files that already exist. Returns count of files created.
 */
function buildSkillFiles(githubSkillsDir, personaKeys) {
  const skillPaths = collectSkillPaths(personaKeys);
  let count = 0;

  for (const relPath of skillPaths) {
    const skillName = 'sml-' + path.basename(relPath);
    const skillDir  = path.join(githubSkillsDir, skillName);
    const skillFile = path.join(skillDir, 'SKILL.md');

    if (fs.existsSync(skillFile)) continue;

    const description = readSkillDescription(relPath) || `Agentic SDLC skill: ${skillName}`;
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(skillFile, buildSkillFileContent(relPath, skillName, description), 'utf8');
    count++;
  }

  return count;
}

module.exports = { run, buildAgentFiles, buildSkillFiles };
