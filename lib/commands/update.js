'use strict';

const path    = require('path');
const { log } = require('../utils/logger');
const { createRL, confirm } = require('../utils/prompt');
const { copyRecursive, dirExists } = require('../utils/fs-utils');

const PACKAGE_ROOT = path.join(__dirname, '../../');
const SKILLS_SRC   = path.join(PACKAGE_ROOT, 'skills');

async function run() {
  const projectRoot = process.cwd();
  const skillsDest  = path.join(projectRoot, '_superml', 'skills');

  log.banner();

  if (!dirExists(SKILLS_SRC)) {
    log.error('Could not find skills/ in the SuperML package.');
    process.exit(1);
  }

  if (!dirExists(skillsDest)) {
    log.warn('No _superml/skills/ folder found in the current directory.');
    log.info('Run: npx @supermldev/agentic-sdlc init');
    process.exit(0);
  }

  // Show which package version we're updating from
  let version = 'unknown';
  try {
    const pkg = require('../../package.json');
    version = pkg.version;
  } catch {}

  log.info(`Updating skills from agentic-sdlc@${version}`);
  log.warn('Any local changes inside _superml/skills/ will be overwritten.');

  const rl = createRL();
  try {
    const ok = await confirm(rl, 'Continue?', false);
    if (!ok) {
      log.line('Update cancelled.');
      return;
    }

    const fileCount = copyRecursive(SKILLS_SRC, skillsDest);
    log.success(`Skills updated  (${fileCount} files written)`);
    log.line('');
    log.info('To see what changed:  git diff _superml/skills/');
    log.line('');
  } finally {
    rl.close();
  }
}

module.exports = { run };
