'use strict';

const { input, select, checkbox, confirm: inquirerConfirm } = require('@inquirer/prompts');

/**
 * createRL is kept for backwards compatibility — Inquirer manages its own I/O.
 * Returns a no-op object with a close() method so callers that do `rl.close()` still work.
 */
function createRL() {
  return { close: () => {} };
}

/**
 * Ask a free-text question, returning the answer (or defaultValue if empty).
 * The `rl` parameter is ignored — kept for API compatibility.
 */
async function ask(_rl, question, defaultValue = '') {
  return input({ message: question, default: defaultValue });
}

/**
 * Present an interactive list (arrow-key navigation) and return the chosen value.
 *
 * choices: [{ label: string, value: string }]
 * The `rl` parameter is ignored — kept for API compatibility.
 */
async function askChoice(_rl, question, choices, defaultIndex = 0) {
  return select({
    message: question,
    choices: choices.map(ch => ({ name: ch.label, value: ch.value })),
    default: choices[defaultIndex] ? choices[defaultIndex].value : undefined,
  });
}

/**
 * Present an interactive checkbox list (space to toggle) and return an array of chosen values.
 *
 * choices: [{ label: string, value: string }]
 * The `rl` parameter is ignored — kept for API compatibility.
 */
async function askMulti(_rl, question, choices) {
  const selected = await checkbox({
    message: question,
    choices: choices.map(ch => ({ name: ch.label, value: ch.value })),
    instructions: '  (Space to select, Enter to confirm)',
  });
  return selected;
}

/**
 * Yes/no confirmation.
 * The `rl` parameter is ignored — kept for API compatibility.
 */
async function confirm(_rl, question, defaultYes = true) {
  return inquirerConfirm({ message: question, default: defaultYes });
}

module.exports = { createRL, ask, askChoice, askMulti, confirm };
