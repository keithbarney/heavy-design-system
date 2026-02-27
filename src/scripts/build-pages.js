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
  // Foundations (alphabetical)
  { file: 'index.html', id: 'animation', label: 'Animation', group: 'Foundations' },
  { file: 'breakpoints.html', id: 'breakpoints', label: 'Breakpoints', group: 'Foundations' },
  { file: 'colors.html', id: 'colors', label: 'Colors', group: 'Foundations' },
  { file: 'layout.html', id: 'layout', label: 'Layout', group: 'Foundations' },
  { file: 'radius.html', id: 'radius', label: 'Radius', group: 'Foundations' },
  { file: 'scale.html', id: 'scale', label: 'Scale', group: 'Foundations' },
  { file: 'spacing.html', id: 'spacing', label: 'Spacing', group: 'Foundations' },
  { file: 'typography.html', id: 'typography', label: 'Typography', group: 'Foundations' },
  // Components (alphabetical)
  { file: 'breadcrumbs.html', id: 'breadcrumbs', label: 'Breadcrumbs', group: 'Components' },
  { file: 'button.html', id: 'button', label: 'Button', group: 'Components' },
  { file: 'button-group.html', id: 'button-group', label: 'Button Group', group: 'Components' },
  { file: 'button-icon.html', id: 'button-icon', label: 'Button Icon', group: 'Components' },
  { file: 'card.html', id: 'card', label: 'Card', group: 'Components' },
  { file: 'chips.html', id: 'chips', label: 'Chips', group: 'Components' },
  { file: 'collapsible.html', id: 'collapsible', label: 'Collapsible', group: 'Components' },
  { file: 'data-display.html', id: 'data-display', label: 'Data Display', group: 'Components' },
  { file: 'divider.html', id: 'divider', label: 'Divider', group: 'Components' },
  { file: 'feedback.html', id: 'feedback', label: 'Feedback', group: 'Components' },
  { file: 'file-upload.html', id: 'file-upload', label: 'File Upload', group: 'Components' },
  { file: 'icon.html', id: 'icon', label: 'Icon', group: 'Components' },
  { file: 'inputs.html', id: 'inputs', label: 'Inputs', group: 'Components' },
  { file: 'link.html', id: 'link', label: 'Link', group: 'Components' },
  { file: 'modal.html', id: 'modal', label: 'Modal', group: 'Components' },
  { file: 'nav-links.html', id: 'nav-links', label: 'Nav Links', group: 'Components' },
  { file: 'search.html', id: 'search', label: 'Search', group: 'Components' },
  { file: 'selects.html', id: 'selects', label: 'Selects', group: 'Components' },
  { file: 'tabs.html', id: 'tabs', label: 'Tabs', group: 'Components' },
  { file: 'toggles.html', id: 'toggles', label: 'Toggles', group: 'Components' },
  // Patterns (alphabetical)
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
      const ref = getRefName(token);
      const scaleRef = ref ? `--base-scale-${ref.replace('ui.', '')}` : '';
      gaps.push({ name: `hds-spacing-${px}`, css: `--hds-spacing-${px}`, value: getNumericValue(token), scaleRef });
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
    var hint = group.querySelector('.hds-form-hint');
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

      input.classList.remove('hds-form-input--error', 'hds-form-input--success');
      hint.classList.remove('hds-form-hint--error', 'hds-form-hint--success');
      input.classList.add(valid ? 'hds-form-input--success' : 'hds-form-input--error');
      hint.classList.add(valid ? 'hds-form-hint--success' : 'hds-form-hint--error');
      hint.textContent = msg;
    }

    function reset() {
      input.classList.remove('hds-form-input--error', 'hds-form-input--success');
      hint.classList.remove('hds-form-hint--error', 'hds-form-hint--success');
      hint.textContent = defaultHint;
    }

    input.addEventListener('blur', validate);
    input.addEventListener('input', function() {
      if (input.classList.contains('hds-form-input--error') || input.classList.contains('hds-form-input--success')) {
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

const { esc, codeBlock, playground: _playground, description, guidelines, componentPage, foundationPage, section, wrapPage, colorTable, spacingTable, radiusTable, typographyTable, baseScaleTable } = builder;

// Syntax highlight escaped HTML code blocks
// Uses markers (\x01..\x04) to avoid regex cascading, then converts to spans
function highlightHtml(escaped) {
  const result = escaped
    // Tags: &lt;tagname and &lt;/tagname (must run before attrs)
    .replace(/(&lt;\/?)(\w+)/g, '$1\x07$2\x08')
    // Strings: &quot;...&quot;
    .replace(/&quot;(.*?)&quot;/g, '\x03&quot;$1&quot;\x04')
    // Attributes: word= (only before a string marker)
    .replace(/([\w-]+)=(?=\x03)/g, '\x01$1\x02=')
    // Brackets: &lt; &gt;
    .replace(/&lt;/g, '\x05&lt;\x06')
    .replace(/&gt;/g, '\x05&gt;\x06');

  return result
    .replace(/\x07(.*?)\x08/g, '<span class="style-guide-syntax-tag">$1</span>')
    .replace(/\x01(.*?)\x02/g, '<span class="style-guide-syntax-attr">$1</span>')
    .replace(/\x03(.*?)\x04/g, '<span class="style-guide-syntax-string">$1</span>')
    .replace(/\x05(.*?)\x06/g, '<span class="style-guide-syntax-punct">$1</span>');
}

// Wrap playground to add hds-specific class + syntax highlighting
const playground = (preview, code) => {
  let html = _playground(preview, code);
  html = html.replace('style-guide-playground-code"', 'style-guide-playground-code hds-playground-code"');
  html = html.replace(/<code>([\s\S]*?)<\/code>/, (_, inner) => `<code>${highlightHtml(inner)}</code>`);
  return html;
};

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
      value: g.scaleRef || g.value,
      widthPx: parseInt(g.value),
    })))),
  ]);
}

function radiusContent(tokens) {
  const baseRadii = [
    { name: 'hds-radius-sm', value: '--base-scale-4', sampleValue: '4px' },
    { name: 'hds-radius-md', value: '--base-scale-8', sampleValue: '8px' },
    { name: 'hds-radius-lg', value: '--base-scale-12', sampleValue: '12px' },
    { name: 'hds-radius-full', value: '999px' },
  ];

  return foundationPage('Radius', 'Four radius tokens from subtle rounding to fully round.', [
    section('Radius Scale', radiusTable(baseRadii.map(r => ({
      tokenName: r.name,
      copyValue: `--${r.name}`,
      value: r.value,
      sampleValue: r.sampleValue,
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
    ['.hds-grid', 'Base grid container', 'gap: var(--hds-grid-gutter)'],
    ['.hds-grid--2', '2 equal columns', 'repeat(2, 1fr)'],
    ['.hds-grid--3', '3 equal columns', 'repeat(3, 1fr)'],
    ['.hds-grid--4', '4 equal columns', 'repeat(4, 1fr)'],
    ['.hds-grid--6', '6 equal columns', 'repeat(6, 1fr)'],
    ['.hds-grid--10', '10 equal columns', 'repeat(10, 1fr)'],
    ['.hds-grid--12', '12 equal columns', 'repeat(12, 1fr)'],
    ['.hds-grid--auto', 'Auto-fit, 300px min', 'minmax(300px, 1fr)'],
    ['.hds-grid--auto-sm', 'Auto-fit, 200px min', 'minmax(200px, 1fr)'],
    ['.hds-grid--auto-lg', 'Auto-fit, 400px min', 'minmax(400px, 1fr)'],
    ['.hds-col-span-{N}', 'Span N columns', 'grid-column: span N'],
    ['.hds-col-span-full', 'Span all columns', 'grid-column: 1 / -1'],
    ['.hds-gap-1 \u2013 .hds-gap-6', 'Gap utilities', '8px \u2013 48px'],
  ]);

  return foundationPage('Layout', 'CSS Grid layout primitives for building page structure.', [
    `          <h3 class="style-guide-section-name">Grid</h3>
          <div>
            <div class="style-guide-demo">
              <div class="hds-grid hds-grid--12">
${gridBoxes}
              </div>
            </div>
            <div class="style-guide-demo">
              <div class="hds-grid hds-grid--12">
                <div class="style-guide-demo-box hds-col-span-4">span 4</div>
                <div class="style-guide-demo-box hds-col-span-8">span 8</div>
                <div class="style-guide-demo-box hds-col-span-6">span 6</div>
                <div class="style-guide-demo-box hds-col-span-6">span 6</div>
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
`,
  ]);
}

function breakpointsContent() {
  const layoutRows = (data) => data.map(([a, b, c]) =>
    `                <tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`
  ).join('\n');

  const rows = layoutRows([
    ['sm', '480px', 'Small phones'],
    ['md', '768px', 'Tablets'],
    ['lg', '1024px', 'Small desktops'],
    ['xl', '1200px', 'Large desktops'],
    ['2xl', '1440px', 'Wide screens'],
  ]);

  return foundationPage('Breakpoints', 'Mobile-first responsive breakpoints used across the system. Apply via inline media queries with native CSS nesting.', [
    section('Breakpoint Scale',
      `          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Width</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
${rows}
            </tbody>
          </table>`),
  ]);
}

function animationContent() {
  return foundationPage('Animation', 'Motion tokens and utility classes for consistent animation across the system.', [
    `          <h3 class="style-guide-section-name">Timing Functions</h3>
          <div>
            <div class="hds-stack hds-stack--lg">
              <div class="hds-stack hds-stack--sm">
                <div class="hds-kv"><span class="hds-kv-key">--ease-out</span><span class="hds-kv-value">cubic-bezier(0.16, 1, 0.3, 1)</span></div>
                <div class="hds-kv"><span class="hds-kv-key">--ease-in-out</span><span class="hds-kv-value">cubic-bezier(0.45, 0, 0.55, 1)</span></div>
                <div class="hds-kv"><span class="hds-kv-key">--ease-spring</span><span class="hds-kv-value">cubic-bezier(0.34, 1.56, 0.64, 1)</span></div>
              </div>
            </div>
          </div>
          <h3 class="style-guide-section-name">Keyframes</h3>
          <div>
            <div class="hds-stack hds-stack--lg">
              <div class="hds-cluster">
                <span class="hds-badge">fade-in</span>
                <span class="hds-badge">slide-up</span>
                <span class="hds-badge">slide-down</span>
                <span class="hds-badge">scale-in</span>
                <span class="hds-badge">spin</span>
                <span class="hds-badge">shimmer</span>
              </div>
            </div>
          </div>
          <h3 class="style-guide-section-name">Utility Classes</h3>
          <div>
            <div class="hds-stack hds-stack--lg">
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
            <div class="hds-stack hds-stack--lg">
              <div class="stagger-children hds-cluster">
                <span class="hds-badge hds-badge--info">1</span>
                <span class="hds-badge hds-badge--info">2</span>
                <span class="hds-badge hds-badge--info">3</span>
                <span class="hds-badge hds-badge--info">4</span>
                <span class="hds-badge hds-badge--info">5</span>
                <span class="hds-badge hds-badge--info">6</span>
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
            <div class="hds-breadcrumbs">
              <a class="heavy-link" href="#">Home</a>
              <span class="hds-breadcrumbs-separator">/</span>
              <a class="heavy-link" href="#">Projects</a>
              <span class="hds-breadcrumbs-separator">/</span>
              <span class="hds-breadcrumbs-current">Design System</span>
            </div>
          </div>`,
        `<nav class="hds-breadcrumbs">
  <a class="heavy-link" href="#">Home</a>
  <span class="hds-breadcrumbs-separator">/</span>
  <a class="heavy-link" href="#">Projects</a>
  <span class="hds-breadcrumbs-separator">/</span>
  <span class="hds-breadcrumbs-current">Design System</span>
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
            <button class="hds-btn hds-btn--primary">Primary</button>
            <button class="hds-btn hds-btn--secondary">Secondary</button>
            <button class="hds-btn hds-btn--tertiary">Tertiary</button>
            <button class="hds-btn hds-btn--danger">Danger</button>
          </div>`,
        `<button class="hds-btn hds-btn--primary">Label</button>
<button class="hds-btn hds-btn--secondary">Label</button>
<button class="hds-btn hds-btn--tertiary">Label</button>
<button class="hds-btn hds-btn--danger">Label</button>`
      ) },
      { label: 'States', content: playground(
        `          <div class="style-guide-variant-row">
            <button class="hds-btn hds-btn--primary">Default</button>
            <button class="hds-btn hds-btn--primary is-hover">Hover</button>
            <button class="hds-btn hds-btn--primary is-active">Active</button>
            <button class="hds-btn hds-btn--primary is-focus">Focus</button>
            <button class="hds-btn hds-btn--primary is-disabled" disabled>Disabled</button>
          </div>`,
        `<!-- Default -->\n<button class="hds-btn hds-btn--primary">Label</button>\n<!-- Hover -->\n<button class="hds-btn hds-btn--primary is-hover">Label</button>\n<!-- Active -->\n<button class="hds-btn hds-btn--primary is-active">Label</button>\n<!-- Focus -->\n<button class="hds-btn hds-btn--primary is-focus">Label</button>\n<!-- Disabled -->\n<button class="hds-btn hds-btn--primary" disabled>Label</button>`
      ) },
      { label: 'Size', content: playground(
        `          <div class="style-guide-variant-row">
            <button class="hds-btn hds-btn--primary hds-btn--xs">X-Small</button>
            <button class="hds-btn hds-btn--primary hds-btn--sm">Small</button>
            <button class="hds-btn hds-btn--primary">Medium</button>
            <button class="hds-btn hds-btn--primary hds-btn--lg">Large</button>
          </div>`,
        `<button class="hds-btn hds-btn--primary hds-btn--xs">Label</button>
<button class="hds-btn hds-btn--primary hds-btn--sm">Label</button>
<button class="hds-btn hds-btn--primary">Label</button>
<button class="hds-btn hds-btn--primary hds-btn--lg">Label</button>`
      ) },
      { label: 'Block', content: playground(
        `          <button class="hds-btn hds-btn--primary hds-btn--block">Label</button>`,
        '<button class="hds-btn hds-btn--primary hds-btn--block">Label</button>'
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
            <button class="hds-btn-icon" aria-label="Settings">&#9881;</button>
            <button class="hds-btn-icon" aria-label="Close">&#10005;</button>
            <button class="hds-btn-icon" aria-label="Menu">&#9776;</button>
          </div>`,
        '<button class="hds-btn-icon" aria-label="Settings">&#9881;</button>'
      ) },
      { label: 'Size', content: playground(
        `          <div class="style-guide-variant-row">
            <button class="hds-btn-icon hds-btn-icon--xs" aria-label="Extra small">&#9881;</button>
            <button class="hds-btn-icon hds-btn-icon--sm" aria-label="Small">&#9881;</button>
            <button class="hds-btn-icon" aria-label="Medium">&#9881;</button>
            <button class="hds-btn-icon hds-btn-icon--lg" aria-label="Large">&#9881;</button>
          </div>`,
        `<button class="hds-btn-icon hds-btn-icon--xs" aria-label="Action">&#9881;</button>
<button class="hds-btn-icon hds-btn-icon--sm" aria-label="Action">&#9881;</button>
<button class="hds-btn-icon" aria-label="Action">&#9881;</button>
<button class="hds-btn-icon hds-btn-icon--lg" aria-label="Action">&#9881;</button>`
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
            <div class="hds-btn-group">
              <button class="hds-btn hds-btn--secondary">Left</button>
              <button class="hds-btn hds-btn--secondary">Center</button>
              <button class="hds-btn hds-btn--secondary">Right</button>
            </div>
          </div>`,
        `<div class="hds-btn-group">
  <button class="hds-btn hds-btn--secondary">Left</button>
  <button class="hds-btn hds-btn--secondary">Center</button>
  <button class="hds-btn hds-btn--secondary">Right</button>
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
            <button class="hds-chip hds-chip--active">Active</button>
            <button class="hds-chip">Inactive</button>
          </div>`,
        `<button class="hds-chip hds-chip--active">Active</button>
<button class="hds-chip">Inactive</button>`
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
            <span class="hds-badge">Default</span>
            <span class="hds-badge hds-badge--success">Success</span>
            <span class="hds-badge hds-badge--warning">Warning</span>
            <span class="hds-badge hds-badge--danger">Danger</span>
            <span class="hds-badge hds-badge--info">Info</span>
          </div>`,
        `<span class="hds-badge">Default</span>
<span class="hds-badge hds-badge--success">Success</span>
<span class="hds-badge hds-badge--warning">Warning</span>
<span class="hds-badge hds-badge--danger">Danger</span>
<span class="hds-badge hds-badge--info">Info</span>`
      ) },
      { label: 'Stat', content: playground(
        `          <div>
            <div class="hds-stack hds-stack--lg">
              <div class="hds-grid hds-grid--3">
                <div class="hds-stat">
                  <div class="hds-stat-value">1,234</div>
                  <div class="hds-stat-label">Total Users</div>
                </div>
                <div class="hds-stat">
                  <div class="hds-stat-value">98<span class="hds-stat-unit">%</span></div>
                  <div class="hds-stat-label">Uptime</div>
                  <div class="hds-stat-delta hds-stat-delta--positive">+2.3%</div>
                </div>
                <div class="hds-stat">
                  <div class="hds-stat-value">42ms</div>
                  <div class="hds-stat-label">Response Time</div>
                  <div class="hds-stat-delta hds-stat-delta--negative">-5ms</div>
                </div>
              </div>
            </div>
          </div>`,
        `<div class="hds-stat">
  <div class="hds-stat-value">98<span class="hds-stat-unit">%</span></div>
  <div class="hds-stat-label">Uptime</div>
  <div class="hds-stat-delta hds-stat-delta--positive">+2.3%</div>
</div>`
      ) },
      { label: 'Key-Value', content: playground(
        `          <div>
            <div class="hds-stack hds-stack--lg">
              <div>
                <div class="hds-kv"><span class="hds-kv-key">Version</span><span class="hds-kv-value">2.4.1</span></div>
                <div class="hds-kv"><span class="hds-kv-key">Status</span><span class="hds-kv-value">Active</span></div>
                <div class="hds-kv"><span class="hds-kv-key">Last Deploy</span><span class="hds-kv-value">2 hours ago</span></div>
              </div>
            </div>
          </div>`,
        `<div class="hds-kv">
  <span class="hds-kv-key">Version</span>
  <span class="hds-kv-value">2.4.1</span>
</div>`
      ) },
      { label: 'List', content: playground(
        `          <div>
            <div class="hds-stack hds-stack--lg">
              <div>
                <div class="hds-list-item">First list item</div>
                <div class="hds-list-item">Second list item</div>
                <div class="hds-list-item">Third list item</div>
              </div>
            </div>
          </div>`,
        '<div class="hds-list-item">List item</div>'
      ) },
      { label: 'Progress', content: playground(
        `          <div>
            <div class="hds-stack hds-stack--lg">
              <div class="hds-stack hds-stack--sm">
                <div class="hds-progress"><div class="hds-progress-bar" style="width: 75%"></div></div>
                <div class="hds-progress"><div class="hds-progress-bar" style="width: 45%"></div></div>
                <div class="hds-progress"><div class="hds-progress-bar" style="width: 90%"></div></div>
              </div>
            </div>
          </div>`,
        `<div class="hds-progress">
  <div class="hds-progress-bar" style="width: 75%"></div>
</div>`
      ) },
    ],
  });
}

function collapsibleContent() {
  return componentPage('Collapsible', {
    description: 'A disclosure widget built with native <details> and <summary> elements. Reveals hidden content on click — no JavaScript needed.',
    dimensions: [
      { label: 'States', content: playground(
        `          <div class="hds-stack hds-stack--lg">
            <details class="collapsible">
              <summary>Collapsed</summary>
              <div>Hidden content revealed when expanded.</div>
            </details>
            <details class="collapsible" open>
              <summary>Open by Default</summary>
              <div>This section starts expanded. Click the header to collapse it.</div>
            </details>
          </div>`,
        `<details class="collapsible">
  <summary>Collapsed</summary>
  <div>Content here.</div>
</details>

<details class="collapsible" open>
  <summary>Open by Default</summary>
  <div>Content here.</div>
</details>`
      ) },
    ],
  });
}

function dividerContent() {
  return componentPage('Divider', {
    description: 'A horizontal rule that separates content into distinct sections. Pair with section headers for labeled divisions.',
    dimensions: [
      { label: 'Type', content: playground(
        `          <div class="hds-stack hds-stack--lg">
            <hr class="divider">
            <div class="hds-section-header">Section Header</div>
          </div>`,
        `<hr class="divider">
<div class="hds-section-header">Section Header</div>`
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
            <div class="hds-stack hds-stack--lg">
              <div class="hds-stack hds-stack--sm">
                <div class="hds-status-msg hds-status-msg--success">Operation completed successfully.</div>
                <div class="hds-status-msg hds-status-msg--error">Something went wrong. Please try again.</div>
                <div class="hds-status-msg hds-status-msg--warning">Your session will expire in 5 minutes.</div>
                <div class="hds-status-msg hds-status-msg--info">A new version is available.</div>
              </div>
            </div>
          </div>`,
        `<div class="hds-status-msg hds-status-msg--success">Operation completed successfully.</div>
<div class="hds-status-msg hds-status-msg--error">Something went wrong. Please try again.</div>`
      ) },
      { label: 'Empty State', content: playground(
        `          <div>
            <div class="hds-stack hds-stack--lg">
              <div class="hds-empty-state">
                <div class="hds-empty-state-title">No results found</div>
                <div class="hds-empty-state-description">Try adjusting your search or filters.</div>
              </div>
            </div>
          </div>`,
        `<div class="hds-empty-state">
  <div class="hds-empty-state-title">No results found</div>
  <div class="hds-empty-state-description">Try adjusting your search or filters.</div>
</div>`
      ) },
      { label: 'Spinner', content: playground(
        `          <div>
            <div class="hds-stack hds-stack--lg">
              <div class="hds-cluster">
                <div class="hds-spinner"></div>
                <span class="body-sm text-muted">Loading...</span>
              </div>
            </div>
          </div>`,
        '<div class="hds-spinner"></div>'
      ) },
      { label: 'Skeleton', content: playground(
        `          <div>
            <div class="hds-stack hds-stack--lg">
              <div class="hds-stack hds-stack--sm">
                <div class="hds-skeleton" style="height: 16px; width: 60%"></div>
                <div class="hds-skeleton" style="height: 16px; width: 80%"></div>
                <div class="hds-skeleton" style="height: 16px; width: 40%"></div>
              </div>
            </div>
          </div>`,
        '<div class="hds-skeleton" style="height: 16px; width: 60%"></div>'
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
            <div class="hds-form-file hds-form-file--xs">
              <input type="file" id="file-xs">
              <label class="hds-form-file-trigger" for="file-xs">X-Small</label>
            </div>
            <div class="hds-form-file hds-form-file--sm">
              <input type="file" id="file-sm">
              <label class="hds-form-file-trigger" for="file-sm">Small</label>
            </div>
            <div class="hds-form-file">
              <input type="file" id="file-md">
              <label class="hds-form-file-trigger" for="file-md">Medium</label>
            </div>
            <div class="hds-form-file hds-form-file--lg">
              <input type="file" id="file-lg">
              <label class="hds-form-file-trigger" for="file-lg">Large</label>
            </div>
          </div>`,
        `<div class="hds-form-file hds-form-file--xs"><input type="file" id="f-xs"><label class="hds-form-file-trigger" for="f-xs">Choose file</label></div>
<div class="hds-form-file hds-form-file--sm"><input type="file" id="f-sm"><label class="hds-form-file-trigger" for="f-sm">Choose file</label></div>
<div class="hds-form-file"><input type="file" id="f-md"><label class="hds-form-file-trigger" for="f-md">Choose file</label></div>
<div class="hds-form-file hds-form-file--lg"><input type="file" id="f-lg"><label class="hds-form-file-trigger" for="f-lg">Choose file</label></div>`
      ) },
    ],
  });
}

function iconContent() {
  return componentPage('Icon', {
    description: 'A sized container for inline SVG icons. Three sizes map directly to base scale tokens: 16, 20 (default), and 24.',
    dimensions: [
      { label: 'Size', content: playground(
        `          <div class="style-guide-variant-row">
            <span class="hds-icon hds-icon--sm"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6.25"/></svg></span>
            <span class="hds-icon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="8.25"/></svg></span>
            <span class="hds-icon hds-icon--lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10.25"/></svg></span>
          </div>`,
        `<span class="hds-icon hds-icon--sm"><!-- 16×16 --></span>
<span class="hds-icon"><!-- 20×20 (default) --></span>
<span class="hds-icon hds-icon--lg"><!-- 24×24 --></span>`
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
            <input class="hds-form-input hds-form-input--xs hds-col-span-2" type="text" placeholder="X-Small">
            <input class="hds-form-input hds-form-input--sm hds-col-span-2" type="text" placeholder="Small">
            <input class="hds-form-input hds-col-span-2" type="text" placeholder="Medium">
            <input class="hds-form-input hds-form-input--lg hds-col-span-2" type="text" placeholder="Large">
          </div>`,
        '<input class="hds-form-input" type="text" placeholder="Placeholder">'
      ) },
      { label: 'States', content: playground(
        `          <div class="style-guide-variant-row">
            <input class="hds-form-input hds-col-span-2" type="text" placeholder="Default">
            <input class="hds-form-input is-hover hds-col-span-2" type="text" placeholder="Hover">
            <input class="hds-form-input is-focus hds-col-span-2" type="text" placeholder="Focus">
            <input class="hds-form-input is-disabled hds-col-span-2" type="text" placeholder="Disabled" disabled>
          </div>`,
        `<div class="hds-form-group">
  <label class="hds-form-label">Email</label>
  <input class="hds-form-input hds-form-input--error" type="text" value="not-an-email">
  <span class="hds-form-hint hds-form-hint--error">Please enter a valid email address</span>
</div>`
      ) },
      { label: 'Validation', content: playground(
        `          <div class="style-guide-variant-row">
            <div class="hds-form-group hds-col-span-3">
              <label class="hds-form-label">Email</label>
              <input class="hds-form-input hds-form-input--error" type="text" placeholder="Enter email" value="not-an-email">
              <span class="hds-form-hint hds-form-hint--error">Please enter a valid email address</span>
            </div>
            <div class="hds-form-group hds-col-span-3">
              <label class="hds-form-label">Username</label>
              <input class="hds-form-input hds-form-input--success" type="text" placeholder="Choose username" value="keithbarney">
              <span class="hds-form-hint hds-form-hint--success">Username is available</span>
            </div>
          </div>`,
        `<div class="hds-form-group">
  <label class="hds-form-label">Email</label>
  <input class="hds-form-input hds-form-input--error" type="text" value="not-an-email">
  <span class="hds-form-hint hds-form-hint--error">Please enter a valid email address</span>
</div>`
      ) },
      { label: 'Textarea', content: playground(
        `          <div class="hds-col-span-4">
            <textarea class="hds-form-input hds-form-textarea" placeholder="Write something..."></textarea>
          </div>`,
        '<textarea class="hds-form-input hds-form-textarea" placeholder="Write something..."></textarea>'
      ) },
      { label: 'Form Group', content: playground(
        `          <div class="hds-form-group hds-col-span-3">
            <label class="hds-form-label">Label</label>
            <input class="hds-form-input" type="text" placeholder="Placeholder">
            <span class="hds-form-hint">Hint text goes here</span>
          </div>`,
        `<div class="hds-form-group">
  <label class="hds-form-label">Label</label>
  <input class="hds-form-input" type="text" placeholder="Placeholder">
  <span class="hds-form-hint">Hint text goes here</span>
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
            <a class="hds-nav-link hds-nav-link--active" href="#">Dashboard</a>
            <a class="hds-nav-link" href="#">Settings</a>
            <a class="hds-nav-link" href="#">Profile</a>
          </div>`,
        `<nav>
  <a class="hds-nav-link hds-nav-link--active" href="#">Dashboard</a>
  <a class="hds-nav-link" href="#">Settings</a>
  <a class="hds-nav-link" href="#">Profile</a>
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
            <label class="hds-search hds-search--xs hds-col-span-2"><input type="search" placeholder="X-Small"></label>
            <label class="hds-search hds-search--sm hds-col-span-2"><input type="search" placeholder="Small"></label>
            <label class="hds-search hds-col-span-2"><input type="search" placeholder="Medium"></label>
            <label class="hds-search hds-search--lg hds-col-span-2"><input type="search" placeholder="Large"></label>
          </div>`,
        `<label class="hds-search hds-search--xs"><input type="search" placeholder="Search..."></label>
<label class="hds-search hds-search--sm"><input type="search" placeholder="Search..."></label>
<label class="hds-search"><input type="search" placeholder="Search..."></label>
<label class="hds-search hds-search--lg"><input type="search" placeholder="Search..."></label>`
      ) },
      { label: 'States', content: playground(
        `          <div class="style-guide-variant-row">
            <label class="hds-search hds-col-span-2"><input type="search" placeholder="Default"></label>
            <label class="hds-search is-hover hds-col-span-2"><input type="search" placeholder="Hover"></label>
            <label class="hds-search is-focus hds-col-span-2"><input type="search" placeholder="Focus"></label>
            <label class="hds-search is-disabled hds-col-span-2"><input type="search" placeholder="Disabled" disabled></label>
          </div>`,
        `<!-- Default -->\n<label class="hds-search"><input type="search" placeholder="Search..."></label>\n<!-- Hover -->\n<label class="hds-search is-hover"><input type="search" placeholder="Search..."></label>\n<!-- Focus -->\n<label class="hds-search is-focus"><input type="search" placeholder="Search..."></label>\n<!-- Disabled -->\n<label class="hds-search" disabled><input type="search" placeholder="Search..." disabled></label>`
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
            <select class="hds-select hds-select--xs hds-col-span-2"><option>X-Small</option></select>
            <select class="hds-select hds-select--sm hds-col-span-2"><option>Small</option></select>
            <select class="hds-select hds-col-span-2"><option>Medium</option></select>
            <select class="hds-select hds-select--lg hds-col-span-2"><option>Large</option></select>
          </div>`,
        `<select class="hds-select hds-select--xs"><option>X-Small</option></select>
<select class="hds-select hds-select--sm"><option>Small</option></select>
<select class="hds-select"><option>Medium</option></select>
<select class="hds-select hds-select--lg"><option>Large</option></select>`
      ) },
      { label: 'States', content: playground(
        `          <div class="style-guide-variant-row">
            <select class="hds-select hds-col-span-2"><option>Default</option></select>
            <select class="hds-select is-hover hds-col-span-2"><option>Hover</option></select>
            <select class="hds-select is-focus hds-col-span-2"><option>Focus</option></select>
            <select class="hds-select is-disabled hds-col-span-2" disabled><option>Disabled</option></select>
          </div>`,
        `<!-- Default -->\n<select class="hds-select"><option>Select an option</option></select>\n<!-- Hover -->\n<select class="hds-select is-hover"><option>Select an option</option></select>\n<!-- Focus -->\n<select class="hds-select is-focus"><option>Select an option</option></select>\n<!-- Disabled -->\n<select class="hds-select" disabled><option>Select an option</option></select>`
      ) },
      { label: 'Form Group', content: playground(
        `          <div class="hds-form-group hds-col-span-3">
            <label class="hds-form-label">Label</label>
            <select class="hds-select"><option>Select an option</option></select>
            <span class="hds-form-hint">Hint text goes here</span>
          </div>`,
        `<div class="hds-form-group">
  <label class="hds-form-label">Label</label>
  <select class="hds-select">
    <option>Select an option</option>
  </select>
  <span class="hds-form-hint">Hint text goes here</span>
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
            <div class="hds-tabs">
              <button class="hds-tab hds-tab--active">Overview</button>
              <button class="hds-tab">Details</button>
              <button class="hds-tab">Settings</button>
            </div>
          </div>`,
        `<div class="hds-tabs">
  <button class="hds-tab hds-tab--active">Overview</button>
  <button class="hds-tab">Details</button>
  <button class="hds-tab">Settings</button>
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
            <label class="hds-form-toggle">
              <input type="checkbox">
              <span class="hds-form-toggle-track"></span>
              <span>Off</span>
            </label>
            <label class="hds-form-toggle">
              <input type="checkbox" checked>
              <span class="hds-form-toggle-track"></span>
              <span>On</span>
            </label>
          </div>`,
        `<label class="hds-form-toggle">
  <input type="checkbox">
  <span class="hds-form-toggle-track"></span>
  <span>Off</span>
</label>`
      ) },
      { label: 'Checkbox', content: playground(
        `          <div>
            <div class="hds-stack">
              <div class="hds-form-check">
                <input class="hds-form-check-input" type="checkbox" id="check1" checked>
                <label class="hds-form-label" for="check1">Checkbox option</label>
              </div>
            </div>
          </div>`,
        `<div class="hds-form-check">
  <input class="hds-form-check-input" type="checkbox" id="check1">
  <label class="hds-form-label" for="check1">Checkbox option</label>
</div>`
      ) },
      { label: 'Radio', content: playground(
        `          <div>
            <div class="hds-stack">
              <div class="hds-form-check">
                <input class="hds-form-check-input" type="radio" name="radio" id="radio1" checked>
                <label class="hds-form-label" for="radio1">Radio option A</label>
              </div>
              <div class="hds-form-check">
                <input class="hds-form-check-input" type="radio" name="radio" id="radio2">
                <label class="hds-form-label" for="radio2">Radio option B</label>
              </div>
            </div>
          </div>`,
        `<div class="hds-form-check">
  <input class="hds-form-check-input" type="radio" name="group" id="radio1">
  <label class="hds-form-label" for="radio1">Radio option A</label>
</div>`
      ) },
    ],
  });
}

function formValidationContent() {
  return componentPage('Form Validation', {
    description: 'Client-side validation pattern for form fields. Uses data attributes to declare validation rules and applies error/success states with hint text on blur. Validates required fields, email format, minimum length, and select choices.',
    dimensions: [
      { label: 'Type', content: `          <div class="hds-col-span-4">
            <div class="hds-stack">
              <div class="hds-form-group" data-validate="required">
                <label class="hds-form-label">Name</label>
                <input class="hds-form-input" type="text" placeholder="Enter your name">
                <span class="hds-form-hint">Required field</span>
              </div>
              <div class="hds-form-group" data-validate="email">
                <label class="hds-form-label">Email</label>
                <input class="hds-form-input" type="text" placeholder="Enter your email">
                <span class="hds-form-hint">Must be a valid email</span>
              </div>
              <div class="hds-form-group" data-validate="minlength" data-minlength="8">
                <label class="hds-form-label">Password</label>
                <input class="hds-form-input" type="password" placeholder="Choose a password">
                <span class="hds-form-hint">Minimum 8 characters</span>
              </div>
              <div class="hds-form-group" data-validate="select">
                <label class="hds-form-label">Role</label>
                <select class="hds-select">
                  <option value="">Select a role</option>
                  <option value="designer">Designer</option>
                  <option value="developer">Developer</option>
                  <option value="manager">Manager</option>
                </select>
                <span class="hds-form-hint">Choose one option</span>
              </div>
            </div>
          </div>
          ${codeBlock(`<div class="hds-form-group" data-validate="required">
  <label class="hds-form-label">Name</label>
  <input class="hds-form-input" type="text" placeholder="Enter your name">
  <span class="hds-form-hint">Required field</span>
</div>

<div class="hds-form-group" data-validate="email">
  <label class="hds-form-label">Email</label>
  <input class="hds-form-input" type="text" placeholder="Enter your email">
  <span class="hds-form-hint">Must be a valid email</span>
</div>`)}` },
    ],
  });
}

function searchPatternContent() {
  return componentPage('Search', {
    description: 'Interactive search pattern. Type in any field below to test the search component at different sizes and in different contexts.',
    dimensions: [
      { label: 'Type', content: `          <div>
            <div class="hds-stack hds-stack--lg">
              <label class="hds-search hds-search--lg"><input type="search" placeholder="Search everything..."></label>
            </div>
          </div>
          <div>
            <div class="hds-stack hds-stack--lg">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--hds-space-16); padding: var(--hds-space-16); background: var(--ui-surface-default); border-radius: var(--hds-radius-md);">
                <span class="style-guide-section-name" style="margin: 0;">App Name</span>
                <label class="hds-search hds-search--sm" style="flex: 1; max-width: 320px;"><input type="search" placeholder="Search..."></label>
                <button class="hds-btn hds-btn--tertiary hds-btn--sm">Settings</button>
              </div>
            </div>
          </div>
          <div>
            <div class="hds-stack hds-stack--lg">
              <div style="max-width: 280px; padding: var(--hds-space-16); background: var(--ui-surface-default); border-radius: var(--hds-radius-md);">
                <div class="hds-stack">
                  <label class="hds-search hds-search--sm"><input type="search" placeholder="Filter items..."></label>
                  <div class="hds-list-item">Dashboard</div>
                  <div class="hds-list-item">Projects</div>
                  <div class="hds-list-item">Settings</div>
                  <div class="hds-list-item">Profile</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div class="hds-stack hds-stack--lg">
              <label class="hds-search" style="display: flex;"><input type="search" placeholder="Search across all projects, files, and settings..."></label>
            </div>
          </div>
          <div>
            <div class="hds-stack hds-stack--lg">
              <label class="hds-search"><input type="search" placeholder="Search unavailable" disabled></label>
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
            <div class="hds-stack hds-stack--lg">
              <div class="hds-card" style="max-width: 360px;">
                <div class="hds-card-header">
                  <div class="hds-card-title">Card Title</div>
                  <div class="hds-card-subtitle">Optional subtitle or description</div>
                </div>
                <div class="hds-card-body">
                  <p>Card body content goes here. This is where the primary information or form fields live.</p>
                </div>
                <div class="hds-card-footer">
                  <div class="hds-cluster">
                    <button class="hds-btn hds-btn--sm">Cancel</button>
                    <button class="hds-btn hds-btn--primary hds-btn--sm">Save</button>
                  </div>
                </div>
              </div>
            </div>
          </div>`,
        `<div class="hds-card">
  <div class="hds-card-header">
    <div class="hds-card-title">Card Title</div>
    <div class="hds-card-subtitle">Optional subtitle</div>
  </div>
  <div class="hds-card-body">
    <p>Card body content</p>
  </div>
  <div class="hds-card-footer">
    <button class="hds-btn hds-btn--sm">Cancel</button>
    <button class="hds-btn hds-btn--primary hds-btn--sm">Save</button>
  </div>
</div>`
      ) },
      { label: 'Elevated', content: playground(
        `          <div>
            <div class="hds-stack hds-stack--lg">
              <div class="hds-card hds-card--elevated" style="max-width: 360px;">
                <div class="hds-card-body">
                  <div class="hds-card-title">Elevated Card</div>
                  <div class="hds-card-subtitle">Uses a shadow instead of a border for visual separation.</div>
                </div>
              </div>
            </div>
          </div>`,
        '<div class="hds-card hds-card--elevated">...</div>'
      ) },
      { label: 'Interactive', content: playground(
        `          <div>
            <div class="hds-stack hds-stack--lg">
              <div class="hds-card hds-card--interactive" style="max-width: 360px;">
                <div class="hds-card-body">
                  <div class="hds-card-title">Clickable Card</div>
                  <div class="hds-card-subtitle">Hover to see the lift effect. Use for items that navigate to a detail view.</div>
                </div>
              </div>
            </div>
          </div>`,
        '<div class="hds-card hds-card--interactive">...</div>'
      ) },
    ],
  });
}

function linkContent() {
  return componentPage('Link', {
    description: 'Inline text link for navigation. Underlined with a subtle decoration color that strengthens on hover.',
    dimensions: [
      { label: 'States', content: playground(
        `          <div class="hds-stack hds-stack--lg">
            <p><a href="#" class="hds-link">Default</a></p>
            <p><a href="#" class="hds-link is-hover">Hover</a></p>
            <p><a href="#" class="hds-link is-active">Active</a></p>
            <p><a href="#" class="hds-link is-focus">Focus</a></p>
            <p><a href="#" class="hds-link is-visited">Visited</a></p>
            <p><a class="hds-link is-disabled" aria-disabled="true">Disabled</a></p>
          </div>`,
        `<a href="#" class="hds-link">Link text</a>`
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
            <div class="hds-stack hds-stack--lg">
              <div style="position: relative; height: 320px; background: var(--ui-bg-default); border-radius: var(--hds-radius-md); overflow: hidden;">
                <div class="hds-modal-backdrop" style="position: absolute;">
                  <div class="hds-modal" style="max-width: 360px;">
                    <div class="hds-modal-header">
                      <div class="hds-modal-title">Confirm Action</div>
                    </div>
                    <div class="hds-modal-body">
                      <p>Are you sure you want to proceed? This action cannot be undone.</p>
                    </div>
                    <div class="hds-modal-footer">
                      <button class="hds-btn hds-btn--sm">Cancel</button>
                      <button class="hds-btn hds-btn--danger hds-btn--sm">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>`,
        `<div class="hds-modal-backdrop">
  <div class="hds-modal">
    <div class="hds-modal-header">
      <div class="hds-modal-title">Confirm Action</div>
    </div>
    <div class="hds-modal-body">
      <p>Are you sure you want to proceed?</p>
    </div>
    <div class="hds-modal-footer">
      <button class="hds-btn hds-btn--sm">Cancel</button>
      <button class="hds-btn hds-btn--danger hds-btn--sm">Delete</button>
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
  'breakpoints': () => breakpointsContent(),
  'animation': () => animationContent(),
  'breadcrumbs': () => breadcrumbsContent(),
  'button': () => buttonsContent(),
  'button-group': () => buttonGroupContent(),
  'button-icon': () => buttonIconContent(),
  'card': () => cardContent(),
  'chips': () => chipsContent(),
  'collapsible': () => collapsibleContent(),
  'data-display': () => dataDisplayContent(),
  'divider': () => dividerContent(),
  'feedback': () => feedbackContent(),
  'file-upload': () => fileUploadContent(),
  'icon': () => iconContent(),
  'inputs': () => inputsContent(),
  'link': () => linkContent(),
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
  const stalePages = ['animation.html', 'stats.html', 'files.html', 'tokens.html', 'base.html', 'alias.html', 'forms.html', 'navigation.html', 'foundations.html', 'components.html', 'buttons.html'];
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
