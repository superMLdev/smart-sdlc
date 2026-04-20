'use strict';

const path    = require('path');
const fs      = require('fs');
const { log, col, c } = require('../utils/logger');

const PACKAGE_ROOT = path.join(__dirname, '../../');
const MODULE_YAML  = path.join(PACKAGE_ROOT, 'module.yaml');

async function run() {
  log.banner();

  if (!fs.existsSync(MODULE_YAML)) {
    log.error('module.yaml not found in the SuperML package.');
    process.exit(1);
  }

  const skills = parseModuleYaml(MODULE_YAML);

  if (skills.length === 0) {
    log.error('No skills found in module.yaml.');
    process.exit(1);
  }

  // Group by phase
  const byPhase = {};
  for (const skill of skills) {
    const phase = skill.phase || 'other';
    if (!byPhase[phase]) byPhase[phase] = [];
    byPhase[phase].push(skill);
  }

  const phaseOrder = ['relearn', 'analysis', 'planning', 'solutioning', 'implementation', 'modernize', 'core', 'integration', 'other'];
  const phaseLabels = {
    relearn:        '0 — Relearn      (Brownfield onboarding)',
    analysis:       '1 — Analysis     (Understand the problem)',
    planning:       '2 — Planning     (Requirements & UX)',
    solutioning:    '3 — Solutioning  (Architecture & stories)',
    implementation: '4 — Implementation (Build, test, ship)',
    modernize:      '5 — Modernize    (Legacy → Modern)',
    core:           'Core             (Cross-cutting utilities)',
    integration:    'Integrations     (JIRA, Confluence, GitHub, GitLab, Azure DevOps)',
    other:          'Other',
  };

  const orderedPhases = [
    ...phaseOrder.filter(p => byPhase[p]),
    ...Object.keys(byPhase).filter(p => !phaseOrder.includes(p)),
  ];

  let totalCount = 0;
  for (const phase of orderedPhases) {
    const phaseName = phaseLabels[phase] || phase;
    log.section(phaseName);

    for (const skill of byPhase[phase]) {
      const typeTag = skill.type === 'agent' ? col(c.cyan, '[agent]') : '';
      const namePart = col(c.bold + c.white, skill.name.padEnd(32));
      console.log(`  ${namePart} ${typeTag}`);
      if (skill.description) {
        // Wrap description at ~70 chars
        const words = skill.description.split(' ');
        let line = '';
        for (const word of words) {
          if ((line + ' ' + word).length > 70) {
            console.log(`  ${col(c.gray, '  ' + line.trim())}`);
            line = word;
          } else {
            line += (line ? ' ' : '') + word;
          }
        }
        if (line) console.log(`  ${col(c.gray, '  ' + line.trim())}`);
      }
      console.log('');
      totalCount++;
    }
  }

  log.divider();
  log.info(`${totalCount} skills available`);
  log.line('');
  log.line('To use a skill, reference its SKILL.md in your AI assistant:');
  log.line('');
  log.item('#file:skills/0-relearn/agent-scout/SKILL.md');
  log.line('');
}

/**
 * Minimal YAML list parser for the module.yaml format.
 * Extracts skill entries: name, path, type, phase, description.
 */
function parseModuleYaml(filePath) {
  const lines  = fs.readFileSync(filePath, 'utf8').split('\n');
  const skills = [];
  let current  = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // New skill entry
    if (/^  - name:/.test(line)) {
      if (current) skills.push(current);
      current = { name: extractValue(line) };
      continue;
    }

    if (!current) continue;

    if (/^    path:/.test(line))        current.path        = extractValue(line);
    if (/^    type:/.test(line))        current.type        = extractValue(line);
    if (/^    phase:/.test(line))       current.phase       = extractValue(line);
    if (/^    description:/.test(line)) current.description = extractValue(line);
  }

  if (current) skills.push(current);
  return skills;
}

function extractValue(line) {
  const match = line.match(/:\s*"?(.+?)"?\s*$/);
  return match ? match[1].replace(/^"|"$/g, '') : '';
}

module.exports = { run };
