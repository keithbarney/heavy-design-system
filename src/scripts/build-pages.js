#!/usr/bin/env node

/**
 * Build HTML Pages from Token JSON
 *
 * Generates style guide pages from template literals
 * and token JSON data. Replaces Pug templates.
 *
 * Usage: npm run build:pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPageBuilder } from '../../../style-guide/src/node/page-builder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../../dist');
const TOKENS_DIR = path.resolve(process.env.HOME, 'Projects/design/tokens');

// ===== Pages Registry =====

const PAGES = [
  { file: 'index.html', id: 'colors', label: 'Colors', group: 'Foundations' },
  { file: 'typography.html', id: 'typography', label: 'Typography', group: 'Foundations' },
  { file: 'spacing.html', id: 'spacing', label: 'Spacing', group: 'Foundations' },
  { file: 'radius.html', id: 'radius', label: 'Radius', group: 'Foundations' },
  { file: 'scale.html', id: 'scale', label: 'Scale', group: 'Foundations' },
  { file: 'layout.html', id: 'layout', label: 'Layout', group: 'Foundations' },
  { file: 'animation.html', id: 'animation', label: 'Animation', group: 'Foundations' },
  { file: 'breadcrumbs.html', id: 'breadcrumbs', label: 'Breadcrumbs', group: 'Components' },
  { file: 'button.html', id: 'button', label: 'Button', group: 'Components' },
  { file: 'card.html', id: 'card', label: 'Card', group: 'Components' },
  { file: 'button-group.html', id: 'button-group', label: 'Button Group', group: 'Components' },
  { file: 'button-icon.html', id: 'button-icon', label: 'Button Icon', group: 'Components' },
  { file: 'chips.html', id: 'chips', label: 'Chips', group: 'Components' },
  { file: 'data-display.html', id: 'data-display', label: 'Data Display', group: 'Components' },
  { file: 'feedback.html', id: 'feedback', label: 'Feedback', group: 'Components' },
  { file: 'file-upload.html', id: 'file-upload', label: 'File Upload', group: 'Components' },
  { file: 'inputs.html', id: 'inputs', label: 'Inputs', group: 'Components' },
  { file: 'modal.html', id: 'modal', label: 'Modal', group: 'Components' },
  { file: 'nav-links.html', id: 'nav-links', label: 'Nav Links', group: 'Components' },
  { file: 'search.html', id: 'search', label: 'Search', group: 'Components' },
  { file: 'selects.html', id: 'selects', label: 'Selects', group: 'Components' },
  { file: 'tabs.html', id: 'tabs', label: 'Tabs', group: 'Components' },
  { file: 'toggles.html', id: 'toggles', label: 'Toggles', group: 'Components' },
  { file: 'form-validation.html', id: 'form-validation', label: 'Form Validation', group: 'Patterns' },
  { file: 'search-pattern.html', id: 'search-pattern', label: 'Search', group: 'Patterns' },
];

// ===== Token Reading =====

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

let _refLookup = {};

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

function resolveRef(value) {
  if (typeof value === 'string') {
    const match = value.match(/^\{(.+)\}$/);
    if (match && match[1] in _refLookup) return _refLookup[match[1]];
  }
  return value;
}

function getRefName(token) {
  const v = token.$value;
  if (typeof v === 'string') {
    const match = v.match(/^\{(.+)\}$/);
    if (match) return match[1];
  }
  return '';
}

function getHex(token) {
  const v = resolveRef(token.$value);
  if (typeof v === 'object' && v.hex) return v.hex;
  if (typeof v === 'object' && v.components) {
    const [r, g, b] = v.components.map(c => Math.round(c * 255));
    const toHex = n => n.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  return v;
}

function getNumericValue(token) {
  const v = resolveRef(token.$value);
  return `${v}px`;
}

function readTokens() {
  const colors = readJSON(path.join(TOKENS_DIR, 'base/colors.tokens.json'));
  const scale = readJSON(path.join(TOKENS_DIR, 'base/scale.tokens.json'));
  const baseTypography = readJSON(path.join(TOKENS_DIR, 'base/typography.tokens.json'));
  const aliasTypography = readJSON(path.join(TOKENS_DIR, 'alias/typography.tokens.json'));

  _refLookup = buildRefLookup(colors, scale);
  const aliasSpacing = readJSON(path.join(TOKENS_DIR, 'alias/spacing.tokens.json'));
  const aliasRadius = readJSON(path.join(TOKENS_DIR, 'alias/radius.tokens.json'));
  const uiLight = readJSON(path.join(TOKENS_DIR, 'alias/light.tokens.json'));
  const uiDark = readJSON(path.join(TOKENS_DIR, 'alias/dark.tokens.json'));

  // Parse colors into families
  const colorFamilies = [];
  if (colors) {
    for (const [name, shades] of Object.entries(colors)) {
      if (name.startsWith('$')) continue;
      const stops = [];
      for (const [stop, token] of Object.entries(shades)) {
        if (stop.startsWith('$')) continue;
        stops.push({ stop, hex: getHex(token) });
      }
      colorFamilies.push({ name, stops });
    }
  }

  // Parse type scale
  const typeScale = [];
  if (scale && scale.type) {
    for (const [name, token] of Object.entries(scale.type)) {
      if (name.startsWith('$')) continue;
      typeScale.push({ token: `type.${name}`, value: getNumericValue(token) });
    }
  }

  // Parse font families from alias typography
  const fontFamilies = [];
  if (aliasTypography && (aliasTypography.family || aliasTypography.Family)) {
    for (const [name, token] of Object.entries(aliasTypography.family || aliasTypography.Family)) {
      if (name.startsWith('$')) continue;
      fontFamilies.push({ token: `font-family.${name}`, value: `"${token.$value}"` });
    }
  }

  const fontWeights = [];
  if (baseTypography && baseTypography['font-weight']) {
    for (const [name, token] of Object.entries(baseTypography['font-weight'])) {
      if (name.startsWith('$')) continue;
      fontWeights.push({ token: `font-weight.${name}`, value: token.$value });
    }
  }

  // Parse alias font sizes
  const fontSizes = [];
  if (aliasTypography && aliasTypography['font-size']) {
    for (const [name, token] of Object.entries(aliasTypography['font-size'])) {
      if (name.startsWith('$')) continue;
      fontSizes.push({ name: `font-size.${name}`, css: `--hds-font-size-${name}`, value: getNumericValue(token), ref: getRefName(token) });
    }
  }

  // Parse alias gaps
  const gaps = [];
  if (aliasSpacing && aliasSpacing.space) {
    for (const [name, token] of Object.entries(aliasSpacing.space)) {
      if (name.startsWith('$')) continue;
      const px = getNumericValue(token).replace('px', '');
      gaps.push({ name: `hds-spacing-${px}`, css: `--hds-spacing-${px}`, value: getNumericValue(token) });
    }
  }

  // Parse alias radius (tokens may be under 'container' key or at root level)
  const radii = [];
  const radiusSource = aliasRadius?.container || aliasRadius;
  if (radiusSource) {
    for (const [name, token] of Object.entries(radiusSource)) {
      if (name.startsWith('$') || typeof token !== 'object' || !token.$value) continue;
      radii.push({ name: `radius.${name}`, css: `--hds-radius-${name}`, value: getNumericValue(token) });
    }
  }

  // Parse UI colors (light + dark)
  const uiColorGroups = [];
  if (uiLight && uiLight.ui) {
    const groupMap = {
      bg: 'Background',
      surface: 'Surface',
      border: 'Border',
      text: 'Text',
      action: 'Action',
      feedback: 'Feedback'
    };
    const groupOrder = ['bg', 'text', 'border'];
    const sortedKeys = Object.keys(uiLight.ui)
      .filter(k => !k.startsWith('$'))
      .sort((a, b) => {
        const ai = groupOrder.indexOf(a);
        const bi = groupOrder.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
    for (const [groupKey, variants] of sortedKeys.map(k => [k, uiLight.ui[k]])) {
      if (groupKey.startsWith('$')) continue;
      const groupName = groupMap[groupKey] || groupKey;
      const tokens = [];
      for (const [variant, token] of Object.entries(variants)) {
        if (variant.startsWith('$')) continue;
        const tokenName = `hds-${groupKey}-${variant}`;
        const cssVar = `--hds-${groupKey}-${variant}`;
        const lightHex = getHex(token);
        const lightRef = getRefName(token);
        const darkToken = uiDark?.ui?.[groupKey]?.[variant];
        const darkHex = darkToken ? getHex(darkToken) : '';
        const darkRef = darkToken ? getRefName(darkToken) : '';
        tokens.push({ name: tokenName, css: cssVar, lightHex, lightRef, darkHex, darkRef });
      }
      uiColorGroups.push({ group: groupName, tokens });
    }
  }

  return {
    colorFamilies, typeScale,
    fontFamilies, fontWeights, fontSizes,
    gaps, radii, uiColorGroups
  };
}

// ===== Page Builder (from heavy-style-guide framework) =====

const VALIDATION_SCRIPT = `<script>
(function() {
  var groups = document.querySelectorAll('[data-validate]');
  groups.forEach(function(group) {
    var rule = group.getAttribute('data-validate');
    var input = group.querySelector('input, select');
    var hint = group.querySelector('.heavy-form-hint');
    if (!input || !hint) return;

    var defaultHint = hint.textContent;

    function validate() {
      var val = input.value.trim();
      var valid = false;
      var msg = '';

      if (rule === 'required') {
        valid = val.length > 0;
        msg = valid ? 'Looks good' : 'This field is required';
      } else if (rule === 'email') {
        if (!val) { reset(); return; }
        valid = /^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$/.test(val);
        msg = valid ? 'Valid email' : 'Please enter a valid email';
      } else if (rule === 'minlength') {
        if (!val) { reset(); return; }
        var min = parseInt(group.getAttribute('data-minlength'));
        valid = val.length >= min;
        msg = valid ? 'Meets requirement' : val.length + ' of ' + min + ' characters';
      } else if (rule === 'select') {
        valid = val !== '';
        msg = valid ? 'Selected' : 'Please select an option';
      }

      input.classList.remove('heavy-form-input--error', 'heavy-form-input--success');
      hint.classList.remove('heavy-form-hint--error', 'heavy-form-hint--success');
      input.classList.add(valid ? 'heavy-form-input--success' : 'heavy-form-input--error');
      hint.classList.add(valid ? 'heavy-form-hint--success' : 'heavy-form-hint--error');
      hint.textContent = msg;
    }

    function reset() {
      input.classList.remove('heavy-form-input--error', 'heavy-form-input--success');
      hint.classList.remove('heavy-form-hint--error', 'heavy-form-hint--success');
      hint.textContent = defaultHint;
    }

    input.addEventListener('blur', validate);
    input.addEventListener('input', function() {
      if (input.classList.contains('heavy-form-input--error') || input.classList.contains('heavy-form-input--success')) {
        validate();
      }
    });
    if (input.tagName === 'SELECT') {
      input.addEventListener('change', validate);
    }
  });
})();
</script>`;

const builder = createPageBuilder({
  brandName: 'Heavy Design System',
  pages: PAGES,
  customScripts: VALIDATION_SCRIPT,
});

const { esc, codeBlock, playground, description, guidelines, componentPage, foundationPage, section, wrapPage, colorTable, spacingTable, radiusTable, typographyTable, baseScaleTable } = builder;

// ===== Content Functions =====

function colorsContent(tokens) {
  const colorSections = tokens.colorFamilies.map(f =>
    section(f.name, colorTable(f.stops.map(s => ({
      tokenName: `base-color-${f.name}-${s.stop}`,
      copyValue: `--base-color-${f.name}-${s.stop}`,
      sampleColor: s.hex,
      value: s.hex,
    }))))
  ).join('\n');

  const uiColorSections = tokens.uiColorGroups.map(group =>
    section(group.group, colorTable(group.tokens.map(t => ({
      tokenName: t.name,
      copyValue: t.css,
      sampleColor: t.lightHex,
      value: `${t.lightRef} / ${t.darkRef}`,
    }))))
  ).join('\n');

  return foundationPage('Colors', 'Alias color tokens for light and dark themes, referencing base color primitives.', [
    uiColorSections,
    colorSections,
  ]);
}

function typographyContent(tokens) {
  const BODY_SAMPLE = 'Design tokens are the visual design atoms of the design system — specifically, they are named entities that store visual design attributes. We use them in place of hard-coded values in order to maintain a scalable and consistent visual system for UI development.';

  const aliasStyles = [
    { title: 'Headings', tokens: [
      { token: 'hds-typography-heading-xl', bases: ['base-font-primary', 'base-font-size-11', 'base-font-weights-bold', 'base-line-heights-xs'] },
      { token: 'hds-typography-heading-1', bases: ['base-font-primary', 'base-font-size-10', 'base-font-weights-bold', 'base-line-heights-sm'] },
      { token: 'hds-typography-heading-2', bases: ['base-font-primary', 'base-font-size-9', 'base-font-weights-bold', 'base-line-heights-sm'] },
      { token: 'hds-typography-heading-3', bases: ['base-font-primary', 'base-font-size-8', 'base-font-weights-bold', 'base-line-heights-sm'] },
      { token: 'hds-typography-heading-4', bases: ['base-font-primary', 'base-font-size-7', 'base-font-weights-bold', 'base-line-heights-sm'] },
      { token: 'hds-typography-heading-5', bases: ['base-font-primary', 'base-font-size-6', 'base-font-weights-bold', 'base-line-heights-sm'] },
      { token: 'hds-typography-heading-6', bases: ['base-font-primary', 'base-font-size-4', 'base-font-weights-bold', 'base-line-heights-sm'] },
    ]},
    { title: 'Body', tokens: [
      { token: 'hds-typography-body', bases: ['base-font-secondary', 'base-font-size-3', 'base-font-weights-regular', 'base-line-heights-default'] },
    ]},
    { title: 'Body Small', tokens: [
      { token: 'hds-typography-body-sm', bases: ['base-font-secondary', 'base-font-size-2', 'base-font-weights-regular', 'base-line-heights-default'] },
    ]},
    { title: 'Body X-Small', tokens: [
      { token: 'hds-typography-body-xs', bases: ['base-font-secondary', 'base-font-size-1', 'base-font-weights-regular', 'base-line-heights-default'] },
    ]},
  ];

  return foundationPage('Typography', 'Alias typography tokens compose weight, size, and line height from base primitives.', [
    section('Font Family', baseScaleTable([
      { tokenName: 'base-font-primary', copyValue: '--base-font-primary', value: '"Inter"', sampleStyle: 'font-family: var(--base-font-primary); font-size: 20px', sampleContent: 'The quick brown fox jumps over the lazy dog' },
      { tokenName: 'base-font-secondary', copyValue: '--base-font-secondary', value: '"JetBrains Mono"', sampleStyle: 'font-family: var(--base-font-secondary); font-size: 20px', sampleContent: 'The quick brown fox jumps over the lazy dog' },
    ])),

    ...aliasStyles.map(group =>
      section(group.title, typographyTable(group.tokens.map(t => ({
        tokenName: t.token,
        copyValue: `--${t.token}`,
        sampleClass: t.token,
        sampleText: t.token.startsWith('hds-typography-body') ? BODY_SAMPLE : 'The quick brown fox',
        subTokens: t.bases.map(b => ({ tokenName: b, copyValue: `--${b}` })),
      }))))
    ),

    section('Font Sizes', baseScaleTable([
      { name: 'hds-font-size-display', value: '48px' },
      { name: 'hds-font-size-h1', value: '40px' },
      { name: 'hds-font-size-h2', value: '32px' },
      { name: 'hds-font-size-h3', value: '28px' },
      { name: 'hds-font-size-h4', value: '24px' },
      { name: 'hds-font-size-h5', value: '20px' },
      { name: 'hds-font-size-body-xlg', value: '20px' },
      { name: 'hds-font-size-body-lg', value: '16px' },
      { name: 'hds-font-size-h6', value: '16px' },
      { name: 'hds-font-size-body', value: '14px' },
      { name: 'hds-font-size-body-sm', value: '12px' },
      { name: 'hds-font-size-body-xs', value: '10px' },
    ].map(s => ({
      tokenName: s.name,
      copyValue: `--${s.name}`,
      value: s.value,
      sampleStyle: `font-size: ${s.value}`,
    })))),

    section('Line Heights', baseScaleTable([
      { name: 'hds-line-height-base', value: '1.5' },
      { name: 'hds-line-height-tight', value: '1.2' },
      { name: 'hds-line-height-loose', value: '1.75' },
    ].map(lh => ({
      tokenName: lh.name,
      copyValue: `--${lh.name}`,
      value: lh.value,
      sampleStyle: `line-height: ${lh.value}; font-size: 16px`,
      sampleContent: 'The quick brown fox jumps over the lazy dog. Design tokens maintain consistency across the system.',
    })))),
  ]);
}

function spacingContent(tokens) {
  return foundationPage('Spacing', 'Semantic spacing aliases built from the base scale.', [
    section('Spacing Aliases', spacingTable(tokens.gaps.map(g => ({
      tokenName: g.name,
      copyValue: g.css,
      value: g.value,
    })))),
  ]);
}

function radiusContent(tokens) {
  const baseRadii = [
    { name: 'hds-radius-sm', value: '4px' },
    { name: 'hds-radius-md', value: '8px' },
    { name: 'hds-radius-lg', value: '12px' },
    { name: 'hds-radius-full', value: '999px' },
  ];

  return foundationPage('Radius', 'Four radius tokens from subtle rounding to fully round.', [
    section('Radius Scale', radiusTable(baseRadii.map(r => ({
      tokenName: r.name,
      copyValue: `--${r.name}`,
      value: r.value,
    })))),
  ]);
}

function scaleContent() {
  const scaleValues = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 96, 128];

  return foundationPage('Scale', 'A shared base scale used by spacing, typography, and layout tokens. Values follow a harmonious structure. Use this scale to create space between objects in product layouts.', [
    section('Base', spacingTable(scaleValues.map(px => ({
      tokenName: `base-scale-${px}`,
      copyValue: `--base-scale-${px}`,
      value: `${px}px`,
    })))),
  ]);
}

function layoutContent() {
  const gridBoxes = Array.from({ length: 12 }, (_, i) =>
    `                    <div class="style-guide-demo-box">${i + 1}</div>`
  ).join('\n');

  const layoutRows = (data) => data.map(([a, b, c]) =>
    `                <tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`
  ).join('\n');

  const gridRows = layoutRows([
    ['.heavy-grid', 'Base grid container', 'gap: var(--hds-grid-gutter)'],
    ['.heavy-grid--2', '2 equal columns', 'repeat(2, 1fr)'],
    ['.heavy-grid--3', '3 equal columns', 'repeat(3, 1fr)'],
    ['.heavy-grid--4', '4 equal columns', 'repeat(4, 1fr)'],
    ['.heavy-grid--6', '6 equal columns', 'repeat(6, 1fr)'],
    ['.heavy-grid--10', '10 equal columns', 'repeat(10, 1fr)'],
    ['.heavy-grid--12', '12 equal columns', 'repeat(12, 1fr)'],
    ['.heavy-grid--auto', 'Auto-fit, 300px min', 'minmax(300px, 1fr)'],
    ['.heavy-grid--auto-sm', 'Auto-fit, 200px min', 'minmax(200px, 1fr)'],
    ['.heavy-grid--auto-lg', 'Auto-fit, 400px min', 'minmax(400px, 1fr)'],
    ['.heavy-col-span-{N}', 'Span N columns', 'grid-column: span N'],
    ['.heavy-col-span-full', 'Span all columns', 'grid-column: 1 / -1'],
    ['.heavy-gap-1 \u2013 .heavy-gap-6', 'Gap utilities', '8px \u2013 48px'],
  ]);

  const stackRows = layoutRows([
    ['.heavy-stack', 'Default vertical rhythm', '16px'],
    ['.heavy-stack--sm', 'Small gap', '8px'],
    ['.heavy-stack--md', 'Medium gap', '16px'],
    ['.heavy-stack--lg', 'Large gap', '24px'],
    ['.heavy-stack--xl', 'Extra-large gap', '32px'],
  ]);

  const clusterRows = layoutRows([
    ['.heavy-cluster', 'display', 'flex'],
    ['.heavy-cluster', 'flex-wrap', 'wrap'],
    ['.heavy-cluster', 'gap', 'var(--cluster-space, 16px)'],
    ['.heavy-cluster', 'align-items', 'center'],
  ]);

  const sidebarRows = layoutRows([
    ['.heavy-with-sidebar', 'display', 'flex'],
    ['.heavy-with-sidebar', 'flex-wrap', 'wrap'],
    ['.heavy-with-sidebar', 'gap', '24px'],
    ['&gt; :first-child', 'flex-basis', 'var(--sidebar-width, 280px)'],
    ['&gt; :first-child', 'flex-grow', '1'],
    ['&gt; :last-child', 'flex-basis', '0'],
    ['&gt; :last-child', 'flex-grow', '999'],
    ['&gt; :last-child', 'min-inline-size', '50%'],
  ]);

  const centerRows = layoutRows([
    ['.heavy-center', 'max-inline-size', 'var(--hds-measure) / 65ch'],
    ['.heavy-center', 'margin-inline', 'auto'],
    ['.heavy-center', 'padding-inline', '16px'],
    ['.heavy-center', 'box-sizing', 'content-box'],
  ]);

  const coverRows = layoutRows([
    ['.heavy-cover', 'display', 'flex column'],
    ['.heavy-cover', 'min-block-size', '100vh'],
    ['.heavy-cover', 'padding', '16px'],
    ['.heavy-cover &gt; *', 'margin-block', '16px'],
    ['.heavy-cover__centered', 'margin-block', 'auto'],
  ]);

  const boxRows = layoutRows([
    ['.heavy-box', 'Default', '16px'],
    ['.heavy-box--sm', 'Small', '8px'],
    ['.heavy-box--lg', 'Large', '24px'],
    ['.heavy-box--xl', 'Extra-large', '32px'],
  ]);

  const measureRows = layoutRows([
    ['.measure', 'Default', '65ch'],
    ['.measure-narrow', 'Narrow', '45ch'],
    ['.measure-wide', 'Wide', '75ch'],
  ]);

  const breakpointRows = layoutRows([
    ['sm', '480px', 'Small phones'],
    ['md', '768px', 'Tablets'],
    ['lg', '1024px', 'Small desktops'],
    ['xl', '1200px', 'Large desktops'],
    ['2xl', '1440px', 'Wide screens'],
  ]);

  return foundationPage('Layout', 'CSS Grid and flexbox layout primitives for building page structure.', [
    `          <h3 class="style-guide-section-name">Grid</h3>
          <div>
            <div class="style-guide-demo">
              <div class="heavy-grid heavy-grid--12">
${gridBoxes}
              </div>
            </div>
            <div class="style-guide-demo">
              <div class="heavy-grid heavy-grid--12">
                <div class="style-guide-demo-box heavy-col-span-4">span 4</div>
                <div class="style-guide-demo-box heavy-col-span-8">span 8</div>
                <div class="style-guide-demo-box heavy-col-span-6">span 6</div>
                <div class="style-guide-demo-box heavy-col-span-6">span 6</div>
              </div>
            </div>
          </div>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Description</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${gridRows}
            </tbody>
          </table>
          <h3 class="style-guide-section-name" id="stack">Stack</h3>
          <div>
            <div class="style-guide-demo">
              <div class="heavy-stack">
                <div class="style-guide-demo-box">Item 1</div>
                <div class="style-guide-demo-box">Item 2</div>
                <div class="style-guide-demo-box">Item 3</div>
              </div>
            </div>
          </div>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Description</th>
                <th>Gap</th>
              </tr>
            </thead>
            <tbody>
${stackRows}
            </tbody>
          </table>
          <h3 class="style-guide-section-name" id="cluster">Cluster</h3>
          <div>
            <div class="style-guide-demo">
              <div class="heavy-cluster">
                <div class="style-guide-demo-box">Tag</div>
                <div class="style-guide-demo-box">Label</div>
                <div class="style-guide-demo-box">Longer tag</div>
                <div class="style-guide-demo-box">Item</div>
                <div class="style-guide-demo-box">Another</div>
                <div class="style-guide-demo-box">More</div>
              </div>
            </div>
          </div>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Property</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${clusterRows}
            </tbody>
          </table>
          <h3 class="style-guide-section-name" id="sidebar-layout">Sidebar</h3>
          <div>
            <div class="style-guide-demo">
              <div class="heavy-with-sidebar">
                <div class="style-guide-demo-box">Sidebar (280px)</div>
                <div class="style-guide-demo-box">Content (fills remaining)</div>
              </div>
            </div>
          </div>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Selector</th>
                <th>Property</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${sidebarRows}
            </tbody>
          </table>
          <h3 class="style-guide-section-name" id="center">Center</h3>
          <div>
            <div class="style-guide-demo" style="background: var(--ui-surface-default)">
              <div class="heavy-center" style="background: var(--ui-bg-default); padding: var(--hds-space-16); border-radius: var(--hds-radius-sm); text-align: center;">
                <span class="body-xsm text-muted">Centered \u2014 max-width: var(--hds-measure)</span>
              </div>
            </div>
          </div>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Property</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${centerRows}
            </tbody>
          </table>
          <h3 class="style-guide-section-name" id="cover">Cover</h3>
          <div>
            <div class="style-guide-demo" style="padding: 0">
              <div class="heavy-cover" style="min-block-size: 240px;">
                <div class="style-guide-demo-box">Header</div>
                <div class="style-guide-demo-box heavy-cover__centered">Centered element</div>
                <div class="style-guide-demo-box">Footer</div>
              </div>
            </div>
          </div>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Selector</th>
                <th>Property</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${coverRows}
            </tbody>
          </table>
          <h3 class="style-guide-section-name" id="box">Box</h3>
          <div>
            <div class="style-guide-demo" style="display: flex; gap: var(--hds-space-16); flex-wrap: wrap; align-items: start">
              <div class="heavy-box--sm" style="background: var(--ui-surface-default); border-radius: var(--hds-radius-sm)">
                <div class="style-guide-demo-box">.heavy-box--sm</div>
              </div>
              <div class="heavy-box" style="background: var(--ui-surface-default); border-radius: var(--hds-radius-sm)">
                <div class="style-guide-demo-box">.heavy-box</div>
              </div>
              <div class="heavy-box--lg" style="background: var(--ui-surface-default); border-radius: var(--hds-radius-sm)">
                <div class="style-guide-demo-box">.heavy-box--lg</div>
              </div>
              <div class="heavy-box--xl" style="background: var(--ui-surface-default); border-radius: var(--hds-radius-sm)">
                <div class="style-guide-demo-box">.heavy-box--xl</div>
              </div>
            </div>
          </div>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Description</th>
                <th>Padding</th>
              </tr>
            </thead>
            <tbody>
${boxRows}
            </tbody>
          </table>
          <h3 class="style-guide-section-name" id="measure">Measure</h3>
          <div>
            <div class="style-guide-demo">
              <div class="heavy-stack">
                <div class="measure-narrow" style="background: var(--ui-surface-default); padding: var(--hds-space-8); border-radius: var(--hds-radius-sm)">
                  <div class="style-guide-demo-box">.measure-narrow (45ch)</div>
                </div>
                <div class="measure" style="background: var(--ui-surface-default); padding: var(--hds-space-8); border-radius: var(--hds-radius-sm)">
                  <div class="style-guide-demo-box">.measure (65ch)</div>
                </div>
                <div class="measure-wide" style="background: var(--ui-surface-default); padding: var(--hds-space-8); border-radius: var(--hds-radius-sm)">
                  <div class="style-guide-demo-box">.measure-wide (75ch)</div>
                </div>
              </div>
            </div>
          </div>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Description</th>
                <th>Max Width</th>
              </tr>
            </thead>
            <tbody>
${measureRows}
            </tbody>
          </table>
          <h3 class="style-guide-section-name" id="breakpoints">Breakpoints</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Width</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
${breakpointRows}
            </tbody>
          </table>
          <h3 class="style-guide-section-name" id="cards">Cards</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-grid heavy-grid--3">
                <div class="heavy-card">
                  <div class="heavy-card-header">
                    <div class="heavy-card-title">Default Card</div>
                    <div class="heavy-card-subtitle">With subtitle</div>
                  </div>
                  <div class="heavy-card-body">
                    <p class="body-sm">Card body content goes here.</p>
                  </div>
                  <div class="heavy-card-footer">
                    <span class="body-xsm text-muted">Card footer</span>
                  </div>
                </div>
                <div class="heavy-card heavy-card--elevated">
                  <div class="heavy-card-body">
                    <div class="heavy-card-title">Elevated Card</div>
                    <p class="body-sm text-muted" style="margin-top: var(--hds-space-4)">No border, shadow only.</p>
                  </div>
                </div>
                <div class="heavy-card heavy-card--interactive">
                  <div class="heavy-card-body">
                    <div class="heavy-card-title">Interactive Card</div>
                    <p class="body-sm text-muted" style="margin-top: var(--hds-space-4)">Hover to see effect.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <h3 class="style-guide-section-name" id="collapsibles">Collapsibles</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <details class="collapsible">
                <summary>Collapsible Section</summary>
                <div>Hidden content revealed when expanded. Built with native &lt;details&gt; and &lt;summary&gt; elements &mdash; no JavaScript needed.</div>
              </details>
              <details class="collapsible" open>
                <summary>Open by Default</summary>
                <div>This section starts expanded. Click the header to collapse it.</div>
              </details>
            </div>
          </div>
          <h3 class="style-guide-section-name" id="dividers">Dividers</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <hr class="divider">
              <div class="heavy-section-header">Section Header</div>
            </div>
          </div>`,
  ]);
}

function animationContent() {
  return foundationPage('Animation', 'Motion tokens and utility classes for consistent animation across the system.', [
    `          <h3 class="style-guide-section-name">Timing Functions</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-stack heavy-stack--sm">
                <div class="heavy-kv"><span class="heavy-kv-key">--ease-out</span><span class="heavy-kv-value">cubic-bezier(0.16, 1, 0.3, 1)</span></div>
                <div class="heavy-kv"><span class="heavy-kv-key">--ease-in-out</span><span class="heavy-kv-value">cubic-bezier(0.45, 0, 0.55, 1)</span></div>
                <div class="heavy-kv"><span class="heavy-kv-key">--ease-spring</span><span class="heavy-kv-value">cubic-bezier(0.34, 1.56, 0.64, 1)</span></div>
              </div>
            </div>
          </div>
          <h3 class="style-guide-section-name">Keyframes</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-cluster">
                <span class="heavy-badge">fade-in</span>
                <span class="heavy-badge">slide-up</span>
                <span class="heavy-badge">slide-down</span>
                <span class="heavy-badge">scale-in</span>
                <span class="heavy-badge">spin</span>
                <span class="heavy-badge">shimmer</span>
              </div>
            </div>
          </div>
          <h3 class="style-guide-section-name">Utility Classes</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <table class="style-guide-data-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Animation</th>
                    <th>Duration</th>
                    <th>Easing</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>.animate-fade-in</code></td>
                    <td>fade-in</td>
                    <td>0.2s</td>
                    <td>ease-out</td>
                  </tr>
                  <tr>
                    <td><code>.animate-slide-up</code></td>
                    <td>slide-up</td>
                    <td>0.3s</td>
                    <td>ease-out</td>
                  </tr>
                  <tr>
                    <td><code>.animate-slide-down</code></td>
                    <td>slide-down</td>
                    <td>0.3s</td>
                    <td>ease-out</td>
                  </tr>
                  <tr>
                    <td><code>.animate-scale-in</code></td>
                    <td>scale-in</td>
                    <td>0.2s</td>
                    <td>spring</td>
                  </tr>
                  <tr>
                    <td><code>.animate-spin</code></td>
                    <td>spin</td>
                    <td>1s</td>
                    <td>linear</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <h3 class="style-guide-section-name">Stagger Children</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="stagger-children heavy-cluster">
                <span class="heavy-badge heavy-badge--info">1</span>
                <span class="heavy-badge heavy-badge--info">2</span>
                <span class="heavy-badge heavy-badge--info">3</span>
                <span class="heavy-badge heavy-badge--info">4</span>
                <span class="heavy-badge heavy-badge--info">5</span>
                <span class="heavy-badge heavy-badge--info">6</span>
              </div>
            </div>
          </div>`,
  ]);
}

function breadcrumbsContent() {
  return componentPage('Breadcrumbs', {
    description: 'A horizontal trail of links showing the user\'s location within a site hierarchy. Helps users navigate back to parent pages without using the browser\'s back button.',
    dimensions: [
      { label: 'Type', content: playground(
        `          <div class="style-guide-variant-row">
            <div class="heavy-breadcrumbs">
              <a class="heavy-breadcrumbs-link" href="#">Home</a>
              <span class="heavy-breadcrumbs-separator">/</span>
              <a class="heavy-breadcrumbs-link" href="#">Projects</a>
              <span class="heavy-breadcrumbs-separator">/</span>
              <span class="heavy-breadcrumbs-current">Design System</span>
            </div>
          </div>`,
        `<nav class="heavy-breadcrumbs">
  <a class="heavy-breadcrumbs-link" href="#">Home</a>
  <span class="heavy-breadcrumbs-separator">/</span>
  <a class="heavy-breadcrumbs-link" href="#">Projects</a>
  <span class="heavy-breadcrumbs-separator">/</span>
  <span class="heavy-breadcrumbs-current">Design System</span>
</nav>`
      ) },
    ],
  });
}

function buttonsContent() {
  return componentPage('Button', {
    description: 'Trigger actions or navigate. Four style variants establish visual hierarchy — primary for the main call to action, secondary for supporting actions, tertiary for low-emphasis options, and danger for destructive operations.',
    dimensions: [
      { label: 'Type', content: playground(
        `          <div class="style-guide-variant-row">
            <button class="heavy-btn heavy-btn--primary">Primary</button>
            <button class="heavy-btn heavy-btn--secondary">Secondary</button>
            <button class="heavy-btn heavy-btn--tertiary">Tertiary</button>
            <button class="heavy-btn heavy-btn--danger">Danger</button>
          </div>`,
        `<button class="heavy-btn heavy-btn--primary">Label</button>
<button class="heavy-btn heavy-btn--secondary">Label</button>
<button class="heavy-btn heavy-btn--tertiary">Label</button>
<button class="heavy-btn heavy-btn--danger">Label</button>`
      ) },
      { label: 'States', content: playground(
        `          <div class="style-guide-variant-row">
            <button class="heavy-btn heavy-btn--primary">Default</button>
            <button class="heavy-btn heavy-btn--primary is-hover">Hover</button>
            <button class="heavy-btn heavy-btn--primary is-active">Active</button>
            <button class="heavy-btn heavy-btn--primary is-focus">Focus</button>
            <button class="heavy-btn heavy-btn--primary is-disabled" disabled>Disabled</button>
          </div>`,
        `<!-- Default -->\n<button class="heavy-btn heavy-btn--primary">Label</button>\n<!-- Hover -->\n<button class="heavy-btn heavy-btn--primary is-hover">Label</button>\n<!-- Active -->\n<button class="heavy-btn heavy-btn--primary is-active">Label</button>\n<!-- Focus -->\n<button class="heavy-btn heavy-btn--primary is-focus">Label</button>\n<!-- Disabled -->\n<button class="heavy-btn heavy-btn--primary" disabled>Label</button>`
      ) },
      { label: 'Size', content: playground(
        `          <div class="style-guide-variant-row">
            <button class="heavy-btn heavy-btn--primary heavy-btn--xs">X-Small</button>
            <button class="heavy-btn heavy-btn--primary heavy-btn--sm">Small</button>
            <button class="heavy-btn heavy-btn--primary">Medium</button>
            <button class="heavy-btn heavy-btn--primary heavy-btn--lg">Large</button>
          </div>`,
        `<button class="heavy-btn heavy-btn--primary heavy-btn--xs">Label</button>
<button class="heavy-btn heavy-btn--primary heavy-btn--sm">Label</button>
<button class="heavy-btn heavy-btn--primary">Label</button>
<button class="heavy-btn heavy-btn--primary heavy-btn--lg">Label</button>`
      ) },
      { label: 'Block', content: playground(
        `          <button class="heavy-btn heavy-btn--primary heavy-btn--block">Label</button>`,
        '<button class="heavy-btn heavy-btn--primary heavy-btn--block">Label</button>'
      ) },
    ],
  });
}

function buttonIconContent() {
  return componentPage('Button Icon', {
    description: 'A compact button that communicates its action through an icon alone. Used for common, recognizable actions where a text label would add clutter.',
    dimensions: [
      { label: 'Type', content: playground(
        `          <div class="style-guide-variant-row">
            <button class="heavy-btn-icon" aria-label="Settings">&#9881;</button>
            <button class="heavy-btn-icon" aria-label="Close">&#10005;</button>
            <button class="heavy-btn-icon" aria-label="Menu">&#9776;</button>
          </div>`,
        '<button class="heavy-btn-icon" aria-label="Settings">&#9881;</button>'
      ) },
    ],
  });
}

function buttonGroupContent() {
  return componentPage('Button Group', {
    description: 'A horizontal row of related buttons with tightened spacing. Groups actions that operate on the same object or belong to the same workflow step.',
    dimensions: [
      { label: 'Type', content: playground(
        `          <div class="style-guide-variant-row">
            <div class="heavy-btn-group">
              <button class="heavy-btn heavy-btn--secondary">Left</button>
              <button class="heavy-btn heavy-btn--secondary">Center</button>
              <button class="heavy-btn heavy-btn--secondary">Right</button>
            </div>
          </div>`,
        `<div class="heavy-btn-group">
  <button class="heavy-btn heavy-btn--secondary">Left</button>
  <button class="heavy-btn heavy-btn--secondary">Center</button>
  <button class="heavy-btn heavy-btn--secondary">Right</button>
</div>`
      ) },
    ],
  });
}

function chipsContent() {
  return componentPage('Chips', {
    description: 'Compact elements for filtering content or selecting from a set of options. Chips toggle between active and inactive states, letting users refine what they see.',
    dimensions: [
      { label: 'States', content: playground(
        `          <div class="style-guide-variant-row">
            <button class="heavy-chip heavy-chip--active">Active</button>
            <button class="heavy-chip">Inactive</button>
          </div>`,
        `<button class="heavy-chip heavy-chip--active">Active</button>
<button class="heavy-chip">Inactive</button>`
      ) },
    ],
  });
}

function dataDisplayContent() {
  return componentPage('Data Display', {
    description: 'A collection of components for presenting read-only data — badges for status labels, stats for key metrics, key-value pairs for metadata, lists for ordered items, and progress bars for completion.',
    dimensions: [
      { label: 'Badge', content: playground(
        `          <div class="style-guide-variant-row">
            <span class="heavy-badge">Default</span>
            <span class="heavy-badge heavy-badge--success">Success</span>
            <span class="heavy-badge heavy-badge--warning">Warning</span>
            <span class="heavy-badge heavy-badge--danger">Danger</span>
            <span class="heavy-badge heavy-badge--info">Info</span>
          </div>`,
        `<span class="heavy-badge">Default</span>
<span class="heavy-badge heavy-badge--success">Success</span>
<span class="heavy-badge heavy-badge--warning">Warning</span>
<span class="heavy-badge heavy-badge--danger">Danger</span>
<span class="heavy-badge heavy-badge--info">Info</span>`
      ) },
      { label: 'Stat', content: playground(
        `          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-grid heavy-grid--3">
                <div class="heavy-stat">
                  <div class="heavy-stat-value">1,234</div>
                  <div class="heavy-stat-label">Total Users</div>
                </div>
                <div class="heavy-stat">
                  <div class="heavy-stat-value">98<span class="heavy-stat-unit">%</span></div>
                  <div class="heavy-stat-label">Uptime</div>
                  <div class="heavy-stat-delta heavy-stat-delta--positive">+2.3%</div>
                </div>
                <div class="heavy-stat">
                  <div class="heavy-stat-value">42ms</div>
                  <div class="heavy-stat-label">Response Time</div>
                  <div class="heavy-stat-delta heavy-stat-delta--negative">-5ms</div>
                </div>
              </div>
            </div>
          </div>`,
        `<div class="heavy-stat">
  <div class="heavy-stat-value">98<span class="heavy-stat-unit">%</span></div>
  <div class="heavy-stat-label">Uptime</div>
  <div class="heavy-stat-delta heavy-stat-delta--positive">+2.3%</div>
</div>`
      ) },
      { label: 'Key-Value', content: playground(
        `          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div>
                <div class="heavy-kv"><span class="heavy-kv-key">Version</span><span class="heavy-kv-value">2.4.1</span></div>
                <div class="heavy-kv"><span class="heavy-kv-key">Status</span><span class="heavy-kv-value">Active</span></div>
                <div class="heavy-kv"><span class="heavy-kv-key">Last Deploy</span><span class="heavy-kv-value">2 hours ago</span></div>
              </div>
            </div>
          </div>`,
        `<div class="heavy-kv">
  <span class="heavy-kv-key">Version</span>
  <span class="heavy-kv-value">2.4.1</span>
</div>`
      ) },
      { label: 'List', content: playground(
        `          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div>
                <div class="heavy-list-item">First list item</div>
                <div class="heavy-list-item">Second list item</div>
                <div class="heavy-list-item">Third list item</div>
              </div>
            </div>
          </div>`,
        '<div class="heavy-list-item">List item</div>'
      ) },
      { label: 'Progress', content: playground(
        `          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-stack heavy-stack--sm">
                <div class="heavy-progress"><div class="heavy-progress-bar" style="width: 75%"></div></div>
                <div class="heavy-progress"><div class="heavy-progress-bar" style="width: 45%"></div></div>
                <div class="heavy-progress"><div class="heavy-progress-bar" style="width: 90%"></div></div>
              </div>
            </div>
          </div>`,
        `<div class="heavy-progress">
  <div class="heavy-progress-bar" style="width: 75%"></div>
</div>`
      ) },
    ],
  });
}

function feedbackContent() {
  return componentPage('Feedback', {
    description: 'Components that communicate system status to the user — status messages for operation results, empty states for zero-data views, and loading indicators for pending operations.',
    dimensions: [
      { label: 'Status Message', content: playground(
        `          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-stack heavy-stack--sm">
                <div class="heavy-status-msg heavy-status-msg--success">Operation completed successfully.</div>
                <div class="heavy-status-msg heavy-status-msg--error">Something went wrong. Please try again.</div>
                <div class="heavy-status-msg heavy-status-msg--warning">Your session will expire in 5 minutes.</div>
                <div class="heavy-status-msg heavy-status-msg--info">A new version is available.</div>
              </div>
            </div>
          </div>`,
        `<div class="heavy-status-msg heavy-status-msg--success">Operation completed successfully.</div>
<div class="heavy-status-msg heavy-status-msg--error">Something went wrong. Please try again.</div>`
      ) },
      { label: 'Empty State', content: playground(
        `          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-empty-state">
                <div class="heavy-empty-state-title">No results found</div>
                <div class="heavy-empty-state-description">Try adjusting your search or filters.</div>
              </div>
            </div>
          </div>`,
        `<div class="heavy-empty-state">
  <div class="heavy-empty-state-title">No results found</div>
  <div class="heavy-empty-state-description">Try adjusting your search or filters.</div>
</div>`
      ) },
      { label: 'Spinner', content: playground(
        `          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-cluster">
                <div class="heavy-spinner"></div>
                <span class="body-sm text-muted">Loading...</span>
              </div>
            </div>
          </div>`,
        '<div class="heavy-spinner"></div>'
      ) },
      { label: 'Skeleton', content: playground(
        `          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-stack heavy-stack--sm">
                <div class="heavy-skeleton" style="height: 16px; width: 60%"></div>
                <div class="heavy-skeleton" style="height: 16px; width: 80%"></div>
                <div class="heavy-skeleton" style="height: 16px; width: 40%"></div>
              </div>
            </div>
          </div>`,
        '<div class="heavy-skeleton" style="height: 16px; width: 60%"></div>'
      ) },
    ],
  });
}

function fileUploadContent() {
  return componentPage('File Upload', {
    description: 'A styled file input that replaces the browser\'s default file picker with a consistent button trigger. The native file input is hidden and the label acts as the clickable element.',
    dimensions: [
      { label: 'Size', content: playground(
        `          <div class="style-guide-variant-row">
            <div class="heavy-form-file heavy-form-file--xs">
              <input type="file" id="file-xs">
              <label class="heavy-form-file-trigger" for="file-xs">X-Small</label>
            </div>
            <div class="heavy-form-file heavy-form-file--sm">
              <input type="file" id="file-sm">
              <label class="heavy-form-file-trigger" for="file-sm">Small</label>
            </div>
            <div class="heavy-form-file">
              <input type="file" id="file-md">
              <label class="heavy-form-file-trigger" for="file-md">Medium</label>
            </div>
            <div class="heavy-form-file heavy-form-file--lg">
              <input type="file" id="file-lg">
              <label class="heavy-form-file-trigger" for="file-lg">Large</label>
            </div>
          </div>`,
        `<div class="heavy-form-file heavy-form-file--xs"><input type="file" id="f-xs"><label class="heavy-form-file-trigger" for="f-xs">Choose file</label></div>
<div class="heavy-form-file heavy-form-file--sm"><input type="file" id="f-sm"><label class="heavy-form-file-trigger" for="f-sm">Choose file</label></div>
<div class="heavy-form-file"><input type="file" id="f-md"><label class="heavy-form-file-trigger" for="f-md">Choose file</label></div>
<div class="heavy-form-file heavy-form-file--lg"><input type="file" id="f-lg"><label class="heavy-form-file-trigger" for="f-lg">Choose file</label></div>`
      ) },
    ],
  });
}

function inputsContent() {
  return componentPage('Inputs', {
    description: 'Text fields for entering and editing single-line or multi-line content. Includes labels, placeholder text, hint text, and validation states for building accessible forms.',
    dimensions: [
      { label: 'Size', content: playground(
        `          <div class="style-guide-variant-row">
            <input class="heavy-form-input heavy-form-input--xs heavy-col-span-2" type="text" placeholder="X-Small">
            <input class="heavy-form-input heavy-form-input--sm heavy-col-span-2" type="text" placeholder="Small">
            <input class="heavy-form-input heavy-col-span-2" type="text" placeholder="Medium">
            <input class="heavy-form-input heavy-form-input--lg heavy-col-span-2" type="text" placeholder="Large">
          </div>`,
        '<input class="heavy-form-input" type="text" placeholder="Placeholder">'
      ) },
      { label: 'States', content: playground(
        `          <div class="style-guide-variant-row">
            <input class="heavy-form-input heavy-col-span-2" type="text" placeholder="Default">
            <input class="heavy-form-input is-hover heavy-col-span-2" type="text" placeholder="Hover">
            <input class="heavy-form-input is-focus heavy-col-span-2" type="text" placeholder="Focus">
            <input class="heavy-form-input is-disabled heavy-col-span-2" type="text" placeholder="Disabled" disabled>
          </div>`,
        `<div class="heavy-form-group">
  <label class="heavy-form-label">Email</label>
  <input class="heavy-form-input heavy-form-input--error" type="text" value="not-an-email">
  <span class="heavy-form-hint heavy-form-hint--error">Please enter a valid email address</span>
</div>`
      ) },
      { label: 'Validation', content: playground(
        `          <div class="style-guide-variant-row">
            <div class="heavy-form-group heavy-col-span-3">
              <label class="heavy-form-label">Email</label>
              <input class="heavy-form-input heavy-form-input--error" type="text" placeholder="Enter email" value="not-an-email">
              <span class="heavy-form-hint heavy-form-hint--error">Please enter a valid email address</span>
            </div>
            <div class="heavy-form-group heavy-col-span-3">
              <label class="heavy-form-label">Username</label>
              <input class="heavy-form-input heavy-form-input--success" type="text" placeholder="Choose username" value="keithbarney">
              <span class="heavy-form-hint heavy-form-hint--success">Username is available</span>
            </div>
          </div>`,
        `<div class="heavy-form-group">
  <label class="heavy-form-label">Email</label>
  <input class="heavy-form-input heavy-form-input--error" type="text" value="not-an-email">
  <span class="heavy-form-hint heavy-form-hint--error">Please enter a valid email address</span>
</div>`
      ) },
      { label: 'Textarea', content: playground(
        `          <div class="heavy-col-span-4">
            <textarea class="heavy-form-input heavy-form-textarea" placeholder="Write something..."></textarea>
          </div>`,
        '<textarea class="heavy-form-input heavy-form-textarea" placeholder="Write something..."></textarea>'
      ) },
      { label: 'Form Group', content: playground(
        `          <div class="heavy-form-group heavy-col-span-3">
            <label class="heavy-form-label">Label</label>
            <input class="heavy-form-input" type="text" placeholder="Placeholder">
            <span class="heavy-form-hint">Hint text goes here</span>
          </div>`,
        `<div class="heavy-form-group">
  <label class="heavy-form-label">Label</label>
  <input class="heavy-form-input" type="text" placeholder="Placeholder">
  <span class="heavy-form-hint">Hint text goes here</span>
</div>`
      ) },
    ],
  });
}

function navLinksContent() {
  return componentPage('Nav Links', {
    description: 'Horizontal navigation links for moving between top-level pages or sections. One link is marked active to show the user\'s current location.',
    dimensions: [
      { label: 'Type', content: playground(
        `          <div class="style-guide-variant-row">
            <a class="heavy-nav-link heavy-nav-link--active" href="#">Dashboard</a>
            <a class="heavy-nav-link" href="#">Settings</a>
            <a class="heavy-nav-link" href="#">Profile</a>
          </div>`,
        `<nav>
  <a class="heavy-nav-link heavy-nav-link--active" href="#">Dashboard</a>
  <a class="heavy-nav-link" href="#">Settings</a>
  <a class="heavy-nav-link" href="#">Profile</a>
</nav>`
      ) },
    ],
  });
}

function searchContent() {
  return componentPage('Search', {
    description: 'A text input with a built-in search icon for filtering or querying content. Available in four sizes to match surrounding UI density. Wraps a native input element for full keyboard and assistive technology support.',
    dimensions: [
      { label: 'Size', content: playground(
        `          <div class="style-guide-variant-row">
            <label class="heavy-search heavy-search--xs heavy-col-span-2"><input type="search" placeholder="X-Small"></label>
            <label class="heavy-search heavy-search--sm heavy-col-span-2"><input type="search" placeholder="Small"></label>
            <label class="heavy-search heavy-col-span-2"><input type="search" placeholder="Medium"></label>
            <label class="heavy-search heavy-search--lg heavy-col-span-2"><input type="search" placeholder="Large"></label>
          </div>`,
        `<label class="heavy-search heavy-search--xs"><input type="search" placeholder="Search..."></label>
<label class="heavy-search heavy-search--sm"><input type="search" placeholder="Search..."></label>
<label class="heavy-search"><input type="search" placeholder="Search..."></label>
<label class="heavy-search heavy-search--lg"><input type="search" placeholder="Search..."></label>`
      ) },
      { label: 'States', content: playground(
        `          <div class="style-guide-variant-row">
            <label class="heavy-search heavy-col-span-2"><input type="search" placeholder="Default"></label>
            <label class="heavy-search is-hover heavy-col-span-2"><input type="search" placeholder="Hover"></label>
            <label class="heavy-search is-focus heavy-col-span-2"><input type="search" placeholder="Focus"></label>
            <label class="heavy-search is-disabled heavy-col-span-2"><input type="search" placeholder="Disabled" disabled></label>
          </div>`,
        `<!-- Default -->\n<label class="heavy-search"><input type="search" placeholder="Search..."></label>\n<!-- Hover -->\n<label class="heavy-search is-hover"><input type="search" placeholder="Search..."></label>\n<!-- Focus -->\n<label class="heavy-search is-focus"><input type="search" placeholder="Search..."></label>\n<!-- Disabled -->\n<label class="heavy-search" disabled><input type="search" placeholder="Search..." disabled></label>`
      ) },
    ],
  });
}

function selectsContent() {
  return componentPage('Selects', {
    description: 'A native dropdown for choosing one option from a list. Uses the browser\'s built-in select element with custom styling for consistency across platforms.',
    dimensions: [
      { label: 'Size', content: playground(
        `          <div class="style-guide-variant-row">
            <select class="heavy-select heavy-select--xs heavy-col-span-2"><option>X-Small</option></select>
            <select class="heavy-select heavy-select--sm heavy-col-span-2"><option>Small</option></select>
            <select class="heavy-select heavy-col-span-2"><option>Medium</option></select>
            <select class="heavy-select heavy-select--lg heavy-col-span-2"><option>Large</option></select>
          </div>`,
        `<select class="heavy-select heavy-select--xs"><option>X-Small</option></select>
<select class="heavy-select heavy-select--sm"><option>Small</option></select>
<select class="heavy-select"><option>Medium</option></select>
<select class="heavy-select heavy-select--lg"><option>Large</option></select>`
      ) },
      { label: 'States', content: playground(
        `          <div class="style-guide-variant-row">
            <select class="heavy-select heavy-col-span-2"><option>Default</option></select>
            <select class="heavy-select is-hover heavy-col-span-2"><option>Hover</option></select>
            <select class="heavy-select is-focus heavy-col-span-2"><option>Focus</option></select>
            <select class="heavy-select is-disabled heavy-col-span-2" disabled><option>Disabled</option></select>
          </div>`,
        `<!-- Default -->\n<select class="heavy-select"><option>Select an option</option></select>\n<!-- Hover -->\n<select class="heavy-select is-hover"><option>Select an option</option></select>\n<!-- Focus -->\n<select class="heavy-select is-focus"><option>Select an option</option></select>\n<!-- Disabled -->\n<select class="heavy-select" disabled><option>Select an option</option></select>`
      ) },
      { label: 'Form Group', content: playground(
        `          <div class="heavy-form-group heavy-col-span-3">
            <label class="heavy-form-label">Label</label>
            <select class="heavy-select"><option>Select an option</option></select>
            <span class="heavy-form-hint">Hint text goes here</span>
          </div>`,
        `<div class="heavy-form-group">
  <label class="heavy-form-label">Label</label>
  <select class="heavy-select">
    <option>Select an option</option>
  </select>
  <span class="heavy-form-hint">Hint text goes here</span>
</div>`
      ) },
    ],
  });
}

function tabsContent() {
  return componentPage('Tabs', {
    description: 'A row of labeled controls that switch between content panels. Only one tab is active at a time, and its associated panel is visible while others are hidden.',
    dimensions: [
      { label: 'Type', content: playground(
        `          <div class="style-guide-variant-row">
            <div class="heavy-tabs">
              <button class="heavy-tab heavy-tab--active">Overview</button>
              <button class="heavy-tab">Details</button>
              <button class="heavy-tab">Settings</button>
            </div>
          </div>`,
        `<div class="heavy-tabs">
  <button class="heavy-tab heavy-tab--active">Overview</button>
  <button class="heavy-tab">Details</button>
  <button class="heavy-tab">Settings</button>
</div>`
      ) },
    ],
  });
}

function togglesContent() {
  return componentPage('Toggles', {
    description: 'Controls for binary and multiple-choice selections. Includes toggle switches for on/off settings, checkboxes for multi-select, and radio buttons for single-select from a group.',
    dimensions: [
      { label: 'Toggle', content: playground(
        `          <div class="style-guide-variant-row">
            <label class="heavy-form-toggle">
              <input type="checkbox">
              <span class="heavy-form-toggle-track"></span>
              <span>Off</span>
            </label>
            <label class="heavy-form-toggle">
              <input type="checkbox" checked>
              <span class="heavy-form-toggle-track"></span>
              <span>On</span>
            </label>
          </div>`,
        `<label class="heavy-form-toggle">
  <input type="checkbox">
  <span class="heavy-form-toggle-track"></span>
  <span>Off</span>
</label>`
      ) },
      { label: 'Checkbox', content: playground(
        `          <div>
            <div class="heavy-stack">
              <div class="heavy-form-check">
                <input class="heavy-form-check-input" type="checkbox" id="check1" checked>
                <label class="heavy-form-label" for="check1">Checkbox option</label>
              </div>
            </div>
          </div>`,
        `<div class="heavy-form-check">
  <input class="heavy-form-check-input" type="checkbox" id="check1">
  <label class="heavy-form-label" for="check1">Checkbox option</label>
</div>`
      ) },
      { label: 'Radio', content: playground(
        `          <div>
            <div class="heavy-stack">
              <div class="heavy-form-check">
                <input class="heavy-form-check-input" type="radio" name="radio" id="radio1" checked>
                <label class="heavy-form-label" for="radio1">Radio option A</label>
              </div>
              <div class="heavy-form-check">
                <input class="heavy-form-check-input" type="radio" name="radio" id="radio2">
                <label class="heavy-form-label" for="radio2">Radio option B</label>
              </div>
            </div>
          </div>`,
        `<div class="heavy-form-check">
  <input class="heavy-form-check-input" type="radio" name="group" id="radio1">
  <label class="heavy-form-label" for="radio1">Radio option A</label>
</div>`
      ) },
    ],
  });
}

function formValidationContent() {
  return componentPage('Form Validation', {
    description: 'Client-side validation pattern for form fields. Uses data attributes to declare validation rules and applies error/success states with hint text on blur. Validates required fields, email format, minimum length, and select choices.',
    dimensions: [
      { label: 'Type', content: `          <div class="heavy-col-span-4">
            <div class="heavy-stack">
              <div class="heavy-form-group" data-validate="required">
                <label class="heavy-form-label">Name</label>
                <input class="heavy-form-input" type="text" placeholder="Enter your name">
                <span class="heavy-form-hint">Required field</span>
              </div>
              <div class="heavy-form-group" data-validate="email">
                <label class="heavy-form-label">Email</label>
                <input class="heavy-form-input" type="text" placeholder="Enter your email">
                <span class="heavy-form-hint">Must be a valid email</span>
              </div>
              <div class="heavy-form-group" data-validate="minlength" data-minlength="8">
                <label class="heavy-form-label">Password</label>
                <input class="heavy-form-input" type="password" placeholder="Choose a password">
                <span class="heavy-form-hint">Minimum 8 characters</span>
              </div>
              <div class="heavy-form-group" data-validate="select">
                <label class="heavy-form-label">Role</label>
                <select class="heavy-select">
                  <option value="">Select a role</option>
                  <option value="designer">Designer</option>
                  <option value="developer">Developer</option>
                  <option value="manager">Manager</option>
                </select>
                <span class="heavy-form-hint">Choose one option</span>
              </div>
            </div>
          </div>
          ${codeBlock(`<div class="heavy-form-group" data-validate="required">
  <label class="heavy-form-label">Name</label>
  <input class="heavy-form-input" type="text" placeholder="Enter your name">
  <span class="heavy-form-hint">Required field</span>
</div>

<div class="heavy-form-group" data-validate="email">
  <label class="heavy-form-label">Email</label>
  <input class="heavy-form-input" type="text" placeholder="Enter your email">
  <span class="heavy-form-hint">Must be a valid email</span>
</div>`)}` },
    ],
  });
}

function searchPatternContent() {
  return componentPage('Search', {
    description: 'Interactive search pattern. Type in any field below to test the search component at different sizes and in different contexts.',
    dimensions: [
      { label: 'Type', content: `          <div>
            <div class="heavy-stack heavy-stack--lg">
              <label class="heavy-search heavy-search--lg"><input type="search" placeholder="Search everything..."></label>
            </div>
          </div>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--hds-space-16); padding: var(--hds-space-16); background: var(--ui-surface-default); border-radius: var(--hds-radius-md);">
                <span class="style-guide-section-name" style="margin: 0;">App Name</span>
                <label class="heavy-search heavy-search--sm" style="flex: 1; max-width: 320px;"><input type="search" placeholder="Search..."></label>
                <button class="heavy-btn heavy-btn--tertiary heavy-btn--sm">Settings</button>
              </div>
            </div>
          </div>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div style="max-width: 280px; padding: var(--hds-space-16); background: var(--ui-surface-default); border-radius: var(--hds-radius-md);">
                <div class="heavy-stack">
                  <label class="heavy-search heavy-search--sm"><input type="search" placeholder="Filter items..."></label>
                  <div class="heavy-list-item">Dashboard</div>
                  <div class="heavy-list-item">Projects</div>
                  <div class="heavy-list-item">Settings</div>
                  <div class="heavy-list-item">Profile</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <label class="heavy-search" style="display: flex;"><input type="search" placeholder="Search across all projects, files, and settings..."></label>
            </div>
          </div>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <label class="heavy-search"><input type="search" placeholder="Search unavailable" disabled></label>
            </div>
          </div>` },
    ],
  });
}

function cardContent() {
  return componentPage('Card', {
    description: 'A container that groups related content and actions. Cards create visual hierarchy by separating content into distinct sections with borders or elevation.',
    dimensions: [
      { label: 'Default', content: playground(
        `          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-card" style="max-width: 360px;">
                <div class="heavy-card-header">
                  <div class="heavy-card-title">Card Title</div>
                  <div class="heavy-card-subtitle">Optional subtitle or description</div>
                </div>
                <div class="heavy-card-body">
                  <p>Card body content goes here. This is where the primary information or form fields live.</p>
                </div>
                <div class="heavy-card-footer">
                  <div class="heavy-cluster">
                    <button class="heavy-btn heavy-btn--sm">Cancel</button>
                    <button class="heavy-btn heavy-btn--primary heavy-btn--sm">Save</button>
                  </div>
                </div>
              </div>
            </div>
          </div>`,
        `<div class="heavy-card">
  <div class="heavy-card-header">
    <div class="heavy-card-title">Card Title</div>
    <div class="heavy-card-subtitle">Optional subtitle</div>
  </div>
  <div class="heavy-card-body">
    <p>Card body content</p>
  </div>
  <div class="heavy-card-footer">
    <button class="heavy-btn heavy-btn--sm">Cancel</button>
    <button class="heavy-btn heavy-btn--primary heavy-btn--sm">Save</button>
  </div>
</div>`
      ) },
      { label: 'Elevated', content: playground(
        `          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-card heavy-card--elevated" style="max-width: 360px;">
                <div class="heavy-card-body">
                  <div class="heavy-card-title">Elevated Card</div>
                  <div class="heavy-card-subtitle">Uses a shadow instead of a border for visual separation.</div>
                </div>
              </div>
            </div>
          </div>`,
        '<div class="heavy-card heavy-card--elevated">...</div>'
      ) },
      { label: 'Interactive', content: playground(
        `          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-card heavy-card--interactive" style="max-width: 360px;">
                <div class="heavy-card-body">
                  <div class="heavy-card-title">Clickable Card</div>
                  <div class="heavy-card-subtitle">Hover to see the lift effect. Use for items that navigate to a detail view.</div>
                </div>
              </div>
            </div>
          </div>`,
        '<div class="heavy-card heavy-card--interactive">...</div>'
      ) },
    ],
  });
}

function modalContent() {
  return componentPage('Modal', {
    description: 'A dialog overlay that focuses the user\'s attention on a specific task or decision. Modals appear on top of a dimmed backdrop and block interaction with the underlying page until dismissed.',
    dimensions: [
      { label: 'Type', content: playground(
        `          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div style="position: relative; height: 320px; background: var(--ui-bg-default); border-radius: var(--hds-radius-md); overflow: hidden;">
                <div class="heavy-modal-backdrop" style="position: absolute;">
                  <div class="heavy-modal" style="max-width: 360px;">
                    <div class="heavy-modal-header">
                      <div class="heavy-modal-title">Confirm Action</div>
                    </div>
                    <div class="heavy-modal-body">
                      <p>Are you sure you want to proceed? This action cannot be undone.</p>
                    </div>
                    <div class="heavy-modal-footer">
                      <button class="heavy-btn heavy-btn--sm">Cancel</button>
                      <button class="heavy-btn heavy-btn--danger heavy-btn--sm">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>`,
        `<div class="heavy-modal-backdrop">
  <div class="heavy-modal">
    <div class="heavy-modal-header">
      <div class="heavy-modal-title">Confirm Action</div>
    </div>
    <div class="heavy-modal-body">
      <p>Are you sure you want to proceed?</p>
    </div>
    <div class="heavy-modal-footer">
      <button class="heavy-btn heavy-btn--sm">Cancel</button>
      <button class="heavy-btn heavy-btn--danger heavy-btn--sm">Delete</button>
    </div>
  </div>
</div>`
      ) },
    ],
  });
}

// ===== Content Map =====

const contentMap = {
  'colors': (tokens) => colorsContent(tokens),
  'typography': (tokens) => typographyContent(tokens),
  'spacing': (tokens) => spacingContent(tokens),
  'radius': (tokens) => radiusContent(tokens),
  'scale': () => scaleContent(),
  'layout': () => layoutContent(),
  'animation': () => animationContent(),
  'breadcrumbs': () => breadcrumbsContent(),
  'button': () => buttonsContent(),
  'button-group': () => buttonGroupContent(),
  'button-icon': () => buttonIconContent(),
  'card': () => cardContent(),
  'chips': () => chipsContent(),
  'data-display': () => dataDisplayContent(),
  'feedback': () => feedbackContent(),
  'file-upload': () => fileUploadContent(),
  'inputs': () => inputsContent(),
  'modal': () => modalContent(),
  'nav-links': () => navLinksContent(),
  'search': () => searchContent(),
  'selects': () => selectsContent(),
  'tabs': () => tabsContent(),
  'toggles': () => togglesContent(),
  'form-validation': () => formValidationContent(),
  'search-pattern': () => searchPatternContent(),
};

// ===== Build =====

function main() {
  console.log('Building pages from token JSON...\n');

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  const tokens = readTokens();
  const activeFiles = new Set(PAGES.map(p => p.file));

  for (const pg of PAGES) {
    const contentFn = contentMap[pg.id];
    const contentHtml = contentFn(tokens);
    const title = pg.label;
    const html = wrapPage(title, contentHtml, pg.id);
    const outPath = path.join(DIST_DIR, pg.file);
    fs.writeFileSync(outPath, html);
    console.log(`  \u2713 ${pg.file}`);
  }

  // Clean stale pages from previous structure
  const stalePages = ['colors.html', 'stats.html', 'files.html', 'tokens.html', 'base.html', 'alias.html', 'forms.html', 'navigation.html', 'foundations.html', 'components.html', 'buttons.html'];
  for (const stale of stalePages) {
    const stalePath = path.join(DIST_DIR, stale);
    if (fs.existsSync(stalePath)) {
      fs.unlinkSync(stalePath);
      console.log(`  \u2717 ${stale} (removed)`);
    }
  }

  console.log(`\n  ${PAGES.length} pages, ${tokens.colorFamilies.length} color families, ${tokens.typeScale.length} type steps, ${tokens.uiColorGroups.length} UI groups`);
}

main();
