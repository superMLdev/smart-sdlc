'use strict';

const path = require('path');
const fs   = require('fs');
const { log } = require('../utils/logger');
const { createRL, ask, askChoice, askMulti, confirm } = require('../utils/prompt');
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
  log.line('  Set up your personal workspace on this project.');
  log.line('');
  log.line('  This will create _superml/persona.yml with your name,');
  log.line('  role, and AI tool preferences — kept out of git.');
  log.line('');

  // ── Read project config for context ──────────────────────────────────────
  const config = readYml(path.join(projectRoot, '_superml', 'config.yml'));
  if (!config) {
    log.warn('No _superml/config.yml found — project has not been initialised yet.');
    const proceed = await confirm(rl, 'Continue without a project config?', false);
    if (!proceed) {
      log.line('');
      log.line('  Run the project setup first:');
      log.line('');
      log.line('      npx @supermldev/agentic-sdlc init');
      log.line('');
      process.exit(0);
    }
  } else {
    const projectName = config.project_name || path.basename(projectRoot);
    const projectType = config.project_type || '';
    log.badge('Project', projectName);
    if (projectType) log.badge('Type', projectType);
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
        const existingTools = parseYmlList(existing.ai_tools) || (existing.use_github_copilot !== 'false' ? ['github_copilot'] : []);
        showNextSteps(config, existing.primary_persona, existingTools);
      }
      return;
    }
  }

  // ── Step 1: Identity ───────────────────────────────────────────────────────
  log.step(1, 3, 'About you');

  const userName = await ask(rl, 'Your name', 'Developer');

  const defaultPersonaIdx = config && config.project_type === 'modernization' ? 3 : 0;
  const primaryPersona = await askChoice(
    rl,
    'Your role on this project',
    PERSONAS.map(p => ({ label: p.label, value: p.key })),
    defaultPersonaIdx,
  );

  // ── Step 2: AI tools ──────────────────────────────────────────────────────
  log.step(2, 3, 'Your AI tools');
  log.line('  Which AI tools do you use in this repo?');
  log.line('  (Skill instructions will be tailored for your selection)');

  // Pre-select tools from project config if available
  const projectAiTools  = parseYmlList((config && config.ai_tools) || '');
  const defaultToolHint = projectAiTools.length ? ` (project default: ${projectAiTools.join(', ')})` : '';
  log.line(`  ${defaultToolHint ? `Project default:${defaultToolHint}` : 'Select all that apply:'}`);

  const AI_TOOLS = [
    { label: 'GitHub Copilot    — VS Code, JetBrains, Visual Studio', value: 'github_copilot' },
    { label: 'Cursor            — AI-native code editor',             value: 'cursor'         },
    { label: 'Claude            — Anthropic chat / API',              value: 'claude'         },
    { label: 'Codex / ChatGPT   — OpenAI models',                     value: 'codex'          },
    { label: 'Windsurf          — Codeium AI editor',                 value: 'windsurf'       },
    { label: 'Gemini            — Google AI',                         value: 'gemini'         },
    { label: 'Other / Custom',                                         value: 'other'          },
  ];

  const aiTools = await askMulti(rl, 'Select your AI tools (comma-separated):', AI_TOOLS);
  const resolvedTools = aiTools.length ? aiTools : (projectAiTools.length ? projectAiTools : ['github_copilot']);

  // ── Step 3: Preferences ────────────────────────────────────────────────────
  log.step(3, 3, 'Preferences');

  const skillLevel = await askChoice(rl, 'Your skill level (controls how much agents explain)', [
    { label: 'beginner     — agents explain concepts and decisions in detail', value: 'beginner'     },
    { label: 'intermediate — balanced explanations, skip the basics',          value: 'intermediate' },
    { label: 'expert       — concise, no hand-holding',                        value: 'expert'       },
  ], 1);
  const language = await ask(rl, 'Language for documents and agent responses', 'English');

  // ── Install ────────────────────────────────────────────────────────────────
  log.section('Installing');

  fs.mkdirSync(supermlDir, { recursive: true });

  const personaContent = buildPersonaConfig({ userName, primaryPersona, aiTools: resolvedTools, skillLevel, language });
  fs.writeFileSync(personaDest, personaContent, 'utf8');
  log.success('Persona config created  →  _superml/persona.yml');

  if (isGitRepo(projectRoot)) {
    const added = addGitignoreEntry(projectRoot, '_superml/persona.yml');
    if (added) {
      log.success('Gitignore updated  →  _superml/persona.yml');
    } else {
      log.info('_superml/persona.yml is already in .gitignore');
    }
  } else {
    log.warn('Not a git repo — add _superml/persona.yml to your .gitignore manually');
  }

  // ── Next steps ─────────────────────────────────────────────────────────────
  showNextSteps(config, primaryPersona, resolvedTools);
}

// ── Next steps (also used when skipping overwrite) ────────────────────────

function showNextSteps(config, primaryPersona, aiTools) {
  // aiTools may be an array or a legacy boolean (backwards compat)
  if (!Array.isArray(aiTools)) aiTools = aiTools ? ['github_copilot'] : [];
  const useCopilot = aiTools.includes('github_copilot');

  const personaData   = PERSONA_MAP[primaryPersona];
  const starterSkill  = personaData ? personaData.starterSkill : '_superml/skills/0-relearn/agent-scout/SKILL.md';
  const rerlearnSkill = '_superml/skills/0-relearn/agent-scout/SKILL.md';
  const projectType   = config && config.project_type;
  const showRelearn   = projectType !== 'greenfield' && starterSkill !== rerlearnSkill;

  // Persona-specific prerequisite warnings
  const artifacts    = (config && config.artifacts) || {};
  const personaNames = {
    product:       (config && config.persona_name_product)       || 'Aria',
    architect:     (config && config.persona_name_architect)     || 'Rex',
    developer:     (config && config.persona_name_developer)     || 'Nova',
    modernization: (config && config.persona_name_modernization) || 'Sage',
    team_lead:     (config && config.persona_name_team_lead)     || 'Lead',
  };

  const missingPrereqs = [];
  if (primaryPersona === 'architect' && !artifacts.prd_complete) {
    missingPrereqs.push({ label: 'PRD not complete', fix: '_superml/skills/2-planning/agent-pm/SKILL.md', persona: `${personaNames.product} (Product)` });
  }
  if (primaryPersona === 'developer') {
    if (!artifacts.prd_complete)          missingPrereqs.push({ label: 'PRD not complete',          fix: '_superml/skills/2-planning/agent-pm/SKILL.md',                fix2: '_superml/skills/2-planning/agent-pm/SKILL.md',                  persona: `${personaNames.product} (Product)` });
    if (!artifacts.architecture_complete) missingPrereqs.push({ label: 'Architecture not complete', fix: '_superml/skills/3-solutioning/agent-architect/SKILL.md',     fix2: '_superml/skills/3-solutioning/agent-architect/SKILL.md',        persona: `${personaNames.architect} (Architect)` });
    if (!artifacts.epics_complete)        missingPrereqs.push({ label: 'Epics not defined',          fix: '_superml/skills/3-solutioning/create-epics-stories/SKILL.md',fix2: '_superml/skills/3-solutioning/create-epics-stories/SKILL.md',  persona: `${personaNames.architect} (Architect)` });
  }
  if (primaryPersona === 'team_lead' && !artifacts.epics_complete) {
    missingPrereqs.push({ label: 'Epics & stories not defined', fix: '_superml/skills/3-solutioning/create-epics-stories/SKILL.md', persona: `${personaNames.architect} (Architect)` });
  }
  if (primaryPersona === 'modernization' && !artifacts.legacy_inventory_complete) {
    missingPrereqs.push({ label: 'Legacy code inventory not complete', fix: '_superml/skills/0-relearn/relearn-codebase/SKILL.md', persona: `${personaNames.modernization}` });
  }

  log.section('Your workspace is ready');
  log.line('');

  if (useCopilot) {
    log.line('  1.  Activate your persona in GitHub Copilot Chat:');
    log.line('');
    log.line(`          #file:${starterSkill}`);
    if (showRelearn) {
      log.line('');
      log.line('      Onboard to the codebase first:');
      log.line('');
      log.line(`          #file:${rerlearnSkill}`);
    }
    if (aiTools.length > 1) {
      const others = aiTools.filter(t => t !== 'github_copilot');
      log.line('');
      log.line(`  2.  In ${others.join(' / ')} or any other AI assistant:`);
      log.line('');
      log.line(`          "Load the skill at ${starterSkill}"`);
    }
  } else {
    log.line('  1.  Activate your persona in your AI assistant:');
    log.line('');
    log.line(`          "Load the skill at ${starterSkill}"`);
    if (showRelearn) {
      log.line('');
      log.line('      Onboard to the codebase first:');
      log.line('');
      log.line(`          "Load the skill at ${rerlearnSkill}"`);
    }
  }

  if (missingPrereqs.length > 0) {
    log.line('');
    log.warn('Prerequisites not yet complete for your persona:');
    log.line('');
    missingPrereqs.forEach(p => {
      log.line(`      ⚠  ${p.label}`);
      log.line(`         Ask ${p.persona} first:`);
      log.line(useCopilot ? `           #file:${p.fix}` : `           "Load the skill at ${p.fix}"`);
    });
    log.line('');
    log.line('  Agents will detect this automatically and guide you.');
  }

  log.line('');
  log.item(`npx @supermldev/agentic-sdlc meeting  — multi-persona meeting context`);
  log.item(`npx @supermldev/agentic-sdlc list     — browse all skills`);
  log.line('');
  log.done('Your workspace is ready.');
  log.line('');
}

// ── Persona config builder ─────────────────────────────────────────────────

function buildPersonaConfig({ userName, primaryPersona, aiTools = [], skillLevel, language }) {
  const ts = new Date().toISOString().slice(0, 10);
  const aiToolsYaml = aiTools.length
    ? aiTools.map(t => `\n  - ${t}`).join('')
    : '\n  - github_copilot';
  // Keep legacy field for backwards compatibility with tools that read persona.yml directly
  const useCopilot = aiTools.includes('github_copilot');

  return `# Agentic SDLC — Personal Workspace Configuration
# Generated: ${ts}
# Run:  npx @supermldev/agentic-sdlc persona  to update these settings.
# This file is personal — it is in your .gitignore.
# Built by Superml.dev & superml.org | crazyaiml

# ─── Identity ────────────────────────────────────────────────────────────────
user_name: "${userName}"
primary_persona: "${primaryPersona}"  # product | architect | developer | modernization | team_lead

# ─── AI Tools ────────────────────────────────────────────────────────────────
# All AI assistants you use. Agents tailor skill instructions for your selection.
ai_tools:${aiToolsYaml}

# ─── Preferences ─────────────────────────────────────────────────────────────
use_github_copilot: ${useCopilot}     # legacy compat — derived from ai_tools above
user_skill_level: "${skillLevel}"     # beginner | intermediate | expert
communication_language: "${language}"
document_output_language: "${language}"
`;
}

// ── Parse a YAML list value (- item per line) ─────────────────────────────

function parseYmlList(raw) {
  if (!raw) return [];
  // Handles inline YAML list: [a, b] or multiline bullet list
  if (typeof raw === 'string') {
    const inline = raw.match(/^\[(.+)\]$/);
    if (inline) return inline[1].split(',').map(s => s.trim()).filter(Boolean);
    return raw.split('\n').map(s => s.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
  }
  return Array.isArray(raw) ? raw : [];
}

// ── YAML reader (flat + one-level nested for artifacts + list for ai_tools) ─

function readYml(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const text   = fs.readFileSync(filePath, 'utf8');
  const config = { artifacts: {}, ai_tools: [] };
  let inArtifacts = false;
  let inAiTools   = false;

  for (const line of text.split('\n')) {
    // Detect artifacts: block header
    if (/^artifacts:\s*$/.test(line)) { inArtifacts = true; inAiTools = false; continue; }
    // Detect ai_tools: block header
    if (/^ai_tools:\s*$/.test(line))  { inAiTools = true; inArtifacts = false; continue; }

    // Nested artifact flags (indented 2 spaces)
    if (inArtifacts && /^\s{2}[a-z]/.test(line)) {
      const m = line.match(/^\s{2}([a-z_]+):\s*(true|false)/);
      if (m) config.artifacts[m[1]] = m[2] === 'true';
      continue;
    }

    // ai_tools list items (- value)
    if (inAiTools && /^\s{2}-/.test(line)) {
      const m = line.match(/^\s{2}-\s*(.+)$/);
      if (m) config.ai_tools.push(m[1].trim());
      continue;
    }

    // Back to top-level
    if (/^[a-z_]/.test(line)) { inArtifacts = false; inAiTools = false; }

    // Top-level key: value
    const m = line.match(/^([a-z_]+):\s*"?([^"#\n]*?)"?\s*(?:#.*)?$/);
    if (m) config[m[1]] = m[2].trim();
  }

  return config;
}

module.exports = { run };
