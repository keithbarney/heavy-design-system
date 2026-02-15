#!/usr/bin/env node

/**
 * Build HTML Pages from Token JSON
 *
 * Generates index.html, base.html, and alias.html from template literals
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

// ===== Token Reading =====

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function getHex(token) {
  const v = token.$value;
  if (typeof v === 'object' && v.hex) return v.hex;
  if (typeof v === 'object' && v.components) {
    const [r, g, b] = v.components.map(c => Math.round(c * 255));
    const toHex = n => n.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  return v;
}

function getNumericValue(token) {
  return `${token.$value}px`;
}

function readTokens() {
  const colors = readJSON(path.join(TOKENS_DIR, 'base/colors.tokens.json'));
  const scale = readJSON(path.join(TOKENS_DIR, 'base/scale.tokens.json'));
  const typography = readJSON(path.join(TOKENS_DIR, 'base/typography.tokens.json'));
  const aliasTypography = readJSON(path.join(TOKENS_DIR, 'alias/typography.tokens.json'));
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

  // Parse font families
  const fontFamilies = [];
  if (typography && typography.Family) {
    for (const [name, token] of Object.entries(typography.Family)) {
      if (name.startsWith('$')) continue;
      fontFamilies.push({ token: `font-family.${name}`, value: `"${token.$value}"` });
    }
  }

  // Parse font weights
  const fontWeights = [];
  if (typography && typography.Weights) {
    for (const [name, token] of Object.entries(typography.Weights)) {
      if (name.startsWith('$')) continue;
      fontWeights.push({ name: name.toLowerCase(), token: `font-weight.${name.toLowerCase()}`, value: String(token.$value) });
    }
  }

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
        const lightRef = token.$extensions?.['com.figma.aliasData']?.targetVariableName?.replace('/', '.') || '';
        // Get dark equivalent
        const darkToken = uiDark?.ui?.[groupKey]?.[variant];
        const darkHex = darkToken ? getHex(darkToken) : '';
        const darkRef = darkToken?.$extensions?.['com.figma.aliasData']?.targetVariableName?.replace('/', '.') || '';
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
</head>`;
}

function header(currentPage) {
  const navLinks = [
    { href: 'components.html', label: 'Components' },
    { href: 'base.html', label: 'Base' },
    { href: 'alias.html', label: 'Alias' },
    { href: 'layout.html', label: 'Layout' },
  ].map(link =>
    `      <a class="sg-nav-link${link.href === currentPage ? ' active' : ''}" href="${link.href}">${link.label}</a>`
  ).join('\n');
  const cols = Array.from({ length: 12 }, () => '      <div class="sg-grid-col"></div>').join('\n');
  return `<header class="sg-header">
  <div class="container">
    <a class="sg-brand" href="index.html">Heavy Design System</a>
    <nav class="sg-header-nav">
${navLinks}
      <button class="grid-toggle" id="grid-toggle" aria-label="Toggle grid overlay">Grid</button>
      <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">Dark</button>
    </nav>
  </div>
</header>
<div class="sg-grid-overlay">
  <div class="sg-grid-overlay-inner">
${cols}
  </div>
</div>`;
}

function footer() {
  const year = new Date().getFullYear();
  return `<footer class="sg-footer">
  <div class="container">
    <span>Heavy Design System &copy; ${year}</span>
  </div>
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
  var links = document.querySelectorAll('.sg-sidebar a');
  if (!links.length) return;
  var sections = [];
  links.forEach(function(link) {
    var id = link.getAttribute('href').slice(1);
    var el = document.getElementById(id);
    if (el) sections.push({ link: link, el: el });
  });
  function onScroll() {
    var active = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].el.getBoundingClientRect().top <= 120) active = sections[i];
    }
    links.forEach(function(l) { l.classList.remove('active'); });
    if (active) active.link.classList.add('active');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
</script>`;
}

// ===== Escape HTML =====

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== Index Page =====

function indexPage(tokens) {
  // Color families — show 5 representative stops
  const previewStops = ['50', '300', '500', '700', '900'];
  const colorFamiliesHTML = tokens.colorFamilies.map(f => {
    const swatches = previewStops
      .map(stop => {
        const s = f.stops.find(s => s.stop === stop);
        return s ? `<div class="color-swatch" style="background: ${s.hex}"></div>` : '';
      })
      .join('\n                      ');
    return `                <div class="color-family">
                  <div class="color-family-name">${f.name}</div>
                  <div class="color-swatches">
                    ${swatches}
                  </div>
                </div>`;
  }).join('\n');

  // Type scale — include extended scale used in variables
  const extendedTypeSteps = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48];
  const typeScaleHTML = extendedTypeSteps.map(step =>
    `                <div class="type-sample">
                  <div class="sample-label">--type-${step} / ${step}px</div>
                  <span style="font-size: ${step}px">The quick brown fox</span>
                </div>`
  ).join('\n');

  // Spacing scale
  const spaceSteps = [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 60, 72];
  const spacingHTML = spaceSteps.map(step =>
    `                <div class="spacing-row">
                  <div class="sample-label">--space-${step} / ${step}px</div>
                  <div class="token-bar" style="width: ${step}px"></div>
                </div>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
${head(null, 'Heavy Design System — Token-driven design system for all projects')}
<body>
${header('index.html')}
<main>
  <div class="container">
    <div class="sg-page">
      <nav class="sg-sidebar">
        <ul>
          <li><a href="#colors">Colors</a></li>
          <li><a href="#type-scale">Type Scale</a></li>
          <li><a href="#spacing">Spacing</a></li>
          <li><a href="#files">Files</a></li>
          <li><a href="#architecture">Architecture</a></li>
        </ul>
      </nav>
      <div class="sg-content">
        <div class="stat-grid">
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

        <section class="sg-section" id="colors">
          <h2>Color Palette</h2>
          <div class="sg-color-grid">
${colorFamiliesHTML}
          </div>
        </section>

        <section class="sg-section" id="type-scale">
          <h2>Type Scale</h2>
          <div class="sg-sample-grid">
${typeScaleHTML}
          </div>
        </section>

        <section class="sg-section" id="spacing">
          <h2>Spacing Scale</h2>
          <div class="sg-sample-grid">
${spacingHTML}
          </div>
        </section>

        <section class="sg-section" id="files">
          <h2>Distributable Files</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Contents</th>
                <th>Consumers</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>tokens.css</code></td>
                <td>CSS custom properties (all themes)</td>
                <td>Projects needing only variables</td>
                <td></td>
              </tr>
              <tr>
                <td><code>main.css</code></td>
                <td>Full design system (variables + grid + typography + layout + utilities)</td>
                <td>Web apps</td>
                <td></td>
              </tr>
              <tr>
                <td><code>heavy-theme.css</code></td>
                <td>Spacegray variables + plugin component styles</td>
                <td>Figma plugins</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="sg-section" id="architecture">
          <h2>Token Architecture</h2>
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
        </section>
      </div>
    </div>
  </div>
</main>
${footer()}
${scripts()}
</body>
</html>`;
}

// ===== Base Tokens Page =====

function basePage(tokens) {
  // Type scale table
  const typeRows = tokens.typeScale.map(t =>
    `                <tr>
                  <td><span class="token-copy" role="button" tabindex="0" onclick="copyToken('${esc(t.token)}', this)">${esc(t.token)}</span></td>
                  <td><div class="token-bar" style="width: ${t.value}"></div></td>
                  <td>${t.value}</td>
                  <td></td>
                </tr>`
  ).join('\n');

  // UI scale table
  const uiRows = tokens.uiScale.map(t =>
    `                <tr>
                  <td><span class="token-copy" role="button" tabindex="0" onclick="copyToken('${esc(t.token)}', this)">${esc(t.token)}</span></td>
                  <td><div class="token-bar" style="width: ${t.value}"></div></td>
                  <td>${t.value}</td>
                  <td></td>
                </tr>`
  ).join('\n');

  // Colors — one table per family
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

  // Font families
  const familyRows = tokens.fontFamilies.map(f =>
    `                <tr>
                  <td><span class="token-copy" role="button" tabindex="0" onclick="copyToken('${esc(f.token)}', this)">${esc(f.token)}</span></td>
                  <td>${esc(f.value)}</td>
                  <td></td>
                  <td></td>
                </tr>`
  ).join('\n');

  // Font weights
  const weightRows = tokens.fontWeights.map(w =>
    `                <tr>
                  <td><span class="token-copy" role="button" tabindex="0" onclick="copyToken('${esc(w.token)}', this)">${esc(w.token)}</span></td>
                  <td>${w.value}</td>
                  <td><span style="font-weight: ${w.value}">Aa</span></td>
                  <td></td>
                </tr>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
${head('Base Tokens', 'Base design tokens — colors, scale, typography, radius')}
<body>
${header('base.html')}
<main>
  <div class="container">
    <div class="sg-page">
      <nav class="sg-sidebar">
        <ul>
          <li><a href="#ui-scale">UI Scale</a></li>
          <li><a href="#typography">Typography</a></li>
          <li><a href="#colors">Colors</a></li>
        </ul>
      </nav>
      <div class="sg-content">
        <div class="page-intro">
          <h1>Base Tokens</h1>
          <p class="text-muted">Raw values everything builds on — colors, type scale, UI scale, typography, and radius.</p>
        </div>

        <section class="sg-section" id="ui-scale">
          <h2>UI Scale</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Visual</th>
                <th>Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
${uiRows}
            </tbody>
          </table>
        </section>

        <section class="sg-section" id="typography">
          <h2>Typography</h2>
          <h3 class="label">Font Families</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Value</th>
                <th></th>
                <th></th>
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
                <th>Value</th>
                <th>Sample</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
${weightRows}
            </tbody>
          </table>
        </section>

        <section class="sg-section" id="colors">
          <h2 class="col-span-full">Colors</h2>
${colorSections}
        </section>
      </div>
    </div>
  </div>
</main>
${footer()}
${scripts()}
</body>
</html>`;
}

// ===== Alias Tokens Page =====

function aliasPage(tokens) {
  // UI Colors table
  const uiColorRows = tokens.uiColorGroups.map(group => {
    return group.tokens.map((t, i) =>
      `                <tr>
                  <td><div class="token-swatch" style="background: ${t.lightHex}"></div></td>
                  <td><span class="token-copy" role="button" tabindex="0" onclick="copyToken('${esc(t.css)}', this)">${esc(t.name)}</span></td>
                  <td class="body-xsm">${esc(t.lightRef)}</td>
                  <td class="body-xsm">${esc(t.darkRef)}</td>
                </tr>`
    ).join('\n');
  }).join('\n');

  // Gap table — map to base UI scale
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

  // Font size table — map to base UI scale
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

  // Radius table
  // Radius table — map to base UI scale
  const radiusUiMap = {
    'radius.none': 'ui.0',
    'radius.sm': 'ui.4',
    'radius.md': 'ui.8',
    'radius.lg': 'ui.12',
    'radius.full': '—'
  };
  const radiusRows = tokens.radii.map(r =>
    `                <tr>
                  <td><span class="token-copy" role="button" tabindex="0" onclick="copyToken('${esc(r.css)}', this)">${esc(r.name)}</span></td>
                  <td><div class="token-radius-sample" style="border-radius: ${r.value}"></div></td>
                  <td class="body-xsm text-muted">${radiusUiMap[r.name] || ''}</td>
                  <td>${r.value}</td>
                </tr>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
${head('Alias Tokens', 'Alias design tokens — semantic spacing, font sizes, UI colors, themed for light and dark')}
<body>
${header('alias.html')}
<main>
  <div class="container">
    <div class="sg-page">
      <nav class="sg-sidebar">
        <ul>
          <li><a href="#ui-colors">UI Colors</a></li>
          <li><a href="#spacing">Spacing</a></li>
          <li><a href="#typography">Typography</a></li>
          <li><a href="#radius">Radius</a></li>
        </ul>
      </nav>
      <div class="sg-content">
        <div class="page-intro">
          <h1>Alias Tokens</h1>
          <p class="text-muted">Semantic references that map to base tokens — themed for light and dark modes.</p>
        </div>

        <section class="sg-section" id="ui-colors">
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
        </section>

        <section class="sg-section" id="spacing">
          <h2>Spacing</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Visual</th>
                <th>Maps To</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${gapRows}
            </tbody>
          </table>
        </section>

        <section class="sg-section" id="typography">
          <h2>Typography</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Sample</th>
                <th>Maps To</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${fontSizeRows}
            </tbody>
          </table>
        </section>

        <section class="sg-section" id="radius">
          <h2>Radius</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Visual</th>
                <th>Maps To</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${radiusRows}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  </div>
</main>
${footer()}
${scripts()}
</body>
</html>`;
}

// ===== Components Page =====

function componentsPage() {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
${head('Components', 'Reusable UI elements — buttons, forms, cards, navigation, feedback, and more')}
<body>
${header('components.html')}
<main>
  <div class="container">
    <div class="sg-page">
      <nav class="sg-sidebar">
        <ul>
          <li><a href="#buttons">Buttons</a></li>
          <li><a href="#form-controls">Form Controls</a></li>
          <li><a href="#data-display">Data Display</a></li>
          <li><a href="#feedback">Feedback</a></li>
          <li><a href="#navigation">Navigation</a></li>
          <li><a href="#layout">Layout</a></li>
          <li><a href="#animation">Animation</a></li>
        </ul>
      </nav>
      <div class="sg-content">
        <div class="page-intro">
          <h1>Components</h1>
          <p class="text-muted">36 reusable elements built from design tokens. Every element responds to light and dark themes.</p>
        </div>

        <section class="sg-section" id="buttons">
          <span class="label">Buttons</span>
          <div>
            <div class="stack stack--lg">
              <div class="cluster">
                <button class="btn btn--primary">Primary</button>
                <button class="btn btn--secondary">Secondary</button>
                <button class="btn btn--danger">Danger</button>
                <button class="btn btn--ghost">Ghost</button>
                <button class="btn btn--primary" disabled>Disabled</button>
              </div>
              <div class="cluster">
                <button class="btn btn--primary btn--sm">Small</button>
                <button class="btn btn--primary">Default</button>
                <button class="btn btn--primary btn--lg">Large</button>
              </div>
              <div>
                <button class="btn btn--primary btn--block">Block Button</button>
              </div>
              <div class="cluster">
                <button class="btn-icon" aria-label="Close">&times;</button>
                <div class="btn-group">
                  <button class="btn btn--secondary">Left</button>
                  <button class="btn btn--secondary">Center</button>
                  <button class="btn btn--secondary">Right</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="sg-section" id="form-controls">
          <span class="label">Form Controls</span>
          <div>
            <div class="stack stack--lg">
              <div class="form-group">
                <label class="form-label">Text Input</label>
                <input class="form-input" type="text" placeholder="Enter text...">
              </div>
              <div class="form-group">
                <label class="form-label form-label--required">Required Field</label>
                <input class="form-input" type="text" placeholder="Required...">
                <span class="form-hint">Helper text goes here</span>
              </div>
              <div class="form-group">
                <label class="form-label">Textarea</label>
                <textarea class="form-input form-textarea" placeholder="Write something..."></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Select</label>
                <select class="form-input form-select">
                  <option>Option One</option>
                  <option>Option Two</option>
                  <option>Option Three</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Search</label>
                <div class="form-search">
                  <input class="form-input" type="search" placeholder="Search...">
                </div>
              </div>
              <div class="form-group">
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
              <div class="form-group">
                <label class="form-label">Toggle</label>
                <label class="form-toggle">
                  <input type="checkbox" checked>
                  <span class="form-toggle-track"></span>
                  <span>Enabled</span>
                </label>
              </div>
              <div class="form-group">
                <label class="form-label">File Upload</label>
                <div class="form-file">
                  <input type="file" id="file1">
                  <label class="form-file-trigger" for="file1">Choose file...</label>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Error State</label>
                <input class="form-input form-input--error" type="text" value="Invalid input">
                <span class="form-error">This field has an error</span>
              </div>
              <div class="form-group">
                <label class="form-label">Success State</label>
                <input class="form-input form-input--success" type="text" value="Valid input">
              </div>
            </div>
          </div>
        </section>

        <section class="sg-section" id="data-display">
          <span class="label">Data Display</span>
          <div>
            <div class="stack stack--lg">
              <div class="cluster">
                <span class="badge">Default</span>
                <span class="badge badge--success">Success</span>
                <span class="badge badge--warning">Warning</span>
                <span class="badge badge--danger">Danger</span>
                <span class="badge badge--info">Info</span>
              </div>
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
              <div>
                <div class="kv"><span class="kv-key">Version</span><span class="kv-value">2.4.1</span></div>
                <div class="kv"><span class="kv-key">Status</span><span class="kv-value">Active</span></div>
                <div class="kv"><span class="kv-key">Last Deploy</span><span class="kv-value">2 hours ago</span></div>
              </div>
              <div>
                <div class="list-item">First list item</div>
                <div class="list-item">Second list item</div>
                <div class="list-item">Third list item</div>
              </div>
              <div class="stack stack--sm">
                <div class="progress"><div class="progress-bar" style="width: 75%"></div></div>
                <div class="progress"><div class="progress-bar" style="width: 45%"></div></div>
                <div class="progress"><div class="progress-bar" style="width: 90%"></div></div>
              </div>
            </div>
          </div>
        </section>

        <section class="sg-section" id="feedback">
          <span class="label">Feedback</span>
          <div>
            <div class="stack stack--lg">
              <div class="stack stack--sm">
                <div class="status-msg status-msg--success">Operation completed successfully.</div>
                <div class="status-msg status-msg--error">Something went wrong. Please try again.</div>
                <div class="status-msg status-msg--warning">Your session will expire in 5 minutes.</div>
                <div class="status-msg status-msg--info">A new version is available.</div>
              </div>
              <div class="empty-state">
                <div class="empty-state-title">No results found</div>
                <div class="empty-state-description">Try adjusting your search or filters.</div>
              </div>
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
        </section>

        <section class="sg-section" id="navigation">
          <span class="label">Navigation</span>
          <div>
            <div class="stack stack--lg">
              <div class="tabs">
                <button class="tab tab--active">Overview</button>
                <button class="tab">Details</button>
                <button class="tab">Settings</button>
              </div>
              <div class="breadcrumbs">
                <a class="breadcrumbs-link" href="#">Home</a>
                <span class="breadcrumbs-separator">/</span>
                <a class="breadcrumbs-link" href="#">Projects</a>
                <span class="breadcrumbs-separator">/</span>
                <span class="breadcrumbs-current">Design System</span>
              </div>
              <div class="cluster" style="gap: var(--space-24)">
                <a class="nav-link nav-link--active" href="#">Dashboard</a>
                <a class="nav-link" href="#">Settings</a>
                <a class="nav-link" href="#">Profile</a>
              </div>
              <div class="cluster">
                <button class="chip chip--active">All</button>
                <button class="chip">Design</button>
                <button class="chip">Development</button>
                <button class="chip">Research</button>
              </div>
            </div>
          </div>
        </section>

        <section class="sg-section" id="layout">
          <span class="label">Layout</span>
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
              <details class="collapsible">
                <summary>Collapsible Section</summary>
                <div>Hidden content revealed when expanded. Built with native &lt;details&gt; and &lt;summary&gt; elements &mdash; no JavaScript needed.</div>
              </details>
              <details class="collapsible" open>
                <summary>Open by Default</summary>
                <div>This section starts expanded. Click the header to collapse it.</div>
              </details>
              <hr class="divider">
              <div class="section-header">Section Header</div>
            </div>
          </div>
        </section>

        <section class="sg-section" id="animation">
          <span class="label">Animation</span>
          <div>
            <div class="stack stack--lg">
              <div>
                <div class="section-header" style="margin-bottom: var(--space-16)">Timing Functions</div>
                <div class="stack stack--sm">
                  <div class="kv"><span class="kv-key">--ease-out</span><span class="kv-value">cubic-bezier(0.16, 1, 0.3, 1)</span></div>
                  <div class="kv"><span class="kv-key">--ease-in-out</span><span class="kv-value">cubic-bezier(0.45, 0, 0.55, 1)</span></div>
                  <div class="kv"><span class="kv-key">--ease-spring</span><span class="kv-value">cubic-bezier(0.34, 1.56, 0.64, 1)</span></div>
                </div>
              </div>
              <div>
                <div class="section-header" style="margin-bottom: var(--space-16)">Keyframes</div>
                <div class="cluster">
                  <span class="badge">fade-in</span>
                  <span class="badge">slide-up</span>
                  <span class="badge">slide-down</span>
                  <span class="badge">scale-in</span>
                  <span class="badge">spin</span>
                  <span class="badge">shimmer</span>
                </div>
              </div>
              <div>
                <div class="section-header" style="margin-bottom: var(--space-16)">Utility Classes</div>
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
              <div>
                <div class="section-header" style="margin-bottom: var(--space-16)">Stagger Children</div>
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
          </div>
        </section>
      </div>
    </div>
  </div>
</main>
${footer()}
${scripts()}
</body>
</html>`;
}

// ===== Layout Page =====

function layoutPage() {
  // Grid demo boxes
  const gridBoxes = Array.from({ length: 12 }, (_, i) =>
    `                    <div class="sg-demo-box">${i + 1}</div>`
  ).join('\n');

  // Helper to build table rows from arrays
  const rows = (data) => data.map(([a, b, c]) =>
    `                <tr><td>${a}</td><td>${b}</td><td>${c}</td><td></td></tr>`
  ).join('\n');

  const gridRows = rows([
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

  const stackRows = rows([
    ['.stack', 'Default vertical rhythm', '16px'],
    ['.stack--sm', 'Small gap', '8px'],
    ['.stack--md', 'Medium gap', '16px'],
    ['.stack--lg', 'Large gap', '24px'],
    ['.stack--xl', 'Extra-large gap', '32px'],
  ]);

  const clusterRows = rows([
    ['.cluster', 'display', 'flex'],
    ['.cluster', 'flex-wrap', 'wrap'],
    ['.cluster', 'gap', 'var(--cluster-space, 16px)'],
    ['.cluster', 'align-items', 'center'],
  ]);

  const sidebarRows = rows([
    ['.with-sidebar', 'display', 'flex'],
    ['.with-sidebar', 'flex-wrap', 'wrap'],
    ['.with-sidebar', 'gap', '24px'],
    ['&gt; :first-child', 'flex-basis', 'var(--sidebar-width, 280px)'],
    ['&gt; :first-child', 'flex-grow', '1'],
    ['&gt; :last-child', 'flex-basis', '0'],
    ['&gt; :last-child', 'flex-grow', '999'],
    ['&gt; :last-child', 'min-inline-size', '50%'],
  ]);

  const centerRows = rows([
    ['.center', 'max-inline-size', 'var(--measure) / 65ch'],
    ['.center', 'margin-inline', 'auto'],
    ['.center', 'padding-inline', '16px'],
    ['.center', 'box-sizing', 'content-box'],
  ]);

  const coverRows = rows([
    ['.cover', 'display', 'flex column'],
    ['.cover', 'min-block-size', '100vh'],
    ['.cover', 'padding', '16px'],
    ['.cover &gt; *', 'margin-block', '16px'],
    ['.cover__centered', 'margin-block', 'auto'],
  ]);

  const boxRows = rows([
    ['.box', 'Default', '16px'],
    ['.box--sm', 'Small', '8px'],
    ['.box--lg', 'Large', '24px'],
    ['.box--xl', 'Extra-large', '32px'],
  ]);

  const measureRows = rows([
    ['.measure', 'Default', '65ch'],
    ['.measure-narrow', 'Narrow', '45ch'],
    ['.measure-wide', 'Wide', '75ch'],
  ]);

  const breakpointRows = rows([
    ['sm', '480px', 'Small phones'],
    ['md', '768px', 'Tablets'],
    ['lg', '1024px', 'Small desktops'],
    ['xl', '1200px', 'Large desktops'],
    ['2xl', '1440px', 'Wide screens'],
  ]);

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
${head('Layout', 'Layout utilities \u2014 grid, stack, cluster, sidebar, center, cover, box, measure')}
<body>
${header('layout.html')}
<main>
  <div class="container">
    <div class="sg-page">
      <nav class="sg-sidebar">
        <ul>
          <li><a href="#grid">Grid</a></li>
          <li><a href="#stack">Stack</a></li>
          <li><a href="#cluster">Cluster</a></li>
          <li><a href="#sidebar">Sidebar</a></li>
          <li><a href="#center">Center</a></li>
          <li><a href="#cover">Cover</a></li>
          <li><a href="#box">Box</a></li>
          <li><a href="#measure">Measure</a></li>
          <li><a href="#breakpoints">Breakpoints</a></li>
        </ul>
      </nav>
      <div class="sg-content">
        <div class="page-intro">
          <h1>Layout</h1>
          <p class="text-muted">Compositional layout patterns built with CSS Grid and Flexbox.</p>
        </div>

        <section class="sg-section" id="grid">
          <h2>Grid</h2>
          <div>
            <div class="sg-demo">
              <div class="grid grid--12">
${gridBoxes}
              </div>
            </div>
            <div class="sg-demo">
              <div class="grid grid--12">
                <div class="sg-demo-box col-span-4">span 4</div>
                <div class="sg-demo-box col-span-8">span 8</div>
                <div class="sg-demo-box col-span-6">span 6</div>
                <div class="sg-demo-box col-span-6">span 6</div>
              </div>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Description</th>
                <th>Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
${gridRows}
            </tbody>
          </table>
        </section>

        <section class="sg-section" id="stack">
          <h2>Stack</h2>
          <div>
            <div class="sg-demo">
              <div class="stack">
                <div class="sg-demo-box">Item 1</div>
                <div class="sg-demo-box">Item 2</div>
                <div class="sg-demo-box">Item 3</div>
              </div>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Description</th>
                <th>Gap</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
${stackRows}
            </tbody>
          </table>
        </section>

        <section class="sg-section" id="cluster">
          <h2>Cluster</h2>
          <div>
            <div class="sg-demo">
              <div class="cluster">
                <div class="sg-demo-box">Tag</div>
                <div class="sg-demo-box">Label</div>
                <div class="sg-demo-box">Longer tag</div>
                <div class="sg-demo-box">Item</div>
                <div class="sg-demo-box">Another</div>
                <div class="sg-demo-box">More</div>
              </div>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Property</th>
                <th>Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
${clusterRows}
            </tbody>
          </table>
        </section>

        <section class="sg-section" id="sidebar">
          <h2>Sidebar</h2>
          <div>
            <div class="sg-demo">
              <div class="with-sidebar">
                <div class="sg-demo-box">Sidebar (280px)</div>
                <div class="sg-demo-box">Content (fills remaining)</div>
              </div>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Selector</th>
                <th>Property</th>
                <th>Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
${sidebarRows}
            </tbody>
          </table>
        </section>

        <section class="sg-section" id="center">
          <h2>Center</h2>
          <div>
            <div class="sg-demo" style="background: var(--ui-surface-default)">
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
                <th></th>
              </tr>
            </thead>
            <tbody>
${centerRows}
            </tbody>
          </table>
        </section>

        <section class="sg-section" id="cover">
          <h2>Cover</h2>
          <div>
            <div class="sg-demo" style="padding: 0">
              <div class="cover" style="min-block-size: 240px;">
                <div class="sg-demo-box">Header</div>
                <div class="sg-demo-box cover__centered">Centered element</div>
                <div class="sg-demo-box">Footer</div>
              </div>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Selector</th>
                <th>Property</th>
                <th>Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
${coverRows}
            </tbody>
          </table>
        </section>

        <section class="sg-section" id="box">
          <h2>Box</h2>
          <div>
            <div class="sg-demo" style="display: flex; gap: var(--space-16); flex-wrap: wrap; align-items: start">
              <div class="box--sm" style="background: var(--ui-surface-default); border-radius: var(--radius-sm)">
                <div class="sg-demo-box">.box--sm</div>
              </div>
              <div class="box" style="background: var(--ui-surface-default); border-radius: var(--radius-sm)">
                <div class="sg-demo-box">.box</div>
              </div>
              <div class="box--lg" style="background: var(--ui-surface-default); border-radius: var(--radius-sm)">
                <div class="sg-demo-box">.box--lg</div>
              </div>
              <div class="box--xl" style="background: var(--ui-surface-default); border-radius: var(--radius-sm)">
                <div class="sg-demo-box">.box--xl</div>
              </div>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Description</th>
                <th>Padding</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
${boxRows}
            </tbody>
          </table>
        </section>

        <section class="sg-section" id="measure">
          <h2>Measure</h2>
          <div>
            <div class="sg-demo">
              <div class="stack">
                <div class="measure-narrow" style="background: var(--ui-surface-default); padding: var(--space-8); border-radius: var(--radius-sm)">
                  <div class="sg-demo-box">.measure-narrow (45ch)</div>
                </div>
                <div class="measure" style="background: var(--ui-surface-default); padding: var(--space-8); border-radius: var(--radius-sm)">
                  <div class="sg-demo-box">.measure (65ch)</div>
                </div>
                <div class="measure-wide" style="background: var(--ui-surface-default); padding: var(--space-8); border-radius: var(--radius-sm)">
                  <div class="sg-demo-box">.measure-wide (75ch)</div>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
${measureRows}
            </tbody>
          </table>
        </section>

        <section class="sg-section" id="breakpoints">
          <h2>Breakpoints</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Width</th>
                <th>Usage</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
${breakpointRows}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  </div>
</main>
${footer()}
${scripts()}
</body>
</html>`;
}

// ===== Build =====

function main() {
  console.log('Building pages from token JSON...\n');

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  const tokens = readTokens();

  const pages = [
    { name: 'index.html', fn: indexPage },
    { name: 'components.html', fn: () => componentsPage() },
    { name: 'base.html', fn: basePage },
    { name: 'alias.html', fn: aliasPage },
    { name: 'layout.html', fn: () => layoutPage() }
  ];

  for (const page of pages) {
    const html = page.fn(tokens);
    const outPath = path.join(DIST_DIR, page.name);
    fs.writeFileSync(outPath, html);
    console.log(`  ✓ ${page.name}`);
  }

  console.log(`\n  ${tokens.colorFamilies.length} color families, ${tokens.typeScale.length} type steps, ${tokens.uiColorGroups.length} UI groups`);
}

main();
