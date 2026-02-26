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

  // Parse UI scale
  const uiScale = [];
  if (scale && scale.ui) {
    for (const [name, token] of Object.entries(scale.ui)) {
      if (name.startsWith('$')) continue;
      uiScale.push({ token: `ui.${name}`, value: getNumericValue(token) });
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
      fontSizes.push({ name: `font-size.${name}`, css: `--font-size-${name}`, value: getNumericValue(token), ref: getRefName(token) });
    }
  }

  // Parse alias gaps
  const gaps = [];
  if (aliasSpacing && aliasSpacing.space) {
    for (const [name, token] of Object.entries(aliasSpacing.space)) {
      if (name.startsWith('$')) continue;
      gaps.push({ name: `spacing.${name}`, css: `--spacing-${name}`, value: getNumericValue(token) });
    }
  }

  // Parse alias radius
  const radii = [];
  if (aliasRadius && aliasRadius.container) {
    for (const [name, token] of Object.entries(aliasRadius.container)) {
      if (name.startsWith('$')) continue;
      radii.push({ name: `radius.${name}`, css: `--radius-${name}`, value: getNumericValue(token) });
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
    for (const [groupKey, variants] of Object.entries(uiLight.ui)) {
      if (groupKey.startsWith('$')) continue;
      const groupName = groupMap[groupKey] || groupKey;
      const tokens = [];
      for (const [variant, token] of Object.entries(variants)) {
        if (variant.startsWith('$')) continue;
        const tokenName = `ui.${groupKey}.${variant}`;
        const cssVar = `--ui-${groupKey}-${variant}`;
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
    colorFamilies, typeScale, uiScale,
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

const { esc, codeBlock, componentPage, foundationPage, wrapPage } = builder;

// ===== Content Functions =====

function colorsContent(tokens) {
  const colorSections = tokens.colorFamilies.map(f => {
    const rows = f.stops.map(s =>
      `                    <tr>
                      <td>${s.stop}</td>
                      <td><div class="style-guide-token-swatch" style="background: ${s.hex}"></div></td>
                      <td><span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('color.${f.name}.${s.stop}', this)">color.${f.name}.${s.stop}</span></td>
                      <td>${s.hex}</td>
                    </tr>`
    ).join('\n');
    return `            <h3 class="heavy-label">${f.name}</h3>
            <table class="style-guide-data-table style-guide-data-table--visual">
              <thead>
                <tr>
                  <th>Stop</th>
                  <th>Visual</th>
                  <th>Token</th>
                  <th>Hex</th>
                </tr>
              </thead>
              <tbody>
${rows}
              </tbody>
            </table>`;
  }).join('\n');

  const uiColorRows = tokens.uiColorGroups.map(group => {
    return group.tokens.map(t =>
      `                <tr>
                  <td><div class="style-guide-token-swatch" style="background: ${t.lightHex}"></div></td>
                  <td><span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('${esc(t.css)}', this)">${esc(t.name)}</span></td>
                  <td class="body-xsm">${esc(t.lightRef)}</td>
                  <td class="body-xsm">${esc(t.darkRef)}</td>
                </tr>`
    ).join('\n');
  }).join('\n');

  return foundationPage('Colors', [
    colorSections,
    `          <h3 class="heavy-label">UI Colors</h3>
          <table class="style-guide-data-table style-guide-data-table--visual">
            <thead>
              <tr>
                <th>Visual</th>
                <th>Token</th>
                <th>Light</th>
                <th>Dark</th>
              </tr>
            </thead>
            <tbody>
${uiColorRows}
            </tbody>
          </table>`,
  ]);
}

function typographyContent(tokens) {
  const familyRows = tokens.fontFamilies.map(f =>
    `                <tr>
                  <td><span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('${esc(f.token)}', this)">${esc(f.token)}</span></td>
                  <td>${esc(f.value)}</td>
                </tr>`
  ).join('\n');

  const weightRows = tokens.fontWeights.map(w =>
    `                <tr>
                  <td><span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('${esc(w.token)}', this)">${esc(w.token)}</span></td>
                  <td><span style="font-size: var(--font-size-body-xlg); font-weight: ${w.value}">Aa</span></td>
                  <td>${w.value}</td>
                </tr>`
  ).join('\n');

  const fontSizeRows = tokens.fontSizes.map(f => {
    return `                <tr>
                  <td><span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('${esc(f.css)}', this)">${esc(f.name)}</span></td>
                  <td><span style="font-size: ${f.value}">Aa</span></td>
                  <td class="body-xsm text-muted">${f.ref}</td>
                  <td>${f.value}</td>
                </tr>`;
  }).join('\n');

  return foundationPage('Typography', [
    `          <h3 class="heavy-label">Font Families</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${familyRows}
            </tbody>
          </table>`,
    `          <h3 class="heavy-label">Font Weights</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Sample</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${weightRows}
            </tbody>
          </table>`,
    `          <h3 class="heavy-label">Font Sizes</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Sample</th>
                <th>Base Token</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${fontSizeRows}
            </tbody>
          </table>`,
  ]);
}

function spacingContent(tokens) {
  const uiRows = tokens.uiScale.map(t =>
    `                <tr>
                  <td><span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('${esc(t.token)}', this)">${esc(t.token)}</span></td>
                  <td><div class="style-guide-token-bar" style="width: ${t.value}"></div></td>
                  <td>${t.value}</td>
                </tr>`
  ).join('\n');

  const gapUiMap = {
    'spacing.none': 'ui.0',
    'spacing.xxs': 'ui.2',
    'spacing.xsm': 'ui.4',
    'spacing.sm': 'ui.8',
    'spacing.md': 'ui.12',
    'spacing.lg': 'ui.16',
    'spacing.xl': 'ui.24',
    'spacing.2xl': 'ui.32',
    'spacing.3xl': 'ui.48'
  };
  const gapRows = tokens.gaps.map(g =>
    `                <tr>
                  <td><span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('${esc(g.css)}', this)">${esc(g.name)}</span></td>
                  <td><div class="style-guide-token-bar" style="width: ${g.value}"></div></td>
                  <td class="body-xsm text-muted">${gapUiMap[g.name] || ''}</td>
                  <td>${g.value}</td>
                </tr>`
  ).join('\n');

  return foundationPage('Spacing', [
    `          <h3 class="heavy-label">UI Scale</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Visual</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${uiRows}
            </tbody>
          </table>`,
    `          <h3 class="heavy-label">Spacing Aliases</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Visual</th>
                <th>Base Token</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${gapRows}
            </tbody>
          </table>`,
  ]);
}

function radiusContent(tokens) {
  const radiusUiMap = {
    'radius.none': 'ui.0',
    'radius.sm': 'ui.4',
    'radius.md': 'ui.8',
    'radius.lg': 'ui.12',
    'radius.full': '\u2014'
  };
  const radiusRows = tokens.radii.map(r =>
    `                <tr>
                  <td><span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('${esc(r.css)}', this)">${esc(r.name)}</span></td>
                  <td><div class="style-guide-token-radius-sample" style="border-radius: ${r.value}"></div></td>
                  <td class="body-xsm text-muted">${radiusUiMap[r.name] || ''}</td>
                  <td>${r.value}</td>
                </tr>`
  ).join('\n');

  return foundationPage('Radius', [
    `          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Visual</th>
                <th>Base Token</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${radiusRows}
            </tbody>
          </table>`,
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
    ['.heavy-grid', 'Base grid container', 'gap: var(--grid-gutter)'],
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
    ['.heavy-center', 'max-inline-size', 'var(--measure) / 65ch'],
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

  return foundationPage('Layout', [
    `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">CSS Grid and flexbox layout primitives for building page structure. Includes grid systems, stacks, clusters, sidebars, centering, cover layouts, boxes, measure utilities, breakpoints, cards, collapsibles, and dividers.</p></div>`,
    `          <h3 class="heavy-label">Grid</h3>
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
          <h3 class="heavy-label" id="stack">Stack</h3>
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
          <h3 class="heavy-label" id="cluster">Cluster</h3>
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
          <h3 class="heavy-label" id="sidebar-layout">Sidebar</h3>
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
          <h3 class="heavy-label" id="center">Center</h3>
          <div>
            <div class="style-guide-demo" style="background: var(--ui-surface-default)">
              <div class="heavy-center" style="background: var(--ui-bg-default); padding: var(--space-16); border-radius: var(--radius-sm); text-align: center;">
                <span class="body-xsm text-muted">Centered \u2014 max-width: var(--measure)</span>
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
          <h3 class="heavy-label" id="cover">Cover</h3>
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
          <h3 class="heavy-label" id="box">Box</h3>
          <div>
            <div class="style-guide-demo" style="display: flex; gap: var(--space-16); flex-wrap: wrap; align-items: start">
              <div class="heavy-box--sm" style="background: var(--ui-surface-default); border-radius: var(--radius-sm)">
                <div class="style-guide-demo-box">.heavy-box--sm</div>
              </div>
              <div class="heavy-box" style="background: var(--ui-surface-default); border-radius: var(--radius-sm)">
                <div class="style-guide-demo-box">.heavy-box</div>
              </div>
              <div class="heavy-box--lg" style="background: var(--ui-surface-default); border-radius: var(--radius-sm)">
                <div class="style-guide-demo-box">.heavy-box--lg</div>
              </div>
              <div class="heavy-box--xl" style="background: var(--ui-surface-default); border-radius: var(--radius-sm)">
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
          <h3 class="heavy-label" id="measure">Measure</h3>
          <div>
            <div class="style-guide-demo">
              <div class="heavy-stack">
                <div class="measure-narrow" style="background: var(--ui-surface-default); padding: var(--space-8); border-radius: var(--radius-sm)">
                  <div class="style-guide-demo-box">.measure-narrow (45ch)</div>
                </div>
                <div class="measure" style="background: var(--ui-surface-default); padding: var(--space-8); border-radius: var(--radius-sm)">
                  <div class="style-guide-demo-box">.measure (65ch)</div>
                </div>
                <div class="measure-wide" style="background: var(--ui-surface-default); padding: var(--space-8); border-radius: var(--radius-sm)">
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
          <h3 class="heavy-label" id="breakpoints">Breakpoints</h3>
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
          <h3 class="heavy-label" id="cards">Cards</h3>
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
                    <p class="body-sm text-muted" style="margin-top: var(--space-4)">No border, shadow only.</p>
                  </div>
                </div>
                <div class="heavy-card heavy-card--interactive">
                  <div class="heavy-card-body">
                    <div class="heavy-card-title">Interactive Card</div>
                    <p class="body-sm text-muted" style="margin-top: var(--space-4)">Hover to see effect.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <h3 class="heavy-label" id="collapsibles">Collapsibles</h3>
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
          <h3 class="heavy-label" id="dividers">Dividers</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <hr class="divider">
              <div class="heavy-section-header">Section Header</div>
            </div>
          </div>`,
    `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="animation.html">Animation</a></strong> — For motion and transition utilities.</li>
            </ul>
          </div>`,
  ]);
}

function animationContent() {
  return foundationPage('Animation', [
    `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">Motion tokens and utility classes for consistent animation across the system. Includes timing functions, named keyframes, ready-made animation classes, and a stagger utility for sequencing children.</p></div>`,
    `          <h3 class="heavy-label">Timing Functions</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-stack heavy-stack--sm">
                <div class="heavy-kv"><span class="heavy-kv-key">--ease-out</span><span class="heavy-kv-value">cubic-bezier(0.16, 1, 0.3, 1)</span></div>
                <div class="heavy-kv"><span class="heavy-kv-key">--ease-in-out</span><span class="heavy-kv-value">cubic-bezier(0.45, 0, 0.55, 1)</span></div>
                <div class="heavy-kv"><span class="heavy-kv-key">--ease-spring</span><span class="heavy-kv-value">cubic-bezier(0.34, 1.56, 0.64, 1)</span></div>
              </div>
            </div>
          </div>
          <h3 class="heavy-label">Keyframes</h3>
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
          <h3 class="heavy-label">Utility Classes</h3>
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
          <h3 class="heavy-label">Stagger Children</h3>
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
    `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="layout.html">Layout</a></strong> — For grid, spacing, and structural layout utilities.</li>
            </ul>
          </div>`,
  ]);
}

function breadcrumbsContent() {
  return componentPage('Breadcrumbs', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">A horizontal trail of links showing the user's location within a site hierarchy. Helps users navigate back to parent pages without using the browser's back button.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>The site has three or more levels of hierarchy.</li>
              <li>Users need to navigate back to parent sections frequently.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Flat sites</strong> — If all pages are at the same level, breadcrumbs add noise.</li>
              <li><strong>Linear flows</strong> — Multi-step wizards or checkout flows should use a stepper, not breadcrumbs.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Default</h3>
          <div>
            <div class="heavy-breadcrumbs">
              <a class="heavy-breadcrumbs-link" href="#">Home</a>
              <span class="heavy-breadcrumbs-separator">/</span>
              <a class="heavy-breadcrumbs-link" href="#">Projects</a>
              <span class="heavy-breadcrumbs-separator">/</span>
              <span class="heavy-breadcrumbs-current">Design System</span>
            </div>
          </div>
          ${codeBlock(`<nav class="heavy-breadcrumbs">
  <a class="heavy-breadcrumbs-link" href="#">Home</a>
  <span class="heavy-breadcrumbs-separator">/</span>
  <a class="heavy-breadcrumbs-link" href="#">Projects</a>
  <span class="heavy-breadcrumbs-separator">/</span>
  <span class="heavy-breadcrumbs-current">Design System</span>
</nav>`)}`,
    content: `          <h3 class="heavy-label">Content</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Current page is text, not a link</strong> — The last item in the trail should never be clickable.</li>
              <li><strong>Use "/" as separator</strong> — Keeps the trail compact and universally understood.</li>
              <li><strong>Match page titles exactly</strong> — Breadcrumb labels must match the destination page's heading.</li>
            </ul>
          </div>`,
    keyboard: `          <h3 class="heavy-label">Keyboard</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>Tab</code></td>
                <td>Moves focus between breadcrumb links</td>
              </tr>
              <tr>
                <td><code>Enter</code></td>
                <td>Navigates to the focused breadcrumb link</td>
              </tr>
            </tbody>
          </table>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="nav-links.html">Nav Links</a></strong> — For primary navigation between top-level pages.</li>
              <li><strong><a href="tabs.html">Tabs</a></strong> — For switching between views within the same page.</li>
            </ul>
          </div>`,
  });
}

function buttonsContent() {
  return componentPage('Button', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">Trigger actions or navigate. Four style variants establish visual hierarchy — primary for the main call to action, secondary for supporting actions, tertiary for low-emphasis options, and danger for destructive operations.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>To trigger an action — submit a form, open a dialog, delete a record, confirm a choice.</li>
              <li>As the primary call to action on a page or within a section.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Navigation</strong> — Use <code>a</code> elements or nav links to move between pages. Buttons that navigate confuse assistive technology.</li>
              <li><strong>Inline text actions</strong> — Use a text link instead. Buttons inside paragraphs disrupt reading flow.</li>
              <li><strong>Selection</strong> — Use chips, toggles, or radio buttons for choosing between options.</li>
              <li><strong>Icon-only actions</strong> — Use a <a href="button-icon.html">button icon</a> instead.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Primary</h3>
          <div class="style-guide-variants">
            <button class="heavy-btn heavy-btn--primary">Default</button>
            <button class="heavy-btn heavy-btn--primary is-hover">Hover</button>
            <button class="heavy-btn heavy-btn--primary is-active">Active</button>
            <button class="heavy-btn heavy-btn--primary is-disabled" disabled>Disabled</button>
          </div>
          ${codeBlock('<button class="heavy-btn heavy-btn--primary">Label</button>')}
          <h3 class="heavy-label">Secondary</h3>
          <div class="style-guide-variants">
            <button class="heavy-btn heavy-btn--secondary">Default</button>
            <button class="heavy-btn heavy-btn--secondary is-hover">Hover</button>
            <button class="heavy-btn heavy-btn--secondary is-active">Active</button>
            <button class="heavy-btn heavy-btn--secondary is-disabled" disabled>Disabled</button>
          </div>
          ${codeBlock('<button class="heavy-btn heavy-btn--secondary">Label</button>')}
          <h3 class="heavy-label">Tertiary</h3>
          <div class="style-guide-variants">
            <button class="heavy-btn heavy-btn--tertiary">Default</button>
            <button class="heavy-btn heavy-btn--tertiary is-hover">Hover</button>
            <button class="heavy-btn heavy-btn--tertiary is-active">Active</button>
            <button class="heavy-btn heavy-btn--tertiary is-disabled" disabled>Disabled</button>
          </div>
          ${codeBlock('<button class="heavy-btn heavy-btn--tertiary">Label</button>')}
          <h3 class="heavy-label">Danger</h3>
          <div class="style-guide-variants">
            <button class="heavy-btn heavy-btn--danger">Default</button>
            <button class="heavy-btn heavy-btn--danger is-hover">Hover</button>
            <button class="heavy-btn heavy-btn--danger is-active">Active</button>
            <button class="heavy-btn heavy-btn--danger is-disabled" disabled>Disabled</button>
          </div>
          ${codeBlock('<button class="heavy-btn heavy-btn--danger">Label</button>')}`,
    formatting: `          <h3 class="heavy-label">Sizes</h3>
          <div class="style-guide-variants">
            <button class="heavy-btn heavy-btn--primary heavy-btn--xs">X-Small</button>
            <button class="heavy-btn heavy-btn--primary heavy-btn--sm">Small</button>
            <button class="heavy-btn heavy-btn--primary">Medium</button>
            <button class="heavy-btn heavy-btn--primary heavy-btn--lg">Large</button>
          </div>
          ${codeBlock(`<button class="heavy-btn heavy-btn--primary heavy-btn--xs">Label</button>
<button class="heavy-btn heavy-btn--primary heavy-btn--sm">Label</button>
<button class="heavy-btn heavy-btn--primary">Label</button>
<button class="heavy-btn heavy-btn--primary heavy-btn--lg">Label</button>`)}
          <h3 class="heavy-label">Block</h3>
          <div>
            <button class="heavy-btn heavy-btn--primary heavy-btn--block">Block</button>
          </div>
          ${codeBlock('<button class="heavy-btn heavy-btn--primary heavy-btn--block">Label</button>')}`,
    usage: `          <h3 class="heavy-label">Usage Guidelines</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Primary</strong> — One per view. The main CTA. Use for the action you most want users to take.</li>
              <li><strong>Secondary</strong> — Supporting actions alongside a primary. "Cancel" next to "Save".</li>
              <li><strong>Tertiary</strong> — Low-emphasis actions. Toolbars, inline actions, filter controls.</li>
              <li><strong>Danger</strong> — Destructive actions only (delete, remove, disconnect). Always confirm.</li>
              <li><strong>Disabled</strong> — Show when an action exists but isn't available. Prefer hiding over disabling when possible.</li>
            </ul>
          </div>`,
    content: `          <h3 class="heavy-label">Content</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Use verbs</strong> — "Save", "Delete", "Export". Not "Okay", "Yes", "Submit".</li>
              <li><strong>Sentence case</strong> — Buttons use uppercase via CSS text-transform. Labels still authored in sentence case.</li>
              <li><strong>Max 3 words</strong> — "Save changes" not "Save all of your current changes".</li>
              <li><strong>Be specific</strong> — "Delete project" not "Delete". Context helps users confirm intent.</li>
              <li><strong>No periods</strong> — Button labels are not sentences.</li>
            </ul>
          </div>`,
    stringLength: `          <h3 class="heavy-label">String Length</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-cluster">
                <button class="heavy-btn heavy-btn--primary">OK</button>
                <button class="heavy-btn heavy-btn--primary">Save</button>
                <button class="heavy-btn heavy-btn--primary">Save changes</button>
                <button class="heavy-btn heavy-btn--primary">Save all current changes to project</button>
              </div>
              <div style="max-width: 200px">
                <button class="heavy-btn heavy-btn--primary heavy-btn--block">OK</button>
                <div style="margin-top: var(--space-8)"></div>
                <button class="heavy-btn heavy-btn--primary heavy-btn--block">Save all current changes to project</button>
              </div>
            </div>
          </div>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Short labels grow naturally</strong> — Buttons are inline-flex and size to their content. Single-word labels produce compact buttons.</li>
              <li><strong>Long labels stretch the button</strong> — There is no truncation or overflow. The button keeps growing, which breaks layouts. Keep labels to 3 words max.</li>
              <li><strong>Block buttons absorb any length</strong> — Full-width buttons handle long labels gracefully, but short labels leave excess whitespace.</li>
            </ul>
          </div>`,
    keyboard: `          <h3 class="heavy-label">Keyboard</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>Enter</code></td>
                <td>Activates the button</td>
              </tr>
              <tr>
                <td><code>Space</code></td>
                <td>Activates the button</td>
              </tr>
              <tr>
                <td><code>Tab</code></td>
                <td>Moves focus to the next focusable element</td>
              </tr>
              <tr>
                <td><code>Shift + Tab</code></td>
                <td>Moves focus to the previous focusable element</td>
              </tr>
            </tbody>
          </table>
          <div class="style-guide-guidelines">
            <ul>
              <li>Disabled buttons are removed from the tab order. Use <code>aria-disabled="true"</code> instead of the <code>disabled</code> attribute when the button needs to remain discoverable.</li>
            </ul>
          </div>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="button-icon.html">Button Icon</a></strong> — For compact, icon-only actions.</li>
              <li><strong><a href="button-group.html">Button Group</a></strong> — For grouping related actions.</li>
              <li><strong><a href="chips.html">Chips</a></strong> — For toggling filters or selecting from a set of options.</li>
              <li><strong><a href="nav-links.html">Nav Links</a></strong> — For navigating between pages or views.</li>
              <li><strong><a href="tabs.html">Tabs</a></strong> — For switching between content panels within a view.</li>
            </ul>
          </div>`,
  });
}

function buttonIconContent() {
  return componentPage('Button Icon', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">A compact button that communicates its action through an icon alone. Used for common, recognizable actions where a text label would add clutter.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>The action is universally understood from the icon (close, settings, menu, delete).</li>
              <li>Space is constrained — toolbars, table rows, card headers.</li>
              <li>The button repeats in a list and a label would be redundant.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Ambiguous actions</strong> — If the icon could mean more than one thing, use a labeled <a href="button.html">button</a> instead.</li>
              <li><strong>Primary CTA</strong> — Primary actions need a visible label. Don't rely on an icon alone for the most important action on a page.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Default</h3>
          <div>
            <div class="heavy-cluster">
              <button class="heavy-btn-icon" aria-label="Settings">&#9881;</button>
              <button class="heavy-btn-icon" aria-label="Close">&#10005;</button>
              <button class="heavy-btn-icon" aria-label="Menu">&#9776;</button>
            </div>
          </div>
          ${codeBlock('<button class="heavy-btn-icon" aria-label="Settings">&#9881;</button>')}`,
    content: `          <h3 class="heavy-label">Content</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>aria-label is required</strong> — Every icon button must have an <code>aria-label</code> that describes the action, not the icon. "Close dialog" not "X".</li>
              <li><strong>Tooltip recommended</strong> — Sighted users also benefit from a text label on hover.</li>
            </ul>
          </div>`,
    keyboard: `          <h3 class="heavy-label">Keyboard</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>Same as Button — <code>Enter</code> and <code>Space</code> activate, <code>Tab</code> moves focus.</li>
            </ul>
          </div>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="button.html">Button</a></strong> — Use when the action needs a visible text label.</li>
              <li><strong><a href="button-group.html">Button Group</a></strong> — For grouping related actions.</li>
            </ul>
          </div>`,
  });
}

function buttonGroupContent() {
  return componentPage('Button Group', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">A horizontal row of related buttons with tightened spacing. Groups actions that operate on the same object or belong to the same workflow step.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>Two or more actions that share the same context — "Save" and "Cancel", "Approve" and "Reject".</li>
              <li>Segmented controls where buttons toggle between views or modes.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Unrelated actions</strong> — Don't group buttons that act on different objects. Use layout spacing instead.</li>
              <li><strong>Navigation</strong> — Use tabs or nav links for switching between pages or panels.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Default</h3>
          <div>
            <div class="heavy-btn-group">
              <button class="heavy-btn heavy-btn--secondary">Left</button>
              <button class="heavy-btn heavy-btn--secondary">Center</button>
              <button class="heavy-btn heavy-btn--secondary">Right</button>
            </div>
          </div>
          ${codeBlock(`<div class="heavy-btn-group">
  <button class="heavy-btn heavy-btn--secondary">Left</button>
  <button class="heavy-btn heavy-btn--secondary">Center</button>
  <button class="heavy-btn heavy-btn--secondary">Right</button>
</div>`)}`,
    content: `          <h3 class="heavy-label">Content</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Parallel structure</strong> — Use the same part of speech for all labels. "Save / Cancel" not "Save / Go back".</li>
              <li><strong>Consistent variant</strong> — All buttons in a group should use the same variant. Mix primary + secondary only for a clear primary/secondary hierarchy.</li>
            </ul>
          </div>`,
    keyboard: `          <h3 class="heavy-label">Keyboard</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><code>Tab</code> moves focus through each button in the group sequentially.</li>
            </ul>
          </div>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="button.html">Button</a></strong> — The building block used inside groups.</li>
              <li><strong><a href="button-icon.html">Button Icon</a></strong> — For compact, icon-only actions.</li>
              <li><strong><a href="chips.html">Chips</a></strong> — For filter selection where multiple options can be active.</li>
            </ul>
          </div>`,
  });
}

function chipsContent() {
  return componentPage('Chips', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">Compact elements for filtering content or selecting from a set of options. Chips toggle between active and inactive states, letting users refine what they see.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>Filtering a list or grid by category, tag, or attribute.</li>
              <li>Selecting one or more options from a small, visible set.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Actions</strong> — Use a <a href="button.html">button</a> for triggering operations like save or delete.</li>
              <li><strong>Navigation</strong> — Use <a href="tabs.html">tabs</a> or <a href="nav-links.html">nav links</a> instead.</li>
              <li><strong>Many options</strong> — If the set has more than 8–10 items, use a <a href="selects.html">select</a> instead.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Default</h3>
          <div>
            <div class="heavy-cluster">
              <button class="heavy-chip heavy-chip--active">All</button>
              <button class="heavy-chip">Design</button>
              <button class="heavy-chip">Development</button>
              <button class="heavy-chip">Research</button>
            </div>
          </div>
          ${codeBlock(`<button class="heavy-chip heavy-chip--active">All</button>
<button class="heavy-chip">Design</button>`)}`,
    keyboard: `          <h3 class="heavy-label">Keyboard</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>Enter</code> / <code>Space</code></td>
                <td>Toggles the focused chip</td>
              </tr>
              <tr>
                <td><code>Tab</code></td>
                <td>Moves focus to the next chip</td>
              </tr>
            </tbody>
          </table>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="button.html">Button</a></strong> — For triggering actions rather than filtering.</li>
              <li><strong><a href="tabs.html">Tabs</a></strong> — For switching between content panels.</li>
              <li><strong><a href="toggles.html">Toggles</a></strong> — For binary on/off settings.</li>
            </ul>
          </div>`,
  });
}

function dataDisplayContent() {
  return componentPage('Data Display', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">A collection of components for presenting read-only data — badges for status labels, stats for key metrics, key-value pairs for metadata, lists for ordered items, and progress bars for completion.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>Displaying status, metrics, metadata, or progress in dashboards, detail views, or cards.</li>
              <li>Presenting structured data that users read but don't edit directly.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Editable data</strong> — Use <a href="inputs.html">inputs</a> or forms for data the user modifies.</li>
              <li><strong>Actions</strong> — Use <a href="button.html">buttons</a> for interactive operations. Badges and stats are not clickable.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Badges</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-cluster">
                <span class="heavy-badge">Default</span>
                <span class="heavy-badge heavy-badge--success">Success</span>
                <span class="heavy-badge heavy-badge--warning">Warning</span>
                <span class="heavy-badge heavy-badge--danger">Danger</span>
                <span class="heavy-badge heavy-badge--info">Info</span>
              </div>
            </div>
          </div>
          ${codeBlock(`<span class="heavy-badge">Default</span>
<span class="heavy-badge heavy-badge--success">Success</span>
<span class="heavy-badge heavy-badge--warning">Warning</span>
<span class="heavy-badge heavy-badge--danger">Danger</span>
<span class="heavy-badge heavy-badge--info">Info</span>`)}
          <h3 class="heavy-label">Stats</h3>
          <div>
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
          </div>
          ${codeBlock(`<div class="heavy-stat">
  <div class="heavy-stat-value">98<span class="heavy-stat-unit">%</span></div>
  <div class="heavy-stat-label">Uptime</div>
  <div class="heavy-stat-delta heavy-stat-delta--positive">+2.3%</div>
</div>`)}
          <h3 class="heavy-label">Key-Value</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div>
                <div class="heavy-kv"><span class="heavy-kv-key">Version</span><span class="heavy-kv-value">2.4.1</span></div>
                <div class="heavy-kv"><span class="heavy-kv-key">Status</span><span class="heavy-kv-value">Active</span></div>
                <div class="heavy-kv"><span class="heavy-kv-key">Last Deploy</span><span class="heavy-kv-value">2 hours ago</span></div>
              </div>
            </div>
          </div>
          ${codeBlock(`<div class="heavy-kv">
  <span class="heavy-kv-key">Version</span>
  <span class="heavy-kv-value">2.4.1</span>
</div>`)}
          <h3 class="heavy-label">Lists</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div>
                <div class="heavy-list-item">First list item</div>
                <div class="heavy-list-item">Second list item</div>
                <div class="heavy-list-item">Third list item</div>
              </div>
            </div>
          </div>
          ${codeBlock('<div class="heavy-list-item">List item</div>')}
          <h3 class="heavy-label">Progress</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-stack heavy-stack--sm">
                <div class="heavy-progress"><div class="heavy-progress-bar" style="width: 75%"></div></div>
                <div class="heavy-progress"><div class="heavy-progress-bar" style="width: 45%"></div></div>
                <div class="heavy-progress"><div class="heavy-progress-bar" style="width: 90%"></div></div>
              </div>
            </div>
          </div>
          ${codeBlock(`<div class="heavy-progress">
  <div class="heavy-progress-bar" style="width: 75%"></div>
</div>`)}`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="feedback.html">Feedback</a></strong> — For status messages, loading states, and empty states.</li>
            </ul>
          </div>`,
  });
}

function feedbackContent() {
  return componentPage('Feedback', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">Components that communicate system status to the user — status messages for operation results, empty states for zero-data views, and loading indicators for pending operations.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Status messages</strong> — After an operation completes (success, error, warning) or to surface system information.</li>
              <li><strong>Empty states</strong> — When a list, table, or view has no data to display.</li>
              <li><strong>Loading</strong> — While waiting for data to load or an operation to complete.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Inline validation</strong> — Use <a href="form-validation.html">form validation</a> for field-level errors.</li>
              <li><strong>Static labels</strong> — Use <a href="data-display.html">badges</a> for persistent status indicators that don't represent a recent event.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Status Messages</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-stack heavy-stack--sm">
                <div class="heavy-status-msg heavy-status-msg--success">Operation completed successfully.</div>
                <div class="heavy-status-msg heavy-status-msg--error">Something went wrong. Please try again.</div>
                <div class="heavy-status-msg heavy-status-msg--warning">Your session will expire in 5 minutes.</div>
                <div class="heavy-status-msg heavy-status-msg--info">A new version is available.</div>
              </div>
            </div>
          </div>
          ${codeBlock(`<div class="heavy-status-msg heavy-status-msg--success">Operation completed successfully.</div>
<div class="heavy-status-msg heavy-status-msg--error">Something went wrong. Please try again.</div>`)}
          <h3 class="heavy-label">Empty State</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-empty-state">
                <div class="heavy-empty-state-title">No results found</div>
                <div class="heavy-empty-state-description">Try adjusting your search or filters.</div>
              </div>
            </div>
          </div>
          ${codeBlock(`<div class="heavy-empty-state">
  <div class="heavy-empty-state-title">No results found</div>
  <div class="heavy-empty-state-description">Try adjusting your search or filters.</div>
</div>`)}
          <h3 class="heavy-label">Spinner</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-cluster">
                <div class="heavy-spinner"></div>
                <span class="body-sm text-muted">Loading...</span>
              </div>
            </div>
          </div>
          ${codeBlock('<div class="heavy-spinner"></div>')}
          <h3 class="heavy-label">Skeleton</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-stack heavy-stack--sm">
                <div class="heavy-skeleton" style="height: 16px; width: 60%"></div>
                <div class="heavy-skeleton" style="height: 16px; width: 80%"></div>
                <div class="heavy-skeleton" style="height: 16px; width: 40%"></div>
              </div>
            </div>
          </div>
          ${codeBlock('<div class="heavy-skeleton" style="height: 16px; width: 60%"></div>')}`,
    content: `          <h3 class="heavy-label">Content</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Messages are sentences</strong> — End with a period. "Operation completed successfully."</li>
              <li><strong>Error messages suggest next steps</strong> — "Something went wrong. Please try again." not just "Error".</li>
              <li><strong>Empty states are helpful</strong> — Include a description and, when possible, a call to action.</li>
            </ul>
          </div>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="data-display.html">Data Display</a></strong> — For badges, stats, and other static data presentation.</li>
              <li><strong><a href="form-validation.html">Form Validation</a></strong> — For field-level validation feedback.</li>
            </ul>
          </div>`,
  });
}

function fileUploadContent() {
  return componentPage('File Upload', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">A styled file input that replaces the browser's default file picker with a consistent button trigger. The native file input is hidden and the label acts as the clickable element.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>Uploading documents, images, or other files from the user's device.</li>
              <li>Forms that require file attachments.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Text content</strong> — Use an <a href="inputs.html">input</a> or textarea for typed content.</li>
              <li><strong>Drag-and-drop</strong> — For bulk uploads, build a dedicated dropzone component instead.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Sizes</h3>
          <div class="style-guide-variants">
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
          </div>
          ${codeBlock(`<div class="heavy-form-file">
  <input type="file" id="file-upload">
  <label class="heavy-form-file-trigger" for="file-upload">Choose file</label>
</div>`)}`,
    content: `          <h3 class="heavy-label">Content</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Label the trigger</strong> — "Choose file", "Upload image", or "Attach document". Be specific about what's expected.</li>
              <li><strong>Show file name after selection</strong> — Confirm the user's choice by displaying the selected file name.</li>
            </ul>
          </div>`,
    keyboard: `          <h3 class="heavy-label">Keyboard</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>Enter</code> / <code>Space</code></td>
                <td>Opens the file picker dialog</td>
              </tr>
              <tr>
                <td><code>Tab</code></td>
                <td>Moves focus to the next form field</td>
              </tr>
            </tbody>
          </table>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="inputs.html">Inputs</a></strong> — For text-based form fields.</li>
              <li><strong><a href="button.html">Button</a></strong> — For general actions that don't involve file selection.</li>
            </ul>
          </div>`,
  });
}

function inputsContent() {
  return componentPage('Inputs', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">Text fields for entering and editing single-line or multi-line content. Includes labels, placeholder text, hint text, and validation states for building accessible forms.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>Collecting free-form text — names, emails, passwords, descriptions.</li>
              <li>Any form field where the user types rather than selects.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Predefined options</strong> — Use a <a href="selects.html">select</a> or <a href="chips.html">chips</a> instead.</li>
              <li><strong>On/off choices</strong> — Use a <a href="toggles.html">toggle</a> or checkbox.</li>
              <li><strong>Search</strong> — Use the <a href="search.html">search</a> component for global search triggers.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Sizes</h3>
          <div class="style-guide-variants">
            <input class="heavy-form-input heavy-form-input--xs heavy-col-span-2" type="text" placeholder="X-Small">
            <input class="heavy-form-input heavy-form-input--sm heavy-col-span-2" type="text" placeholder="Small">
            <input class="heavy-form-input heavy-col-span-2" type="text" placeholder="Medium">
            <input class="heavy-form-input heavy-form-input--lg heavy-col-span-2" type="text" placeholder="Large">
          </div>
          ${codeBlock('<input class="heavy-form-input" type="text" placeholder="Placeholder">')}
          <h3 class="heavy-label">States</h3>
          <div class="style-guide-variants">
            <input class="heavy-form-input heavy-col-span-2" type="text" placeholder="Default">
            <input class="heavy-form-input is-hover heavy-col-span-2" type="text" placeholder="Hover">
            <input class="heavy-form-input is-focus heavy-col-span-2" type="text" placeholder="Focus">
            <input class="heavy-form-input is-disabled heavy-col-span-2" type="text" placeholder="Disabled" disabled>
          </div>
          <h3 class="heavy-label">Validation</h3>
          <div class="style-guide-variants">
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
          </div>
          ${codeBlock(`<div class="heavy-form-group">
  <label class="heavy-form-label">Email</label>
  <input class="heavy-form-input heavy-form-input--error" type="text" value="not-an-email">
  <span class="heavy-form-hint heavy-form-hint--error">Please enter a valid email address</span>
</div>`)}
          <h3 class="heavy-label">Textarea</h3>
          <div class="heavy-col-span-4">
            <textarea class="heavy-form-input heavy-form-textarea" placeholder="Write something..."></textarea>
          </div>
          ${codeBlock('<textarea class="heavy-form-input heavy-form-textarea" placeholder="Write something..."></textarea>')}`,
    formatting: `          <h3 class="heavy-label">Form group</h3>
          <div class="heavy-form-group heavy-col-span-3">
            <label class="heavy-form-label">Label</label>
            <input class="heavy-form-input" type="text" placeholder="Placeholder">
            <span class="heavy-form-hint">Hint text goes here</span>
          </div>
          ${codeBlock(`<div class="heavy-form-group">
  <label class="heavy-form-label">Label</label>
  <input class="heavy-form-input" type="text" placeholder="Placeholder">
  <span class="heavy-form-hint">Hint text goes here</span>
</div>`)}`,
    content: `          <h3 class="heavy-label">Content</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Labels are required</strong> — Every input needs a visible label. Don't rely on placeholder text alone.</li>
              <li><strong>Placeholder is a hint, not a label</strong> — Use it to show format ("name@example.com") not purpose.</li>
              <li><strong>Hint text for constraints</strong> — Show format rules, character limits, or requirements below the field.</li>
              <li><strong>Error messages are specific</strong> — "Please enter a valid email" not "Invalid input".</li>
            </ul>
          </div>`,
    keyboard: `          <h3 class="heavy-label">Keyboard</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>Tab</code></td>
                <td>Moves focus to the next form field</td>
              </tr>
              <tr>
                <td><code>Shift + Tab</code></td>
                <td>Moves focus to the previous form field</td>
              </tr>
            </tbody>
          </table>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="selects.html">Selects</a></strong> — For choosing from predefined options.</li>
              <li><strong><a href="toggles.html">Toggles</a></strong> — For boolean choices.</li>
              <li><strong><a href="file-upload.html">File Upload</a></strong> — For uploading files.</li>
              <li><strong><a href="form-validation.html">Form Validation</a></strong> — For client-side validation patterns.</li>
            </ul>
          </div>`,
  });
}

function navLinksContent() {
  return componentPage('Nav Links', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">Horizontal navigation links for moving between top-level pages or sections. One link is marked active to show the user's current location.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>Top-level navigation between major sections of an application.</li>
              <li>Secondary navigation within a section header.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Content switching</strong> — Use <a href="tabs.html">tabs</a> when toggling between views on the same page.</li>
              <li><strong>Hierarchical navigation</strong> — Use <a href="breadcrumbs.html">breadcrumbs</a> for showing depth.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Default</h3>
          <div>
            <div class="heavy-cluster" style="gap: var(--space-24)">
              <a class="heavy-nav-link heavy-nav-link--active" href="#">Dashboard</a>
              <a class="heavy-nav-link" href="#">Settings</a>
              <a class="heavy-nav-link" href="#">Profile</a>
            </div>
          </div>
          ${codeBlock(`<nav>
  <a class="heavy-nav-link heavy-nav-link--active" href="#">Dashboard</a>
  <a class="heavy-nav-link" href="#">Settings</a>
  <a class="heavy-nav-link" href="#">Profile</a>
</nav>`)}`,
    keyboard: `          <h3 class="heavy-label">Keyboard</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>Tab</code></td>
                <td>Moves focus between nav links</td>
              </tr>
              <tr>
                <td><code>Enter</code></td>
                <td>Navigates to the focused link</td>
              </tr>
            </tbody>
          </table>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="tabs.html">Tabs</a></strong> — For switching content panels within a page.</li>
              <li><strong><a href="breadcrumbs.html">Breadcrumbs</a></strong> — For showing hierarchical location.</li>
            </ul>
          </div>`,
  });
}

function searchContent() {
  return componentPage('Search', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">A text input with a built-in search icon for filtering or querying content. Available in four sizes to match surrounding UI density. Wraps a native input element for full keyboard and assistive technology support.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>Filtering a list, table, or set of results by keyword.</li>
              <li>Global search in a header or sidebar.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Structured input</strong> — Use an <a href="inputs.html">input</a> with a label for collecting specific data like names or emails.</li>
              <li><strong>Filtering by category</strong> — Use <a href="chips.html">chips</a> for filtering by predefined tags.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Sizes</h3>
          <div class="style-guide-variants">
            <label class="heavy-search heavy-search--xs heavy-col-span-2"><input type="search" placeholder="X-Small"></label>
            <label class="heavy-search heavy-search--sm heavy-col-span-2"><input type="search" placeholder="Small"></label>
            <label class="heavy-search heavy-col-span-2"><input type="search" placeholder="Medium"></label>
            <label class="heavy-search heavy-search--lg heavy-col-span-2"><input type="search" placeholder="Large"></label>
          </div>
          ${codeBlock(`<label class="heavy-search">
  <input type="search" placeholder="Search...">
</label>`)}
          <h3 class="heavy-label">States</h3>
          <div class="style-guide-variants">
            <label class="heavy-search heavy-col-span-2"><input type="search" placeholder="Default"></label>
            <label class="heavy-search is-hover heavy-col-span-2"><input type="search" placeholder="Hover"></label>
            <label class="heavy-search is-focus heavy-col-span-2"><input type="search" placeholder="Focus"></label>
            <label class="heavy-search is-disabled heavy-col-span-2"><input type="search" placeholder="Disabled" disabled></label>
          </div>`,
    keyboard: `          <h3 class="heavy-label">Keyboard</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>Tab</code></td>
                <td>Focuses the search input</td>
              </tr>
              <tr>
                <td><code>Escape</code></td>
                <td>Clears the search input (browser default)</td>
              </tr>
            </tbody>
          </table>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="inputs.html">Inputs</a></strong> — For general text entry and form fields.</li>
              <li><strong><a href="chips.html">Chips</a></strong> — For filtering by predefined categories.</li>
            </ul>
          </div>`,
  });
}

function selectsContent() {
  return componentPage('Selects', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">A native dropdown for choosing one option from a list. Uses the browser's built-in select element with custom styling for consistency across platforms.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>Choosing from 5 or more predefined options.</li>
              <li>Form fields where space is limited and the option list is long.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Few options</strong> — Use <a href="chips.html">chips</a> or radio buttons for 2–4 visible choices.</li>
              <li><strong>Multiple selection</strong> — Use checkboxes or a multi-select pattern instead.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Sizes</h3>
          <div class="style-guide-variants">
            <select class="heavy-select heavy-select--xs heavy-col-span-2"><option>X-Small</option></select>
            <select class="heavy-select heavy-select--sm heavy-col-span-2"><option>Small</option></select>
            <select class="heavy-select heavy-col-span-2"><option>Medium</option></select>
            <select class="heavy-select heavy-select--lg heavy-col-span-2"><option>Large</option></select>
          </div>
          ${codeBlock(`<select class="heavy-select">
  <option>Select an option</option>
</select>`)}
          <h3 class="heavy-label">States</h3>
          <div class="style-guide-variants">
            <select class="heavy-select heavy-col-span-2"><option>Default</option></select>
            <select class="heavy-select is-hover heavy-col-span-2"><option>Hover</option></select>
            <select class="heavy-select is-focus heavy-col-span-2"><option>Focus</option></select>
            <select class="heavy-select is-disabled heavy-col-span-2" disabled><option>Disabled</option></select>
          </div>`,
    formatting: `          <h3 class="heavy-label">Form group</h3>
          <div class="heavy-form-group heavy-col-span-3">
            <label class="heavy-form-label">Label</label>
            <select class="heavy-select"><option>Select an option</option></select>
            <span class="heavy-form-hint">Hint text goes here</span>
          </div>
          ${codeBlock(`<div class="heavy-form-group">
  <label class="heavy-form-label">Label</label>
  <select class="heavy-select">
    <option>Select an option</option>
  </select>
  <span class="heavy-form-hint">Hint text goes here</span>
</div>`)}`,
    keyboard: `          <h3 class="heavy-label">Keyboard</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>Space</code> / <code>Enter</code></td>
                <td>Opens the dropdown</td>
              </tr>
              <tr>
                <td><code>Arrow Up</code> / <code>Arrow Down</code></td>
                <td>Moves between options</td>
              </tr>
              <tr>
                <td><code>Escape</code></td>
                <td>Closes the dropdown</td>
              </tr>
            </tbody>
          </table>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="chips.html">Chips</a></strong> — For visible selection from a small set.</li>
              <li><strong><a href="inputs.html">Inputs</a></strong> — For free-form text entry.</li>
              <li><strong><a href="toggles.html">Toggles</a></strong> — For binary on/off choices.</li>
            </ul>
          </div>`,
  });
}

function tabsContent() {
  return componentPage('Tabs', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">A row of labeled controls that switch between content panels. Only one tab is active at a time, and its associated panel is visible while others are hidden.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>Organizing related content into parallel views within a single page.</li>
              <li>Reducing page length by hiding secondary content behind a tab.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Sequential steps</strong> — Use a stepper or wizard for ordered processes.</li>
              <li><strong>Page navigation</strong> — Use <a href="nav-links.html">nav links</a> for moving between separate pages.</li>
              <li><strong>Filtering</strong> — Use <a href="chips.html">chips</a> for narrowing a content list.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Default</h3>
          <div>
            <div class="heavy-tabs">
              <button class="heavy-tab heavy-tab--active">Overview</button>
              <button class="heavy-tab">Details</button>
              <button class="heavy-tab">Settings</button>
            </div>
          </div>
          ${codeBlock(`<div class="heavy-tabs">
  <button class="heavy-tab heavy-tab--active">Overview</button>
  <button class="heavy-tab">Details</button>
  <button class="heavy-tab">Settings</button>
</div>`)}`,
    content: `          <h3 class="heavy-label">Content</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>One word preferred</strong> — "Overview", "Settings", "Activity". Keep labels short enough that all tabs fit on one line.</li>
              <li><strong>Parallel structure</strong> — All tabs at the same grammatical level. Don't mix nouns and verbs.</li>
            </ul>
          </div>`,
    keyboard: `          <h3 class="heavy-label">Keyboard</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>Tab</code></td>
                <td>Moves focus into the tab list, then to the active panel</td>
              </tr>
              <tr>
                <td><code>Arrow Left</code> / <code>Arrow Right</code></td>
                <td>Moves focus between tabs</td>
              </tr>
              <tr>
                <td><code>Enter</code> / <code>Space</code></td>
                <td>Activates the focused tab</td>
              </tr>
            </tbody>
          </table>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="nav-links.html">Nav Links</a></strong> — For navigating between separate pages.</li>
              <li><strong><a href="chips.html">Chips</a></strong> — For filtering content within a single view.</li>
            </ul>
          </div>`,
  });
}

function togglesContent() {
  return componentPage('Toggles', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">Controls for binary and multiple-choice selections. Includes toggle switches for on/off settings, checkboxes for multi-select, and radio buttons for single-select from a group.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Toggle</strong> — Instant on/off settings that take effect immediately (dark mode, notifications).</li>
              <li><strong>Checkbox</strong> — Selecting one or more options from a list, or agreeing to terms.</li>
              <li><strong>Radio</strong> — Choosing exactly one option from a mutually exclusive set.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Actions</strong> — Use a <a href="button.html">button</a> for operations like save or submit.</li>
              <li><strong>Navigation</strong> — Use <a href="tabs.html">tabs</a> or <a href="chips.html">chips</a> for switching views.</li>
              <li><strong>Many options</strong> — Use a <a href="selects.html">select</a> for long lists.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Toggle Switch</h3>
          <div>
            <div class="heavy-cluster">
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
            </div>
          </div>
          ${codeBlock(`<label class="heavy-form-toggle">
  <input type="checkbox">
  <span class="heavy-form-toggle-track"></span>
  <span>Off</span>
</label>`)}
          <h3 class="heavy-label">Checkbox</h3>
          <div>
            <div class="heavy-stack">
              <div class="heavy-form-check">
                <input class="heavy-form-check-input" type="checkbox" id="check1" checked>
                <label class="heavy-form-label" for="check1">Checkbox option</label>
              </div>
            </div>
          </div>
          ${codeBlock(`<div class="heavy-form-check">
  <input class="heavy-form-check-input" type="checkbox" id="check1">
  <label class="heavy-form-label" for="check1">Checkbox option</label>
</div>`)}
          <h3 class="heavy-label">Radio</h3>
          <div>
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
          </div>
          ${codeBlock(`<div class="heavy-form-check">
  <input class="heavy-form-check-input" type="radio" name="group" id="radio1">
  <label class="heavy-form-label" for="radio1">Radio option A</label>
</div>`)}`,
    content: `          <h3 class="heavy-label">Content</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Toggle labels describe the setting</strong> — "Dark mode", "Send notifications". The on/off state is communicated visually.</li>
              <li><strong>Checkbox labels are positive</strong> — "Enable feature" not "Disable feature". Avoid double negatives.</li>
              <li><strong>Radio labels are parallel</strong> — Same grammatical structure for all options in the group.</li>
            </ul>
          </div>`,
    keyboard: `          <h3 class="heavy-label">Keyboard</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>Space</code></td>
                <td>Toggles the focused control</td>
              </tr>
              <tr>
                <td><code>Tab</code></td>
                <td>Moves focus to the next control</td>
              </tr>
              <tr>
                <td><code>Arrow Up</code> / <code>Arrow Down</code></td>
                <td>Moves between radio buttons in a group</td>
              </tr>
            </tbody>
          </table>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="chips.html">Chips</a></strong> — For visible multi-select filtering.</li>
              <li><strong><a href="selects.html">Selects</a></strong> — For single choice from a long list.</li>
              <li><strong><a href="inputs.html">Inputs</a></strong> — For free-form text entry.</li>
            </ul>
          </div>`,
  });
}

function formValidationContent() {
  return componentPage('Form Validation', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">Client-side validation pattern for form fields. Uses data attributes to declare validation rules and applies error/success states with hint text on blur. Validates required fields, email format, minimum length, and select choices.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>Any form that submits data — validate before sending to catch errors early.</li>
              <li>Fields with format requirements (email, password length, required fields).</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Server-only validation</strong> — Always validate on the server too. Client-side validation is a convenience, not a security measure.</li>
              <li><strong>Real-time search</strong> — Don't validate search inputs. Let users type freely.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Live example</h3>
          <div class="heavy-col-span-4">
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
</div>`)}`,
    content: `          <h3 class="heavy-label">Content</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Hint text shows the rule</strong> — "Minimum 8 characters", "Must be a valid email". Tell users the constraint upfront.</li>
              <li><strong>Error messages are specific</strong> — Repeat or rephrase the rule. "Please enter a valid email" not "Invalid field".</li>
              <li><strong>Validate on blur</strong> — Don't interrupt typing. Check when the user leaves the field.</li>
            </ul>
          </div>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="inputs.html">Inputs</a></strong> — The base text field component with validation states.</li>
              <li><strong><a href="selects.html">Selects</a></strong> — Dropdowns that participate in form validation.</li>
              <li><strong><a href="feedback.html">Feedback</a></strong> — For form-level success/error messages after submission.</li>
            </ul>
          </div>`,
  });
}

function searchPatternContent() {
  return componentPage('Search', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">Interactive search pattern. Type in any field below to test the search component at different sizes and in different contexts.</p></div>`,
    variants: `          <h3 class="heavy-label">Standalone</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <label class="heavy-search heavy-search--lg"><input type="search" placeholder="Search everything..."></label>
            </div>
          </div>
          <h3 class="heavy-label">In a header</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-16); padding: var(--space-16); background: var(--ui-surface-default); border-radius: var(--radius-md);">
                <span class="heavy-label" style="margin: 0;">App Name</span>
                <label class="heavy-search heavy-search--sm" style="flex: 1; max-width: 320px;"><input type="search" placeholder="Search..."></label>
                <button class="heavy-btn heavy-btn--tertiary heavy-btn--sm">Settings</button>
              </div>
            </div>
          </div>
          <h3 class="heavy-label">In a sidebar</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div style="max-width: 280px; padding: var(--space-16); background: var(--ui-surface-default); border-radius: var(--radius-md);">
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
          <h3 class="heavy-label">Full width</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <label class="heavy-search" style="display: flex;"><input type="search" placeholder="Search across all projects, files, and settings..."></label>
            </div>
          </div>
          <h3 class="heavy-label">Disabled</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <label class="heavy-search"><input type="search" placeholder="Search unavailable" disabled></label>
            </div>
          </div>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="search.html">Search Component</a></strong> — API reference, sizes, states, and keyboard docs.</li>
              <li><strong><a href="inputs.html">Inputs</a></strong> — For general text entry and form fields.</li>
              <li><strong><a href="chips.html">Chips</a></strong> — For filtering by predefined categories.</li>
            </ul>
          </div>`,
  });
}

function cardContent() {
  return componentPage('Card', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">A container that groups related content and actions. Cards create visual hierarchy by separating content into distinct sections with borders or elevation.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>Grouping related form fields or settings into a distinct section.</li>
              <li>Displaying a summary of an item (e.g., a branch, project, or user) in a list or grid.</li>
              <li>Creating dashboard panels with a header, body, and optional footer.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Full-page content</strong> — Don't wrap entire page content in a card. Cards are for contained sections.</li>
              <li><strong>Overlays</strong> — Use a <a href="modal.html">modal</a> for content that interrupts the user's flow.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Default</h3>
          <div>
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
          </div>
          ${codeBlock(`<div class="heavy-card">
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
</div>`)}
          <h3 class="heavy-label">Elevated</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-card heavy-card--elevated" style="max-width: 360px;">
                <div class="heavy-card-body">
                  <div class="heavy-card-title">Elevated Card</div>
                  <div class="heavy-card-subtitle">Uses a shadow instead of a border for visual separation.</div>
                </div>
              </div>
            </div>
          </div>
          ${codeBlock('<div class="heavy-card heavy-card--elevated">...</div>')}
          <h3 class="heavy-label">Interactive</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div class="heavy-card heavy-card--interactive" style="max-width: 360px;">
                <div class="heavy-card-body">
                  <div class="heavy-card-title">Clickable Card</div>
                  <div class="heavy-card-subtitle">Hover to see the lift effect. Use for items that navigate to a detail view.</div>
                </div>
              </div>
            </div>
          </div>
          ${codeBlock('<div class="heavy-card heavy-card--interactive">...</div>')}`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="modal.html">Modal</a></strong> — For content that interrupts the user's flow and requires a decision.</li>
              <li><strong><a href="data-display.html">Data Display</a></strong> — For badges, stats, and key-value pairs inside cards.</li>
            </ul>
          </div>`,
  });
}

function modalContent() {
  return componentPage('Modal', {
    description: `          <h3 class="heavy-label">Description</h3>
          <div><p class="style-guide-description">A dialog overlay that focuses the user's attention on a specific task or decision. Modals appear on top of a dimmed backdrop and block interaction with the underlying page until dismissed.</p></div>`,
    whenToUse: `          <h3 class="heavy-label">When to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li>Confirming a destructive or irreversible action (e.g., delete, disconnect).</li>
              <li>Collecting a small amount of input without navigating away from the current context.</li>
              <li>Presenting a choice from a short list of options.</li>
            </ul>
          </div>`,
    whenNotToUse: `          <h3 class="heavy-label">When not to use</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Long forms</strong> — Use a dedicated page or inline expansion instead.</li>
              <li><strong>Non-blocking info</strong> — Use <a href="feedback.html">status messages</a> for notifications that don't require a decision.</li>
              <li><strong>Content grouping</strong> — Use a <a href="card.html">card</a> for sections within a page.</li>
            </ul>
          </div>`,
    variants: `          <h3 class="heavy-label">Default</h3>
          <div>
            <div class="heavy-stack heavy-stack--lg">
              <div style="position: relative; height: 320px; background: var(--ui-bg-default); border-radius: var(--radius-md); overflow: hidden;">
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
          </div>
          ${codeBlock(`<div class="heavy-modal-backdrop">
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
</div>`)}`,
    content: `          <h3 class="heavy-label">Content</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong>Title is required</strong> — Always include a clear, concise title that describes what the modal is about.</li>
              <li><strong>Keep it brief</strong> — Modal body should be scannable. If it needs scrolling, consider a different pattern.</li>
              <li><strong>Primary action on the right</strong> — Cancel on the left, confirm/destructive action on the right.</li>
              <li><strong>Destructive actions use danger buttons</strong> — Make the consequences visually clear.</li>
            </ul>
          </div>`,
    keyboard: `          <h3 class="heavy-label">Keyboard</h3>
          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>Escape</code></td>
                <td>Closes the modal (equivalent to Cancel)</td>
              </tr>
              <tr>
                <td><code>Tab</code></td>
                <td>Moves focus within the modal (trapped)</td>
              </tr>
            </tbody>
          </table>`,
    related: `          <h3 class="heavy-label">Related</h3>
          <div class="style-guide-guidelines">
            <ul>
              <li><strong><a href="card.html">Card</a></strong> — For non-blocking content grouping within a page.</li>
              <li><strong><a href="feedback.html">Feedback</a></strong> — For status messages that don't require user action.</li>
            </ul>
          </div>`,
  });
}

// ===== Content Map =====

const contentMap = {
  'colors': (tokens) => colorsContent(tokens),
  'typography': (tokens) => typographyContent(tokens),
  'spacing': (tokens) => spacingContent(tokens),
  'radius': (tokens) => radiusContent(tokens),
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
