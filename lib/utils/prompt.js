'use strict';

const readline = require('readline');

/**
 * Create a readline interface. Caller must call rl.close() when done.
 */
function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: !!process.stdin.isTTY,
  });
}

/**
 * Ask a free-text question, returning the answer (or defaultValue if empty).
 */
async function ask(rl, question, defaultValue = '') {
  const hint = defaultValue ? ` [${defaultValue}]` : '';
  return new Promise(resolve => {
    rl.question(`  ${question}${hint}: `, answer => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Present a numbered list and return the value of the chosen item.
 *
 * choices: [{ label: string, value: string }]
 */
async function askChoice(rl, question, choices, defaultIndex = 0) {
  console.log(`\n  ${question}`);
  choices.forEach((ch, i) => {
    const marker = i === defaultIndex ? ' (default)' : '';
    console.log(`    ${i + 1}. ${ch.label}${marker}`);
  });

  const answer = await ask(rl, 'Enter number', String(defaultIndex + 1));
  const idx = parseInt(answer, 10) - 1;
  const safeIdx = Math.max(0, Math.min(idx, choices.length - 1));
  return choices[safeIdx].value;
}

/**
 * Present a numbered list and return an array of chosen values.
 * User enters comma-separated numbers, e.g. "1,3" or "2" or "" to skip.
 *
 * choices: [{ label: string, value: string }]
 */
async function askMulti(rl, question, choices) {
  console.log(`\n  ${question}`);
  console.log('  (Enter comma-separated numbers, or press Enter to skip)\n');
  choices.forEach((ch, i) => console.log(`    ${i + 1}. ${ch.label}`));

  const answer = await ask(rl, 'Enter numbers', '');
  if (!answer) return [];

  return answer
    .split(',')
    .map(s => parseInt(s.trim(), 10) - 1)
    .filter(i => i >= 0 && i < choices.length)
    .map(i => choices[i].value);
}

/**
 * Yes/no confirmation.
 */
async function confirm(rl, question, defaultYes = true) {
  const hint = defaultYes ? 'Y/n' : 'y/N';
  const answer = await ask(rl, `${question} (${hint})`, defaultYes ? 'y' : 'n');
  return answer.toLowerCase().startsWith('y');
}

module.exports = { createRL, ask, askChoice, askMulti, confirm };
