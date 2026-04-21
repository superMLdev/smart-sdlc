#!/usr/bin/env node
'use strict';

const [, , command, ...args] = process.argv;

const commands = {
  init:    () => require('../lib/commands/init').run(),
  persona: () => require('../lib/commands/persona').run(),
  update:  () => require('../lib/commands/update').run(),
  list:    () => require('../lib/commands/list').run(),
  meeting: () => require('../lib/commands/meeting').run(),
  clean:   () => require('../lib/commands/clean').run(),
};

if (!command || command === '--help' || command === '-h' || command === 'help') {
  printHelp();
  process.exit(0);
}

if (command === '--version' || command === '-v' || command === 'version') {
  const { version } = require('../package.json');
  console.log(`agentic-sdlc v${version}`);
  process.exit(0);
}

if (!commands[command]) {
  console.error(`\n  Unknown command: ${command}\n`);
  printHelp();
  process.exit(1);
}

commands[command]().catch(err => {
  const { log } = require('../lib/utils/logger');
  log.error(err.message);
  process.exit(1);
});

function printHelp() {
  const { log } = require('../lib/utils/logger');
  log.banner();
  log.line('Usage:  npx @supermldev/agentic-sdlc <command>');
  log.line('');
  log.line('Commands:');
  log.item('init     — Set up Agentic SDLC project for your team');
  log.item('persona  — Configure your personal workspace and role');
  log.item('update   — Update skills to the latest installed version');
  log.item('list     — List all available skills and agents');
  log.item('meeting  — Set up a multi-persona meeting context');
  log.item('clean    — Remove generated Agentic SDLC files from project');
  log.line('');
  log.line('Examples:');
  log.item('npx @supermldev/agentic-sdlc init');
  log.item('npx @supermldev/agentic-sdlc persona');
  log.item('npx @supermldev/agentic-sdlc list');
  log.item('npx @supermldev/agentic-sdlc meeting');
  log.item('npx @supermldev/agentic-sdlc clean');
  log.line('');
}
