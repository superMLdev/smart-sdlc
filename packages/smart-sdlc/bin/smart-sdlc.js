#!/usr/bin/env node
// smart-sdlc — thin alias for @supermldev/smart-sdlc
// Allows: npx smart-sdlc init, npx smart-sdlc persona, etc.
const { spawnSync } = require('child_process');
const path = require('path');

const bin = path.resolve(__dirname, '../node_modules/@supermldev/smart-sdlc/bin/superml.js');
const result = spawnSync(process.execPath, [bin, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(result.status ?? 0);
