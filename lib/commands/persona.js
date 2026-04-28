'use strict';

const path = require('path');
const fs   = require('fs');
const { log } = require('../utils/logger');
const { createRL, ask, askChoice, askMulti, confirm } = require('../utils/prompt');
const { addGitignoreEntry, isGitRepo, fileExists } = require('../utils/fs-utils');
const { PERSONAS, PERSONA_MAP } = require('../data/personas');
const { logEvent }              = require('../utils/audit');

async function run(args = []) {
  const projectRoot = process.cwd();
  const subCommand  = args[0];

  if (subCommand === 'exit') {
    return runPersonaExit(projectRoot);
  }

  if (subCommand === 'status') {
    return runPersonaStatus(projectRoot);
  }

  const rl = createRL();
  try {
    await runPersona(rl, projectRoot);
  } finally {
    rl.close();
  }
}

/**
 * Exit (uninstall) the current persona — removes _superml/persona.yml.
 */
function runPersonaExit(projectRoot) {
  log.banner();
  const supermlDir  = path.join(projectRoot, '_superml');
  const personaDest = path.join(supermlDir, 'persona.yml');

  if (!fileExists(personaDest)) {
    log.warn('No persona installed. Nothing to exit.');
    log.line('  Run `npx @supermldev/smart-sdlc persona` to install one.');
    log.line('');
    process.exit(0);
  }

  const existing = readYml(personaDest);
  const key      = existing && existing.primary_persona;
  const p        = key && PERSONA_MAP[key];
  const label    = p ? `${p.name} — ${p.role}` : (key || 'unknown');

  log.warn(`This will exit your installed persona: ${label}`);
  log.line('  Your _superml/persona.yml will be deleted.');
  log.line('');

  // Synchronous exit — no readline needed for a simple confirm-then-delete
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('  Exit persona? (y/N): ', answer => {
    rl.close();
    if (answer.trim().toLowerCase() !== 'y') {
      log.info('Persona exit cancelled. Your persona remains installed.');
      log.line('');
      process.exit(0);
    }
    fs.unlinkSync(personaDest);
    logEvent(projectRoot, { type: 'persona-exit', persona: key || '-', phase: key || '-', notes: label });
    log.success(`Persona exited: ${label}`);
    log.line('');
    log.line('  Install a new persona:');
    log.line('');
    log.line('      npx @supermldev/smart-sdlc persona');
    log.line('');
    process.exit(0);
  });
}

/**
 * Show the currently installed persona without launching the wizard.
 */
function runPersonaStatus(projectRoot) {
  log.banner();
  const personaDest = path.join(projectRoot, '_superml', 'persona.yml');

  if (!fileExists(personaDest)) {
    log.warn('No persona installed.');
    log.line('  Run `npx @supermldev/smart-sdlc persona` to install one.');
    log.line('');
    process.exit(0);
  }

  const existing = readYml(personaDest);
  const key      = existing && existing.primary_persona;
  const p        = key && PERSONA_MAP[key];

  log.section('Installed persona');
  log.line(`  Name:     ${(existing && existing.user_name) || 'Unknown'}`);
  log.line(`  Persona:  ${p ? p.name : (key || '—')}${p ? ` — ${p.role}` : ''}`);
  log.line(`  Tools:    ${(existing && existing.ai_tools) || '—'}`);
  log.line(`  Level:    ${(existing && existing.user_skill_level) || '—'}`);
  log.line('');
  log.item('npx @supermldev/smart-sdlc persona        — re-install / change persona');
  log.item('npx @supermldev/smart-sdlc persona exit   — exit this persona');
  log.line('');
  process.exit(0);
}

/**
 * Check if a persona's sequential prerequisites are met.
 * Returns an array of { flag, label } for each unmet prerequisite.
 *
 * Double-gate strategy:
 *  1. The config.artifacts flag must be true (set by the previous persona when they sign off)
 *  2. The prerequisite artifact doc files must actually exist on disk
 *     (prevents bypassing by manually editing config.yml flags)
 */
function checkPersonaGate(config, personaKey, projectRoot) {
  const persona = PERSONA_MAP[personaKey];
  if (!persona || !persona.prerequisites || persona.prerequisites.length === 0) return [];
  const artifacts = (config && config.artifacts) || {};

  return persona.prerequisites
    .map((flag, i) => ({ flag, label: persona.prerequisiteLabels[i] || flag }))
    .filter(({ flag }) => {
      // Gate 1: flag must be explicitly true
      if (!artifacts[flag]) return true;

      // Gate 2: look up which persona produces the artifact for this flag
      // and verify its doc files exist on disk
      if (projectRoot) {
        // Find the persona whose skillSequence has an item with artifactFlag === flag
        const outputPath = (config && config.output_path) || '_superml/artifacts';
        const ownerPersona = Object.values(PERSONA_MAP).find(p =>
          p.skillSequence && p.skillSequence.some(s => s.artifactFlag === flag)
        );
        if (ownerPersona && ownerPersona.docPaths && ownerPersona.docPaths.length > 0) {
          const anyDocExists = ownerPersona.docPaths.some(docPath => {
            const resolved = path.join(projectRoot, docPath.replace('{output_path}', outputPath));
            return fs.existsSync(resolved);
          });
          if (!anyDocExists) return true; // flag says true but no artifact files on disk
        }
      }

      return false;
    });
}

async function runPersona(rl, projectRoot) {
  log.banner();
  log.line('  Install a persona — commit to a role and activate your AI agent skill set.');
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
      log.line('      npx @supermldev/smart-sdlc init');
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
  const supermlDir     = path.join(projectRoot, '_superml');
  const personaDest    = path.join(supermlDir, 'persona.yml');

  if (fileExists(personaDest)) {
    const existingYml      = readYml(personaDest);
    const existingPersonaKey = existingYml && existingYml.primary_persona;
    const cur              = existingPersonaKey && PERSONA_MAP[existingPersonaKey];

    log.line('');
    log.warn('A persona is already installed.');
    if (cur) log.line(`  Currently active: ${cur.name} \u2014 ${cur.role}`);
    log.line('');
    log.line('  You cannot switch personas while one is installed.');
    log.line('  Exit your current persona first, then run this command again:');
    log.line('');
    log.line('      npx @supermldev/smart-sdlc persona exit');
    log.line('');
    log.line('  To update preferences (name, tools, skill level) without changing role,');
    log.line('  exit and re-install the same persona.');
    log.line('');
    process.exit(1);
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

  // ── Gate check: sequential phase enforcement ──────────────────────────────
  const gate = checkPersonaGate(config, primaryPersona, projectRoot);
  if (gate.length > 0) {
    const personaData = PERSONA_MAP[primaryPersona];
    log.line('');
    log.warn(`Cannot activate ${personaData ? personaData.role : primaryPersona} \u2014 prerequisites not met:`);
    log.line('');
    gate.forEach(g => log.line(`      \u2717  ${g.label}`));
    log.line('');
    log.line('  Complete the required work with the previous persona first, then re-run:');
    log.line('');
    log.line('      npx @supermldev/smart-sdlc persona');
    log.line('');
    process.exit(1);
  }

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
  const installingLabel = PERSONA_MAP[primaryPersona];
  log.section(`Installing persona: ${installingLabel ? installingLabel.name : primaryPersona}`);

  fs.mkdirSync(supermlDir, { recursive: true });

  const personaContent = buildPersonaConfig({ userName, primaryPersona, aiTools: resolvedTools, skillLevel, language });
  fs.writeFileSync(personaDest, personaContent, 'utf8');
  log.success(`Persona installed: ${installingLabel ? `${installingLabel.name} — ${installingLabel.role}` : primaryPersona}  →  _superml/persona.yml`);
  logEvent(projectRoot, { type: 'persona-install', persona: primaryPersona, phase: primaryPersona, user: userName, notes: installingLabel ? installingLabel.role : '' });

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

  // ── Generate Copilot agent + skill files ──────────────────────────────────
  if (resolvedTools.includes('github_copilot')) {
    const { buildAgentFiles, buildSkillFiles } = require('./init');
    const agentsDir       = path.join(projectRoot, '.github', 'agents');
    const githubSkillsDir = path.join(projectRoot, '.github', 'skills');

    const allPersonaNames = {
      product:       (config && config.persona_name_product)       || 'Aria',
      architect:     (config && config.persona_name_architect)     || 'Rex',
      developer:     (config && config.persona_name_developer)     || 'Nova',
      modernization: (config && config.persona_name_modernization) || 'Sage',
      team_lead:     (config && config.persona_name_team_lead)     || 'Lead',
      qa:            (config && config.persona_name_qa)            || 'Quinn',
      release:       (config && config.persona_name_release)       || 'Riley',
    };

    const agentCount = buildAgentFiles(agentsDir, allPersonaNames);
    if (agentCount > 0) {
      log.success(`Agent files created  →  .github/agents/  (${agentCount} agents)`);
    }

    const skillCount = buildSkillFiles(githubSkillsDir, [primaryPersona]);
    if (skillCount > 0) {
      log.success(`Skill commands created  →  .github/skills/  (${skillCount} skills)`);
    }
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

  log.section(`Persona installed — ${(PERSONA_MAP[primaryPersona] || {}).name || primaryPersona} is ready`);
  log.line('');

  if (useCopilot) {
    const agentName = {
      product: 'sml-agent-pm', architect: 'sml-agent-architect', developer: 'sml-agent-developer',
      modernization: 'sml-agent-sage', team_lead: 'sml-agent-lead',
      qa: 'sml-agent-qa', release: 'sml-agent-release',
    }[primaryPersona] || 'sml-agent-scout';

    log.line('  1.  Use your agent — type in Copilot Chat:');
    log.line('');
    log.line(`          @${agentName}`);
    log.line('');
    log.line('      Or use a skill slash command:');
    log.line('');
    log.line(`          /${agentName}`);
    log.line('');
    log.line('      Or reference the skill file directly:');
    log.line('');
    log.line(`          #file:${starterSkill}`);
    if (showRelearn) {
      log.line('');
      log.line('      Onboard to the codebase first:');
      log.line('');
      log.line('          @sml-agent-scout');
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
    log.warn('⛔ Prerequisites not yet complete for your persona:');
    log.line('');
    missingPrereqs.forEach(p => {
      log.line(`      ✗  ${p.label}`);
      log.line(`         You must complete this with ${p.persona} first:`);
      log.line(useCopilot ? `           #file:${p.fix}` : `           "Load the skill at ${p.fix}"`);
    });
    log.line('');
    log.line('  ⚠  Your persona is installed but you cannot proceed until the above is done.');
    log.line('     Agents are instructed to STOP if these prerequisites are not met.');
    log.line('     There is no bypass — complete the required phases in order.');
  }

  log.line('');
  log.item(`npx @supermldev/smart-sdlc meeting  — Party Mode (multi-persona session)`);
  log.item(`npx @supermldev/smart-sdlc list     — browse all skills`);
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

  return `# Smart SDLC — Personal Workspace Configuration
# Generated: ${ts}
# Run:  npx @supermldev/smart-sdlc persona  to update these settings.
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
