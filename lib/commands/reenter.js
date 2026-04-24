'use strict';

const path = require('path');
const fs   = require('fs');
const { log }               = require('../utils/logger');
const { createRL, askChoice, confirm } = require('../utils/prompt');
const { fileExists }        = require('../utils/fs-utils');
const { PERSONAS, PERSONA_MAP } = require('../data/personas');
const { logEvent }          = require('../utils/audit');

// ── Phase registry — ordered sequence of phases ──────────────────────────────
// Each phase entry maps to a persona and its starter skill.
const PHASES = [
  {
    key:       'scout',
    label:     '0 — Relearn / Scout',
    persona:   null,
    artifact:  null,
    starterSkill: '_superml/skills/0-relearn/agent-scout/SKILL.md',
  },
  {
    key:       'product',
    label:     '1 — Product / BA',
    persona:   'product',
    artifact:  'prd_complete',
    starterSkill: '_superml/skills/2-planning/agent-pm/SKILL.md',
  },
  {
    key:       'architect',
    label:     '2 — Architect / Solutioning',
    persona:   'architect',
    artifact:  'architecture_complete',
    starterSkill: '_superml/skills/3-solutioning/agent-architect/SKILL.md',
  },
  {
    key:       'team_lead',
    label:     '3 — Team Lead / Sprint Planning',
    persona:   'team_lead',
    artifact:  'epics_complete',
    starterSkill: '_superml/skills/4-implementation/agent-lead/SKILL.md',
  },
  {
    key:       'developer',
    label:     '4 — Developer / Implementation',
    persona:   'developer',
    artifact:  'implementation_complete',
    starterSkill: '_superml/skills/4-implementation/agent-developer/SKILL.md',
  },
  {
    key:       'qa',
    label:     '5 — QA / Test',
    persona:   'qa',
    artifact:  'qa_complete',
    starterSkill: '_superml/skills/4-implementation/agent-qa/SKILL.md',
  },
  {
    key:       'release',
    label:     '6 — Release',
    persona:   'release',
    artifact:  'release_complete',
    starterSkill: '_superml/skills/4-implementation/agent-release/SKILL.md',
  },
  {
    key:       'modernization',
    label:     'M — Modernization',
    persona:   'modernization',
    artifact:  'legacy_inventory_complete',
    starterSkill: '_superml/skills/5-modernize/agent-sage/SKILL.md',
  },
];

function readYml(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const yaml = require('js-yaml');
    return yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

async function run() {
  const projectRoot = process.cwd();
  const rl = createRL();

  try {
    await runReenter(rl, projectRoot);
  } finally {
    rl.close();
  }
}

async function runReenter(rl, projectRoot) {
  log.banner();
  log.line('  Re-enter a prior phase — revisit any SDLC phase regardless of current progress.');
  log.line('');

  const config    = readYml(path.join(projectRoot, '_superml', 'config.yml'));
  const personaCfg = readYml(path.join(projectRoot, '_superml', 'persona.yml'));

  if (!config) {
    log.warn('No _superml/config.yml found. Run `npx @supermldev/smart-sdlc init` first.');
    log.line('');
    process.exit(1);
  }

  const artifacts       = (config && config.artifacts) || {};
  const currentPersona  = personaCfg && personaCfg.primary_persona;
  const currentPhaseIdx = PHASES.findIndex(ph => ph.persona === currentPersona);

  log.section('Available phases');
  log.line('');

  PHASES.forEach((ph, idx) => {
    const done   = ph.artifact ? !!artifacts[ph.artifact] : false;
    const active = ph.persona === currentPersona;
    const status = active ? '▶ current' : (done ? '✓ complete' : '  pending ');
    log.line(`  ${status}  ${ph.label}`);
  });
  log.line('');

  const choices = PHASES.map(ph => ({ label: ph.label, value: ph.key }));
  const selected = await askChoice(rl, 'Select a phase to re-enter:', choices, Math.max(0, currentPhaseIdx));

  const targetIdx = PHASES.findIndex(ph => ph.key === selected);
  const target    = PHASES[targetIdx];

  // ── Warn on backward re-entry ─────────────────────────────────────────────
  if (currentPhaseIdx > -1 && targetIdx < currentPhaseIdx) {
    const from = PHASES[currentPhaseIdx];
    log.line('');
    log.warn(`You are re-entering an earlier phase: ${target.label}`);
    log.line(`  Current phase: ${from.label}`);
    log.line('');
    log.line('  Going back is allowed but changes in this phase may conflict with');
    log.line('  decisions already made in later phases. Review artifacts carefully.');
    log.line('');
    const proceed = await confirm(rl, 'Re-enter this phase anyway?', false);
    if (!proceed) {
      log.info('Phase re-entry cancelled.');
      log.line('');
      process.exit(0);
    }
  }

  // ── Check persona switch needed ───────────────────────────────────────────
  if (target.persona && target.persona !== currentPersona) {
    const targetPersonaData = PERSONA_MAP[target.persona];
    log.line('');
    log.warn(`This phase requires persona: ${targetPersonaData ? targetPersonaData.name : target.persona}`);
    log.line(`  Your current persona: ${currentPersona || 'none'}`);
    log.line('');
    log.line('  Re-install your persona first:');
    log.line('');
    log.line('      npx @supermldev/smart-sdlc persona');
    log.line('');
  }

  // ── Output starter skill ──────────────────────────────────────────────────
  log.section(`Re-entering: ${target.label}`);
  log.line('');

  const skillExists = fileExists(path.join(projectRoot, target.starterSkill));

  const useCopilot = personaCfg && (
    (personaCfg.ai_tools && personaCfg.ai_tools.includes('github_copilot')) ||
    personaCfg.use_github_copilot === true || personaCfg.use_github_copilot === 'true'
  );

  if (useCopilot) {
    const agentName = target.persona ? `sml-agent-${target.persona === 'team_lead' ? 'lead' : target.persona === 'modernization' ? 'sage' : target.persona}` : 'sml-agent-scout';
    log.line('  Start with your agent in Copilot Chat:');
    log.line('');
    log.line(`      @${agentName}`);
    log.line('');
    log.line('  Or reference the skill directly:');
    log.line('');
    log.line(`      #file:${target.starterSkill}`);
  } else {
    log.line('  Load the starter skill in your AI assistant:');
    log.line('');
    log.line(`      "Load the skill at ${target.starterSkill}"`);
  }

  if (!skillExists) {
    log.line('');
    log.warn(`Skill file not found at ${target.starterSkill}`);
    log.line('  Run `npx @supermldev/smart-sdlc update` to restore skill files.');
  }

  log.line('');
  const reenterUser = personaCfg && personaCfg.user_name;
  logEvent(projectRoot, { type: 'phase-reenter', persona: target.persona || 'scout', phase: target.key, user: reenterUser, notes: target.label });
  log.done(`Phase re-entry ready: ${target.label}`);
  log.line('');
}

module.exports = { run };
