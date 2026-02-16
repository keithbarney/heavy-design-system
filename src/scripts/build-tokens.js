#!/usr/bin/env node

/**
 * Build Token JSON Files → CSS
 *
 * Generates CSS custom properties from token files.
 * Supports project overrides via alias-overrides.json.
 *
 * Usage: npm run build:tokens
 *        npm run build:tokens -- --project-overrides=/path/to/alias-overrides.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHARED_TOKENS_DIR = path.resolve(process.env.HOME, 'Projects/tokens');
const BASE_TOKENS_DIR = path.join(SHARED_TOKENS_DIR, 'base');
const ALIAS_TOKENS_DIR = path.join(SHARED_TOKENS_DIR, 'alias');
const DIST_DIR = path.resolve(__dirname, '../../dist');

// Parse command line args for project overrides
const args = process.argv.slice(2);
const overridesArg = args.find(arg => arg.startsWith('--project-overrides='));
const projectOverridesPath = overridesArg ? overridesArg.split('=')[1] : null;

function readTokenFile(dir, filename) {
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (key.startsWith('$')) continue;
    if (source[key] && typeof source[key] === 'object' && !('$value' in source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function flattenTokens(obj, prefix = '') {
  const result = [];

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;

    const tokenPath = prefix ? `${prefix}-${key}` : key;

    if (value && typeof value === 'object' && '$type' in value) {
      result.push({ name: tokenPath, token: value });
    } else if (value && typeof value === 'object') {
      result.push(...flattenTokens(value, tokenPath));
    }
  }

  return result;
}

function buildRefLookup(colorsTokens, scaleTokens) {
  const lookup = {};
  if (colorsTokens) {
    for (const [family, shades] of Object.entries(colorsTokens)) {
      if (family.startsWith('$')) continue;
      for (const [stop, token] of Object.entries(shades)) {
        if (stop.startsWith('$')) continue;
        lookup[`${family}.${stop}`] = token.$value;
      }
    }
  }
  if (scaleTokens) {
    for (const [group, values] of Object.entries(scaleTokens)) {
      if (group.startsWith('$')) continue;
      for (const [name, token] of Object.entries(values)) {
        if (name.startsWith('$')) continue;
        lookup[`${group}.${name}`] = token.$value;
      }
    }
  }
  return lookup;
}

function resolveRef(value, lookup) {
  if (typeof value === 'string') {
    const match = value.match(/^\{(.+)\}$/);
    if (match && match[1] in lookup) return lookup[match[1]];
  }
  return value;
}

function getTokenValue(token, refLookup) {
  const value = refLookup ? resolveRef(token.$value, refLookup) : token.$value;
  const type = token.$type;

  // Handle color tokens
  if (type === 'color') {
    if (typeof value === 'object') {
      if (value.hex) return value.hex;
      if (value.components) {
        const [r, g, b] = value.components.map(c => Math.round(c * 255));
        const a = value.alpha ?? 1;
        if (a < 1) return `rgba(${r}, ${g}, ${b}, ${a})`;
        const toHex = n => n.toString(16).padStart(2, '0').toUpperCase();
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      }
    }
    return value;
  }

  // Handle number tokens (spacing, radius, font-size)
  if (type === 'number') {
    return `${value}px`;
  }

  // Handle string tokens (font-family)
  if (type === 'string') {
    return value;
  }

  return value;
}

function generateCSS(lightTokens, darkTokens, overrides) {
  const lines = [
    '/* Auto-generated from token files - DO NOT EDIT */',
    '/* Run `npm run build` to regenerate */',
    ''
  ];

  const colorsTokens = readTokenFile(BASE_TOKENS_DIR, 'colors.tokens.json');
  const scaleTokens = readTokenFile(BASE_TOKENS_DIR, 'scale.tokens.json');
  const typographyAliasTokens = readTokenFile(ALIAS_TOKENS_DIR, 'typography.tokens.json');
  const spacingAliasTokens = readTokenFile(ALIAS_TOKENS_DIR, 'spacing.tokens.json');
  const radiusAliasTokens = readTokenFile(ALIAS_TOKENS_DIR, 'radius.tokens.json');

  const refLookup = buildRefLookup(colorsTokens, scaleTokens);

  const finalLightTokens = overrides ? deepMerge(lightTokens, overrides) : lightTokens;
  const finalDarkTokens = overrides ? deepMerge(darkTokens, overrides) : darkTokens;
  const lightFlat = flattenTokens(finalLightTokens);
  const darkFlat = flattenTokens(finalDarkTokens);

  lines.push(':root {');

  // Base colors
  if (colorsTokens) {
    lines.push('  /* Colors */');
    for (const [colorName, shades] of Object.entries(colorsTokens)) {
      if (colorName.startsWith('$')) continue;
      for (const [shade, token] of Object.entries(shades)) {
        if (shade.startsWith('$')) continue;
        const value = getTokenValue(token);
        lines.push(`  --color-${colorName}-${shade}: ${value};`);
      }
    }
    lines.push('');
  }

  // Scale tokens
  if (scaleTokens) {
    if (scaleTokens.ui) {
      lines.push('  /* Space Scale */');
      for (const [name, token] of Object.entries(scaleTokens.ui)) {
        if (name.startsWith('$')) continue;
        const value = getTokenValue(token);
        lines.push(`  --space-${name}: ${value};`);
      }
      lines.push('');
    }
    if (scaleTokens.type) {
      lines.push('  /* Type Scale */');
      for (const [name, token] of Object.entries(scaleTokens.type)) {
        if (name.startsWith('$')) continue;
        const value = getTokenValue(token);
        lines.push(`  --type-${name}: ${value};`);
      }
      lines.push('');
    }
  }

  // Alias typography
  if (typographyAliasTokens) {
    if (typographyAliasTokens['font-size']) {
      lines.push('  /* Font Sizes */');
      for (const [name, token] of Object.entries(typographyAliasTokens['font-size'])) {
        if (name.startsWith('$')) continue;
        const value = getTokenValue(token);
        lines.push(`  --font-size-${name}: ${value};`);
      }
      lines.push('');
    }
  }

  // Alias spacing
  if (spacingAliasTokens) {
    if (spacingAliasTokens.space) {
      lines.push('  /* Spacing Aliases */');
      for (const [name, token] of Object.entries(spacingAliasTokens.space)) {
        if (name.startsWith('$')) continue;
        const value = getTokenValue(token, refLookup);
        lines.push(`  --gap-${name}: ${value};`);
      }
      lines.push('');
    }
    if (spacingAliasTokens.screen) {
      lines.push('  /* Screen Spacing */');
      for (const [name, token] of Object.entries(spacingAliasTokens.screen)) {
        if (name.startsWith('$')) continue;
        const value = getTokenValue(token, refLookup);
        lines.push(`  --screen-${name}: ${value};`);
      }
      lines.push('');
    }
  }

  // Alias radius
  if (radiusAliasTokens && radiusAliasTokens.container) {
    lines.push('  /* Radius */');
    for (const [name, token] of Object.entries(radiusAliasTokens.container)) {
      if (name.startsWith('$')) continue;
      const value = getTokenValue(token, refLookup);
      lines.push(`  --radius-${name}: ${value};`);
    }
    lines.push('');
  }

  // UI tokens (light mode default)
  lines.push('  /* UI Colors (light) */');
  for (const { name, token } of lightFlat) {
    const value = getTokenValue(token, refLookup);
    lines.push(`  --${name}: ${value};`);
  }

  lines.push('}');
  lines.push('');

  // Dark mode
  lines.push('[data-theme="dark"] {');
  lines.push('  /* UI Colors (dark) */');
  for (const { name, token } of darkFlat) {
    const value = getTokenValue(token, refLookup);
    lines.push(`  --${name}: ${value};`);
  }
  lines.push('}');

  return lines.join('\n');
}

function main() {
  console.log('Building tokens from JSON files...\n');

  try {
    // Ensure output directory exists
    if (!fs.existsSync(DIST_DIR)) {
      fs.mkdirSync(DIST_DIR, { recursive: true });
    }

    // Read token files
    const lightTokens = readTokenFile(ALIAS_TOKENS_DIR, 'ui.light.tokens.json') || {};
    const darkTokens = readTokenFile(ALIAS_TOKENS_DIR, 'ui.dark.tokens.json') || {};

    // Read project overrides if specified
    let overrides = null;
    if (projectOverridesPath && fs.existsSync(projectOverridesPath)) {
      overrides = JSON.parse(fs.readFileSync(projectOverridesPath, 'utf-8'));
      console.log(`✓ Loaded project overrides from: ${projectOverridesPath}`);
    }

    // Generate CSS
    const css = generateCSS(lightTokens, darkTokens, overrides);
    const cssPath = path.join(DIST_DIR, 'tokens.css');
    fs.writeFileSync(cssPath, css);
    console.log(`✓ Generated: ${path.relative(process.cwd(), cssPath)}`);

    // Count tokens
    const lightCount = flattenTokens(lightTokens).length;
    const darkCount = flattenTokens(darkTokens).length;
    console.log(`\n  UI tokens: ${lightCount} (light) / ${darkCount} (dark)`);

  } catch (error) {
    console.error('Error building tokens:', error.message);
    process.exit(1);
  }
}

main();
