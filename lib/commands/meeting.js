'use strict';

const path = require('path');
const fs   = require('fs');
const { log }                  = require('../utils/logger');
const { createRL, ask, askMulti } = require('../utils/prompt');
const { PERSONAS }             = require('../data/personas');

async function run() {
  const projectRoot = process.cwd();
  const rl = createRL();
  try {
    await runMeeting(rl, projectRoot);
  } finally {
    rl.close();
  }
}

async function runMeeting(rl, projectRoot) {
  log.banner();
  log.line('Set up a multi-persona meeting — bring different perspectives to one discussion.');
  log.line('');

  const config        = readConfig(projectRoot);
  const personaConfig = readPersonaConfig(projectRoot);
  const projectName   = (config && config.project_name)      || path.basename(projectRoot);
  const docsPath      = (config && config.project_knowledge) || 'docs';
  const useCopilot    = (() => {
    const val = (personaConfig && personaConfig.use_github_copilot) || (config && config.use_github_copilot);
    return !val || val !== 'false';
  })();

  if (!config) {
    log.warn('No _superml/config.yml found. Run `npx @supermldev/smart-sdlc init` first.');
    log.line('Continuing with defaults...');
    log.line('');
  }

  // ── Questions ──────────────────────────────────────────────────────────────
  log.section('Meeting details');

  const topic = await ask(rl, 'Meeting goal or topic', '');
  if (!topic.trim()) {
    log.error('A meeting topic is required.');
    process.exit(1);
  }

  const personaChoices = PERSONAS.map(p => {
    const resolvedName = (config && config[p.configKey]) || p.name;
    return {
      label: `${resolvedName.padEnd(8)} (${p.role.padEnd(20)}) — ${p.brings.slice(0, 2).join(', ')}`,
      value: p.key,
    };
  });

  const selectedKeys = await askMulti(rl, 'Who is joining this meeting?', personaChoices);
  if (selectedKeys.length === 0) {
    log.warn('No personas selected. A meeting needs at least one persona.');
    process.exit(1);
  }

  // ── Generate ───────────────────────────────────────────────────────────────
  const date        = new Date().toISOString().slice(0, 10);
  const slug        = slugify(topic);
  const filename    = `${date}-${slug}.md`;
  const meetingDir  = path.join(projectRoot, '_superml', 'meetings');
  const meetingPath = path.join(meetingDir, filename);
  const relPath     = path.join('_superml', 'meetings', filename);

  fs.mkdirSync(meetingDir, { recursive: true });

  const selectedPersonas = selectedKeys.map(k => {
    const p = PERSONAS.find(p => p.key === k);
    const resolvedName = (config && config[p.configKey]) || p.name;
    return { ...p, resolvedName };
  });
  const content = buildMeetingDoc({ topic, date, projectName, docsPath, personas: selectedPersonas, useCopilot });
  fs.writeFileSync(meetingPath, content, 'utf8');

  log.line('');
  log.section('Meeting ready');
  log.success(`Context saved: ${relPath}`);
  log.line('');

  // ── Usage instructions ─────────────────────────────────────────────────────
  if (useCopilot) {
    log.line('In GitHub Copilot chat, attach:');
    log.line('');
    log.item(`#file:${relPath}   ← meeting context`);
    for (const p of selectedPersonas) {
      log.item(`#file:_superml/skills/${p.skills[0]}/SKILL.md   ← ${p.resolvedName} (${p.role})`);
    }
    log.line('');
    log.line('Then open the meeting with:');
    log.line('');
    log.item(`"We are meeting to: ${topic}"`);
  } else {
    log.line('In your AI assistant, load:');
    log.line('');
    log.item(`"Load the meeting context at ${relPath}"`);
    for (const p of selectedPersonas) {
      log.item(`"Also load the skill at _superml/skills/${p.skills[0]}/SKILL.md"`);
    }
    log.line('');
    log.line('Then say:');
    log.line('');
    log.item(`"We are meeting to: ${topic}"`);
  }

  log.line('');
  log.success('Meeting setup complete.');
  log.line('');
}

// ── Meeting document builder ───────────────────────────────────────────────

function buildMeetingDoc({ topic, date, projectName, docsPath, personas, useCopilot }) {
  const lines = [];

  lines.push(`# Meeting: ${topic}`);
  lines.push('');
  lines.push(`> **Project:** ${projectName} &nbsp;|&nbsp; **Date:** ${date} &nbsp;|&nbsp; **Personas:** ${personas.map(p => `${p.resolvedName} (${p.role})`).join(', ')}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Purpose');
  lines.push('');
  lines.push(`This meeting brings together ${personas.length} perspective${personas.length !== 1 ? 's' : ''} to discuss: **${topic}**`);
  lines.push('');
  lines.push('Each persona contributes from their area of ownership. They may agree, challenge, or build on each other\'s points to reach a shared decision.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Personas');
  lines.push('');

  for (const p of personas) {
    lines.push(`### ${p.resolvedName} — ${p.role}`);
    lines.push('');
    lines.push(`**Perspective:** ${p.description}`);
    lines.push('');
    lines.push('**Brings to this meeting:**');
    p.brings.forEach(b => lines.push(`- ${b}`));
    lines.push('');
    lines.push('**Artifacts (attach if they exist):**');
    p.docPaths
      .map(d => d.replace('{docsPath}', docsPath))
      .forEach(d => lines.push(useCopilot ? `- \`#file:${d}\`` : `- \`${d}\``));
    lines.push('');
    lines.push(useCopilot ? '**Skills (attach in Copilot):**' : '**Skills:**');
    p.skills.slice(0, 2).forEach(s =>
      lines.push(useCopilot ? `- \`#file:_superml/skills/${s}/SKILL.md\`` : `- \`_superml/skills/${s}/SKILL.md\``)
    );
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## How to run');
  lines.push('');
  if (useCopilot) {
    lines.push('1. Attach this file + each persona\'s skill file in GitHub Copilot chat');
    lines.push('2. Optionally attach any artifact docs listed above for each persona');
  } else {
    lines.push('1. Load this file + each persona\'s skill file in your AI assistant');
    lines.push('2. Optionally load any artifact docs listed above for each persona');
  }
  lines.push(`3. Open with: *"We are meeting to: ${topic}"*`);
  lines.push('4. Direct questions to each persona by name');
  lines.push('');

  if (personas.length >= 2) {
    lines.push('### Example discussion starters');
    lines.push('');
    const [first, second] = personas;
    lines.push(`- *"${first.resolvedName}, what are the key requirements or concerns for: ${topic}?"*`);
    lines.push(`- *"${second.resolvedName}, from your perspective — do you agree? What constraints does this create?"*`);
    if (personas.length > 2) {
      lines.push(`- *"${personas[2].resolvedName}, how does this affect your area?"*`);
    }
    lines.push(`- *"Where do ${personas.map(p => p.resolvedName).join(' and ')} see things differently? Help us reach a decision."*`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('*Generated by Smart SDLC — `npx @supermldev/smart-sdlc meeting` | Superml.dev & superml.org by crazyaiml*');

  return lines.join('\n');
}

// ── Helpers ────────────────────────────────────────────────────────────────

function readConfig(projectRoot) {
  const configPath = path.join(projectRoot, '_superml', 'config.yml');
  if (!fs.existsSync(configPath)) return null;
  const text   = fs.readFileSync(configPath, 'utf8');
  const config = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([a-z_]+):\s*"?([^"#\n]*?)"?\s*(?:#.*)?$/);
    if (m) config[m[1]] = m[2].trim();
  }
  return config;
}

function readPersonaConfig(projectRoot) {
  const personaPath = path.join(projectRoot, '_superml', 'persona.yml');
  if (!fs.existsSync(personaPath)) return null;
  const text   = fs.readFileSync(personaPath, 'utf8');
  const config = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([a-z_]+):\s*"?([^"#\n]*?)"?\s*(?:#.*)?$/);
    if (m) config[m[1]] = m[2].trim();
  }
  return config;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

module.exports = { run };
