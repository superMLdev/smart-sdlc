'use strict';

// ANSI escape codes — only applied when writing to a real terminal
const USE_COLOR = process.stdout.isTTY !== false;

const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  blue:   '\x1b[34m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
  white:  '\x1b[37m',
};

const col = (codes, text) => USE_COLOR ? `${codes}${text}${c.reset}` : text;

const log = {
  banner() {
    console.log('');
    console.log(col(c.bold + c.cyan, '  ┌──────────────────────────────────────────────────────┐'));
    console.log(col(c.bold + c.cyan, '  │  Agentic SDLC — by Superml.dev & superml.org          │'));
    console.log(col(c.bold + c.cyan, '  │  built by crazyaiml                                   │'));
    console.log(col(c.bold + c.cyan, '  └──────────────────────────────────────────────────────┘'));
    console.log('');
  },
  section(title) {
    console.log('');
    console.log(`  ${col(c.bold + c.white, title)}`);
    console.log(`  ${col(c.gray, '─'.repeat(48))}`);
  },
  success(text) { console.log(`  ${col(c.green, '✓')}  ${text}`); },
  info(text)    { console.log(`  ${col(c.blue,  'ℹ')}  ${text}`); },
  warn(text)    { console.log(`  ${col(c.yellow,'⚠')}  ${text}`); },
  error(text)   { console.log(`  ${col(c.red,   '✗')}  ${text}`); },
  item(text)    { console.log(`     ${col(c.gray,'•')}  ${text}`); },
  line(text)    { console.log(text ? `  ${text}` : ''); },
  divider()     { console.log(`  ${col(c.gray, '─'.repeat(48))}`); },
};

module.exports = { log, col, c };
