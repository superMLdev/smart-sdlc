'use strict';

const path = require('path');
const fs   = require('fs');
const { log } = require('../utils/logger');
const { createRL, ask, askChoice, confirm } = require('../utils/prompt');
const { addGitignoreEntry, isGitRepo, fileExists } = require('../utils/fs-utils');
const { PERSONAS, PERSONA_MAP } = require('../data/personas');

async function run() {
  const projectRoot = process.cwd();
  const rl = createRL();

  try {
    await runPersona(rl, projectRoot);
  } finally {
    rl.close();
  }
}

async function runPersona(rl, projectRoot) {
  log.banner();
  log.line('Set up your personal workspace on this project.');
  log.line('');
  log.line('This will:');
  log.item('Create _superml/persona.yml with your name, role, and preferences');
  log.item('Add _superml/persona.yml to .gitignore');
  log.line('');

  // ── Read project config for context ──────────────────────────────────────
  const config = readYml(path.join(projectRoot, '_superml', 'config.yml'));
  if (!config) {
    log.warn('No _superml/config.yml found — project has not been initialised yet.');
    const proceed = await confirm(rl, 'Continue without a project config?', false);
    if (!proceed) {
      log.line('');
      log.line('Run the project setup first:');
      log.line('');
      log.line('      npx @supermldev/agentic-sdlc init');
      log.line('');
      process.exit(0);
    }
  } else {
    const projectName = config.project_name || path.basename(projectRoot);
    log.line(`  Project: ${projectName}`);
    log.line('');
  }

  // ── Check for existing persona.yml ────────────────────────────────────────
  const supermlDir  = path.join(projectRoot, '_superml');
  const personaDest = path.join(supermlDir, 'persona.yml');

  if (fileExists(personaDest)) {
    log.warn('_superml/persona.yml already exists.');
    const overwrite = await confirm(rl, 'Overwrite with new answers?', false);
    if (!overwrite) {
      log.info('Keeping existing persona config.');
      log.line('');
      const existing = readYml(personaDest);
      if (existing) {
        showNextSteps(config, existing.primary_persona, existing.use_github_copilot !== 'false');
      }
      return;
    }
  }

  // ── Questions ──────────────────────────────────────────────────────────────
  log.section('About you');

  const userName = await ask(rl, 'Your name', 'Developer');

  const defaultPersonaIdx = config && config.project_type === 'modernization' ? 3 : 0;
  const primaryPersona = await askChoice(
    rl,
    'Your role on this project',
    PERSONAS.map(p => ({ label: p.label, value: p.key })),
    defaultPersonaIdx,
  );

  log.section('Your preferences');

  const useCopilot = await confirm(rl, 'Are you using GitHub Copilot in this repo?', true);
  const skillLevel = await askChoice(rl, 'Your skill level (controls how much agents explain)', [
    { label: 'beginner     — agents explain concepts and decisions in detail', value: 'beginner' },
    { label: 'intermediate — balanced explanations, skip the basics',          value: 'intermediate' },
    { label: 'expert       — concise, no hand-holding',                        value: 'expert' },
  ], 1);
  const language = await ask(rl, 'Language for documents and agent responses', 'English');

  // ── Install ────────────────────────────────────────────────────────────────
  log.section('Installing');

  fs.mkdirSync(supermlDir, { recursive: true });

  const personaContent = buildPersonaConfig({ userName, primaryPersona, useCopilot, skillLevel, language });
  fs.writeFileSync(personaDest, personaContent, 'utf8');
  log.success('Persona config created at _superml/persona.yml');

  if (isGitRepo(projectRoot)) {
    const added = addGitignoreEntry(projectRoot, '_superml/persona.yml');
    if (added) {
      log.success('Added _superml/persona.yml to .gitignore');
    } else {
      log.info('_superml/persona.yml is already in .gitignore');
    }
  } else {
    log.warn('Not a git repo — add _superml/persona.yml to your .gitignore manually');
  }

  // ── Next steps ─────────────────────────────────────────────────────────────
  showNextSteps(config, primaryPersona, useCopilot);
}

// ── Next steps (also used when skipping overwrite) ────────────────────────

function showNextSteps(config, primaryPersona, useCopilot) {
  const personaData   = PERSONA_MAP[primaryPersona];
  const starterSkill  = personaData ? personaData.starterSkill : 'skills/0-relearn/agent-scout/SKILL.md';
  const rerlearnSkill = 'skills/0-relearn/agent-scout/SKILL.md';
  const projectType   = config && config.project_type;
  const showRelearn   = projectType !== 'greenfield' && starterSkill !== rerlearnSkill;

  // Persona-specific prerequisite warnings
  const artifacts     = (config && config.artifacts) || {};
  const personaNames  = {
    product:       (config && config.persona_name_product)       || 'Aria',
    architect:     (config && config.persona_name_architect)     || 'Rex',
    developer:     (config && config.persona_name_developer)     || 'Nova',
    modernization: (config && config.persona_name_modernization) || 'Sage',
    team_lead:     (config && config.persona_name_team_lead)     || 'Lead',
  };

  const missingPrereqs = [];
  if (primaryPersona === 'architect' && !artifacts.prd_complete) {
    missingPrereqs.push({ label: 'PRD not complete', fix: 'skills/2-planning/agent-pm/SKILL.md', persona: `${personaNames.product} (Product)` });
  }
  if (primaryPersona === 'developer') {
    if (!artifacts.prd_complete)          missingPrereqs.push({ label: 'PRD not complete',          fix: 'skills/2-planning/agent-pm/SKILL.md',                    persona: `${personaNames.product} (Product)` });
    if (!artifacts.architecture_complete) missingPrereqs.push({ label: 'Architecture not complete', fix: 'skills/3-solutioning/agent-architect/SKILL.md',           persona: `${personaNames.architect} (Architect)` });
    if (!artifacts.epics_complete)        missingPrereqs.push({ label: 'Epics not defined',          fix: 'skills/3-solutioning/create-epics-stories/SKILL.md',     persona: `${personaNames.architect} (Architect)` });
  }
  if (primaryPersona === 'team_lead' && !artifacts.epics_complete) {
    missingPrereqs.push({ label: 'Epics & stories not defined', fix: 'skills/3-solutioning/create-epics-stories/SKILL.md', persona: `${personaNames.architect} (Architect)` });
  }
  if (primaryPersona === 'modernization' && !artifacts.legacy_inventory_complete) {
    missingPrereqs.push({ label: 'Legacy code inventory not complete', fix: 'skills/0-relearn/relearn-codebase/SKILL.md', persona: `${personaNames.modernization}` });
  }

  log.section('Next steps');

  if (useCopilot) {
    log.line('1.  Start with your persona skill in GitHub Copilot chat:');
    log.line('');
    log.line(`      #file:${starterSkill}`);
    if (showRelearn) {
      log.line('');
      log.line('    Onboard to the codebase first:');
      log.line('');
      log.line(`      #file:${rerlearnSkill}`);
    }
    log.line('');
    log.line('2.  Or in Claude, Cursor, or any other AI assistant:');
    log.line('');
    log.line(`      "Load the skill at ${starterSkill}"`);
  } else {
    log.line('1.  Start with your persona skill in your AI assistant:');
    log.line('');
    log.line(`      "Load the skill at ${starterSkill}"`);
    if (showRelearn) {
      log.line('');
      log.line('    Onboard to the codebase first:');
      log.line('');
      log.line(`      "Load the skill at ${rerlearnSkill}"`);
    }
    log.line('');
    log.line('2.  To also use GitHub Copilot, attach skills with:');
    log.line('');
    log.line(`      #file:${starterSkill}`);
  }

  if (missingPrereqs.length > 0) {
    log.line('');
    log.warn('Prerequisites not yet complete for your persona:');
    log.line('');
    missingPrereqs.forEach(p => {
      log.line(`  ⚠  ${p.label}`);
      log.line(`     Ask ${p.persona} first:`);
      log.line(useCopilot ? `       #file:${p.fix}` : `       "Load the skill at ${p.fix}"`);
    });
    log.line('');
    log.line('  Agents will detect this automatically and guide you.');
  }

  log.line('');
  log.line('3.  Run a multi-persona meeting:');
  log.line('');
  log.line('      npx @supermldev/agentic-sdlc meeting');
  log.line('');
  log.line('4.  See all available skills:');
  log.line('');
  log.line('      npx @supermldev/agentic-sdlc list');
  log.line('');
  log.success('Your workspace is ready.');
  log.line('');
}

// ── Persona config builder ─────────────────────────────────────────────────

function buildPersonaConfig({ userName, primaryPersona, useCopilot, skillLevel, language }) {
  const ts = new Date().toISOString().slice(0, 10);

  return `# Agentic SDLC — Personal Workspace Configuration
# Generated: ${ts}
# Run:  npx @supermldev/agentic-sdlc persona  to update these settings.
# This file is personal — it is in your .gitignore.
# Built by Superml.dev & superml.org | crazyaiml

# ─── Identity ────────────────────────────────────────────────────────────────
user_name: "${userName}"
primary_persona: "${primaryPersona}"  # product | architect | developer | modernization | team_lead

# ─── Preferences ─────────────────────────────────────────────────────────────
use_github_copilot: ${useCopilot}     # true | false
user_skill_level: "${skillLevel}"     # beginner | intermediate | expert
communication_language: "${language}"
document_output_language: "${language}"
`;
}

// ── YAML reader (flat + one-level nested for artifacts) ───────────────────

function readYml(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const text   = fs.readFileSync(filePath, 'utf8');
  const config = { artifacts: {} };
  let inArtifacts = false;

  for (const line of text.split('\n')) {
    // Detect artifacts: block header
    if (/^artifacts:\s*$/.test(line)) { inArtifacts = true; continue; }

    // Nested artifact flags (indented 2 spaces)
    if (inArtifacts && /^\s{2}[a-z]/.test(line)) {
      const m = line.match(/^\s{2}([a-z_]+):\s*(true|false)/);
      if (m) config.artifacts[m[1]] = m[2] === 'true';
      continue;
    }

    // Back to top-level
    if (/^[a-z_]/.test(line)) inArtifacts = false;

    // Top-level key: value
    const m = line.match(/^([a-z_]+):\s*"?([^"#\n]*?)"?\s*(?:#.*)?$/);
    if (m) config[m[1]] = m[2].trim();
  }

  return config;
}

module.exports = { run };
