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
  log.banner();
  log.line("Let's set up Agentic SDLC for your project team.");
  log.line('');
  log.line('This will:');
  log.item('Copy skills/ to your project root');
  log.item('Create _superml/config.yml (project config)');
  log.item('Create _superml/reference/ (company docs per persona)');
  log.item('Add _superml/config.yml to .gitignore');
  log.line('');
  log.line('Each team member then runs:  npx @supermldev/agentic-sdlc persona');

  // ── Preflight ──────────────────────────────────────────────────────────────
  if (!fs.existsSync(SKILLS_SRC)) {
    log.error('Could not find the skills/ folder in the SuperML package.');
    log.info('Try: npm install -g agentic-sdlc  then run agentic-sdlc init');
    process.exit(1);
  }

  const skillsDest  = path.join(projectRoot, 'skills');
  const configDest  = path.join(projectRoot, '_superml', 'config.yml');
  const supermlDir  = path.join(projectRoot, '_superml');

  let overwriteSkills = true;
  let overwriteConfig = true;

  if (dirExists(skillsDest)) {
    log.warn('A skills/ folder already exists in this directory.');
    overwriteSkills = await confirm(rl, 'Overwrite it with the latest SuperML skills?', false);
    if (!overwriteSkills) {
      log.info('Keeping existing skills/.');
    }
  }

  if (fileExists(configDest)) {
    log.warn('_superml/config.yml already exists.');
    overwriteConfig = await confirm(rl, 'Overwrite config with new answers?', false);
    if (!overwriteConfig) {
      log.info('Keeping existing config.');
    }
  }

  // ── Questions ──────────────────────────────────────────────────────────────
  log.section('About this project');

  const projectName = await ask(rl, 'Project name', path.basename(projectRoot));
  const teamName    = await ask(rl, 'Team / org name (optional)', '');

  const projectType = await askChoice(rl, 'What type of project is this?', [
    { label: 'General         — standard software project',          value: 'general' },
    { label: 'Modernization   — legacy system migration or rewrite', value: 'modernization' },
    { label: 'Greenfield      — new project, no existing codebase',  value: 'greenfield' },
    { label: 'API / Platform  — API-first or platform engineering',  value: 'api' },
  ], 0);

  log.section('Docs & references');

  const docsPath = await ask(rl, 'Where should agents save docs (PRDs, ADRs, architecture)?', 'docs');

  // ── Team role names ───────────────────────────────────────────────────────
  log.section('Team role names');
  log.line('Give each role a name — used in meeting docs and agent greetings.');
  log.line('Press Enter to keep the default.');
  log.line('');

  const personaNames = {};
  for (const p of PERSONAS) {
    const custom = await ask(rl, p.role, p.name);
    personaNames[p.key] = custom.trim() || p.name;
  }

  // ── Artifact readiness ──────────────────────────────────────────────────────
  // Skip for greenfield — nothing exists yet.
  let readyArtifacts = [];
  if (projectType !== 'greenfield') {
    log.section('What already exists?');
    log.line('This helps agents know which prerequisites are ready.');
    log.line('Agents will warn you if a required artifact is missing before they start work.');
    log.line('');

    const artifactChoices = [
      { label: 'PRD — Product Requirements Document is approved',          value: 'prd' },
      { label: 'Architecture document — high-level design is defined',     value: 'architecture' },
      { label: 'ADRs — Architecture Decision Records exist',               value: 'adrs' },
      { label: 'Epics & stories — backlog is broken down and prioritised', value: 'epics' },
      ...(projectType === 'modernization' ? [
        { label: 'Legacy inventory — code inventory / tech radar complete', value: 'legacy_inventory' },
        { label: 'Domain knowledge graph — built by Sage',                  value: 'knowledge_graph' },
      ] : []),
    ];

    readyArtifacts = await askMulti(rl, 'Which artifacts are already complete? (skip if none)', artifactChoices);
  }

  log.section('Integrations');

  const INTEGRATIONS = [
    { label: 'JIRA',          value: 'jira' },
    { label: 'Confluence',    value: 'confluence' },
    { label: 'GitHub',        value: 'github' },
    { label: 'GitLab',        value: 'gitlab' },
    { label: 'Azure DevOps',  value: 'azure_devops' },
  ];

  const enabledIntegrations = await askMulti(
    rl,
    'Which integrations do you want to enable?',
    INTEGRATIONS
  );

  // ── Install ────────────────────────────────────────────────────────────────
  log.section('Installing');

  // 1. Copy skills/
  if (overwriteSkills) {
    const fileCount = copyRecursive(SKILLS_SRC, skillsDest);
    log.success(`Skills copied to skills/  (${fileCount} files)`);
  }

  // 2. Copy module.yaml if present
  const moduleYamlDest = path.join(projectRoot, 'module.yaml');
  if (fs.existsSync(MODULE_YAML) && !fileExists(moduleYamlDest)) {
    fs.copyFileSync(MODULE_YAML, moduleYamlDest);
    log.success('Skill registry copied to module.yaml');
  }

  // 3. Write config.yml
  if (overwriteConfig) {
    fs.mkdirSync(supermlDir, { recursive: true });
    const configContent = buildConfig({
      projectName, teamName, projectType, docsPath, enabledIntegrations,
      personaNames, readyArtifacts,
    });
    fs.writeFileSync(configDest, configContent, 'utf8');
    log.success('Config created at _superml/config.yml');
  }

  // 4. .gitignore
  if (isGitRepo(projectRoot)) {
    const added = addGitignoreEntry(projectRoot, '_superml/config.yml');
    if (added) {
      log.success('Added _superml/config.yml to .gitignore');
    } else {
      log.info('_superml/config.yml is already in .gitignore');
    }
  } else {
    log.warn('Not a git repository — remember to add _superml/config.yml to your .gitignore manually');
  }

  // 5. Create reference folder structure
  const refRoot = path.join(supermlDir, 'reference');
  const refFolders = ['all', ...PERSONAS.map(p => p.referenceFolder)];
  for (const folder of refFolders) {
    fs.mkdirSync(path.join(refRoot, folder), { recursive: true });
  }
  const refReadmePath = path.join(refRoot, 'README.md');
  if (!fs.existsSync(refReadmePath)) {
    fs.writeFileSync(refReadmePath, buildReferenceReadme(), 'utf8');
  }
  log.success('Reference folder created at _superml/reference/');

  // ── Credentials reminder ───────────────────────────────────────────────────  const credentialFields = buildCredentialReminder(enabledIntegrations);
  if (credentialFields.length > 0) {
    log.section('Fill in your credentials');
    log.line('Edit _superml/config.yml and add:');
    credentialFields.forEach(f => log.item(f));
  }

  // ── Next steps ─────────────────────────────────────────────────────────────
  // ── Project setup complete ─────────────────────────────────────────────────
  log.section('Project setup complete');
  log.line('Share with your team:');
  log.line('');
  log.item('Commit skills/ and module.yaml to version control');
  log.item('Drop company docs in _superml/reference/ — see README.md inside');
  log.item('Keep _superml/config.yml out of git (already gitignored)');
  log.line('');
  log.line('Each team member sets up their personal workspace:');
  log.line('');
  log.line('      npx @supermldev/agentic-sdlc persona');
  log.line('');
  log.line('Other commands:');
  log.line('');
  log.item('npx @supermldev/agentic-sdlc meeting  — multi-persona meeting context');
  log.item('npx @supermldev/agentic-sdlc list     — browse all skills');
  log.line('');
  log.success('Agentic SDLC project is ready.');
  log.line('');
}

// ── Config builder ─────────────────────────────────────────────────────────

function enabled(integrations, key) {
  return integrations.includes(key) ? 'true' : 'false';
}

function buildConfig({ projectName, teamName, projectType, docsPath, enabledIntegrations, personaNames = {}, readyArtifacts = [] }) {
  const ts = new Date().toISOString().slice(0, 10);

  return `# Agentic SDLC — Project Configuration
# Generated: ${ts}
# ⚠  This file may contain API tokens. It is in your .gitignore.
# Personal settings (name, role, AI tool) are in _superml/persona.yml
# Built by Superml.dev & superml.org | crazyaiml

# ─── Project Identity ────────────────────────────────────────────────────────
project_name: "${projectName}"
team_name: "${teamName}"
project_type: "${projectType}"      # general | modernization | greenfield | api

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
