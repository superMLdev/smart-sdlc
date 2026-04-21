'use strict';

// ANSI escape codes — only applied when writing to a real terminal
const USE_COLOR = process.stdout.isTTY !== false;

const c = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  bgreen:  '\x1b[92m',
  blue:    '\x1b[34m',
  bblue:   '\x1b[94m',
  yellow:  '\x1b[33m',
  byellow: '\x1b[93m',
  cyan:    '\x1b[36m',
  bcyan:   '\x1b[96m',
  magenta: '\x1b[35m',
  red:     '\x1b[31m',
  gray:    '\x1b[90m',
  white:   '\x1b[37m',
  bwhite:  '\x1b[97m',
};

const col = (codes, text) => USE_COLOR ? `${codes}${text}${c.reset}` : text;

const W = 58; // banner inner width

const log = {
  banner() {
    const top    = '╔' + '═'.repeat(W) + '╗';
    const bot    = '╚' + '═'.repeat(W) + '╝';
    const blank  = '║' + ' '.repeat(W) + '║';
    const mid1   = padLine('  Agentic SDLC  ·  AI-Driven Development', W);
    const mid2   = padLine('  superml.dev  &  superml.org  |  crazyaiml', W);
    const mid3   = padLine('  v' + safeVersion(), W);

    console.log('');
    console.log(col(c.bold + c.bcyan, '  ' + top));
    console.log(col(c.bold + c.bcyan, '  ' + blank));
    console.log('  ' + col(c.bold + c.bcyan, '║') + col(c.bold + c.bwhite, mid1) + col(c.bold + c.bcyan, '║'));
    console.log('  ' + col(c.bold + c.bcyan, '║') + col(c.dim  + c.cyan,   mid2) + col(c.bold + c.bcyan, '║'));
    console.log('  ' + col(c.bold + c.bcyan, '║') + col(c.dim  + c.gray,   mid3) + col(c.bold + c.bcyan, '║'));
    console.log(col(c.bold + c.bcyan, '  ' + blank));
    console.log(col(c.bold + c.bcyan, '  ' + bot));
    console.log('');
  },

  section(title) {
    console.log('');
    console.log(`  ${col(c.bold + c.bcyan, '▸')}  ${col(c.bold + c.bwhite, title)}`);
    console.log(`  ${col(c.gray, '  ' + '─'.repeat(50))}`);
  },

  step(n, total, title) {
    const tag = col(c.bold + c.bcyan, `[${n}/${total}]`);
    console.log('');
    console.log(`  ${tag}  ${col(c.bold + c.bwhite, title)}`);
    console.log(`  ${col(c.gray, '      ' + '─'.repeat(46))}`);
  },

  success(text) { console.log(`  ${col(c.bold + c.bgreen,  '✔')}  ${text}`); },
  info(text)    { console.log(`  ${col(c.bold + c.bblue,   'ℹ')}  ${text}`); },
  warn(text)    { console.log(`  ${col(c.bold + c.byellow, '⚠')}  ${text}`); },
  error(text)   { console.log(`  ${col(c.bold + c.red,     '✖')}  ${text}`); },
  item(text)    { console.log(`      ${col(c.cyan, '·')}  ${text}`); },
  done(text)    { console.log(`  ${col(c.bold + c.bgreen, '●')}  ${col(c.bold + c.bwhite, text)}`); },
  line(text)    { console.log(text ? `  ${text}` : ''); },
  divider()     { console.log(`  ${col(c.gray, '  ' + '─'.repeat(50))}`); },

  summary(rows) {
    // rows: [{ label, value, ok? }]
    console.log('');
    const labelW = Math.max(...rows.map(r => r.label.length)) + 2;
    for (const row of rows) {
      const lbl = col(c.gray, (row.label + ':').padEnd(labelW + 1));
      const val = row.ok === false
        ? col(c.byellow, row.value)
        : row.ok === true
          ? col(c.bgreen, row.value)
          : col(c.bwhite, row.value);
      console.log(`      ${lbl} ${val}`);
    }
    console.log('');
  },

  badge(label, value, color) {
    const lc = color || c.bcyan;
    console.log(`  ${col(c.bold + lc, `[ ${label} ]`)}  ${col(c.bwhite, value)}`);
  },
};

function padLine(text, width) {
  if (text.length >= width) return text;
  return text + ' '.repeat(width - text.length);
}

function safeVersion() {
  try { return require('../../package.json').version; } catch { return ''; }
}

module.exports = { log, col, c };
