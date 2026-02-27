#!/usr/bin/env node

/**
 * Build Theme CSS
 *
 * Concatenates theme variable and component files into distributable CSS.
 *
 * Usage: npm run build:themes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const THEMES_DIR = path.resolve(__dirname, '../themes');
const DIST_DIR = path.resolve(__dirname, '../../dist');
const TEMPLATES_THEME = path.resolve(__dirname, '../../../keith-templates/figma-plugin/heavy-theme.css');

function buildTheme(themeName) {
  const themeDir = path.join(THEMES_DIR, themeName);
  const variablesPath = path.join(themeDir, 'variables.css');
  const componentsPath = path.join(themeDir, 'components.css');

  if (!fs.existsSync(variablesPath) || !fs.existsSync(componentsPath)) {
    console.error(`Missing files for theme: ${themeName}`);
    process.exit(1);
  }

  const variables = fs.readFileSync(variablesPath, 'utf-8');
  const components = fs.readFileSync(componentsPath, 'utf-8');

  return variables + components;
}

function main() {
  console.log('Building themes...\n');

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Build heavy-plugin theme
  const heavyTheme = buildTheme('heavy-plugin');
  const outputPath = path.join(DIST_DIR, 'heavy-theme.css');
  fs.writeFileSync(outputPath, heavyTheme);
  console.log(`✓ Generated: ${path.relative(process.cwd(), outputPath)}`);

  // Auto-distribute to keith-templates (all plugins symlink there)
  fs.copyFileSync(outputPath, TEMPLATES_THEME);
  console.log(`✓ Copied to: ${path.relative(process.cwd(), TEMPLATES_THEME)}`);
}

main();
