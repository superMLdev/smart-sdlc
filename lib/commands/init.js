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
  log.item('.github/              — Copilot instructions & PR template (if GitHub)');
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

module.exports = { run };
