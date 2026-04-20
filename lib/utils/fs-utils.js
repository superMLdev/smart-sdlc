'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * Recursively copy src directory/file to dest.
 * Returns the count of files copied.
 */
function copyRecursive(src, dest) {
  let count = 0;
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      count += copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    count = 1;
  }

  return count;
}

/**
 * Add a line to .gitignore if it isn't already there.
 * Creates .gitignore if it doesn't exist.
 * Returns true if the entry was added, false if it was already present.
 */
function addGitignoreEntry(projectRoot, entry) {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  let content = '';

  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8');
    // Exact line match
    const lines = content.split('\n').map(l => l.trim());
    if (lines.includes(entry.trim())) return false;
    if (!content.endsWith('\n')) content += '\n';
  }

  fs.writeFileSync(gitignorePath, content + entry + '\n');
  return true;
}

/**
 * Check if the current working directory is inside a git repository.
 */
function isGitRepo(dir) {
  let current = dir;
  while (true) {
    if (fs.existsSync(path.join(current, '.git'))) return true;
    const parent = path.dirname(current);
    if (parent === current) return false;
    current = parent;
  }
}

function dirExists(p)  { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function fileExists(p) { try { return fs.statSync(p).isFile();      } catch { return false; } }

module.exports = { copyRecursive, addGitignoreEntry, isGitRepo, dirExists, fileExists };
