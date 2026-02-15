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
    { href: 'base.html', label: 'Base' },
    { href: 'alias.html', label: 'Alias' },
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
            <div class="stat-value">120+</div>
            <div class="stat-label">Custom Properties</div>
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

// ===== Build =====

function main() {
  console.log('Building pages from token JSON...\n');

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  const tokens = readTokens();

  const pages = [
    { name: 'index.html', fn: indexPage },
    { name: 'base.html', fn: basePage },
    { name: 'alias.html', fn: aliasPage }
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
