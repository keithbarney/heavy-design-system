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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../../dist');
const TOKENS_DIR = path.resolve(process.env.HOME, 'Projects/tokens');

// ===== Pages Registry =====

const PAGES = [
  { file: 'index.html', id: 'overview', label: 'Overview', group: 'Overview' },
  { file: 'colors.html', id: 'colors', label: 'Colors', group: 'Foundations' },
  { file: 'typography.html', id: 'typography', label: 'Typography', group: 'Foundations' },
  { file: 'spacing.html', id: 'spacing', label: 'Spacing', group: 'Foundations' },
  { file: 'radius.html', id: 'radius', label: 'Radius', group: 'Foundations' },
  { file: 'layout.html', id: 'layout', label: 'Layout', group: 'Foundations' },
  { file: 'animation.html', id: 'animation', label: 'Animation', group: 'Foundations' },
  { file: 'breadcrumbs.html', id: 'breadcrumbs', label: 'Breadcrumbs', group: 'Components' },
  { file: 'buttons.html', id: 'buttons', label: 'Buttons', group: 'Components' },
  { file: 'chips.html', id: 'chips', label: 'Chips', group: 'Components' },
  { file: 'data-display.html', id: 'data-display', label: 'Data Display', group: 'Components' },
  { file: 'feedback.html', id: 'feedback', label: 'Feedback', group: 'Components' },
  { file: 'file-upload.html', id: 'file-upload', label: 'File Upload', group: 'Components' },
  { file: 'inputs.html', id: 'inputs', label: 'Inputs', group: 'Components' },
  { file: 'nav-links.html', id: 'nav-links', label: 'Nav Links', group: 'Components' },
  { file: 'search.html', id: 'search', label: 'Search', group: 'Components' },
  { file: 'selects.html', id: 'selects', label: 'Selects', group: 'Components' },
  { file: 'tabs.html', id: 'tabs', label: 'Tabs', group: 'Components' },
  { file: 'toggles.html', id: 'toggles', label: 'Toggles', group: 'Components' },
  { file: 'form-validation.html', id: 'form-validation', label: 'Form Validation', group: 'Patterns' },
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
  const aliasTypography = readJSON(path.join(TOKENS_DIR, 'alias/typography.tokens.json'));

  _refLookup = buildRefLookup(colors, scale);
  const aliasSpacing = readJSON(path.join(TOKENS_DIR, 'alias/spacing.tokens.json'));
  const aliasRadius = readJSON(path.join(TOKENS_DIR, 'alias/radius.tokens.json'));
  const uiLight = readJSON(path.join(TOKENS_DIR, 'alias/ui.light.tokens.json'));
  const uiDark = readJSON(path.join(TOKENS_DIR, 'alias/ui.dark.tokens.json'));

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
  if (aliasTypography && aliasTypography.Family) {
    for (const [name, token] of Object.entries(aliasTypography.Family)) {
      if (name.startsWith('$')) continue;
      fontFamilies.push({ token: `font-family.${name}`, value: `"${token.$value}"` });
    }
  }

  const fontWeights = [];

  // Parse alias font sizes
  const fontSizes = [];
  if (aliasTypography && aliasTypography['font-size']) {
    for (const [name, token] of Object.entries(aliasTypography['font-size'])) {
      if (name.startsWith('$')) continue;
      fontSizes.push({ name: `font-size.${name}`, css: `--font-size-${name}`, value: getNumericValue(token) });
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

// ===== Shared HTML Partials =====

function head(title, description) {
  const fullTitle = title ? `${title} — Heavy Design System` : 'Heavy Design System';
  const desc = description || 'Heavy Design System — Style Guide';
  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${desc}">
  <title>${fullTitle}</title>
  <link rel="stylesheet" href="main.css">
  <link rel="stylesheet" href="style-guide.css">
</head>`;
}

function sidebar(currentPageId) {
  const groups = ['Overview', 'Foundations', 'Components', 'Patterns'];
  const overviewSubLinks = [
    { anchor: 'files', label: 'Files' },
    { anchor: 'architecture', label: 'Tokens' },
  ];

  let nav = '';
  for (const group of groups) {
    nav += `      <span class="style-guide-sidebar-label">${group}</span>\n`;
    const groupPages = PAGES.filter(p => p.group === group);
    for (const pg of groupPages) {
      if (pg.id === 'overview') {
        // Overview page link
        const active = currentPageId === 'overview' ? ' class="active"' : '';
        nav += `      <a href="index.html"${active}>Overview</a>\n`;
        // Sub-links for Files and Tokens
        for (const sub of overviewSubLinks) {
          const href = currentPageId === 'overview' ? `#${sub.anchor}` : `index.html#${sub.anchor}`;
          nav += `      <a href="${href}">${sub.label}</a>\n`;
        }
      } else {
        const active = currentPageId === pg.id ? ' class="active"' : '';
        nav += `      <a href="${pg.file}"${active}>${pg.label}</a>\n`;
      }
    }
  }

  return `  <aside class="style-guide-sidebar">
    <a class="style-guide-brand" href="index.html">Heavy Design System</a>
    <nav>
${nav}    </nav>
    <div class="style-guide-sidebar-controls">
      <button class="btn btn--tertiary btn--sm grid-toggle" id="grid-toggle" aria-label="Toggle grid overlay">Grid</button>
      <button class="btn btn--tertiary btn--sm theme-toggle" id="theme-toggle" aria-label="Toggle theme">Dark</button>
    </div>
  </aside>`;
}

function gridOverlay() {
  const cols = Array.from({ length: 12 }, () => '    <div class="style-guide-grid-col"></div>').join('\n');
  return `<div class="style-guide-grid-overlay">
  <div class="style-guide-grid-overlay-inner">
${cols}
  </div>
</div>`;
}

function footer() {
  const year = new Date().getFullYear();
  return `<footer class="style-guide-footer">
  <span>Heavy Design System &copy; ${year}</span>
</footer>`;
}

function scripts() {
  return `<script>
(function() {
  var toggle = document.getElementById('theme-toggle');
  var html = document.documentElement;
  var stored = localStorage.getItem('hds-theme');
  if (stored) {
    html.setAttribute('data-theme', stored);
    toggle.textContent = stored === 'dark' ? 'Dark' : 'Light';
  }
  toggle.addEventListener('click', function() {
    var current = html.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    toggle.textContent = next === 'dark' ? 'Dark' : 'Light';
    localStorage.setItem('hds-theme', next);
  });
})();
</script>
<script>
(function() {
  var btn = document.getElementById('grid-toggle');
  var html = document.documentElement;
  var stored = localStorage.getItem('hds-grid');
  if (stored === 'on') html.setAttribute('data-grid', 'on');
  btn.addEventListener('click', function() {
    var isOn = html.getAttribute('data-grid') === 'on';
    if (isOn) {
      html.removeAttribute('data-grid');
      localStorage.removeItem('hds-grid');
    } else {
      html.setAttribute('data-grid', 'on');
      localStorage.setItem('hds-grid', 'on');
    }
  });
})();
</script>
<script>
function copyToken(name, el) {
  navigator.clipboard.writeText(name).then(function() {
    el.classList.add('copied');
    setTimeout(function() { el.classList.remove('copied'); }, 500);
  });
}
</script>
<script>
(function() {
  var links = document.querySelectorAll('.style-guide-sidebar a[href^="#"]');
  if (!links.length) return;
  var sections = [];
  links.forEach(function(link) {
    var id = link.getAttribute('href').slice(1);
    var el = document.getElementById(id);
    if (el) sections.push({ link: link, el: el });
  });

  function onScroll() {
    var atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
    var active;
    if (atBottom) {
      active = sections[sections.length - 1];
    } else {
      active = sections[0];
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].el.getBoundingClientRect().top <= 120) active = sections[i];
      }
    }
    links.forEach(function(l) { l.classList.remove('active'); });
    if (active) active.link.classList.add('active');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
</script>
<script>
(function() {
  var groups = document.querySelectorAll('[data-validate]');
  groups.forEach(function(group) {
    var rule = group.getAttribute('data-validate');
    var input = group.querySelector('input, select');
    var hint = group.querySelector('.form-hint');
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
        valid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(val);
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

      input.classList.remove('form-input--error', 'form-input--success');
      hint.classList.remove('form-hint--error', 'form-hint--success');
      input.classList.add(valid ? 'form-input--success' : 'form-input--error');
      hint.classList.add(valid ? 'form-hint--success' : 'form-hint--error');
      hint.textContent = msg;
    }

    function reset() {
      input.classList.remove('form-input--error', 'form-input--success');
      hint.classList.remove('form-hint--error', 'form-hint--success');
      hint.textContent = defaultHint;
    }

    input.addEventListener('blur', validate);
    input.addEventListener('input', function() {
      if (input.classList.contains('form-input--error') || input.classList.contains('form-input--success')) {
        validate();
      }
    });
    if (input.tagName === 'SELECT') {
      input.addEventListener('change', validate);
    }
  });
})();
</script>`;
}

// ===== Escape HTML =====

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== Page Wrapper =====

function wrapPage(title, contentHtml, currentPageId) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
${head(title, title ? `${title} — Heavy Design System` : 'Heavy Design System — Token-driven design system for all projects')}
<body>
<div class="style-guide-shell">
${sidebar(currentPageId)}
  <main class="style-guide-content">
${contentHtml}
  </main>
  ${footer()}
</div>
${gridOverlay()}
${scripts()}
</body>
</html>`;
}

// ===== Content Functions =====

function overviewContent(tokens) {
  return `    <div class="stat-grid">
          <h2>Stats</h2>
          <div class="stat-block">
            <div class="stat-value">3</div>
            <div class="stat-label">Output Files</div>
          </div>
          <div class="stat-block">
            <div class="stat-value">${tokens.colorFamilies.length}</div>
            <div class="stat-label">Color Families</div>
          </div>
          <div class="stat-block">
            <div class="stat-value">36</div>
            <div class="stat-label">Elements</div>
          </div>
          <div class="stat-block">
            <div class="stat-value">2</div>
            <div class="stat-label">Themes</div>
          </div>
        </div>

        <section class="style-guide-section" id="files">
          <h2>Files</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Contents</th>
                <th>Consumers</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>tokens.css</code></td>
                <td>CSS custom properties (all themes)</td>
                <td>Projects needing only variables</td>
              </tr>
              <tr>
                <td><code>main.css</code></td>
                <td>Full design system (variables + grid + typography + layout + utilities)</td>
                <td>Web apps</td>
              </tr>
              <tr>
                <td><code>heavy-theme.css</code></td>
                <td>Spacegray variables + plugin component styles</td>
                <td>Figma plugins</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="style-guide-section" id="architecture">
          <h2>Tokens</h2>
          <div class="flow-steps">
            <div class="flow-step">
              <div class="flow-number">1</div>
              <span>Figma</span>
            </div>
            <div class="flow-arrow">&rarr;</div>
            <div class="flow-step">
              <div class="flow-number">2</div>
              <span>JSON</span>
            </div>
            <div class="flow-arrow">&rarr;</div>
            <div class="flow-step">
              <div class="flow-number">3</div>
              <span>CSS</span>
            </div>
            <div class="flow-arrow">&rarr;</div>
            <div class="flow-step">
              <div class="flow-number">4</div>
              <span>Projects</span>
            </div>
          </div>
        </section>`;
}

function colorsContent(tokens) {
  const colorSections = tokens.colorFamilies.map(f => {
    const rows = f.stops.map(s =>
      `                    <tr>
                      <td>${s.stop}</td>
                      <td><div class="token-swatch" style="background: ${s.hex}"></div></td>
                      <td><span class="token-copy" role="button" tabindex="0" onclick="copyToken('color.${f.name}.${s.stop}', this)">color.${f.name}.${s.stop}</span></td>
                      <td>${s.hex}</td>
                    </tr>`
    ).join('\n');
    return `            <h3 class="label">${f.name}</h3>
            <table class="data-table">
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
                  <td><div class="token-swatch" style="background: ${t.lightHex}"></div></td>
                  <td><span class="token-copy" role="button" tabindex="0" onclick="copyToken('${esc(t.css)}', this)">${esc(t.name)}</span></td>
                  <td class="body-xsm">${esc(t.lightRef)}</td>
                  <td class="body-xsm">${esc(t.darkRef)}</td>
                </tr>`
    ).join('\n');
  }).join('\n');

  return `        <section class="style-guide-section">
          <h2 class="col-span-full">Colors</h2>
${colorSections}
        </section>

        <section class="style-guide-section">
          <h2>UI Colors</h2>
          <table class="data-table">
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
          </table>
        </section>`;
}

function typographyContent(tokens) {
  const familyRows = tokens.fontFamilies.map(f =>
    `                <tr>
                  <td><span class="token-copy" role="button" tabindex="0" onclick="copyToken('${esc(f.token)}', this)">${esc(f.token)}</span></td>
                  <td>${esc(f.value)}</td>
                </tr>`
  ).join('\n');

  const weightRows = tokens.fontWeights.map(w =>
    `                <tr>
                  <td><span class="token-copy" role="button" tabindex="0" onclick="copyToken('${esc(w.token)}', this)">${esc(w.token)}</span></td>
                  <td><span style="font-weight: ${w.value}">Aa</span></td>
                  <td>${w.value}</td>
                </tr>`
  ).join('\n');

  const fontSizeTypeMap = {
    'body-xsm': 'ui.12',
    'body-sm': 'ui.14',
    'body': 'ui.16',
    'h6': 'ui.16',
    'h5': 'ui.20',
    'h4': 'ui.24',
    'h3': 'ui.28',
    'h2': 'ui.32',
    'h1': 'ui.40',
    'display': 'ui.48'
  };
  const fontSizeRows = tokens.fontSizes.map(f => {
    const shortName = f.name.replace('font-size.', '');
    const mapsTo = fontSizeTypeMap[shortName] || '';
    return `                <tr>
                  <td><span class="token-copy" role="button" tabindex="0" onclick="copyToken('${esc(f.css)}', this)">${esc(f.name)}</span></td>
                  <td><span style="font-size: ${f.value}">Aa</span></td>
                  <td class="body-xsm text-muted">${mapsTo}</td>
                  <td>${f.value}</td>
                </tr>`;
  }).join('\n');

  return `        <section class="style-guide-section">
          <h2>Typography</h2>
          <h3 class="label">Font Families</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${familyRows}
            </tbody>
          </table>
          <h3 class="label">Font Weights</h3>
          <table class="data-table">
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
          </table>
          <h3 class="label">Font Sizes</h3>
          <table class="data-table">
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
          </table>
        </section>`;
}

function spacingContent(tokens) {
  const uiRows = tokens.uiScale.map(t =>
    `                <tr>
                  <td><span class="token-copy" role="button" tabindex="0" onclick="copyToken('${esc(t.token)}', this)">${esc(t.token)}</span></td>
                  <td><div class="token-bar" style="width: ${t.value}"></div></td>
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
                  <td><span class="token-copy" role="button" tabindex="0" onclick="copyToken('${esc(g.css)}', this)">${esc(g.name)}</span></td>
                  <td><div class="token-bar" style="width: ${g.value}"></div></td>
                  <td class="body-xsm text-muted">${gapUiMap[g.name] || ''}</td>
                  <td>${g.value}</td>
                </tr>`
  ).join('\n');

  return `        <section class="style-guide-section">
          <h2>Spacing</h2>
          <h3 class="label">UI Scale</h3>
          <table class="data-table">
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
          </table>
          <h3 class="label">Spacing Aliases</h3>
          <table class="data-table">
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
          </table>
        </section>`;
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
                  <td><span class="token-copy" role="button" tabindex="0" onclick="copyToken('${esc(r.css)}', this)">${esc(r.name)}</span></td>
                  <td><div class="token-radius-sample" style="border-radius: ${r.value}"></div></td>
                  <td class="body-xsm text-muted">${radiusUiMap[r.name] || ''}</td>
                  <td>${r.value}</td>
                </tr>`
  ).join('\n');

  return `        <section class="style-guide-section">
          <h2>Radius</h2>
          <table class="data-table">
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
          </table>
        </section>`;
}

function layoutContent() {
  const gridBoxes = Array.from({ length: 12 }, (_, i) =>
    `                    <div class="style-guide-demo-box">${i + 1}</div>`
  ).join('\n');

  const layoutRows = (data) => data.map(([a, b, c]) =>
    `                <tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`
  ).join('\n');

  const gridRows = layoutRows([
    ['.grid', 'Base grid container', 'gap: var(--grid-gutter)'],
    ['.grid--2', '2 equal columns', 'repeat(2, 1fr)'],
    ['.grid--3', '3 equal columns', 'repeat(3, 1fr)'],
    ['.grid--4', '4 equal columns', 'repeat(4, 1fr)'],
    ['.grid--6', '6 equal columns', 'repeat(6, 1fr)'],
    ['.grid--10', '10 equal columns', 'repeat(10, 1fr)'],
    ['.grid--12', '12 equal columns', 'repeat(12, 1fr)'],
    ['.grid--auto', 'Auto-fit, 300px min', 'minmax(300px, 1fr)'],
    ['.grid--auto-sm', 'Auto-fit, 200px min', 'minmax(200px, 1fr)'],
    ['.grid--auto-lg', 'Auto-fit, 400px min', 'minmax(400px, 1fr)'],
    ['.col-span-{N}', 'Span N columns', 'grid-column: span N'],
    ['.col-span-full', 'Span all columns', 'grid-column: 1 / -1'],
    ['.gap-1 \u2013 .gap-6', 'Gap utilities', '8px \u2013 48px'],
  ]);

  const stackRows = layoutRows([
    ['.stack', 'Default vertical rhythm', '16px'],
    ['.stack--sm', 'Small gap', '8px'],
    ['.stack--md', 'Medium gap', '16px'],
    ['.stack--lg', 'Large gap', '24px'],
    ['.stack--xl', 'Extra-large gap', '32px'],
  ]);

  const clusterRows = layoutRows([
    ['.cluster', 'display', 'flex'],
    ['.cluster', 'flex-wrap', 'wrap'],
    ['.cluster', 'gap', 'var(--cluster-space, 16px)'],
    ['.cluster', 'align-items', 'center'],
  ]);

  const sidebarRows = layoutRows([
    ['.with-sidebar', 'display', 'flex'],
    ['.with-sidebar', 'flex-wrap', 'wrap'],
    ['.with-sidebar', 'gap', '24px'],
    ['&gt; :first-child', 'flex-basis', 'var(--sidebar-width, 280px)'],
    ['&gt; :first-child', 'flex-grow', '1'],
    ['&gt; :last-child', 'flex-basis', '0'],
    ['&gt; :last-child', 'flex-grow', '999'],
    ['&gt; :last-child', 'min-inline-size', '50%'],
  ]);

  const centerRows = layoutRows([
    ['.center', 'max-inline-size', 'var(--measure) / 65ch'],
    ['.center', 'margin-inline', 'auto'],
    ['.center', 'padding-inline', '16px'],
    ['.center', 'box-sizing', 'content-box'],
  ]);

  const coverRows = layoutRows([
    ['.cover', 'display', 'flex column'],
    ['.cover', 'min-block-size', '100vh'],
    ['.cover', 'padding', '16px'],
    ['.cover &gt; *', 'margin-block', '16px'],
    ['.cover__centered', 'margin-block', 'auto'],
  ]);

  const boxRows = layoutRows([
    ['.box', 'Default', '16px'],
    ['.box--sm', 'Small', '8px'],
    ['.box--lg', 'Large', '24px'],
    ['.box--xl', 'Extra-large', '32px'],
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

  return `        <section class="style-guide-section" id="grid">
          <h2>Layout</h2>
          <h3 class="label">Grid</h3>
          <div>
            <div class="style-guide-demo">
              <div class="grid grid--12">
${gridBoxes}
              </div>
            </div>
            <div class="style-guide-demo">
              <div class="grid grid--12">
                <div class="style-guide-demo-box col-span-4">span 4</div>
                <div class="style-guide-demo-box col-span-8">span 8</div>
                <div class="style-guide-demo-box col-span-6">span 6</div>
                <div class="style-guide-demo-box col-span-6">span 6</div>
              </div>
            </div>
          </div>
          <table class="data-table">
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
          <h3 class="label" id="stack">Stack</h3>
          <div>
            <div class="style-guide-demo">
              <div class="stack">
                <div class="style-guide-demo-box">Item 1</div>
                <div class="style-guide-demo-box">Item 2</div>
                <div class="style-guide-demo-box">Item 3</div>
              </div>
            </div>
          </div>
          <table class="data-table">
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
          <h3 class="label" id="cluster">Cluster</h3>
          <div>
            <div class="style-guide-demo">
              <div class="cluster">
                <div class="style-guide-demo-box">Tag</div>
                <div class="style-guide-demo-box">Label</div>
                <div class="style-guide-demo-box">Longer tag</div>
                <div class="style-guide-demo-box">Item</div>
                <div class="style-guide-demo-box">Another</div>
                <div class="style-guide-demo-box">More</div>
              </div>
            </div>
          </div>
          <table class="data-table">
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
          <h3 class="label" id="sidebar-layout">Sidebar</h3>
          <div>
            <div class="style-guide-demo">
              <div class="with-sidebar">
                <div class="style-guide-demo-box">Sidebar (280px)</div>
                <div class="style-guide-demo-box">Content (fills remaining)</div>
              </div>
            </div>
          </div>
          <table class="data-table">
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
          <h3 class="label" id="center">Center</h3>
          <div>
            <div class="style-guide-demo" style="background: var(--ui-surface-default)">
              <div class="center" style="background: var(--ui-bg-default); padding: var(--space-16); border-radius: var(--radius-sm); text-align: center;">
                <span class="body-xsm text-muted">Centered \u2014 max-width: var(--measure)</span>
              </div>
            </div>
          </div>
          <table class="data-table">
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
          <h3 class="label" id="cover">Cover</h3>
          <div>
            <div class="style-guide-demo" style="padding: 0">
              <div class="cover" style="min-block-size: 240px;">
                <div class="style-guide-demo-box">Header</div>
                <div class="style-guide-demo-box cover__centered">Centered element</div>
                <div class="style-guide-demo-box">Footer</div>
              </div>
            </div>
          </div>
          <table class="data-table">
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
          <h3 class="label" id="box">Box</h3>
          <div>
            <div class="style-guide-demo" style="display: flex; gap: var(--space-16); flex-wrap: wrap; align-items: start">
              <div class="box--sm" style="background: var(--ui-surface-default); border-radius: var(--radius-sm)">
                <div class="style-guide-demo-box">.box--sm</div>
              </div>
              <div class="box" style="background: var(--ui-surface-default); border-radius: var(--radius-sm)">
                <div class="style-guide-demo-box">.box</div>
              </div>
              <div class="box--lg" style="background: var(--ui-surface-default); border-radius: var(--radius-sm)">
                <div class="style-guide-demo-box">.box--lg</div>
              </div>
              <div class="box--xl" style="background: var(--ui-surface-default); border-radius: var(--radius-sm)">
                <div class="style-guide-demo-box">.box--xl</div>
              </div>
            </div>
          </div>
          <table class="data-table">
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
          <h3 class="label" id="measure">Measure</h3>
          <div>
            <div class="style-guide-demo">
              <div class="stack">
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
          <table class="data-table">
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
          <h3 class="label" id="breakpoints">Breakpoints</h3>
          <table class="data-table">
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
          <h3 class="label" id="cards">Cards</h3>
          <div>
            <div class="stack stack--lg">
              <div class="grid grid--3">
                <div class="card">
                  <div class="card-header">
                    <div class="card-title">Default Card</div>
                    <div class="card-subtitle">With subtitle</div>
                  </div>
                  <div class="card-body">
                    <p class="body-sm">Card body content goes here.</p>
                  </div>
                  <div class="card-footer">
                    <span class="body-xsm text-muted">Card footer</span>
                  </div>
                </div>
                <div class="card card--elevated">
                  <div class="card-body">
                    <div class="card-title">Elevated Card</div>
                    <p class="body-sm text-muted" style="margin-top: var(--space-4)">No border, shadow only.</p>
                  </div>
                </div>
                <div class="card card--interactive">
                  <div class="card-body">
                    <div class="card-title">Interactive Card</div>
                    <p class="body-sm text-muted" style="margin-top: var(--space-4)">Hover to see effect.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <h3 class="label" id="collapsibles">Collapsibles</h3>
          <div>
            <div class="stack stack--lg">
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
          <h3 class="label" id="dividers">Dividers</h3>
          <div>
            <div class="stack stack--lg">
              <hr class="divider">
              <div class="section-header">Section Header</div>
            </div>
          </div>
        </section>`;
}

function animationContent() {
  return `        <section class="style-guide-section">
          <h2>Animation</h2>
          <h3 class="label">Timing Functions</h3>
          <div>
            <div class="stack stack--lg">
              <div class="stack stack--sm">
                <div class="kv"><span class="kv-key">--ease-out</span><span class="kv-value">cubic-bezier(0.16, 1, 0.3, 1)</span></div>
                <div class="kv"><span class="kv-key">--ease-in-out</span><span class="kv-value">cubic-bezier(0.45, 0, 0.55, 1)</span></div>
                <div class="kv"><span class="kv-key">--ease-spring</span><span class="kv-value">cubic-bezier(0.34, 1.56, 0.64, 1)</span></div>
              </div>
            </div>
          </div>
          <h3 class="label">Keyframes</h3>
          <div>
            <div class="stack stack--lg">
              <div class="cluster">
                <span class="badge">fade-in</span>
                <span class="badge">slide-up</span>
                <span class="badge">slide-down</span>
                <span class="badge">scale-in</span>
                <span class="badge">spin</span>
                <span class="badge">shimmer</span>
              </div>
            </div>
          </div>
          <h3 class="label">Utility Classes</h3>
          <div>
            <div class="stack stack--lg">
              <table class="data-table">
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
          <h3 class="label">Stagger Children</h3>
          <div>
            <div class="stack stack--lg">
              <div class="stagger-children cluster">
                <span class="badge badge--info">1</span>
                <span class="badge badge--info">2</span>
                <span class="badge badge--info">3</span>
                <span class="badge badge--info">4</span>
                <span class="badge badge--info">5</span>
                <span class="badge badge--info">6</span>
              </div>
            </div>
          </div>
        </section>`;
}

function breadcrumbsContent() {
  return `        <section class="style-guide-section">
          <h2>Breadcrumbs</h2>
          <span class="label">Default</span>
          <div>
            <div class="breadcrumbs">
              <a class="breadcrumbs-link" href="#">Home</a>
              <span class="breadcrumbs-separator">/</span>
              <a class="breadcrumbs-link" href="#">Projects</a>
              <span class="breadcrumbs-separator">/</span>
              <span class="breadcrumbs-current">Design System</span>
            </div>
          </div>
        </section>`;
}

function buttonsContent() {
  return `        <section class="style-guide-section">
          <h2>Buttons</h2>
          <h3 class="label">Primary</h3>
          <div class="style-guide-variants">
            <button class="btn btn--primary">Default</button>
            <button class="btn btn--primary is-hover">Hover</button>
            <button class="btn btn--primary is-active">Active</button>
            <button class="btn btn--primary is-disabled" disabled>Disabled</button>
          </div>
          <h3 class="label">Secondary</h3>
          <div class="style-guide-variants">
            <button class="btn btn--secondary">Default</button>
            <button class="btn btn--secondary is-hover">Hover</button>
            <button class="btn btn--secondary is-active">Active</button>
            <button class="btn btn--secondary is-disabled" disabled>Disabled</button>
          </div>
          <h3 class="label">Tertiary</h3>
          <div class="style-guide-variants">
            <button class="btn btn--tertiary">Default</button>
            <button class="btn btn--tertiary is-hover">Hover</button>
            <button class="btn btn--tertiary is-active">Active</button>
            <button class="btn btn--tertiary is-disabled" disabled>Disabled</button>
          </div>
          <h3 class="label">Danger</h3>
          <div class="style-guide-variants">
            <button class="btn btn--danger">Default</button>
            <button class="btn btn--danger is-hover">Hover</button>
            <button class="btn btn--danger is-active">Active</button>
            <button class="btn btn--danger is-disabled" disabled>Disabled</button>
          </div>
          <h3 class="label">Sizes</h3>
          <div class="style-guide-variants">
            <button class="btn btn--primary btn--xs">X-Small</button>
            <button class="btn btn--primary btn--sm">Small</button>
            <button class="btn btn--primary">Medium</button>
            <button class="btn btn--primary btn--lg">Large</button>
          </div>
          <h3 class="label">Block</h3>
          <div>
            <button class="btn btn--primary btn--block">Block</button>
          </div>
        </section>`;
}

function chipsContent() {
  return `        <section class="style-guide-section">
          <h2>Chips</h2>
          <span class="label">Default</span>
          <div>
            <div class="cluster">
              <button class="chip chip--active">All</button>
              <button class="chip">Design</button>
              <button class="chip">Development</button>
              <button class="chip">Research</button>
            </div>
          </div>
        </section>`;
}

function dataDisplayContent() {
  return `        <section class="style-guide-section">
          <h2>Data Display</h2>
          <span class="label">Badges</span>
          <div>
            <div class="stack stack--lg">
              <div class="cluster">
                <span class="badge">Default</span>
                <span class="badge badge--success">Success</span>
                <span class="badge badge--warning">Warning</span>
                <span class="badge badge--danger">Danger</span>
                <span class="badge badge--info">Info</span>
              </div>
            </div>
          </div>
          <span class="label">Stats</span>
          <div>
            <div class="stack stack--lg">
              <div class="grid grid--3">
                <div class="stat">
                  <div class="stat-value">1,234</div>
                  <div class="stat-label">Total Users</div>
                </div>
                <div class="stat">
                  <div class="stat-value">98<span class="stat-unit">%</span></div>
                  <div class="stat-label">Uptime</div>
                  <div class="stat-delta stat-delta--positive">+2.3%</div>
                </div>
                <div class="stat">
                  <div class="stat-value">42ms</div>
                  <div class="stat-label">Response Time</div>
                  <div class="stat-delta stat-delta--negative">-5ms</div>
                </div>
              </div>
            </div>
          </div>
          <span class="label">Key-Value</span>
          <div>
            <div class="stack stack--lg">
              <div>
                <div class="kv"><span class="kv-key">Version</span><span class="kv-value">2.4.1</span></div>
                <div class="kv"><span class="kv-key">Status</span><span class="kv-value">Active</span></div>
                <div class="kv"><span class="kv-key">Last Deploy</span><span class="kv-value">2 hours ago</span></div>
              </div>
            </div>
          </div>
          <span class="label">Lists</span>
          <div>
            <div class="stack stack--lg">
              <div>
                <div class="list-item">First list item</div>
                <div class="list-item">Second list item</div>
                <div class="list-item">Third list item</div>
              </div>
            </div>
          </div>
          <span class="label">Progress</span>
          <div>
            <div class="stack stack--lg">
              <div class="stack stack--sm">
                <div class="progress"><div class="progress-bar" style="width: 75%"></div></div>
                <div class="progress"><div class="progress-bar" style="width: 45%"></div></div>
                <div class="progress"><div class="progress-bar" style="width: 90%"></div></div>
              </div>
            </div>
          </div>
        </section>`;
}

function feedbackContent() {
  return `        <section class="style-guide-section">
          <h2>Feedback</h2>
          <span class="label">Status Messages</span>
          <div>
            <div class="stack stack--lg">
              <div class="stack stack--sm">
                <div class="status-msg status-msg--success">Operation completed successfully.</div>
                <div class="status-msg status-msg--error">Something went wrong. Please try again.</div>
                <div class="status-msg status-msg--warning">Your session will expire in 5 minutes.</div>
                <div class="status-msg status-msg--info">A new version is available.</div>
              </div>
            </div>
          </div>
          <span class="label">Empty State</span>
          <div>
            <div class="stack stack--lg">
              <div class="empty-state">
                <div class="empty-state-title">No results found</div>
                <div class="empty-state-description">Try adjusting your search or filters.</div>
              </div>
            </div>
          </div>
          <span class="label">Loading</span>
          <div>
            <div class="stack stack--lg">
              <div class="cluster">
                <div class="spinner"></div>
                <span class="body-sm text-muted">Loading...</span>
              </div>
              <div class="stack stack--sm">
                <div class="skeleton" style="height: 16px; width: 60%"></div>
                <div class="skeleton" style="height: 16px; width: 80%"></div>
                <div class="skeleton" style="height: 16px; width: 40%"></div>
              </div>
            </div>
          </div>
        </section>`;
}

function fileUploadContent() {
  return `        <section class="style-guide-section">
          <h2>File Upload</h2>
          <span class="label">Sizes</span>
          <div class="style-guide-variants">
            <div class="form-file form-file--xs">
              <input type="file" id="file-xs">
              <label class="form-file-trigger" for="file-xs">X-Small</label>
            </div>
            <div class="form-file form-file--sm">
              <input type="file" id="file-sm">
              <label class="form-file-trigger" for="file-sm">Small</label>
            </div>
            <div class="form-file">
              <input type="file" id="file-md">
              <label class="form-file-trigger" for="file-md">Medium</label>
            </div>
            <div class="form-file form-file--lg">
              <input type="file" id="file-lg">
              <label class="form-file-trigger" for="file-lg">Large</label>
            </div>
          </div>
        </section>`;
}

function inputsContent() {
  return `        <section class="style-guide-section">
          <h2>Inputs</h2>
          <span class="label">Sizes</span>
          <div class="style-guide-variants">
            <input class="form-input form-input--xs col-span-2" type="text" placeholder="X-Small">
            <input class="form-input form-input--sm col-span-2" type="text" placeholder="Small">
            <input class="form-input col-span-2" type="text" placeholder="Medium">
            <input class="form-input form-input--lg col-span-2" type="text" placeholder="Large">
          </div>
          <span class="label">States</span>
          <div class="style-guide-variants">
            <input class="form-input col-span-2" type="text" placeholder="Default">
            <input class="form-input is-hover col-span-2" type="text" placeholder="Hover">
            <input class="form-input is-focus col-span-2" type="text" placeholder="Focus">
            <input class="form-input is-disabled col-span-2" type="text" placeholder="Disabled" disabled>
          </div>
          <span class="label">Validation</span>
          <div class="style-guide-variants">
            <div class="form-group col-span-3">
              <label class="form-label">Email</label>
              <input class="form-input form-input--error" type="text" placeholder="Enter email" value="not-an-email">
              <span class="form-hint form-hint--error">Please enter a valid email address</span>
            </div>
            <div class="form-group col-span-3">
              <label class="form-label">Username</label>
              <input class="form-input form-input--success" type="text" placeholder="Choose username" value="keithbarney">
              <span class="form-hint form-hint--success">Username is available</span>
            </div>
          </div>
          <span class="label">Form group</span>
          <div class="form-group col-span-3">
            <label class="form-label">Label</label>
            <input class="form-input" type="text" placeholder="Placeholder">
            <span class="form-hint">Hint text goes here</span>
          </div>
          <span class="label">Textarea</span>
          <div class="col-span-4">
            <textarea class="form-input form-textarea" placeholder="Write something..."></textarea>
          </div>
        </section>`;
}

function navLinksContent() {
  return `        <section class="style-guide-section">
          <h2>Nav Links</h2>
          <span class="label">Default</span>
          <div>
            <div class="cluster" style="gap: var(--space-24)">
              <a class="nav-link nav-link--active" href="#">Dashboard</a>
              <a class="nav-link" href="#">Settings</a>
              <a class="nav-link" href="#">Profile</a>
            </div>
          </div>
        </section>`;
}

function searchContent() {
  return `        <section class="style-guide-section">
          <h2>Search</h2>
          <span class="label">Sizes</span>
          <div class="style-guide-variants">
            <button class="search search--xs col-span-2">X-Small</button>
            <button class="search search--sm col-span-2">Small</button>
            <button class="search col-span-2">Medium</button>
            <button class="search search--lg col-span-2">Large</button>
          </div>
          <span class="label">States</span>
          <div class="style-guide-variants">
            <button class="search col-span-2">Default</button>
            <button class="search is-hover col-span-2">Hover</button>
            <button class="search is-focus col-span-2">Focus</button>
            <button class="search is-disabled col-span-2" disabled>Disabled</button>
          </div>
        </section>`;
}

function selectsContent() {
  return `        <section class="style-guide-section">
          <h2>Selects</h2>
          <span class="label">Sizes</span>
          <div class="style-guide-variants">
            <select class="select select--xs col-span-2"><option>X-Small</option></select>
            <select class="select select--sm col-span-2"><option>Small</option></select>
            <select class="select col-span-2"><option>Medium</option></select>
            <select class="select select--lg col-span-2"><option>Large</option></select>
          </div>
          <span class="label">States</span>
          <div class="style-guide-variants">
            <select class="select col-span-2"><option>Default</option></select>
            <select class="select is-hover col-span-2"><option>Hover</option></select>
            <select class="select is-focus col-span-2"><option>Focus</option></select>
            <select class="select is-disabled col-span-2" disabled><option>Disabled</option></select>
          </div>
          <span class="label">Form group</span>
          <div class="form-group col-span-3">
            <label class="form-label">Label</label>
            <select class="select"><option>Select an option</option></select>
            <span class="form-hint">Hint text goes here</span>
          </div>
        </section>`;
}

function tabsContent() {
  return `        <section class="style-guide-section">
          <h2>Tabs</h2>
          <span class="label">Default</span>
          <div>
            <div class="tabs">
              <button class="tab tab--active">Overview</button>
              <button class="tab">Details</button>
              <button class="tab">Settings</button>
            </div>
          </div>
        </section>`;
}

function togglesContent() {
  return `        <section class="style-guide-section">
          <h2>Toggles</h2>
          <span class="label">States</span>
          <div>
            <div class="cluster">
              <label class="form-toggle">
                <input type="checkbox">
                <span class="form-toggle-track"></span>
                <span>Off</span>
              </label>
              <label class="form-toggle">
                <input type="checkbox" checked>
                <span class="form-toggle-track"></span>
                <span>On</span>
              </label>
            </div>
          </div>
          <span class="label">Choices</span>
          <div>
            <div class="stack">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="check1" checked>
                <label class="form-label" for="check1">Checkbox option</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="radio" id="radio1" checked>
                <label class="form-label" for="radio1">Radio option A</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="radio" id="radio2">
                <label class="form-label" for="radio2">Radio option B</label>
              </div>
            </div>
          </div>
        </section>`;
}

function formValidationContent() {
  return `        <section class="style-guide-section">
          <h2>Form Validation</h2>
          <span class="label">Live example</span>
          <div class="col-span-4">
            <div class="stack">
              <div class="form-group" data-validate="required">
                <label class="form-label">Name</label>
                <input class="form-input" type="text" placeholder="Enter your name">
                <span class="form-hint">Required field</span>
              </div>
              <div class="form-group" data-validate="email">
                <label class="form-label">Email</label>
                <input class="form-input" type="text" placeholder="Enter your email">
                <span class="form-hint">Must be a valid email</span>
              </div>
              <div class="form-group" data-validate="minlength" data-minlength="8">
                <label class="form-label">Password</label>
                <input class="form-input" type="password" placeholder="Choose a password">
                <span class="form-hint">Minimum 8 characters</span>
              </div>
              <div class="form-group" data-validate="select">
                <label class="form-label">Role</label>
                <select class="select">
                  <option value="">Select a role</option>
                  <option value="designer">Designer</option>
                  <option value="developer">Developer</option>
                  <option value="manager">Manager</option>
                </select>
                <span class="form-hint">Choose one option</span>
              </div>
            </div>
          </div>
        </section>`;
}

// ===== Content Map =====

const contentMap = {
  'overview': (tokens) => overviewContent(tokens),
  'colors': (tokens) => colorsContent(tokens),
  'typography': (tokens) => typographyContent(tokens),
  'spacing': (tokens) => spacingContent(tokens),
  'radius': (tokens) => radiusContent(tokens),
  'layout': () => layoutContent(),
  'animation': () => animationContent(),
  'breadcrumbs': () => breadcrumbsContent(),
  'buttons': () => buttonsContent(),
  'chips': () => chipsContent(),
  'data-display': () => dataDisplayContent(),
  'feedback': () => feedbackContent(),
  'file-upload': () => fileUploadContent(),
  'inputs': () => inputsContent(),
  'nav-links': () => navLinksContent(),
  'search': () => searchContent(),
  'selects': () => selectsContent(),
  'tabs': () => tabsContent(),
  'toggles': () => togglesContent(),
  'form-validation': () => formValidationContent(),
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
    const title = pg.id === 'overview' ? null : pg.label;
    const html = wrapPage(title, contentHtml, pg.id);
    const outPath = path.join(DIST_DIR, pg.file);
    fs.writeFileSync(outPath, html);
    console.log(`  \u2713 ${pg.file}`);
  }

  // Clean stale pages from previous structure
  const stalePages = ['base.html', 'alias.html', 'forms.html', 'navigation.html', 'foundations.html', 'components.html'];
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
