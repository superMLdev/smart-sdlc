'use strict';

const path = require('path');
const fs   = require('fs');
const { log }                              = require('../utils/logger');
const { createRL, ask, askChoice, askMulti, confirm } = require('../utils/prompt');
const { PERSONAS }                         = require('../data/personas');
const { MEETING_TEMPLATES }                = require('../data/meeting-templates');

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

  // ── Template or custom? ────────────────────────────────────────────────────
  log.section('Meeting type');

  const meetingMode = await askChoice(rl, 'How do you want to set up this meeting?', [
    { label: 'Choose a meeting template  — predefined agenda + suggested personas', value: 'template' },
    { label: 'Custom meeting             — free-form topic, choose personas yourself', value: 'custom' },
  ], 0);

  let template        = null;
  let topic           = '';
  let preSelectedKeys = [];

  if (meetingMode === 'template') {
    // ── Template selection ───────────────────────────────────────────────────
    const templateChoices = MEETING_TEMPLATES.map(t => ({ label: t.label, value: t.key }));
    const chosenKey       = await askChoice(rl, 'Select a meeting template:', templateChoices, 0);
    template              = MEETING_TEMPLATES.find(t => t.key === chosenKey);

    log.line('');
    log.line(`  Template: ${template.title}`);
    log.line(`  Purpose:  ${template.purpose.slice(0, 80)}...`);
    log.line('');

    topic = await ask(rl, template.topicPrompt, '');
    if (!topic.trim()) {
      log.error('A topic is required.');
      process.exit(1);
    }

    preSelectedKeys = [...template.defaultPersonas];

    // Show suggested personas
    log.line('');
    log.line('  Suggested personas for this meeting:');
    const allRelevant = [...template.defaultPersonas, ...template.optionalPersonas];
    allRelevant.forEach(k => {
      const p    = PERSONAS.find(p => p.key === k);
      const name = (config && config[p.configKey]) || p.name;
      const tag  = template.defaultPersonas.includes(k) ? '● default' : '○ optional';
      log.line(`    ${tag}  ${name} (${p.role})`);
    });
    log.line('');

    // Allow user to add optional personas
    if (template.optionalPersonas.length > 0) {
      const optionalChoices = template.optionalPersonas.map(k => {
        const p    = PERSONAS.find(p => p.key === k);
        const name = (config && config[p.configKey]) || p.name;
        return { label: `${name} — ${p.role}`, value: k };
      });
      const toAdd = await askMulti(rl, 'Add optional personas? (Enter to skip)', optionalChoices);
      preSelectedKeys = [...new Set([...preSelectedKeys, ...toAdd])];
    }

    // Allow user to remove default personas
    if (preSelectedKeys.length > 1) {
      const keepChoices = preSelectedKeys.map(k => {
        const p    = PERSONAS.find(p => p.key === k);
        const name = (config && config[p.configKey]) || p.name;
        return { label: `${name} — ${p.role}`, value: k };
      });
      log.line('');
      const toRemove = await askMulti(rl, 'Remove any personas? (Enter to keep all)', keepChoices);
      if (toRemove.length > 0) {
        preSelectedKeys = preSelectedKeys.filter(k => !toRemove.includes(k));
      }
    }

  } else {
    // ── Custom meeting ───────────────────────────────────────────────────────
    log.section('Meeting details');
    topic = await ask(rl, 'Meeting goal or topic', '');
    if (!topic.trim()) {
      log.error('A meeting topic is required.');
      process.exit(1);
    }
  }

  // ── Persona selection for custom meetings ──────────────────────────────────
  let selectedKeys = preSelectedKeys;

  if (meetingMode === 'custom') {
    const personaChoices = PERSONAS.map(p => {
      const resolvedName = (config && config[p.configKey]) || p.name;
      return {
        label: `${resolvedName.padEnd(8)} (${p.role.padEnd(20)}) — ${p.brings.slice(0, 2).join(', ')}`,
        value: p.key,
      };
    });

    selectedKeys = await askMulti(rl, 'Who is joining this meeting?', personaChoices);
    if (selectedKeys.length === 0) {
      log.warn('No personas selected. A meeting needs at least one persona.');
      process.exit(1);
    }
  } else if (selectedKeys.length === 0) {
    log.warn('No personas remain after removal. Keeping the default set.');
    selectedKeys = [...template.defaultPersonas];
  }

  // ── Save preferences ───────────────────────────────────────────────────────
  let saveToDocsPath = false;
  if (template) {
    saveToDocsPath = await confirm(
      rl,
      `Save meeting notes to ${docsPath}/meetings/ as well?`,
      true
    );
  }

  // ── Generate ───────────────────────────────────────────────────────────────
  const date     = new Date().toISOString().slice(0, 10);
  const slug     = slugify(topic);
  const filename = `${date}-${slug}.md`;

  // Always write to _superml/meetings/ (history)
  const historyDir  = path.join(projectRoot, '_superml', 'meetings');
  const historyPath = path.join(historyDir, filename);
  const historyRel  = path.join('_superml', 'meetings', filename);
  fs.mkdirSync(historyDir, { recursive: true });

  // Optionally write to docsPath/meetings/
  let docsSavePath = null;
  let docsSaveRel  = null;
  if (saveToDocsPath && template) {
    const tmplPath = template.output.pathTemplate
      .replace('{docsPath}', docsPath)
      .replace('{slug}',     slug);
    docsSavePath = path.join(projectRoot, tmplPath);
    docsSaveRel  = tmplPath;
    fs.mkdirSync(path.dirname(docsSavePath), { recursive: true });
  }

  const selectedPersonas = selectedKeys.map(k => {
    const p            = PERSONAS.find(p => p.key === k);
    const resolvedName = (config && config[p.configKey]) || p.name;
    return { ...p, resolvedName };
  });

  const content = buildMeetingDoc({
    topic,
    date,
    projectName,
    docsPath,
    personas: selectedPersonas,
    useCopilot,
    template,
    savePath: docsSaveRel,
  });

  fs.writeFileSync(historyPath, content, 'utf8');
  if (docsSavePath) {
    fs.writeFileSync(docsSavePath, content, 'utf8');
  }

  // ── Output ─────────────────────────────────────────────────────────────────
  log.line('');
  log.section('Meeting ready');
  log.success(`Context saved:  ${historyRel}`);
  if (docsSaveRel) {
    log.success(`Docs saved:     ${docsSaveRel}`);
  }
  log.line('');

  if (useCopilot) {
    log.line('In GitHub Copilot chat, attach:');
    log.line('');
    log.item(`#file:${historyRel}   ← meeting context`);
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
    log.item(`"Load the meeting context at ${historyRel}"`);
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

function buildMeetingDoc({ topic, date, projectName, docsPath, personas, useCopilot, template, savePath }) {
  const lines = [];

  lines.push(`# Meeting: ${topic}`);
  lines.push('');

  const templateLabel = template ? ` &nbsp;|&nbsp; **Type:** ${template.title}` : '';
  lines.push(`> **Project:** ${projectName} &nbsp;|&nbsp; **Date:** ${date}${templateLabel} &nbsp;|&nbsp; **Personas:** ${personas.map(p => `${p.resolvedName} (${p.role})`).join(', ')}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── Purpose ────────────────────────────────────────────────────────────────
  lines.push('## Purpose');
  lines.push('');
  if (template) {
    lines.push(template.purpose);
  } else {
    lines.push(`This meeting brings together ${personas.length} perspective${personas.length !== 1 ? 's' : ''} to discuss: **${topic}**`);
    lines.push('');
    lines.push('Each persona contributes from their area of ownership. They may agree, challenge, or build on each other\'s points to reach a shared decision.');
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── Agenda (template meetings only) ───────────────────────────────────────
  if (template && template.agenda && template.agenda.length > 0) {
    lines.push('## Agenda');
    lines.push('');
    template.agenda.forEach((item, i) => lines.push(`${i + 1}. ${item}`));
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // ── Personas ───────────────────────────────────────────────────────────────
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

  // ── How to run ─────────────────────────────────────────────────────────────
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

  // ── Discussion starters ───────────────────────────────────────────────────
  lines.push('### Discussion starters');
  lines.push('');

  if (template && template.discussionStarters && template.discussionStarters.length > 0) {
    // Use template starters, substituting persona names
    const nameAt = (idx) => personas[idx] ? personas[idx].resolvedName : (personas[0] ? personas[0].resolvedName : 'Persona');
    template.discussionStarters.forEach(s => {
      const filled = s
        .replace(/{persona0}/g, nameAt(0))
        .replace(/{persona1}/g, nameAt(1))
        .replace(/{persona2}/g, nameAt(2))
        .replace(/{topic}/g,    topic);
      lines.push(`- *${filled}*`);
    });
  } else if (personas.length >= 2) {
    const [first, second] = personas;
    lines.push(`- *"${first.resolvedName}, what are the key requirements or concerns for: ${topic}?"*`);
    lines.push(`- *"${second.resolvedName}, from your perspective — do you agree? What constraints does this create?"*`);
    if (personas.length > 2) {
      lines.push(`- *"${personas[2].resolvedName}, how does this affect your area?"*`);
    }
    lines.push(`- *"Where do ${personas.map(p => p.resolvedName).join(' and ')} see things differently? Help us reach a decision."*`);
  }
  lines.push('');

  // ── Meeting notes section ─────────────────────────────────────────────────
  lines.push('---');
  lines.push('');
  lines.push('## Meeting Notes');
  lines.push('');
  lines.push('> *Use this section to capture key points, decisions, and action items during or after the meeting.*');
  lines.push('');
  lines.push('### Key Points');
  lines.push('');
  lines.push('- ');
  lines.push('');
  lines.push('### Decisions Made');
  lines.push('');
  lines.push('- ');
  lines.push('');
  lines.push('### Action Items');
  lines.push('');
  lines.push('| Action | Owner | Due |');
  lines.push('|--------|-------|-----|');
  lines.push('|        |       |     |');
  lines.push('');

  if (savePath) {
    lines.push('---');
    lines.push('');
    lines.push(`*Also saved to project docs: \`${savePath}\`*`);
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
