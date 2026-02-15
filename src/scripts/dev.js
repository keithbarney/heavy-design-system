#!/usr/bin/env node

/**
 * Dev File Watcher
 *
 * Watches src/ for changes and runs the appropriate build step.
 * Uses fs.watch (no extra dependencies).
 *
 * Usage: node src/scripts/dev.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const SRC = path.resolve(__dirname, '..');

let debounceTimer = null;

function run(cmd, label) {
  console.log(`\n  → ${label}`);
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
    console.log(`  ✓ ${label} done`);
  } catch {
    console.error(`  ✗ ${label} failed`);
  }
}

function onChange(filepath) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const rel = path.relative(SRC, filepath);

    if (rel.startsWith('styles')) {
      run('npm run build:styles', 'build:styles');
    } else if (rel.startsWith('scripts/build-pages')) {
      run('npm run build:pages', 'build:pages');
    } else if (rel.startsWith('scripts/build-tokens')) {
      run('npm run build:tokens', 'build:tokens');
    } else if (rel.startsWith('scripts/build-themes')) {
      run('npm run build:themes', 'build:themes');
    } else if (rel.startsWith('themes')) {
      run('npm run build:themes', 'build:themes');
    }
  }, 200);
}

// Watch directories recursively
const watchDirs = ['styles', 'scripts', 'themes'];

console.log('Watching src/ for changes...\n');

for (const dir of watchDirs) {
  const fullPath = path.join(SRC, dir);
  if (!fs.existsSync(fullPath)) continue;

  fs.watch(fullPath, { recursive: true }, (event, filename) => {
    if (!filename) return;
    onChange(path.join(fullPath, filename));
  });

  console.log(`  watching src/${dir}/`);
}
