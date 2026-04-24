'use strict';

const path = require('path');
const fs   = require('fs');

/**
 * Append a structured entry to _superml/audit.log.
 *
 * @param {string} projectRoot  Absolute path to the project root.
 * @param {object} event
 * @param {string} event.type   Event type: 'project-init' | 'persona-install' | 'persona-exit' | 'phase-reenter'
 * @param {string} [event.persona]  Persona key (e.g. 'product', 'architect')
 * @param {string} [event.phase]    Phase key or label
 * @param {string} [event.user]     User name from persona.yml
 * @param {string} [event.notes]    Free-text notes
 */
function logEvent(projectRoot, event) {
  try {
    const supermlDir = path.join(projectRoot, '_superml');
    if (!fs.existsSync(supermlDir)) return;   // project not initialised yet — skip silently

    const ts      = new Date().toISOString();
    const persona = event.persona || '-';
    const phase   = event.phase   || '-';
    const user    = event.user    || '-';
    const notes   = event.notes   || '';
    const line    = `${ts} | ${event.type.padEnd(16)} | persona:${persona.padEnd(14)} | phase:${phase.padEnd(16)} | user:${user.padEnd(20)} | ${notes}\n`;

    fs.appendFileSync(path.join(supermlDir, 'audit.log'), line, 'utf8');
  } catch {
    // Audit logging is best-effort — never crash the CLI
  }
}

module.exports = { logEvent };
