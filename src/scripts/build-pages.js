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
  { file: 'utilities.html', id: 'utilities', label: 'Utilities', group: 'Foundations' },
  // Components (alphabetical)
  { file: 'badge.html', id: 'badge', label: 'Badge', group: 'Components' },
  { file: 'breadcrumbs.html', id: 'breadcrumbs', label: 'Breadcrumbs', group: 'Components' },
  { file: 'button.html', id: 'button', label: 'Button', group: 'Components' },
  { file: 'button-group.html', id: 'button-group', label: 'Button Group', group: 'Components' },
  { file: 'button-icon.html', id: 'button-icon', label: 'Button Icon', group: 'Components' },
  { file: 'card.html', id: 'card', label: 'Card', group: 'Components' },
  { file: 'card-footer.html', id: 'card-footer', label: 'Card Footer', group: 'Components' },
  { file: 'card-header.html', id: 'card-header', label: 'Card Header', group: 'Components' },
  { file: 'chips.html', id: 'chips', label: 'Chips', group: 'Components' },
  { file: 'chip-input.html', id: 'chip-input', label: 'Chip Input', group: 'Components' },
  { file: 'collapsible.html', id: 'collapsible', label: 'Collapsible', group: 'Components' },
  { file: 'divider.html', id: 'divider', label: 'Divider', group: 'Components' },
  { file: 'empty-state.html', id: 'empty-state', label: 'Empty State', group: 'Components' },
  { file: 'file-upload.html', id: 'file-upload', label: 'File Upload', group: 'Components' },
  { file: 'form-group.html', id: 'form-group', label: 'Form Group', group: 'Components' },
  { file: 'icon.html', id: 'icon', label: 'Icon', group: 'Components' },
  { file: 'inputs.html', id: 'inputs', label: 'Inputs', group: 'Components' },
  { file: 'link.html', id: 'link', label: 'Link', group: 'Components' },
  { file: 'list.html', id: 'list', label: 'List', group: 'Components' },
  { file: 'modal.html', id: 'modal', label: 'Modal', group: 'Components' },
  { file: 'nav-links.html', id: 'nav-links', label: 'Nav Links', group: 'Components' },
  { file: 'playground.html', id: 'playground', label: 'Playground', group: 'Components' },
  { file: 'progress.html', id: 'progress', label: 'Progress', group: 'Components' },
  { file: 'search.html', id: 'search', label: 'Search', group: 'Components' },
  { file: 'selects.html', id: 'selects', label: 'Selects', group: 'Components' },
  { file: 'skeleton.html', id: 'skeleton', label: 'Skeleton', group: 'Components' },
  { file: 'spinner.html', id: 'spinner', label: 'Spinner', group: 'Components' },
  { file: 'stat.html', id: 'stat', label: 'Stat', group: 'Components' },
  { file: 'status-message.html', id: 'status-message', label: 'Status Message', group: 'Components' },
  { file: 'tabs.html', id: 'tabs', label: 'Tabs', group: 'Components' },
  { file: 'textarea.html', id: 'textarea', label: 'Textarea', group: 'Components' },
  { file: 'toggle.html', id: 'toggle', label: 'Toggle', group: 'Components' },
  { file: 'token-copy.html', id: 'token-copy', label: 'Token Copy', group: 'Components' },
  { file: 'checkbox.html', id: 'checkbox', label: 'Checkbox', group: 'Components' },
  { file: 'radio.html', id: 'radio', label: 'Radio', group: 'Components' },
  // Patterns (alphabetical)
  { file: 'form-patterns.html', id: 'form-patterns', label: 'Forms', group: 'Patterns' },
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
    const groupOrder = ['text', 'bg', 'border'];
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
        const tokenName = `hds.${groupKey}.${variant}`;
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

  // Parse action colors (nested: action.primary.bg.default, etc.)
  if (uiLight && uiLight.action) {
    for (const [actionType, actionVariants] of Object.entries(uiLight.action)) {
      if (actionType.startsWith('$')) continue;
      const groupName = `Action — ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`;
      const tokens = [];
      for (const [propGroup, propValues] of Object.entries(actionVariants)) {
        if (propGroup.startsWith('$')) continue;
        for (const [variant, token] of Object.entries(propValues)) {
          if (variant.startsWith('$')) continue;
          const tokenName = `hds.action.${actionType}.${propGroup}.${variant}`;
          const cssVar = `--hds-action-${actionType}-${propGroup}-${variant}`;
          const lightHex = getHex(token);
          const lightRef = getRefName(token);
          const darkToken = uiDark?.action?.[actionType]?.[propGroup]?.[variant];
          const darkHex = darkToken ? getHex(darkToken) : '';
          const darkRef = darkToken ? getRefName(darkToken) : '';
          tokens.push({ name: tokenName, css: cssVar, lightHex, lightRef, darkHex, darkRef });
        }
      }
      uiColorGroups.push({ group: groupName, tokens });
    }
  }

  // Parse feedback colors (flat: feedback.success, etc.)
  if (uiLight && uiLight.feedback) {
    const tokens = [];
    for (const [variant, token] of Object.entries(uiLight.feedback)) {
      if (variant.startsWith('$')) continue;
      const tokenName = `hds.feedback.${variant}`;
      const cssVar = `--hds-feedback-${variant}`;
      const lightHex = getHex(token);
      const lightRef = getRefName(token);
      const darkToken = uiDark?.feedback?.[variant];
      const darkHex = darkToken ? getHex(darkToken) : '';
      const darkRef = darkToken ? getRefName(darkToken) : '';
      tokens.push({ name: tokenName, css: cssVar, lightHex, lightRef, darkHex, darkRef });
    }
    uiColorGroups.push({ group: 'Feedback', tokens });
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

const PLAYGROUND_THEME_SCRIPT = `<script>
function togglePlaygroundTheme(btn) {
  var preview = btn.closest('.style-guide-playground-preview');
  var current = preview.getAttribute('data-theme');
  var next = current === 'dark' ? 'light' : 'dark';
  preview.setAttribute('data-theme', next);
  btn.textContent = next === 'dark' ? 'Dark' : 'Light';
}
// Initialize all playground toggles to opposite of page theme
(function() {
  var pageTheme = document.documentElement.getAttribute('data-theme') || 'light';
  var label = pageTheme === 'dark' ? 'Dark' : 'Light';
  document.querySelectorAll('.hds-playground-theme-toggle').forEach(function(btn) {
    btn.textContent = label;
  });
})();
</script>`;

const CMD_K_SCRIPT = `<script>
(function() {
  // Build page list from sidebar links
  var pages = [];
  var currentGroup = '';
  var sidebar = document.querySelector('.style-guide-sidebar nav');
  if (!sidebar) return;
  var children = sidebar.children;
  for (var i = 0; i < children.length; i++) {
    var el = children[i];
    if (el.classList.contains('style-guide-sidebar-label')) {
      currentGroup = el.textContent.trim();
    } else if (el.tagName === 'A') {
      pages.push({ label: el.textContent.trim(), href: el.getAttribute('href'), group: currentGroup, isActive: el.classList.contains('active') });
    }
  }

  var backdrop = null;

  function open() {
    if (backdrop) return;
    backdrop = document.createElement('div');
    backdrop.className = 'command-palette-backdrop';
    backdrop.innerHTML =
      '<div class="command-palette">' +
        '<input class="command-palette-input" type="text" placeholder="Jump to page\\u2026" autocomplete="off" spellcheck="false">' +
        '<div class="command-palette-results"></div>' +
      '</div>';
    document.body.appendChild(backdrop);

    var input = backdrop.querySelector('.command-palette-input');
    var results = backdrop.querySelector('.command-palette-results');
    var activeIndex = 0;

    function render(query) {
      var filtered = pages;
      if (query) {
        var q = query.toLowerCase();
        filtered = pages.filter(function(p) { return p.label.toLowerCase().indexOf(q) !== -1; });
      }

      if (filtered.length === 0) {
        results.innerHTML = '<div class="command-palette-empty">No results</div>';
        activeIndex = -1;
        return;
      }

      var html = '';
      var itemIndex = 0;
      var lastGroup = '';
      for (var i = 0; i < filtered.length; i++) {
        var p = filtered[i];
        if (p.group !== lastGroup) {
          html += '<div class="command-palette-group">' + p.group + '</div>';
          lastGroup = p.group;
        }
        var cls = 'command-palette-item';
        if (itemIndex === activeIndex) cls += ' is-active';
        if (p.isActive) cls += ' is-current';
        html += '<div class="' + cls + '" data-href="' + p.href + '" data-index="' + itemIndex + '">' + p.label + '</div>';
        itemIndex++;
      }
      results.innerHTML = html;
    }

    function getItems() { return results.querySelectorAll('.command-palette-item'); }

    function setActive(idx) {
      var items = getItems();
      if (items.length === 0) return;
      if (idx < 0) idx = items.length - 1;
      if (idx >= items.length) idx = 0;
      for (var i = 0; i < items.length; i++) items[i].classList.remove('is-active');
      items[idx].classList.add('is-active');
      items[idx].scrollIntoView({ block: 'nearest' });
      activeIndex = idx;
    }

    function navigate() {
      var items = getItems();
      if (items.length === 0 || activeIndex < 0) return;
      var href = items[activeIndex].getAttribute('data-href');
      if (href) window.location.href = href;
    }

    render('');
    input.focus();

    input.addEventListener('input', function() {
      activeIndex = 0;
      render(input.value);
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); navigate(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });

    results.addEventListener('click', function(e) {
      var item = e.target.closest('.command-palette-item');
      if (item) {
        var href = item.getAttribute('data-href');
        if (href) window.location.href = href;
      }
    });

    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) close();
    });
  }

  function close() {
    if (!backdrop) return;
    backdrop.remove();
    backdrop = null;
  }

  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (backdrop) close(); else open();
    }
  });

  // Wire up sidebar shortcut badge
  var badge = document.querySelector('.command-palette-shortcut');
  if (badge) badge.addEventListener('click', open);
})();
</script>`;

const ANATOMY_SCRIPT = `<script>
(function() {
  var BADGE_SIZE = 20;
  var OUTLINE_PAD = 2;
  var BADGE_GAP = 26;

  function initAnatomy() {
    var containers = document.querySelectorAll('.style-guide-anatomy-component');
    containers.forEach(function(container) {
      var encoded = container.getAttribute('data-markers');
      if (!encoded) return;
      var markerDefs = encoded.split('||').map(function(s) {
        var el = document.createElement('div');
        el.innerHTML = '<i ' + s + '></i>';
        var i = el.firstChild;
        return {
          target: i.getAttribute('data-marker-target'),
          index: parseInt(i.getAttribute('data-marker-index')),
          primary: i.hasAttribute('data-primary')
        };
      });

      var containerRect = container.getBoundingClientRect();

      // Collect all marker data first
      var markers = [];
      markerDefs.forEach(function(def) {
        var targetEl = container.querySelector('[data-anatomy="' + def.target + '"]');
        if (!targetEl) return;
        var targetRect = targetEl.getBoundingClientRect();
        var rect = {
          top: targetRect.top - containerRect.top,
          left: targetRect.left - containerRect.left,
          width: targetRect.width,
          height: targetRect.height
        };

        // Create outline
        var outline = document.createElement('div');
        outline.className = 'style-guide-anatomy-outline';
        if (def.primary) outline.setAttribute('data-primary', '');
        outline.style.top = (rect.top - OUTLINE_PAD) + 'px';
        outline.style.left = (rect.left - OUTLINE_PAD) + 'px';
        outline.style.width = (rect.width + OUTLINE_PAD * 2) + 'px';
        outline.style.height = (rect.height + OUTLINE_PAD * 2) + 'px';
        container.appendChild(outline);

        markers.push({ def: def, rect: rect, cx: rect.left + rect.width / 2 });
      });

      // Sort by index for consistent layout
      markers.sort(function(a, b) { return a.def.index - b.def.index; });

      // Spread badges horizontally, centered above the component
      var totalWidth = (markers.length - 1) * BADGE_GAP;
      var componentCx = containerRect.width / 2;
      var startX = componentCx - totalWidth / 2;
      var badgeRow = -30;

      // Stack additional rows if more than fits in one row
      markers.forEach(function(m, i) {
        var badge = document.createElement('div');
        badge.className = 'style-guide-anatomy-marker';
        if (m.def.primary) badge.setAttribute('data-primary', '');
        badge.textContent = m.def.index;

        var badgeLeft = startX + i * BADGE_GAP - BADGE_SIZE / 2;
        badge.style.top = badgeRow + 'px';
        badge.style.left = badgeLeft + 'px';

        // Stem from badge down to outline top
        var outlineTop = m.rect.top - OUTLINE_PAD;
        var stemLength = outlineTop - (badgeRow + BADGE_SIZE);
        if (stemLength > 0) {
          badge.setAttribute('data-stem', 'down');
          badge.style.setProperty('--stem-length', stemLength + 'px');
        }

        container.appendChild(badge);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnatomy);
  } else {
    initAnatomy();
  }
})();
</script>`;

const builder = createPageBuilder({
  brandName: 'Heavy Design System',
  pages: PAGES,
  sidebarControls: '<div class="hds-btn-group"><button class="hds-btn hds-btn--tertiary hds-btn--sm theme-toggle" id="theme-toggle" aria-label="Toggle theme">Dark</button><button class="hds-btn hds-btn--tertiary hds-btn--sm command-palette-shortcut" title="Quick jump (⌘K)">⌘K</button></div>',
  customScripts: VALIDATION_SCRIPT + PLAYGROUND_THEME_SCRIPT + CMD_K_SCRIPT + ANATOMY_SCRIPT,
});

const { esc, codeBlock, anatomy, playground: _playground, description, guidelines, componentPage, foundationPage, section, wrapPage, colorTable, spacingTable, radiusTable, typographyTable, baseScaleTable } = builder;

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

// Wrap playground to add hds-specific class + syntax highlighting + theme toggle
const THEME_TOGGLE = '<button class="hds-btn hds-btn--tertiary hds-btn--sm hds-playground-theme-toggle" onclick="togglePlaygroundTheme(this)" aria-label="Toggle dark/light">Light</button>';

const playground = (preview, code) => {
  let html = _playground(preview, code);
  html = html.replace('style-guide-playground-code"', 'style-guide-playground-code hds-playground-code"');
  html = html.replace(/<code>([\s\S]*?)<\/code>/, (_, inner) => `<code>${highlightHtml(inner)}</code>`);
  // Restyle copy button as hds-btn--tertiary --sm
  html = html.replace('class="style-guide-playground-copy"', 'class="hds-btn hds-btn--tertiary hds-btn--sm style-guide-playground-copy"');
  // Inject theme toggle into playground preview
  html = html.replace('style-guide-playground-preview">', `style-guide-playground-preview">\n          ${THEME_TOGGLE}`);
  return html;
};

const playgroundWide = (preview, code) => {
  let html = playground(preview, code);
  html = html.replace('class="style-guide-playground"', 'class="style-guide-playground style-guide-playground--wide"');
  return html;
};

// ===== Content Functions =====

function colorSample(hex, groupKey, bgHex) {
  if (groupKey === 'text') {
    return `<span style="color: ${hex}; font-size: 14px; font-weight: 500">Lorem ipsum dolor</span>`;
  }
  if (groupKey === 'border') {
    return `<div style="width: 24px; height: 24px; border: 1px solid ${hex}; border-radius: 4px"></div>`;
  }
  // bg, surface, action, feedback — filled swatch
  return `<div class="style-guide-token-bar" style="background: ${hex}"></div>`;
}

function colorsContent(tokens) {
  const colorSections = tokens.colorFamilies.map(f =>
    section(f.name, colorTable(f.stops.map(s => ({
      tokenName: `base-color-${f.name}-${s.stop}`,
      copyValue: `--base-color-${f.name}-${s.stop}`,
      sampleColor: s.hex,
      value: s.hex,
    }))))
  ).join('\n');

  // Resolve bg hex for border sample contrast
  const darkBgGroup = tokens.uiColorGroups.find(g => g.group === 'Background');
  const lightBgGroup = darkBgGroup;
  const darkBgHex = darkBgGroup?.tokens[0]?.darkHex || '#161616';
  const lightBgHex = lightBgGroup?.tokens[0]?.lightHex || '#f0f0f0';

  const textColorClassRows = [
    ['.hds-text-default', 'var(--hds-text-default)'],
    ['.hds-text-strong', 'var(--hds-text-strong)'],
    ['.hds-text-muted', 'var(--hds-text-default)'],
    ['.hds-text-disabled', 'var(--hds-text-disabled)'],
  ].map(([cls, val]) =>
    `                <tr><td><code>${cls}</code></td><td>${val}</td></tr>`
  ).join('\n');

  const textColorClassesTable = `
          <table class="style-guide-data-table" style="margin-top: var(--hds-space-24)">
            <thead>
              <tr>
                <th>Class</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${textColorClassRows}
            </tbody>
          </table>`;

  const uiColorSections = tokens.uiColorGroups.map(group => {
    const groupKey = group.group.toLowerCase();
    const rows = group.tokens.map(t => `          <tr>
            <td><span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('${esc(t.css)}', this)">${esc(t.name)}</span></td>
            <td>${colorSample(t.lightHex, groupKey, lightBgHex)}</td>
            <td><span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('${esc(t.lightRef)}', this)">${esc(t.lightRef)}</span></td>
            <td>${colorSample(t.darkHex, groupKey, darkBgHex)}</td>
            <td><span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('${esc(t.darkRef)}', this)">${esc(t.darkRef)}</span></td>
          </tr>`).join('\n');
    const table = `      <table class="style-guide-data-table style-guide-data-table--visual style-guide-data-table--dual">
        <thead><tr><th>Token</th><th>Light</th><th>Value</th><th>Dark</th><th>Value</th></tr></thead>
        <tbody>
${rows}
        </tbody>
      </table>`;
    // Append text color utility classes inside the Text section
    const extra = group.group === 'Text' ? textColorClassesTable : '';
    return section(group.group, table + extra);
  }).join('\n');

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

    section('Font Weights', baseScaleTable([
      { name: 'base-font-weights-light', value: '100' },
      { name: 'base-font-weights-regular', value: '400' },
      { name: 'base-font-weights-bold', value: '700' },
    ].map(w => ({
      tokenName: w.name,
      copyValue: `--${w.name}`,
      value: w.value,
      sampleStyle: `font-weight: ${w.value}; font-size: 20px`,
      sampleContent: 'The quick brown fox jumps over the lazy dog',
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

    ...(() => {
      const utilRows = (data) => data.map(([a, b, c]) =>
        `                <tr><td><code>${a}</code></td><td>${b}</td><td>${c}</td></tr>`
      ).join('\n');
      const utilTable = (heading, headerRow, bodyRows) =>
        section(heading,
          `          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>${headerRow[0]}</th>
                <th>${headerRow[1]}</th>
                <th>${headerRow[2]}</th>
              </tr>
            </thead>
            <tbody>
${bodyRows}
            </tbody>
          </table>`);
      return [
        utilTable('Body Text Classes', ['Class', 'Description', 'Font Size'], utilRows([
          ['.hds-body', 'Body text', 'var(--hds-font-size-body)'],
          ['.hds-body-sm', 'Small body text', 'var(--hds-font-size-body-sm)'],
          ['.hds-body-xsm', 'Extra-small body text', 'var(--hds-font-size-body-xs)'],
        ])),
        utilTable('Font Family Classes', ['Class', 'Property', 'Value'], utilRows([
          ['.hds-font-primary', 'font-family', 'var(--base-font-primary)'],
          ['.hds-font-secondary', 'font-family', 'var(--base-font-secondary)'],
          ['.hds-font-sans', 'font-family', 'var(--base-font-primary)'],
        ])),
        utilTable('Font Weight Classes', ['Class', 'Property', 'Value'], utilRows([
          ['.hds-font-thin', 'font-weight', '100'],
          ['.hds-font-extralight', 'font-weight', '200'],
          ['.hds-font-light', 'font-weight', '300'],
          ['.hds-font-normal', 'font-weight', '400'],
          ['.hds-font-medium', 'font-weight', '500'],
          ['.hds-font-semibold', 'font-weight', '600'],
          ['.hds-font-bold', 'font-weight', '700'],
          ['.hds-font-extrabold', 'font-weight', '800'],
          ['.hds-font-black', 'font-weight', '900'],
        ])),
        utilTable('Text Transform Classes', ['Class', 'Property', 'Value'], utilRows([
          ['.hds-uppercase', 'text-transform', 'uppercase'],
          ['.hds-lowercase', 'text-transform', 'lowercase'],
          ['.hds-capitalize', 'text-transform', 'capitalize'],
        ])),
        utilTable('Letter Spacing Classes', ['Class', 'Property', 'Value'], utilRows([
          ['.hds-tracking-tight', 'letter-spacing', '-0.02em'],
          ['.hds-tracking-normal', 'letter-spacing', '0'],
          ['.hds-tracking-wide', 'letter-spacing', '0.05em'],
          ['.hds-tracking-wider', 'letter-spacing', '0.1em'],
        ])),
        utilTable('Line Height Classes', ['Class', 'Property', 'Value'], utilRows([
          ['.hds-leading-none', 'line-height', '1'],
          ['.hds-leading-tight', 'line-height', 'var(--hds-line-height-tight)'],
          ['.hds-leading-normal', 'line-height', 'var(--hds-line-height-base)'],
          ['.hds-leading-loose', 'line-height', 'var(--hds-line-height-loose)'],
        ])),
      ];
    })(),
  ]);
}

function spacingContent(tokens) {
  const utilRows = (data) => data.map(([a, b, c]) =>
    `                <tr><td><code>${a}</code></td><td>${b}</td><td>${c}</td></tr>`
  ).join('\n');
  const utilTable = (heading, bodyRows) =>
    section(heading,
      `          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Property</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
${bodyRows}
            </tbody>
          </table>`);

  return foundationPage('Spacing', 'Semantic spacing aliases built from the base scale.', [
    section('Spacing Aliases', spacingTable(tokens.gaps.map(g => ({
      tokenName: g.name,
      copyValue: g.css,
      value: g.scaleRef || g.value,
      widthPx: parseInt(g.value),
    })))),
    utilTable('Margin Classes', utilRows([
      ['.hds-m-0', 'margin', '0'],
      ['.hds-m-1', 'margin', 'var(--hds-space-4) &mdash; 4px'],
      ['.hds-m-2', 'margin', 'var(--hds-space-8) &mdash; 8px'],
      ['.hds-m-3', 'margin', 'var(--hds-space-16) &mdash; 16px'],
      ['.hds-m-4', 'margin', 'var(--hds-space-24) &mdash; 24px'],
      ['.hds-m-5', 'margin', 'var(--hds-space-32) &mdash; 32px'],
      ['.hds-m-6', 'margin', 'var(--hds-space-48) &mdash; 48px'],
      ['.hds-mx-auto', 'margin-inline', 'auto'],
      ['.hds-my-0', 'margin-block', '0'],
      ['.hds-my-1', 'margin-block', 'var(--hds-space-4) &mdash; 4px'],
      ['.hds-my-2', 'margin-block', 'var(--hds-space-8) &mdash; 8px'],
      ['.hds-my-3', 'margin-block', 'var(--hds-space-16) &mdash; 16px'],
      ['.hds-my-4', 'margin-block', 'var(--hds-space-24) &mdash; 24px'],
      ['.hds-my-5', 'margin-block', 'var(--hds-space-32) &mdash; 32px'],
      ['.hds-my-6', 'margin-block', 'var(--hds-space-48) &mdash; 48px'],
      ['.hds-mb-0', 'margin-bottom', '0'],
      ['.hds-mb-1', 'margin-bottom', 'var(--hds-space-4) &mdash; 4px'],
      ['.hds-mb-2', 'margin-bottom', 'var(--hds-space-8) &mdash; 8px'],
      ['.hds-mb-3', 'margin-bottom', 'var(--hds-space-16) &mdash; 16px'],
      ['.hds-mb-4', 'margin-bottom', 'var(--hds-space-24) &mdash; 24px'],
      ['.hds-mb-5', 'margin-bottom', 'var(--hds-space-32) &mdash; 32px'],
      ['.hds-mb-6', 'margin-bottom', 'var(--hds-space-48) &mdash; 48px'],
      ['.hds-mt-0', 'margin-top', '0'],
      ['.hds-mt-1', 'margin-top', 'var(--hds-space-4) &mdash; 4px'],
      ['.hds-mt-2', 'margin-top', 'var(--hds-space-8) &mdash; 8px'],
      ['.hds-mt-3', 'margin-top', 'var(--hds-space-16) &mdash; 16px'],
      ['.hds-mt-4', 'margin-top', 'var(--hds-space-24) &mdash; 24px'],
      ['.hds-mt-5', 'margin-top', 'var(--hds-space-32) &mdash; 32px'],
      ['.hds-mt-6', 'margin-top', 'var(--hds-space-48) &mdash; 48px'],
    ])),
    utilTable('Padding Classes', utilRows([
      ['.hds-p-0', 'padding', '0'],
      ['.hds-p-1', 'padding', 'var(--hds-space-4) &mdash; 4px'],
      ['.hds-p-2', 'padding', 'var(--hds-space-8) &mdash; 8px'],
      ['.hds-p-3', 'padding', 'var(--hds-space-16) &mdash; 16px'],
      ['.hds-p-4', 'padding', 'var(--hds-space-24) &mdash; 24px'],
      ['.hds-p-5', 'padding', 'var(--hds-space-32) &mdash; 32px'],
      ['.hds-p-6', 'padding', 'var(--hds-space-48) &mdash; 48px'],
      ['.hds-px-0', 'padding-inline', '0'],
      ['.hds-px-1', 'padding-inline', 'var(--hds-space-4) &mdash; 4px'],
      ['.hds-px-2', 'padding-inline', 'var(--hds-space-8) &mdash; 8px'],
      ['.hds-px-3', 'padding-inline', 'var(--hds-space-16) &mdash; 16px'],
      ['.hds-px-4', 'padding-inline', 'var(--hds-space-24) &mdash; 24px'],
      ['.hds-px-5', 'padding-inline', 'var(--hds-space-32) &mdash; 32px'],
      ['.hds-px-6', 'padding-inline', 'var(--hds-space-48) &mdash; 48px'],
      ['.hds-py-0', 'padding-block', '0'],
      ['.hds-py-1', 'padding-block', 'var(--hds-space-4) &mdash; 4px'],
      ['.hds-py-2', 'padding-block', 'var(--hds-space-8) &mdash; 8px'],
      ['.hds-py-3', 'padding-block', 'var(--hds-space-16) &mdash; 16px'],
      ['.hds-py-4', 'padding-block', 'var(--hds-space-24) &mdash; 24px'],
      ['.hds-py-5', 'padding-block', 'var(--hds-space-32) &mdash; 32px'],
      ['.hds-py-6', 'padding-block', 'var(--hds-space-48) &mdash; 48px'],
    ])),
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
  return foundationPage('Animation', 'Motion tokens, micro-interactions, and entrance animations for consistent, tactile UI across the system.', [
    `          <h3 class="style-guide-section-name">Duration Tokens</h3>
          <div>
            <div class="hds-stack hds-stack--lg">
              <table class="style-guide-data-table">
                <thead><tr><th>Token</th><th>Value</th><th>Use</th></tr></thead>
                <tbody>
                  <tr><td><code>--hds-duration-instant</code></td><td>100ms</td><td>Micro-feedback (press, hover)</td></tr>
                  <tr><td><code>--hds-duration-fast</code></td><td>150ms</td><td>Component transitions (buttons, inputs, toggles)</td></tr>
                  <tr><td><code>--hds-duration-normal</code></td><td>200ms</td><td>Fade-in, scale-in utilities</td></tr>
                  <tr><td><code>--hds-duration-slow</code></td><td>300ms</td><td>Entrance animations (slide-up, modal)</td></tr>
                  <tr><td><code>--hds-duration-slower</code></td><td>500ms</td><td>Large reveals</td></tr>
                  <tr><td><code>--hds-delay-stagger</code></td><td>50ms</td><td>Stagger increment between children</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <h3 class="style-guide-section-name">Timing Functions</h3>
          <div>
            <div class="hds-stack hds-stack--lg">
              <div class="hds-stack hds-stack--sm">
                <div class="hds-kv"><span class="hds-kv-key">--hds-ease-out</span><span class="hds-kv-value">cubic-bezier(0.16, 1, 0.3, 1)</span></div>
                <div class="hds-kv"><span class="hds-kv-key">--hds-ease-in-out</span><span class="hds-kv-value">cubic-bezier(0.45, 0, 0.55, 1)</span></div>
                <div class="hds-kv"><span class="hds-kv-key">--hds-ease-spring</span><span class="hds-kv-value">cubic-bezier(0.34, 1.56, 0.64, 1)</span></div>
              </div>
              <p class="hds-body-sm hds-text-default">Backward-compatible aliases (<code>--ease-out</code>, <code>--ease-in-out</code>, <code>--ease-spring</code>) still work.</p>
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
                <span class="hds-badge">backdrop-fade</span>
                <span class="hds-badge">modal-enter</span>
                <span class="hds-badge">progress-pulse</span>
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
                    <td>--hds-duration-normal</td>
                    <td>--hds-ease-out</td>
                  </tr>
                  <tr>
                    <td><code>.animate-slide-up</code></td>
                    <td>slide-up</td>
                    <td>--hds-duration-slow</td>
                    <td>--hds-ease-out</td>
                  </tr>
                  <tr>
                    <td><code>.animate-slide-down</code></td>
                    <td>slide-down</td>
                    <td>--hds-duration-slow</td>
                    <td>--hds-ease-out</td>
                  </tr>
                  <tr>
                    <td><code>.animate-scale-in</code></td>
                    <td>scale-in</td>
                    <td>--hds-duration-normal</td>
                    <td>--hds-ease-spring</td>
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
          <h3 class="style-guide-section-name">Micro-Interactions</h3>
          <div>
            <div class="hds-stack hds-stack--lg">
              <p class="hds-body-sm hds-text-default">Subtle tactile feedback on interactive elements. Built into the components &mdash; no extra classes needed.</p>
              <table class="style-guide-data-table">
                <thead><tr><th>Component</th><th>Trigger</th><th>Effect</th></tr></thead>
                <tbody>
                  <tr><td>Button / Button Icon</td><td><code>:active</code></td><td><code>scale(0.97)</code> &mdash; 100ms ease-out</td></tr>
                  <tr><td>Toggle</td><td>State change</td><td>Spring easing on thumb slide</td></tr>
                  <tr><td>Progress bar</td><td>Continuous</td><td>Faint leading-edge pulse (2s cycle)</td></tr>
                </tbody>
              </table>
              <div class="hds-cluster" style="gap: var(--hds-space-16);">
                <button class="hds-btn hds-btn--primary">Press me</button>
                <button class="hds-btn hds-btn--secondary">Press me</button>
                <button class="hds-btn hds-btn--tertiary">Press me</button>
              </div>
              <div style="max-width: 300px;">
                <label class="hds-form-toggle">
                  <input type="checkbox" checked>
                  <span class="hds-form-toggle-track"></span>
                  <span class="hds-body-sm">Spring toggle</span>
                </label>
              </div>
              <div style="max-width: 300px;">
                <div class="hds-progress"><div class="hds-progress-bar" style="width: 65%;"></div></div>
                <p class="hds-body-sm hds-text-default" style="margin-top: var(--hds-space-4);">Progress with leading-edge pulse</p>
              </div>
              <div style="max-width: 300px;">
                <div class="hds-progress"><div class="hds-progress-bar hds-progress-bar--complete" style="width: 100%;"></div></div>
                <p class="hds-body-sm hds-text-default" style="margin-top: var(--hds-space-4);">Complete &mdash; pulse disabled</p>
              </div>
            </div>
          </div>
          <h3 class="style-guide-section-name">Component Entrances</h3>
          <div>
            <div class="hds-stack hds-stack--lg">
              <p class="hds-body-sm hds-text-default">Modal uses a two-stage entrance: backdrop fades (200ms), then the modal scales in with spring easing (300ms).</p>
              <table class="style-guide-data-table">
                <thead><tr><th>Element</th><th>Keyframe</th><th>Duration</th><th>Easing</th></tr></thead>
                <tbody>
                  <tr><td><code>.hds-modal-backdrop</code></td><td>backdrop-fade</td><td>--hds-duration-normal</td><td>--hds-ease-out</td></tr>
                  <tr><td><code>.hds-modal</code></td><td>modal-enter</td><td>--hds-duration-slow</td><td>--hds-ease-spring</td></tr>
                </tbody>
              </table>
              <button class="hds-btn hds-btn--secondary" onclick="document.getElementById('animation-demo-modal').style.display='flex'">Open modal demo</button>
              <div id="animation-demo-modal" class="hds-modal-backdrop" style="display:none; position:relative; inset:auto; min-height:200px; border-radius:var(--hds-radius-md);" onclick="if(event.target===this)this.style.display='none'">
                <div class="hds-modal" style="min-width:200px; max-width:320px;">
                  <div class="hds-modal-header">
                    <span class="hds-modal-title">Demo Modal</span>
                    <button class="hds-btn-icon" aria-label="Close" onclick="this.closest('.hds-modal-backdrop').style.display='none'">&times;</button>
                  </div>
                  <div class="hds-modal-body">
                    <p class="hds-body-sm hds-text-default">Backdrop fades, modal scales in with spring easing.</p>
                  </div>
                  <div class="hds-modal-footer">
                    <button class="hds-btn hds-btn--primary" onclick="this.closest('.hds-modal-backdrop').style.display='none'">Close</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <h3 class="style-guide-section-name">Stagger Children</h3>
          <div>
            <div class="hds-stack hds-stack--lg">
              <p class="hds-body-sm hds-text-default">Apply <code>.stagger-children</code> to a container. Supports up to 12 children. Customize pace with <code>--stagger-delay</code> (default: 50ms).</p>
              <div class="stagger-children hds-cluster">
                <span class="hds-badge hds-badge--info">1</span>
                <span class="hds-badge hds-badge--info">2</span>
                <span class="hds-badge hds-badge--info">3</span>
                <span class="hds-badge hds-badge--info">4</span>
                <span class="hds-badge hds-badge--info">5</span>
                <span class="hds-badge hds-badge--info">6</span>
                <span class="hds-badge hds-badge--info">7</span>
                <span class="hds-badge hds-badge--info">8</span>
                <span class="hds-badge hds-badge--info">9</span>
                <span class="hds-badge hds-badge--info">10</span>
                <span class="hds-badge hds-badge--info">11</span>
                <span class="hds-badge hds-badge--info">12</span>
              </div>
            </div>
          </div>
          <h3 class="style-guide-section-name">Reduced Motion</h3>
          <div>
            <div class="hds-stack hds-stack--lg">
              <p class="hds-body-sm hds-text-default">A global <code>@media (prefers-reduced-motion: reduce)</code> rule forces all animations to near-zero duration and single iteration. No per-component opt-in needed &mdash; enable &ldquo;Reduce motion&rdquo; in system accessibility settings and all transitions resolve instantly.</p>
            </div>
          </div>`,
  ]);
}

function utilitiesContent() {
  const rows = (data) => data.map(([a, b, c]) =>
    `                <tr><td><span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('${esc(a)}', this)">${esc(a)}</span></td><td>${b}</td><td>${c}</td></tr>`
  ).join('\n');

  const flexRows = rows([
    ['.hds-flex', 'display', 'flex'],
    ['.hds-flex-col', 'flex-direction', 'column'],
    ['.hds-flex-row', 'flex-direction', 'row'],
    ['.hds-flex-wrap', 'flex-wrap', 'wrap'],
    ['.hds-items-start', 'align-items', 'flex-start'],
    ['.hds-items-center', 'align-items', 'center'],
    ['.hds-items-end', 'align-items', 'flex-end'],
    ['.hds-items-baseline', 'align-items', 'baseline'],
    ['.hds-justify-start', 'justify-content', 'flex-start'],
    ['.hds-justify-center', 'justify-content', 'center'],
    ['.hds-justify-end', 'justify-content', 'flex-end'],
    ['.hds-justify-between', 'justify-content', 'space-between'],
  ]);

  const gapRows = rows([
    ['.hds-gap-1', 'gap', 'var(--hds-space-8) &mdash; 8px'],
    ['.hds-gap-2', 'gap', 'var(--hds-space-16) &mdash; 16px'],
    ['.hds-gap-3', 'gap', 'var(--hds-space-24) &mdash; 24px'],
    ['.hds-gap-4', 'gap', 'var(--hds-space-32) &mdash; 32px'],
    ['.hds-gap-5', 'gap', 'var(--hds-space-40) &mdash; 40px'],
    ['.hds-gap-6', 'gap', 'var(--hds-space-48) &mdash; 48px'],
  ]);

  const stackClusterRows = rows([
    ['.hds-stack', 'Vertical rhythm between children', 'var(--hds-space-16) &mdash; 16px'],
    ['.hds-stack--sm', 'Tight vertical rhythm', 'var(--hds-space-8) &mdash; 8px'],
    ['.hds-stack--md', 'Medium vertical rhythm', 'var(--hds-space-16) &mdash; 16px'],
    ['.hds-stack--lg', 'Loose vertical rhythm', 'var(--hds-space-24) &mdash; 24px'],
    ['.hds-stack--xl', 'Extra-loose vertical rhythm', 'var(--hds-space-32) &mdash; 32px'],
    ['.hds-cluster', 'Horizontal flex-wrap grouping', 'var(--hds-space-16) &mdash; 16px'],
  ]);

  const layoutRows = rows([
    ['.hds-with-sidebar', 'Sidebar + main content layout', 'flex-wrap, sidebar 280px, main 50%+ min'],
    ['.hds-center', 'Centered max-width container', 'max-inline-size: var(--hds-measure), margin-inline: auto'],
    ['.hds-cover', 'Full-viewport flex column', 'min-block-size: 100vh, centered child via .hds-cover__centered'],
    ['.hds-box', 'Padding primitive (default)', 'padding: var(--hds-space-16) &mdash; 16px'],
    ['.hds-box--sm', 'Padding primitive (small)', 'padding: var(--hds-space-8) &mdash; 8px'],
    ['.hds-box--lg', 'Padding primitive (large)', 'padding: var(--hds-space-24) &mdash; 24px'],
    ['.hds-box--xl', 'Padding primitive (extra-large)', 'padding: var(--hds-space-32) &mdash; 32px'],
  ]);

  const displayRows = rows([
    ['.hds-block', 'display', 'block'],
    ['.hds-inline-block', 'display', 'inline-block'],
    ['.hds-inline', 'display', 'inline'],
    ['.hds-hidden', 'display', 'none'],
    ['.hds-visible', 'visibility', 'visible'],
    ['.hds-invisible', 'visibility', 'hidden'],
    ['.hds-w-full', 'width', '100%'],
    ['.hds-h-full', 'height', '100%'],
    ['.hds-min-h-screen', 'min-height', '100vh'],
    ['.hds-text-left', 'text-align', 'left'],
    ['.hds-text-center', 'text-align', 'center'],
    ['.hds-text-right', 'text-align', 'right'],
    ['.hds-sr-only', 'Visually hidden, accessible to screen readers', 'position: absolute, clip, 1px &times; 1px'],
    ['.hds-sr-only-focusable', 'Visible on focus (skip links)', 'Overrides sr-only on :focus/:focus-within'],
  ]);

  const utilityTable = (heading, headerRow, bodyRows) =>
    section(heading,
      `          <table class="style-guide-data-table">
            <thead>
              <tr>
                <th>${headerRow[0]}</th>
                <th>${headerRow[1]}</th>
                <th>${headerRow[2]}</th>
              </tr>
            </thead>
            <tbody>
${bodyRows}
            </tbody>
          </table>`);

  return foundationPage('Utilities', 'Single-purpose CSS classes for layout, spacing, display, and accessibility. Apply directly to elements &mdash; no custom CSS needed.', [
    utilityTable('Flex', ['Class', 'Property', 'Value'], flexRows),
    utilityTable('Gap', ['Class', 'Property', 'Value'], gapRows),
    utilityTable('Stack &amp; Cluster', ['Class', 'Description', 'Default'], stackClusterRows),
    utilityTable('Layout Primitives', ['Class', 'Description', 'Key Props'], layoutRows),
    utilityTable('Display &amp; Visibility', ['Class', 'Property', 'Value'], displayRows),
  ]);
}

function breadcrumbsContent() {
  return componentPage('Breadcrumbs', {
    description: 'A horizontal trail of links showing the user\'s location within a site hierarchy. Helps users navigate back to parent pages without using the browser\'s back button.',
    anatomy: anatomy(
      `            <div class="hds-breadcrumbs" data-anatomy="container">
              <a class="hds-link" href="#" data-anatomy="link">Home</a>
              <span class="hds-breadcrumbs-separator" data-anatomy="separator">/</span>
              <a class="hds-link" href="#">Projects</a>
              <span class="hds-breadcrumbs-separator">/</span>
              <span class="hds-breadcrumbs-current" data-anatomy="current">Design System</span>
            </div>`,
      [
        { label: 'Link', target: 'link' },
        { label: 'Separator', target: 'separator' },
        { label: 'Current', target: 'current' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Type', content: playground(
        `          <div class="style-guide-variant-row">
            <div class="hds-breadcrumbs">
              <a class="hds-link" href="#">Home</a>
              <span class="hds-breadcrumbs-separator">/</span>
              <a class="hds-link" href="#">Projects</a>
              <span class="hds-breadcrumbs-separator">/</span>
              <span class="hds-breadcrumbs-current">Design System</span>
            </div>
          </div>`,
        `<nav class="hds-breadcrumbs">
  <a class="hds-link" href="#">Home</a>
  <span class="hds-breadcrumbs-separator">/</span>
  <a class="hds-link" href="#">Projects</a>
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
    anatomy: anatomy(
      `            <button class="hds-btn hds-btn--primary" data-anatomy="container"><span data-anatomy="label">Label</span></button>`,
      [
        { label: 'Label', target: 'label' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
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
            <button class="hds-btn hds-btn--primary hds-btn--tiny">Tiny</button>
            <button class="hds-btn hds-btn--primary hds-btn--xs">X-Small</button>
            <button class="hds-btn hds-btn--primary hds-btn--sm">Small</button>
            <button class="hds-btn hds-btn--primary">Medium</button>
            <button class="hds-btn hds-btn--primary hds-btn--lg">Large</button>
          </div>`,
        `<button class="hds-btn hds-btn--primary hds-btn--tiny">Label</button>
<button class="hds-btn hds-btn--primary hds-btn--xs">Label</button>
<button class="hds-btn hds-btn--primary hds-btn--sm">Label</button>
<button class="hds-btn hds-btn--primary">Label</button>
<button class="hds-btn hds-btn--primary hds-btn--lg">Label</button>`
      ) },
      { label: 'Icon + Text', content: playground(
        `          <div class="style-guide-variant-row">
            <button class="hds-btn hds-btn--primary"><span class="hds-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8.5l3.5 3.5L13 4.5"/></svg></span> Save</button>
            <button class="hds-btn hds-btn--secondary"><span class="hds-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5Z"/></svg></span> Edit</button>
            <button class="hds-btn hds-btn--tertiary"><span class="hds-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1.5 2h13l-4.5 5.5V13l-4 2V7.5L1.5 2Z"/></svg></span> Filter</button>
          </div>`,
        esc(`<button class="hds-btn hds-btn--primary">\n  <span class="hds-icon"><svg>\u2026</svg></span>\n  Save\n</button>`)
      ) },
      { label: 'Block', content: playground(
        `          <button class="hds-btn hds-btn--primary hds-btn--block">Label</button>`,
        '<button class="hds-btn hds-btn--primary hds-btn--block">Label</button>'
      ) },
    ],
  });
}

function buttonIconContent() {
  const gearSvg16 = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6.8 1.5h2.4l.3 1.9.5.2 1.6-1 1.7 1.7-1 1.6.2.5 1.9.3v2.4l-1.9.3-.2.5 1 1.6-1.7 1.7-1.6-1-.5.2-.3 1.9H6.8l-.3-1.9-.5-.2-1.6 1-1.7-1.7 1-1.6-.2-.5-1.9-.3V6.8l1.9-.3.2-.5-1-1.6 1.7-1.7 1.6 1 .5-.2.3-1.9Z"/><circle cx="8" cy="8" r="2.25"/></svg>';
  const gearSvg20 = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8.5 1.9h3l.4 2.3.6.3 2-1.3 2.1 2.1-1.3 2 .3.6 2.3.4v3l-2.3.4-.3.6 1.3 2-2.1 2.1-2-1.3-.6.3-.4 2.3h-3l-.4-2.3-.6-.3-2 1.3-2.1-2.1 1.3-2-.3-.6-2.3-.4v-3l2.3-.4.3-.6-1.3-2 2.1-2.1 2 1.3.6-.3.4-2.3Z"/><circle cx="10" cy="10" r="2.75"/></svg>';
  const gearSvg24 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.2 2.3h3.6l.5 2.8.7.3 2.4-1.5 2.5 2.5-1.5 2.4.3.7 2.8.5v3.6l-2.8.5-.3.7 1.5 2.4-2.5 2.5-2.4-1.5-.7.3-.5 2.8h-3.6l-.5-2.8-.7-.3-2.4 1.5-2.5-2.5 1.5-2.4-.3-.7-2.8-.5v-3.6l2.8-.5.3-.7-1.5-2.4 2.5-2.5 2.4 1.5.7-.3.5-2.8Z"/><circle cx="12" cy="12" r="3.25"/></svg>';
  const iconXsm = `<span class="hds-icon hds-icon--xsm">${gearSvg16}</span>`;
  const iconSm = `<span class="hds-icon hds-icon--sm">${gearSvg16}</span>`;
  const iconMd = `<span class="hds-icon hds-icon--md">${gearSvg20}</span>`;
  const iconLg = `<span class="hds-icon hds-icon--lg">${gearSvg24}</span>`;
  return componentPage('Button Icon', {
    description: 'A compact button that communicates its action through an icon alone. Wraps an HeavyIcon child. Used for common, recognizable actions where a text label would add clutter. Shares the same type variants as Button.',
    anatomy: anatomy(
      `            <button class="hds-btn-icon hds-btn-icon--primary" aria-label="Settings" data-anatomy="container"><span class="hds-icon hds-icon--md" data-anatomy="icon">${gearSvg20}</span></button>`,
      [
        { label: 'Icon', target: 'icon' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Type', content: playground(
        `          <div class="style-guide-variant-row">
            <button class="hds-btn-icon hds-btn-icon--primary" aria-label="Settings">${iconMd}</button>
            <button class="hds-btn-icon hds-btn-icon--secondary" aria-label="Settings">${iconMd}</button>
            <button class="hds-btn-icon hds-btn-icon--tertiary" aria-label="Settings">${iconMd}</button>
            <button class="hds-btn-icon hds-btn-icon--danger" aria-label="Settings">${iconMd}</button>
          </div>`,
        `<button class="hds-btn-icon hds-btn-icon--primary" aria-label="Settings">
  <span class="hds-icon hds-icon--md"><!-- svg --></span>
</button>
<button class="hds-btn-icon hds-btn-icon--secondary">...</button>
<button class="hds-btn-icon hds-btn-icon--tertiary">...</button>
<button class="hds-btn-icon hds-btn-icon--danger">...</button>`
      ) },
      { label: 'States', content: playground(
        `          <div class="style-guide-variant-row">
            <button class="hds-btn-icon hds-btn-icon--primary" aria-label="Default">${iconMd}</button>
            <button class="hds-btn-icon hds-btn-icon--primary is-hover" aria-label="Hover">${iconMd}</button>
            <button class="hds-btn-icon hds-btn-icon--primary is-active" aria-label="Active">${iconMd}</button>
            <button class="hds-btn-icon hds-btn-icon--primary is-focus" aria-label="Focus">${iconMd}</button>
            <button class="hds-btn-icon hds-btn-icon--primary is-disabled" disabled aria-label="Disabled">${iconMd}</button>
          </div>`,
        `<!-- Default -->
<button class="hds-btn-icon hds-btn-icon--primary" aria-label="Settings">
  <span class="hds-icon hds-icon--md"><!-- svg --></span>
</button>
<!-- Disabled -->
<button class="hds-btn-icon hds-btn-icon--primary" disabled aria-label="Settings">
  <span class="hds-icon hds-icon--md"><!-- svg --></span>
</button>`
      ) },
      { label: 'Size', content: playground(
        `          <div class="style-guide-variant-row">
            <button class="hds-btn-icon hds-btn-icon--primary hds-btn-icon--tiny" aria-label="Tiny">${iconXsm}</button>
            <button class="hds-btn-icon hds-btn-icon--primary hds-btn-icon--xs" aria-label="Extra small">${iconSm}</button>
            <button class="hds-btn-icon hds-btn-icon--primary hds-btn-icon--sm" aria-label="Small">${iconSm}</button>
            <button class="hds-btn-icon hds-btn-icon--primary" aria-label="Medium">${iconMd}</button>
            <button class="hds-btn-icon hds-btn-icon--primary hds-btn-icon--lg" aria-label="Large">${iconLg}</button>
          </div>`,
        `<!-- tiny + icon xsm -->
<button class="hds-btn-icon hds-btn-icon--primary hds-btn-icon--tiny">
  <span class="hds-icon hds-icon--xsm"><!-- svg --></span>
</button>
<!-- xs + icon sm -->
<button class="hds-btn-icon hds-btn-icon--primary hds-btn-icon--xs">
  <span class="hds-icon hds-icon--sm"><!-- svg --></span>
</button>
<!-- sm + icon sm -->
<button class="hds-btn-icon hds-btn-icon--primary hds-btn-icon--sm">
  <span class="hds-icon hds-icon--sm"><!-- svg --></span>
</button>
<!-- md (default) + icon md -->
<button class="hds-btn-icon hds-btn-icon--primary">
  <span class="hds-icon hds-icon--md"><!-- svg --></span>
</button>
<!-- lg + icon lg -->
<button class="hds-btn-icon hds-btn-icon--primary hds-btn-icon--lg">
  <span class="hds-icon hds-icon--lg"><!-- svg --></span>
</button>`
      ) },
    ],
  });
}

function buttonGroupContent() {
  return componentPage('Button Group', {
    description: 'A horizontal row of related buttons with tightened spacing. Groups actions that operate on the same object or belong to the same workflow step.',
    anatomy: anatomy(
      `            <div class="hds-btn-group" data-anatomy="container">
              <button class="hds-btn hds-btn--secondary" data-anatomy="button">Left</button>
              <button class="hds-btn hds-btn--secondary">Center</button>
              <button class="hds-btn hds-btn--secondary">Right</button>
            </div>`,
      [
        { label: 'Button', target: 'button' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
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

const chipX = '<span class="hds-icon hds-icon--xsm"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="11" y1="5" x2="5" y2="11"/><line x1="5" y1="5" x2="11" y2="11"/></svg></span>';

function chipsContent() {
  return componentPage('Chips', {
    description: 'Compact elements for filtering content or selecting from a set of options. Chips toggle between active and inactive states, letting users refine what they see.',
    anatomy: anatomy(
      `            <button class="hds-chip" data-anatomy="container"><span data-anatomy="label">Label</span><span class="hds-chip-remove" data-anatomy="remove">${chipX}</span></button>`,
      [
        { label: 'Label', target: 'label' },
        { label: 'Remove', target: 'remove' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Type', content: playground(
        `          <div class="style-guide-variant-row">
            <button class="hds-chip">Inactive</button>
            <button class="hds-chip hds-chip--active">Active</button>
          </div>`,
        `<button class="hds-chip">Inactive</button>
<button class="hds-chip hds-chip--active">Active</button>`
      ) },
      { label: 'States (Inactive)', content: playground(
        `          <div class="style-guide-variant-row">
            <button class="hds-chip">Default</button>
            <button class="hds-chip is-hover">Hover</button>
            <button class="hds-chip is-active">Active</button>
            <button class="hds-chip is-focus">Focus</button>
            <button class="hds-chip is-disabled" disabled>Disabled</button>
          </div>`,
        `<button class="hds-chip">Default</button>
<button class="hds-chip">Hover</button>
<button class="hds-chip">Active</button>
<button class="hds-chip">Focus</button>
<button class="hds-chip" disabled>Disabled</button>`
      ) },
      { label: 'States (Active)', content: playground(
        `          <div class="style-guide-variant-row">
            <button class="hds-chip hds-chip--active">Default</button>
            <button class="hds-chip hds-chip--active is-hover">Hover</button>
            <button class="hds-chip hds-chip--active is-active">Active</button>
            <button class="hds-chip hds-chip--active is-focus">Focus</button>
            <button class="hds-chip hds-chip--active is-disabled" disabled>Disabled</button>
          </div>`,
        `<button class="hds-chip hds-chip--active">Default</button>
<button class="hds-chip hds-chip--active">Hover</button>
<button class="hds-chip hds-chip--active">Active</button>
<button class="hds-chip hds-chip--active">Focus</button>
<button class="hds-chip hds-chip--active" disabled>Disabled</button>`
      ) },
    ],
  });
}

function chipInputContent() {
  return componentPage('Chip Input', {
    description: 'A text field that converts typed values into removable chips. Use for multi-value inputs like tags, categories, or domains.',
    anatomy: anatomy(
      `            <div class="hds-chip-input" data-anatomy="container">
              <span class="hds-chip" data-anatomy="chip">Design<button class="hds-chip-remove" data-anatomy="remove">${chipX}</button></span>
              <span class="hds-chip">Engineering<button class="hds-chip-remove">${chipX}</button></span>
              <input class="hds-chip-input-field" data-anatomy="field" placeholder="Add value…" />
            </div>`,
      [
        { label: 'Chip', target: 'chip' },
        { label: 'Remove', target: 'remove' },
        { label: 'Input field', target: 'field' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Size', content: playground(
        `          <div style="display: flex; flex-direction: column; gap: var(--hds-space-16); max-width: 360px;">
            <div>
              <p class="hds-body-sm hds-text-muted" style="margin-bottom: var(--hds-space-4);">Default (md)</p>
              <div class="hds-chip-input">
                <span class="hds-chip">Design<button class="hds-chip-remove">${chipX}</button></span>
                <span class="hds-chip">Engineering<button class="hds-chip-remove">${chipX}</button></span>
                <input class="hds-chip-input-field" placeholder="Add value…" />
              </div>
            </div>
            <div>
              <p class="hds-body-sm hds-text-muted" style="margin-bottom: var(--hds-space-4);">Small (sm)</p>
              <div class="hds-chip-input hds-chip-input--sm">
                <span class="hds-chip">Design<button class="hds-chip-remove">${chipX}</button></span>
                <span class="hds-chip">Engineering<button class="hds-chip-remove">${chipX}</button></span>
                <input class="hds-chip-input-field" placeholder="Add value…" />
              </div>
            </div>
          </div>`,
        `<!-- Default (md) -->
<div class="hds-chip-input">
  <span class="hds-chip">Design<button class="hds-chip-remove">${chipX}</button></span>
  <input class="hds-chip-input-field" placeholder="Add value…" />
</div>

<!-- Small -->
<div class="hds-chip-input hds-chip-input--sm">
  <span class="hds-chip">Design<button class="hds-chip-remove">${chipX}</button></span>
  <input class="hds-chip-input-field" placeholder="Add value…" />
</div>`
      ) },
      { label: 'States', content: playground(
        `          <div style="display: flex; flex-direction: column; gap: var(--hds-space-16); max-width: 360px;">
            <div>
              <p class="hds-body-sm hds-text-muted" style="margin-bottom: var(--hds-space-4);">Empty</p>
              <div class="hds-chip-input">
                <input class="hds-chip-input-field" placeholder="Type and press Enter…" />
              </div>
            </div>
            <div>
              <p class="hds-body-sm hds-text-muted" style="margin-bottom: var(--hds-space-4);">With chips</p>
              <div class="hds-chip-input">
                <span class="hds-chip">Design<button class="hds-chip-remove">${chipX}</button></span>
                <span class="hds-chip">Engineering<button class="hds-chip-remove">${chipX}</button></span>
                <span class="hds-chip">Marketing<button class="hds-chip-remove">${chipX}</button></span>
                <input class="hds-chip-input-field" placeholder="Add value…" />
              </div>
            </div>
            <div>
              <p class="hds-body-sm hds-text-muted" style="margin-bottom: var(--hds-space-4);">Focused</p>
              <div class="hds-chip-input" style="border-color: var(--hds-forms-input-border-focus);">
                <span class="hds-chip">Design<button class="hds-chip-remove">${chipX}</button></span>
                <input class="hds-chip-input-field" placeholder="Add value…" />
              </div>
            </div>
            <div>
              <p class="hds-body-sm hds-text-muted" style="margin-bottom: var(--hds-space-4);">Disabled</p>
              <div class="hds-chip-input hds-chip-input--disabled">
                <span class="hds-chip" disabled>Design<button class="hds-chip-remove" disabled>${chipX}</button></span>
                <input class="hds-chip-input-field" placeholder="Add value…" disabled />
              </div>
            </div>
          </div>`,
        `<!-- Empty -->
<div class="hds-chip-input">
  <input class="hds-chip-input-field" placeholder="Type and press Enter…" />
</div>

<!-- With chips -->
<div class="hds-chip-input">
  <span class="hds-chip">Design<button class="hds-chip-remove">${chipX}</button></span>
  <input class="hds-chip-input-field" placeholder="Add value…" />
</div>

<!-- Disabled -->
<div class="hds-chip-input hds-chip-input--disabled">
  <span class="hds-chip" disabled>Design<button class="hds-chip-remove" disabled>${chipX}</button></span>
  <input class="hds-chip-input-field" placeholder="Add value…" disabled />
</div>`
      ) },
    ],
    guidelines: `<h4>When to use</h4>\n` + guidelines([
      'Multi-value text inputs — tags, categories, domains, email recipients',
      'When values are discrete tokens entered one at a time',
      'When users need to see and remove individual values',
    ]) + `\n<h4>When not to use</h4>\n` + guidelines([
      'Single-value inputs — use a standard text input instead',
      'Predefined option sets — use a multi-select or checkbox group',
      'Long-form text — use a textarea',
    ]),
    related: guidelines([
      '<a href="chips.html">Chips</a> — standalone filter/toggle chips',
      '<a href="inputs.html">Inputs</a> — single-value text fields',
      '<a href="form-group.html">Form Group</a> — label + input wrapper',
    ]),
  });
}

function badgeContent() {
  return componentPage('Badge', {
    description: 'A small label for status, category, or metadata. Color variants map to semantic meaning — success, warning, danger, and info.',
    anatomy: anatomy(
      `            <span class="hds-badge" data-anatomy="container"><span data-anatomy="label">Default</span></span>`,
      [
        { label: 'Label', target: 'label' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Type', content: playground(
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
    ],
  });
}

function listContent() {
  return componentPage('List', {
    description: 'A vertical stack of items separated by borders. Items can be plain text or key-value pairs. Use for settings panels, metadata displays, menu options, or any repeating data rows.',
    anatomy: anatomy(
      `            <div data-anatomy="container">
              <div class="hds-list-item" data-anatomy="item"><span class="hds-list-item-key">Version</span><span class="hds-list-item-value">2.4.1</span></div>
              <div class="hds-list-item">Another item</div>
            </div>`,
      [
        { label: 'Item', target: 'item' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Type', content: playground(
        `<div>
            <div class="hds-list-item">Plain text item</div>
            <div class="hds-list-item">Another plain item</div>
            <div class="hds-list-item">Third item</div>
          </div>
          <div style="margin-top: var(--hds-space-24)">
            <div class="hds-list-item"><span class="hds-list-item-key">Version</span><span class="hds-list-item-value">2.4.1</span></div>
            <div class="hds-list-item"><span class="hds-list-item-key">Status</span><span class="hds-list-item-value">Active</span></div>
            <div class="hds-list-item"><span class="hds-list-item-key">Last Deploy</span><span class="hds-list-item-value">2 hours ago</span></div>
          </div>`,
        `<!-- Plain text -->
<div class="hds-list-item">Plain text item</div>

<!-- Key-value -->
<div class="hds-list-item">
  <span class="hds-list-item-key">Version</span>
  <span class="hds-list-item-value">2.4.1</span>
</div>`
      ) },
      { label: 'Size', content: playground(
        `<div>
            <div class="hds-list-item hds-list-item--sm"><span class="hds-list-item-key">Small</span><span class="hds-list-item-value">Compact</span></div>
            <div class="hds-list-item hds-list-item--sm"><span class="hds-list-item-key">Density</span><span class="hds-list-item-value">High</span></div>
          </div>
          <div style="margin-top: var(--hds-space-24)">
            <div class="hds-list-item"><span class="hds-list-item-key">Medium</span><span class="hds-list-item-value">Default</span></div>
            <div class="hds-list-item"><span class="hds-list-item-key">Density</span><span class="hds-list-item-value">Standard</span></div>
          </div>
          <div style="margin-top: var(--hds-space-24)">
            <div class="hds-list-item hds-list-item--lg"><span class="hds-list-item-key">Large</span><span class="hds-list-item-value">Spacious</span></div>
            <div class="hds-list-item hds-list-item--lg"><span class="hds-list-item-key">Density</span><span class="hds-list-item-value">Low</span></div>
          </div>`,
        `<!-- Small -->
<div class="hds-list-item hds-list-item--sm">...</div>

<!-- Medium (default) -->
<div class="hds-list-item">...</div>

<!-- Large -->
<div class="hds-list-item hds-list-item--lg">...</div>`
      ) },
      { label: 'States', content: playground(
        `<div>
            <div class="hds-list-item">Read-only item (no hover)</div>
            <div class="hds-list-item">Another read-only item</div>
          </div>
          <div style="margin-top: var(--hds-space-24)">
            <div class="hds-list-item hds-list-item--interactive">Interactive item (hover me)</div>
            <div class="hds-list-item hds-list-item--interactive">Another interactive item</div>
            <div class="hds-list-item hds-list-item--interactive is-hover">Hovered state</div>
          </div>`,
        `<!-- Read-only (default) -->
<div class="hds-list-item">Read-only item</div>

<!-- Interactive -->
<div class="hds-list-item hds-list-item--interactive">Interactive item</div>`
      ) },
    ],
  });
}

function progressContent() {
  return componentPage('Progress', {
    description: 'A horizontal bar that communicates completion or progress toward a goal. The fill width maps directly to a percentage value.',
    anatomy: anatomy(
      `            <div style="width: 200px">
              <div class="hds-progress" data-anatomy="track"><div class="hds-progress-bar" data-anatomy="fill" style="width: 75%"></div></div>
              <div class="hds-body-sm hds-text-muted" data-anatomy="label" style="margin-top: 4px">75%</div>
            </div>`,
      [
        { label: 'Track', target: 'track' },
        { label: 'Fill', target: 'fill' },
        { label: 'Label', target: 'label' },
        { label: 'Container', target: 'track', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Default', content: playground(
        `          <div style="width: 100%">
            <div class="hds-stack hds-stack--sm">
              <div class="hds-progress"><div class="hds-progress-bar" style="width: 75%"></div></div>
              <div class="hds-progress"><div class="hds-progress-bar" style="width: 45%"></div></div>
              <div class="hds-progress"><div class="hds-progress-bar" style="width: 90%"></div></div>
            </div>
          </div>`,
        `<div class="hds-progress">
  <div class="hds-progress-bar" style="width: 75%"></div>
</div>`
      ) },
    ],
  });
}

function playgroundContent() {
  const samplePreview = `          <div class="style-guide-variant-row">
            <button class="hds-btn hds-btn--primary">Primary</button>
            <button class="hds-btn hds-btn--secondary">Secondary</button>
          </div>`;
  const sampleCode = `<button class="hds-btn hds-btn--primary">Primary</button>
<button class="hds-btn hds-btn--secondary">Secondary</button>`;

  return componentPage('Playground', {
    description: 'A preview-and-code container used on every component page. The top half renders a live component demo against the page background, and the bottom half shows the corresponding HTML in a copyable code block.',
    anatomy: anatomy(
      `            <div class="style-guide-playground" data-anatomy="container" style="width: 320px">
              <div class="style-guide-playground-preview" data-anatomy="preview" style="padding: 16px; display: flex; justify-content: center;">
                <button class="hds-btn hds-btn--primary">Primary</button>
              </div>
              <div class="style-guide-playground-code-container" data-anatomy="code" style="padding: 12px;">
                <pre class="style-guide-playground-code" style="margin: 0; font-size: 11px;"><code>&lt;button class="hds-btn"&gt;Primary&lt;/button&gt;</code></pre>
              </div>
            </div>`,
      [
        { label: 'Preview', target: 'preview' },
        { label: 'Code', target: 'code' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Anatomy', content: playground(
        samplePreview,
        sampleCode
      ) },
      { label: 'Theme Toggle', content:
        `      <div class="style-guide-playground">
        <div class="style-guide-playground-preview">
          <div class="hds-playground-theme-toggle">
            <button class="style-guide-playground-accent active">Dark</button>
            <button class="style-guide-playground-accent">Light</button>
          </div>
${samplePreview}
        </div>
        <div class="style-guide-playground-code-container">
          <button class="style-guide-playground-copy" onclick="copyCode(this)" aria-label="Copy code">Copy</button>
          <pre class="style-guide-playground-code"><code>${esc(sampleCode.trim())}</code></pre>
        </div>
      </div>`
      },
      { label: 'Wide Variant', content:
        `      <div class="style-guide-playground style-guide-playground--wide">
        <div class="style-guide-playground-preview">
${samplePreview}
        </div>
        <div class="style-guide-playground-code-container">
          <button class="style-guide-playground-copy" onclick="copyCode(this)" aria-label="Copy code">Copy</button>
          <pre class="style-guide-playground-code"><code>${esc(sampleCode.trim())}</code></pre>
        </div>
      </div>`
      },
    ],
    guidelines: `<h4>When to use</h4>\n` + guidelines([
      'Every component dimension section — wrap the demo and its code in a playground.',
      'Use the theme toggle variant when a component looks different in dark and light mode.',
      'Use the wide variant (<code>.style-guide-playground--wide</code>) for components that need more horizontal space (e.g., full-width layouts, tables).',
    ]) +
    `\n<h4>Structure</h4>\n` + guidelines([
      '<code>.style-guide-playground</code> — outer container with border and rounded corners.',
      '<code>.style-guide-playground-preview</code> — top area, centers content with generous padding.',
      '<code>.style-guide-playground-code-container</code> — bottom area with surface background, holds the Copy button and code block.',
      '<code>.style-guide-playground-code</code> — monospace <code>&lt;pre&gt;</code> block with horizontal scroll.',
      '<code>.style-guide-playground-copy</code> — absolute-positioned Copy button in the code area.',
    ]),
  });
}

function statContent() {
  return componentPage('Stat', {
    description: 'A key metric display with large value, label, and optional delta indicator. Use in dashboard cards or summary headers to highlight important numbers.',
    anatomy: anatomy(
      `            <div class="hds-stat" data-anatomy="container">
              <div class="hds-stat-value" data-anatomy="value">98<span class="hds-stat-unit">%</span></div>
              <div class="hds-stat-label" data-anatomy="label">Uptime</div>
            </div>`,
      [
        { label: 'Value', target: 'value' },
        { label: 'Label', target: 'label' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Default', content: playground(
        `          <div>
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
          </div>`,
        `<div class="hds-stat">
  <div class="hds-stat-value">98<span class="hds-stat-unit">%</span></div>
  <div class="hds-stat-label">Uptime</div>
  <div class="hds-stat-delta hds-stat-delta--positive">+2.3%</div>
</div>`
      ) },
    ],
  });
}

function collapsibleContent() {
  return componentPage('Collapsible', {
    description: 'A disclosure widget built with native <details> and <summary> elements. Reveals hidden content on click — no JavaScript needed.',
    anatomy: anatomy(
      `            <details class="collapsible" open data-anatomy="container">
              <summary data-anatomy="header">Header <span data-anatomy="icon" style="float: right">&#9660;</span></summary>
              <div data-anatomy="panel">Hidden content revealed when expanded.</div>
            </details>`,
      [
        { label: 'Header', target: 'header' },
        { label: 'Icon', target: 'icon' },
        { label: 'Panel', target: 'panel' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
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
    description: 'A horizontal rule that separates content into distinct sections.',
    anatomy: anatomy(
      `            <div style="width: 200px"><hr class="hds-divider" data-anatomy="line"></div>`,
      [
        { label: 'Line', target: 'line', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Type', content: playground(
        `          <div class="hds-stack hds-stack--lg">
            <hr class="hds-divider">
          </div>`,
        `<hr class="hds-divider">`
      ) },
    ],
  });
}

function statusMessageContent() {
  return componentPage('Status Message', {
    description: 'Inline messages that communicate the result of an operation. Four sentiment variants provide visual context — success, error, warning, and info.',
    anatomy: anatomy(
      `            <div class="hds-status-msg hds-status-msg--success" data-anatomy="container"><span data-anatomy="icon" style="margin-right: 8px">&#10003;</span><span data-anatomy="message">Operation completed successfully.</span></div>`,
      [
        { label: 'Icon', target: 'icon' },
        { label: 'Message', target: 'message' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Type', content: playground(
        `          <div class="hds-stack hds-stack--sm">
            <div class="hds-status-msg hds-status-msg--success">Operation completed successfully.</div>
            <div class="hds-status-msg hds-status-msg--error">Something went wrong. Please try again.</div>
            <div class="hds-status-msg hds-status-msg--warning">Your session will expire in 5 minutes.</div>
            <div class="hds-status-msg hds-status-msg--info">A new version is available.</div>
          </div>`,
        `<div class="hds-status-msg hds-status-msg--success">Message</div>
<div class="hds-status-msg hds-status-msg--error">Message</div>
<div class="hds-status-msg hds-status-msg--warning">Message</div>
<div class="hds-status-msg hds-status-msg--info">Message</div>`
      ) },
    ],
  });
}

function emptyStateContent() {
  return componentPage('Empty State', {
    description: 'A placeholder for views with no data. Communicates what the user can expect and optionally suggests an action to populate the view.',
    anatomy: anatomy(
      `            <div class="hds-empty-state" data-anatomy="container">
              <div class="hds-empty-state-title" data-anatomy="title">No results found</div>
              <div class="hds-empty-state-description" data-anatomy="description">Try adjusting your search or filters.</div>
              <button class="hds-btn hds-btn--primary hds-btn--sm" data-anatomy="action" style="margin-top: 12px">Create New</button>
            </div>`,
      [
        { label: 'Title', target: 'title' },
        { label: 'Description', target: 'description' },
        { label: 'Action', target: 'action' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Type', content: playground(
        `          <div class="hds-empty-state">
            <div class="hds-empty-state-title">No results found</div>
            <div class="hds-empty-state-description">Try adjusting your search or filters.</div>
          </div>`,
        `<div class="hds-empty-state">
  <div class="hds-empty-state-title">No results found</div>
  <div class="hds-empty-state-description">Try adjusting your search or filters.</div>
</div>`
      ) },
    ],
  });
}

function spinnerContent() {
  return componentPage('Spinner', {
    description: 'An animated loading indicator for operations with indeterminate duration. Pair with a text label for accessibility.',
    anatomy: anatomy(
      `            <div class="hds-cluster" data-anatomy="container">
              <div class="hds-spinner" data-anatomy="track"></div>
            </div>`,
      [
        { label: 'Track', target: 'track' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Type', content: playground(
        `          <div class="hds-cluster">
            <div class="hds-spinner"></div>
            <span class="hds-body-sm hds-text-muted">Loading...</span>
          </div>`,
        '<div class="hds-spinner"></div>'
      ) },
    ],
  });
}

function skeletonContent() {
  return componentPage('Skeleton', {
    description: 'Placeholder shapes that preview the layout of incoming content. Use during loading to reduce perceived wait time and prevent layout shift.',
    anatomy: anatomy(
      `            <div class="hds-skeleton" data-anatomy="shape" style="height: 16px; width: 200px"></div>`,
      [
        { label: 'Shape', target: 'shape', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Type', content: playground(
        `          <div class="hds-stack hds-stack--sm">
            <div class="hds-skeleton" style="height: 16px; width: 60%"></div>
            <div class="hds-skeleton" style="height: 16px; width: 80%"></div>
            <div class="hds-skeleton" style="height: 16px; width: 40%"></div>
          </div>`,
        '<div class="hds-skeleton" style="height: 16px; width: 60%"></div>'
      ) },
    ],
  });
}

function fileUploadContent() {
  return componentPage('File Upload', {
    description: 'A styled file input that replaces the browser\'s default file picker with a consistent button trigger. The native file input is hidden and the label acts as the clickable element.',
    anatomy: anatomy(
      `            <div class="hds-form-file" data-anatomy="container">
              <input type="file" id="anatomy-file" style="display:none">
              <label class="hds-form-file-trigger" for="anatomy-file" data-anatomy="label">Choose file</label>
              <span class="hds-body-sm hds-text-muted" data-anatomy="hint" style="margin-left: 8px">No file chosen</span>
            </div>`,
      [
        { label: 'Label', target: 'label' },
        { label: 'Hint', target: 'hint' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
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
    description: 'A sized container for inline SVG icons. Three explicit size modifiers: sm (16), md (20), and lg (24).',
    anatomy: anatomy(
      `            <span class="hds-icon hds-icon--md" data-anatomy="container"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" data-anatomy="svg"><circle cx="10" cy="10" r="8.25"/></svg></span>`,
      [
        { label: 'SVG', target: 'svg' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Size', content: playground(
        `          <div class="style-guide-variant-row">
            <span class="hds-icon hds-icon--sm"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6.25"/></svg></span>
            <span class="hds-icon hds-icon--md"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="8.25"/></svg></span>
            <span class="hds-icon hds-icon--lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10.25"/></svg></span>
          </div>`,
        `<span class="hds-icon hds-icon--sm"><!-- 16×16 --></span>
<span class="hds-icon hds-icon--md"><!-- 20×20 --></span>
<span class="hds-icon hds-icon--lg"><!-- 24×24 --></span>`
      ) },
    ],
  });
}

function inputsContent() {
  return componentPage('Inputs', {
    description: 'Single-line text fields for entering and editing content. Available in four sizes with support for validation states.',
    anatomy: anatomy(
      `            <input class="hds-form-input" type="text" placeholder="Placeholder" data-anatomy="input" style="width: 240px">`,
      [
        { label: 'Input', target: 'input', primary: true },
      ]
    ),
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
        `<!-- Default -->
<input class="hds-form-input" type="text" placeholder="Placeholder">
<!-- Disabled -->
<input class="hds-form-input" type="text" placeholder="Placeholder" disabled>`
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
        `<input class="hds-form-input hds-form-input--error" type="text" value="not-an-email">
<input class="hds-form-input hds-form-input--success" type="text" value="keithbarney">`
      ) },
    ],
  });
}

function formGroupContent() {
  return componentPage('Form Group', {
    description: 'A vertical container that pairs a label, input, and hint text into a single form field. Provides consistent spacing and structure for all form controls.',
    anatomy: anatomy(
      `            <div class="hds-form-group" data-anatomy="container" style="width: 240px">
              <label class="hds-form-label" data-anatomy="label">Label</label>
              <input class="hds-form-input" type="text" placeholder="Placeholder" data-anatomy="input">
              <span class="hds-form-hint" data-anatomy="hint">Hint text goes here</span>
            </div>`,
      [
        { label: 'Label', target: 'label' },
        { label: 'Input', target: 'input' },
        { label: 'Hint', target: 'hint' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Default', content: playground(
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
        `<!-- Error -->
<div class="hds-form-group">
  <label class="hds-form-label">Email</label>
  <input class="hds-form-input hds-form-input--error" type="text" value="not-an-email">
  <span class="hds-form-hint hds-form-hint--error">Please enter a valid email address</span>
</div>

<!-- Success -->
<div class="hds-form-group">
  <label class="hds-form-label">Username</label>
  <input class="hds-form-input hds-form-input--success" type="text" value="keithbarney">
  <span class="hds-form-hint hds-form-hint--success">Username is available</span>
</div>`
      ) },
      { label: 'With Select', content: playground(
        `          <div class="hds-form-group hds-col-span-3">
            <label class="hds-form-label">Role</label>
            <select class="hds-select">
              <option>Select a role</option>
              <option>Designer</option>
              <option>Developer</option>
            </select>
            <span class="hds-form-hint">Choose one option</span>
          </div>`,
        `<div class="hds-form-group">
  <label class="hds-form-label">Role</label>
  <select class="hds-select">
    <option>Select a role</option>
  </select>
  <span class="hds-form-hint">Choose one option</span>
</div>`
      ) },
    ],
  });
}

function textareaContent() {
  return componentPage('Textarea', {
    description: 'A multi-line text field for longer-form content. Shares base styling with inputs but allows vertical expansion for paragraphs, descriptions, and notes.',
    anatomy: anatomy(
      `            <textarea class="hds-form-input hds-form-textarea" placeholder="Write something..." data-anatomy="textarea" style="width: 240px"></textarea>`,
      [
        { label: 'Textarea', target: 'textarea', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Default', content: playground(
        `          <div class="hds-col-span-4">
            <textarea class="hds-form-input hds-form-textarea" placeholder="Write something..."></textarea>
          </div>`,
        '<textarea class="hds-form-input hds-form-textarea" placeholder="Write something..."></textarea>'
      ) },
      { label: 'In Form Group', content: playground(
        `          <div class="hds-form-group hds-col-span-4">
            <label class="hds-form-label">Description</label>
            <textarea class="hds-form-input hds-form-textarea" placeholder="Write something..."></textarea>
            <span class="hds-form-hint">Maximum 500 characters</span>
          </div>`,
        `<div class="hds-form-group">
  <label class="hds-form-label">Description</label>
  <textarea class="hds-form-input hds-form-textarea" placeholder="Write something..."></textarea>
  <span class="hds-form-hint">Maximum 500 characters</span>
</div>`
      ) },
    ],
  });
}

function navLinksContent() {
  return componentPage('Nav Links', {
    description: 'Horizontal navigation links for moving between top-level pages or sections. One link is marked active to show the user\'s current location.',
    anatomy: anatomy(
      `            <nav data-anatomy="container" style="display: flex; gap: 16px;">
              <a class="hds-nav-link hds-nav-link--active" href="#" data-anatomy="active-link">Dashboard</a>
              <a class="hds-nav-link" href="#" data-anatomy="link">Settings</a>
              <a class="hds-nav-link" href="#">Profile</a>
            </nav>`,
      [
        { label: 'Link', target: 'link' },
        { label: 'Active Link', target: 'active-link' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
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
    anatomy: anatomy(
      `            <label class="hds-search" data-anatomy="container"><span data-anatomy="icon" style="pointer-events: none">&#128269;</span><input type="search" placeholder="Search..." data-anatomy="input"><span data-anatomy="clear" style="cursor: pointer">&times;</span></label>`,
      [
        { label: 'Icon', target: 'icon' },
        { label: 'Input', target: 'input' },
        { label: 'Clear', target: 'clear' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
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
    anatomy: anatomy(
      `            <div class="hds-form-group" data-anatomy="container" style="width: 240px">
              <label class="hds-form-label" data-anatomy="label">Label</label>
              <select class="hds-select" data-anatomy="select"><option>Select an option</option></select>
            </div>`,
      [
        { label: 'Label', target: 'label' },
        { label: 'Select', target: 'select' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
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
    anatomy: anatomy(
      `            <div class="hds-tabs" data-anatomy="container">
              <button class="hds-tab" data-anatomy="tab">Overview</button>
              <button class="hds-tab hds-tab--active" data-anatomy="active-tab">Details</button>
              <button class="hds-tab">Settings</button>
            </div>`,
      [
        { label: 'Tab', target: 'tab' },
        { label: 'Active Tab', target: 'active-tab' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
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

function tokenCopyContent() {
  return componentPage('Token Copy', {
    description: 'Interactive chip that copies a token name or value to the clipboard on click. Shows a copy icon and brief success feedback. Used throughout the style guide to let developers grab token names, CSS variables, and resolved values.',
    anatomy: anatomy(
      `            <span class="style-guide-token-copy" role="button" tabindex="0" data-anatomy="container">
              <span data-anatomy="token">hds.text.default</span>
              <span data-anatomy="value" style="margin-left: 8px; opacity: 0.6">--hds-text-default</span>
              <span data-anatomy="copy" style="margin-left: 4px; opacity: 0.5">&#128203;</span>
            </span>`,
      [
        { label: 'Token', target: 'token' },
        { label: 'Value', target: 'value' },
        { label: 'Copy', target: 'copy' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'States', content: playground(
        `          <div class="style-guide-variant-row">
            <span class="style-guide-token-copy" role="button" tabindex="0">Default</span>
            <span class="style-guide-token-copy is-hover" role="button" tabindex="0">Hover</span>
            <span class="style-guide-token-copy style-guide-copied" role="button" tabindex="0">Copied</span>
          </div>`,
        `<!-- Default -->\n<span class="style-guide-token-copy" role="button" tabindex="0">hds.text.default</span>\n<!-- Hover -->\n<span class="style-guide-token-copy" role="button" tabindex="0">hds.text.default</span>\n<!-- Copied (applied via JS) -->\n<span class="style-guide-token-copy style-guide-copied" role="button" tabindex="0">hds.text.default</span>`
      ) },
      { label: 'Content Variants', content: playground(
        `          <div class="style-guide-variant-row">
            <span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('hds.text.default', this)">hds.text.default</span>
            <span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('--hds-text-default', this)">--hds-text-default</span>
            <span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('#898989', this)">#898989</span>
            <span class="style-guide-token-copy" role="button" tabindex="0" onclick="copyToken('16px', this)">16px</span>
          </div>`,
        `<!-- Token name -->\n<span class="style-guide-token-copy" role="button" tabindex="0"\n  onclick="copyToken(\'hds.text.default\', this)">hds.text.default</span>\n\n<!-- CSS variable -->\n<span class="style-guide-token-copy" role="button" tabindex="0"\n  onclick="copyToken(\'--hds-text-default\', this)">--hds-text-default</span>\n\n<!-- Hex value -->\n<span class="style-guide-token-copy" role="button" tabindex="0"\n  onclick="copyToken(\'#898989\', this)">#898989</span>\n\n<!-- Size value -->\n<span class="style-guide-token-copy" role="button" tabindex="0"\n  onclick="copyToken(\'16px\', this)">16px</span>`
      ) },
    ],
    guidelines: `<h4>When to use</h4>\n` + guidelines([
      'Display any copyable value — token names, CSS variables, hex colors, size values.',
      'Use in data tables, props tables, and anywhere a developer needs to grab a value quickly.',
    ]) +
    `\n<h4>Accessibility</h4>\n` + guidelines([
      'Always include <code>role="button"</code> and <code>tabindex="0"</code> on non-button elements.',
      'The copy icon (::after pseudo-element) provides a visual affordance that the chip is interactive.',
      'Success state (<code>.style-guide-copied</code>) provides visual confirmation — lasts 500ms.',
    ]),
  });
}

function toggleContent() {
  return componentPage('Toggle', {
    description: 'A switch for binary on/off settings. Wraps a hidden checkbox with a styled track and thumb for immediate visual feedback.',
    anatomy: anatomy(
      `            <label class="hds-form-toggle" data-anatomy="container">
              <input type="checkbox" checked>
              <span class="hds-form-toggle-track" data-anatomy="track"></span>
              <span data-anatomy="label">On</span>
            </label>`,
      [
        { label: 'Track', target: 'track' },
        { label: 'Label', target: 'label' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'States', content: playground(
        `          <div class="hds-stack hds-stack--lg">
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
            <label class="hds-form-toggle is-hover">
              <input type="checkbox">
              <span class="hds-form-toggle-track"></span>
              <span>Hover</span>
            </label>
            <label class="hds-form-toggle">
              <input type="checkbox" class="is-focus">
              <span class="hds-form-toggle-track"></span>
              <span>Focus</span>
            </label>
            <label class="hds-form-toggle">
              <input type="checkbox" disabled>
              <span class="hds-form-toggle-track"></span>
              <span>Disabled off</span>
            </label>
            <label class="hds-form-toggle">
              <input type="checkbox" checked disabled>
              <span class="hds-form-toggle-track"></span>
              <span>Disabled on</span>
            </label>
          </div>`,
        `<!-- Default -->
<label class="hds-form-toggle">
  <input type="checkbox">
  <span class="hds-form-toggle-track"></span>
  <span>Off</span>
</label>

<!-- Disabled -->
<label class="hds-form-toggle">
  <input type="checkbox" disabled>
  <span class="hds-form-toggle-track"></span>
  <span>Disabled</span>
</label>`
      ) },
    ],
  });
}

function checkboxContent() {
  return componentPage('Checkbox', {
    description: 'A multi-select control for toggling individual options. Each checkbox operates independently — users can select any combination from a group.',
    anatomy: anatomy(
      `            <div class="hds-form-check" data-anatomy="container">
              <input class="hds-form-check-input" type="checkbox" id="anatomy-check" checked data-anatomy="input">
              <label class="hds-form-label" for="anatomy-check" data-anatomy="label">Checkbox option</label>
            </div>`,
      [
        { label: 'Input', target: 'input' },
        { label: 'Label', target: 'label' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'States', content: playground(
        `          <div>
            <div class="hds-stack">
              <div class="hds-form-check">
                <input class="hds-form-check-input" type="checkbox" id="check-off">
                <label class="hds-form-label" for="check-off">Unchecked</label>
              </div>
              <div class="hds-form-check">
                <input class="hds-form-check-input" type="checkbox" id="check-on" checked>
                <label class="hds-form-label" for="check-on">Checked</label>
              </div>
            </div>
          </div>`,
        `<div class="hds-form-check">
  <input class="hds-form-check-input" type="checkbox" id="check1">
  <label class="hds-form-label" for="check1">Unchecked</label>
</div>

<div class="hds-form-check">
  <input class="hds-form-check-input" type="checkbox" id="check2" checked>
  <label class="hds-form-label" for="check2">Checked</label>
</div>`
      ) },
    ],
  });
}

function radioContent() {
  return componentPage('Radio', {
    description: 'A single-select control for choosing one option from a group. Radios with the same name attribute are mutually exclusive — selecting one deselects the others.',
    anatomy: anatomy(
      `            <div class="hds-form-check" data-anatomy="container">
              <input class="hds-form-check-input" type="radio" name="anatomy-radio" id="anatomy-radio1" checked data-anatomy="input">
              <label class="hds-form-label" for="anatomy-radio1" data-anatomy="label">Radio option</label>
            </div>`,
      [
        { label: 'Input', target: 'input' },
        { label: 'Label', target: 'label' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'States', content: playground(
        `          <div>
            <div class="hds-stack">
              <div class="hds-form-check">
                <input class="hds-form-check-input" type="radio" name="radio-demo" id="radio-a" checked>
                <label class="hds-form-label" for="radio-a">Option A (selected)</label>
              </div>
              <div class="hds-form-check">
                <input class="hds-form-check-input" type="radio" name="radio-demo" id="radio-b">
                <label class="hds-form-label" for="radio-b">Option B</label>
              </div>
            </div>
          </div>`,
        `<div class="hds-form-check">
  <input class="hds-form-check-input" type="radio" name="group" id="radio1" checked>
  <label class="hds-form-label" for="radio1">Option A</label>
</div>

<div class="hds-form-check">
  <input class="hds-form-check-input" type="radio" name="group" id="radio2">
  <label class="hds-form-label" for="radio2">Option B</label>
</div>`
      ) },
    ],
  });
}

function formPatternsContent() {
  return componentPage('Forms', {
    description: 'Complete form layouts that show how inputs, selects, toggles, checkboxes, file uploads, and textareas compose into real-world forms. Three examples progress from minimal to comprehensive.',
    dimensions: [
      { label: 'Sign In', content: playground(
        `          <div class="hds-col-span-4">
            <form class="hds-stack">
              <div class="hds-form-group">
                <label class="hds-form-label hds-form-label--required">Email</label>
                <input class="hds-form-input" type="email" placeholder="you@example.com" required>
              </div>
              <div class="hds-form-group">
                <label class="hds-form-label hds-form-label--required">Password</label>
                <input class="hds-form-input" type="password" placeholder="Enter password" required>
              </div>
              <label class="hds-form-toggle">
                <input type="checkbox">
                <span class="hds-form-toggle-track"></span>
                <span>Remember me</span>
              </label>
              <button class="hds-btn hds-btn--primary hds-btn--block" type="submit">Sign In</button>
              <a class="hds-link hds-link--sm" href="#" style="text-align: center; margin-top: var(--hds-space-8);">Forgot password?</a>
            </form>
          </div>`,
        `<form class="hds-stack">
  <div class="hds-form-group">
    <label class="hds-form-label hds-form-label--required">Email</label>
    <input class="hds-form-input" type="email" placeholder="you@example.com" required>
  </div>
  <div class="hds-form-group">
    <label class="hds-form-label hds-form-label--required">Password</label>
    <input class="hds-form-input" type="password" placeholder="Enter password" required>
  </div>
  <label class="hds-form-toggle">
    <input type="checkbox">
    <span class="hds-form-toggle-track"></span>
    <span>Remember me</span>
  </label>
  <button class="hds-btn hds-btn--primary hds-btn--block" type="submit">Sign In</button>
  <a class="hds-link hds-link--sm" href="#">Forgot password?</a>
</form>`
      ) },
      { label: 'Contact', content: playground(
        `          <div class="hds-col-span-6">
            <form class="hds-stack">
              <div class="hds-form-group">
                <label class="hds-form-label hds-form-label--required">Name</label>
                <input class="hds-form-input" type="text" placeholder="Your name" required>
              </div>
              <div class="hds-form-group">
                <label class="hds-form-label hds-form-label--required">Email</label>
                <input class="hds-form-input" type="email" placeholder="you@example.com" required>
              </div>
              <div class="hds-form-group">
                <label class="hds-form-label hds-form-label--required">Subject</label>
                <select class="hds-select" required>
                  <option value="">Select a subject</option>
                  <option value="general">General inquiry</option>
                  <option value="support">Support</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>
              <div class="hds-form-group">
                <label class="hds-form-label hds-form-label--required">Message</label>
                <textarea class="hds-form-input hds-form-textarea" placeholder="Write your message..." required></textarea>
              </div>
              <div class="hds-form-group">
                <label class="hds-form-label">Attachment</label>
                <div class="hds-form-file">
                  <input type="file" id="contact-file">
                  <label class="hds-form-file-trigger" for="contact-file">Choose file</label>
                  <span class="hds-body-sm hds-text-muted" style="margin-left: 8px">No file chosen</span>
                </div>
              </div>
              <div class="hds-cluster" style="justify-content: flex-end;">
                <button class="hds-btn hds-btn--secondary" type="button">Cancel</button>
                <button class="hds-btn hds-btn--primary" type="submit">Submit</button>
              </div>
            </form>
          </div>`,
        `<form class="hds-stack">
  <div class="hds-form-group">
    <label class="hds-form-label hds-form-label--required">Name</label>
    <input class="hds-form-input" type="text" placeholder="Your name" required>
  </div>
  <div class="hds-form-group">
    <label class="hds-form-label hds-form-label--required">Email</label>
    <input class="hds-form-input" type="email" placeholder="you@example.com" required>
  </div>
  <div class="hds-form-group">
    <label class="hds-form-label hds-form-label--required">Subject</label>
    <select class="hds-select" required>
      <option value="">Select a subject</option>
      <option value="general">General inquiry</option>
      <option value="support">Support</option>
      <option value="feedback">Feedback</option>
    </select>
  </div>
  <div class="hds-form-group">
    <label class="hds-form-label hds-form-label--required">Message</label>
    <textarea class="hds-form-input hds-form-textarea" placeholder="Write your message..." required></textarea>
  </div>
  <div class="hds-form-group">
    <label class="hds-form-label">Attachment</label>
    <div class="hds-form-file">
      <input type="file" id="file"><label class="hds-form-file-trigger" for="file">Choose file</label>
    </div>
  </div>
  <div class="hds-cluster" style="justify-content: flex-end;">
    <button class="hds-btn hds-btn--secondary" type="button">Cancel</button>
    <button class="hds-btn hds-btn--primary" type="submit">Submit</button>
  </div>
</form>`
      ) },
      { label: 'Profile Settings', content: playground(
        `          <div class="hds-col-span-6">
            <form class="hds-stack">
              <div class="hds-form-group">
                <label class="hds-form-label">Avatar</label>
                <div class="hds-form-file">
                  <input type="file" id="profile-avatar" accept="image/*">
                  <label class="hds-form-file-trigger" for="profile-avatar">Upload photo</label>
                  <span class="hds-body-sm hds-text-muted" style="margin-left: 8px">No file chosen</span>
                </div>
              </div>
              <div class="hds-form-group">
                <label class="hds-form-label hds-form-label--required">Full Name</label>
                <input class="hds-form-input" type="text" placeholder="Your full name" value="Keith Barney" required>
              </div>
              <div class="hds-form-group">
                <label class="hds-form-label">Email</label>
                <input class="hds-form-input is-disabled" type="email" value="keith@example.com" disabled>
                <span class="hds-form-hint">Contact support to change your email</span>
              </div>
              <div class="hds-form-group">
                <label class="hds-form-label">Bio</label>
                <textarea class="hds-form-input hds-form-textarea" placeholder="Tell us about yourself..."></textarea>
              </div>
              <div class="hds-form-group">
                <label class="hds-form-label">Role</label>
                <select class="hds-select">
                  <option value="">Select a role</option>
                  <option value="designer" selected>Designer</option>
                  <option value="developer">Developer</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <fieldset class="hds-stack" style="border: none; padding: 0; margin: 0;">
                <legend class="hds-form-label" style="margin-bottom: var(--hds-space-8);">Notifications</legend>
                <div class="hds-form-check">
                  <input class="hds-form-check-input" type="checkbox" id="notify-email" checked>
                  <label class="hds-form-label" for="notify-email">Email notifications</label>
                </div>
                <div class="hds-form-check">
                  <input class="hds-form-check-input" type="checkbox" id="notify-push" checked>
                  <label class="hds-form-label" for="notify-push">Push notifications</label>
                </div>
                <div class="hds-form-check">
                  <input class="hds-form-check-input" type="checkbox" id="notify-sms">
                  <label class="hds-form-label" for="notify-sms">SMS notifications</label>
                </div>
              </fieldset>
              <label class="hds-form-toggle">
                <input type="checkbox" checked>
                <span class="hds-form-toggle-track"></span>
                <span>Dark mode</span>
              </label>
              <div class="hds-cluster" style="justify-content: flex-end;">
                <button class="hds-btn hds-btn--secondary" type="button">Cancel</button>
                <button class="hds-btn hds-btn--primary" type="submit">Save</button>
              </div>
            </form>
          </div>`,
        `<form class="hds-stack">
  <div class="hds-form-group">
    <label class="hds-form-label">Avatar</label>
    <div class="hds-form-file">
      <input type="file" id="avatar" accept="image/*">
      <label class="hds-form-file-trigger" for="avatar">Upload photo</label>
    </div>
  </div>
  <div class="hds-form-group">
    <label class="hds-form-label hds-form-label--required">Full Name</label>
    <input class="hds-form-input" type="text" value="Keith Barney" required>
  </div>
  <div class="hds-form-group">
    <label class="hds-form-label">Email</label>
    <input class="hds-form-input" type="email" value="keith@example.com" disabled>
    <span class="hds-form-hint">Contact support to change your email</span>
  </div>
  <div class="hds-form-group">
    <label class="hds-form-label">Bio</label>
    <textarea class="hds-form-input hds-form-textarea" placeholder="Tell us about yourself..."></textarea>
  </div>
  <div class="hds-form-group">
    <label class="hds-form-label">Role</label>
    <select class="hds-select">
      <option value="">Select a role</option>
      <option value="designer" selected>Designer</option>
    </select>
  </div>
  <fieldset style="border: none; padding: 0; margin: 0;">
    <legend class="hds-form-label">Notifications</legend>
    <div class="hds-form-check">
      <input class="hds-form-check-input" type="checkbox" id="n1" checked>
      <label class="hds-form-label" for="n1">Email notifications</label>
    </div>
    <div class="hds-form-check">
      <input class="hds-form-check-input" type="checkbox" id="n2" checked>
      <label class="hds-form-label" for="n2">Push notifications</label>
    </div>
    <div class="hds-form-check">
      <input class="hds-form-check-input" type="checkbox" id="n3">
      <label class="hds-form-label" for="n3">SMS notifications</label>
    </div>
  </fieldset>
  <label class="hds-form-toggle">
    <input type="checkbox" checked>
    <span class="hds-form-toggle-track"></span>
    <span>Dark mode</span>
  </label>
  <div class="hds-cluster" style="justify-content: flex-end;">
    <button class="hds-btn hds-btn--secondary" type="button">Cancel</button>
    <button class="hds-btn hds-btn--primary" type="submit">Save</button>
  </div>
</form>`
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
    anatomy: anatomy(
      `            <div class="hds-card" data-anatomy="container" style="width: 280px">
              <div class="hds-card-header" data-anatomy="header">
                <div class="hds-card-title">Title</div>
              </div>
              <div class="hds-card-body" data-anatomy="body">
                <p>Body content goes here.</p>
              </div>
              <div class="hds-card-footer" data-anatomy="footer">
                <button class="hds-btn hds-btn--primary hds-btn--sm">Save</button>
              </div>
            </div>`,
      [
        { label: 'Header', target: 'header' },
        { label: 'Body', target: 'body' },
        { label: 'Footer', target: 'footer' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Composition', content: playgroundWide(
        `<div class="hds-stack hds-stack--lg" style="width: 100%;">
            <div class="hds-card">
              <div class="hds-card-body">
                <div class="hds-card-title">Body Only</div>
                <div class="hds-card-subtitle">Simplest form — just content</div>
              </div>
            </div>
            <div class="hds-card">
              <div class="hds-card-header">
                <div class="hds-card-title">With Header</div>
                <div class="hds-card-subtitle">Title separated from body</div>
              </div>
              <div class="hds-card-body">
                <p>Body content below the header.</p>
              </div>
            </div>
            <div class="hds-card">
              <div class="hds-card-body">
                <p>Body content above the footer.</p>
              </div>
              <div class="hds-card-footer">
                <button class="hds-btn hds-btn--primary hds-btn--sm">Confirm</button>
              </div>
            </div>
            <div class="hds-card">
              <div class="hds-card-header">
                <div class="hds-card-title">Header + Footer</div>
                <div class="hds-card-subtitle">Full composition</div>
              </div>
              <div class="hds-card-body">
                <p>Body content between header and footer.</p>
              </div>
              <div class="hds-card-footer">
                <button class="hds-btn hds-btn--secondary hds-btn--sm">Cancel</button>
                <button class="hds-btn hds-btn--primary hds-btn--sm">Save</button>
              </div>
            </div>
          </div>`,
        `<!-- Body only -->
<div class="hds-card">
  <div class="hds-card-body">...</div>
</div>

<!-- Header + body -->
<div class="hds-card">
  <div class="hds-card-header">...</div>
  <div class="hds-card-body">...</div>
</div>

<!-- Body + footer -->
<div class="hds-card">
  <div class="hds-card-body">...</div>
  <div class="hds-card-footer">...</div>
</div>

<!-- Header + body + footer -->
<div class="hds-card">
  <div class="hds-card-header">...</div>
  <div class="hds-card-body">...</div>
  <div class="hds-card-footer">...</div>
</div>`
      ) },
      { label: 'States', content: playgroundWide(
        `<div class="hds-stack hds-stack--lg" style="width: 100%;">
            <div class="hds-card hds-card--interactive">
              <div class="hds-card-body">
                <div class="hds-card-title">Interactive</div>
                <div class="hds-card-subtitle">Default state</div>
              </div>
            </div>
            <div class="hds-card hds-card--interactive is-hover">
              <div class="hds-card-body">
                <div class="hds-card-title">Interactive (Hover)</div>
                <div class="hds-card-subtitle">Background change on hover</div>
              </div>
            </div>
            <div class="hds-card hds-card--interactive is-active">
              <div class="hds-card-body">
                <div class="hds-card-title">Interactive (Active)</div>
                <div class="hds-card-subtitle">Background change on press</div>
              </div>
            </div>
          </div>`,
        `<div class="hds-card hds-card--interactive">...</div>`
      ) },
    ],
  });
}

function cardHeaderContent() {
  return componentPage('Card Header', {
    description: 'The top section of a card containing a title and optional subtitle. Separated from the body by a bottom border.',
    anatomy: anatomy(
      `            <div class="hds-card" style="width: 280px">
              <div class="hds-card-header" data-anatomy="container">
                <div class="hds-card-title" data-anatomy="title">Card Title</div>
                <div class="hds-card-subtitle" data-anatomy="actions">Supporting text</div>
              </div>
              <div class="hds-card-body"><p>Body content</p></div>
            </div>`,
      [
        { label: 'Title', target: 'title' },
        { label: 'Actions', target: 'actions' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Default', content: playgroundWide(
        `<div class="hds-card" style="width: 100%;">
              <div class="hds-card-header">
                <div class="hds-card-title">Card Title</div>
              </div>
              <div class="hds-card-body"><p>Body content</p></div>
            </div>`,
        `<div class="hds-card-header">
  <div class="hds-card-title">Card Title</div>
</div>`
      ) },
      { label: 'Content Variations', content: playgroundWide(
        `<div class="hds-stack hds-stack--lg" style="width: 100%;">
            <div class="hds-card">
              <div class="hds-card-header">
                <div class="hds-card-title">Title Only</div>
              </div>
              <div class="hds-card-body"><p>Body content</p></div>
            </div>
            <div class="hds-card">
              <div class="hds-card-header">
                <div class="hds-card-title">Title with Subtitle</div>
                <div class="hds-card-subtitle">Supporting text that adds context</div>
              </div>
              <div class="hds-card-body"><p>Body content</p></div>
            </div>
          </div>`,
        `<!-- Title only -->
<div class="hds-card-header">
  <div class="hds-card-title">Title</div>
</div>

<!-- Title + subtitle -->
<div class="hds-card-header">
  <div class="hds-card-title">Title</div>
  <div class="hds-card-subtitle">Subtitle</div>
</div>`
      ) },
    ],
  });
}

function cardFooterContent() {
  return componentPage('Card Footer', {
    description: 'The bottom section of a card for actions. Buttons are right-aligned by default. Separated from the body by a top border.',
    anatomy: anatomy(
      `            <div class="hds-card" style="width: 280px">
              <div class="hds-card-body"><p>Body content</p></div>
              <div class="hds-card-footer" data-anatomy="container">
                <button class="hds-btn hds-btn--secondary hds-btn--sm" data-anatomy="actions">Cancel</button>
                <button class="hds-btn hds-btn--primary hds-btn--sm">Save</button>
              </div>
            </div>`,
      [
        { label: 'Actions', target: 'actions' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Default', content: playgroundWide(
        `<div class="hds-card" style="width: 100%;">
              <div class="hds-card-body"><p>Body content</p></div>
              <div class="hds-card-footer">
                <button class="hds-btn hds-btn--secondary hds-btn--sm">Cancel</button>
                <button class="hds-btn hds-btn--primary hds-btn--sm">Save</button>
              </div>
            </div>`,
        `<div class="hds-card-footer">
  <button class="hds-btn hds-btn--secondary hds-btn--sm">Cancel</button>
  <button class="hds-btn hds-btn--primary hds-btn--sm">Save</button>
</div>`
      ) },
      { label: 'Content Variations', content: playgroundWide(
        `<div class="hds-stack hds-stack--lg" style="width: 100%;">
            <div class="hds-card">
              <div class="hds-card-body"><p>Single action</p></div>
              <div class="hds-card-footer">
                <button class="hds-btn hds-btn--primary hds-btn--sm">Confirm</button>
              </div>
            </div>
            <div class="hds-card">
              <div class="hds-card-body"><p>Confirm and cancel</p></div>
              <div class="hds-card-footer">
                <button class="hds-btn hds-btn--secondary hds-btn--sm">Cancel</button>
                <button class="hds-btn hds-btn--primary hds-btn--sm">Save</button>
              </div>
            </div>
            <div class="hds-card">
              <div class="hds-card-body"><p>Destructive action</p></div>
              <div class="hds-card-footer">
                <button class="hds-btn hds-btn--secondary hds-btn--sm">Cancel</button>
                <button class="hds-btn hds-btn--danger hds-btn--sm">Delete</button>
              </div>
            </div>
          </div>`,
        `<!-- Single action -->
<div class="hds-card-footer">
  <button class="hds-btn hds-btn--primary hds-btn--sm">Confirm</button>
</div>

<!-- Confirm + cancel -->
<div class="hds-card-footer">
  <button class="hds-btn hds-btn--secondary hds-btn--sm">Cancel</button>
  <button class="hds-btn hds-btn--primary hds-btn--sm">Save</button>
</div>

<!-- Destructive -->
<div class="hds-card-footer">
  <button class="hds-btn hds-btn--secondary hds-btn--sm">Cancel</button>
  <button class="hds-btn hds-btn--danger hds-btn--sm">Delete</button>
</div>`
      ) },
    ],
  });
}

function linkContent() {
  return componentPage('Link', {
    description: 'Inline text link for navigation. Underlined with a subtle decoration color that strengthens on hover.',
    anatomy: anatomy(
      `            <a href="#" class="hds-link" data-anatomy="label">Link text</a>`,
      [
        { label: 'Label', target: 'label', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Size', content: playground(
        `          <div class="hds-stack hds-stack--lg">
            <p><a href="#" class="hds-link hds-link--xs">X-Small link</a></p>
            <p><a href="#" class="hds-link hds-link--sm">Small link</a></p>
            <p><a href="#" class="hds-link">Medium link (default)</a></p>
            <p><a href="#" class="hds-link hds-link--lg">Large link</a></p>
          </div>`,
        `<a href="#" class="hds-link hds-link--xs">X-Small</a>
<a href="#" class="hds-link hds-link--sm">Small</a>
<a href="#" class="hds-link">Medium (default)</a>
<a href="#" class="hds-link hds-link--lg">Large</a>`
      ) },
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
    anatomy: anatomy(
      `            <div style="position: relative; height: 260px; width: 320px; background: var(--hds-bg-default); border-radius: var(--hds-radius-md); overflow: hidden;">
              <div class="hds-modal-backdrop" data-anatomy="backdrop" style="position: absolute;">
                <div class="hds-modal" data-anatomy="container" style="max-width: 280px;">
                  <div class="hds-modal-header" data-anatomy="header">
                    <div class="hds-modal-title" data-anatomy="title">Confirm</div>
                  </div>
                  <div class="hds-modal-body" data-anatomy="body">
                    <p>Are you sure?</p>
                  </div>
                  <div class="hds-modal-footer" data-anatomy="footer">
                    <button class="hds-btn hds-btn--sm">Cancel</button>
                    <button class="hds-btn hds-btn--danger hds-btn--sm">Delete</button>
                  </div>
                </div>
              </div>
            </div>`,
      [
        { label: 'Header', target: 'header' },
        { label: 'Title', target: 'title' },
        { label: 'Body', target: 'body' },
        { label: 'Footer', target: 'footer' },
        { label: 'Backdrop', target: 'backdrop' },
        { label: 'Container', target: 'container', primary: true },
      ]
    ),
    dimensions: [
      { label: 'Type', content: playground(
        `<div style="position: relative; height: 320px; width: 100%; background: var(--hds-bg-default); border-radius: var(--hds-radius-md); overflow: hidden;">
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
      { label: 'Live Demo', content: `<div class="hds-stack hds-stack--lg">
              <p class="hds-body-sm hds-text-default">Backdrop fades in, then the modal scales up with spring easing. Click the backdrop or a button to dismiss.</p>
              <button class="hds-btn hds-btn--primary" onclick="document.getElementById('modal-live-demo').style.display='flex'">Open Modal</button>
            </div>
            <div id="modal-live-demo" class="hds-modal-backdrop" style="display:none;" onclick="if(event.target===this)this.style.display='none'">
              <div class="hds-modal">
                <div class="hds-modal-header">
                  <div class="hds-modal-title">Confirm Action</div>
                  <button class="hds-btn-icon" aria-label="Close" onclick="document.getElementById('modal-live-demo').style.display='none'">&times;</button>
                </div>
                <div class="hds-modal-body">
                  <p class="hds-body-sm hds-text-default">Are you sure you want to proceed? This action cannot be undone.</p>
                </div>
                <div class="hds-modal-footer">
                  <button class="hds-btn hds-btn--secondary hds-btn--sm" onclick="document.getElementById('modal-live-demo').style.display='none'">Cancel</button>
                  <button class="hds-btn hds-btn--danger hds-btn--sm" onclick="document.getElementById('modal-live-demo').style.display='none'">Delete</button>
                </div>
              </div>
            </div>` },
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
  'utilities': () => utilitiesContent(),
  'breadcrumbs': () => breadcrumbsContent(),
  'button': () => buttonsContent(),
  'button-group': () => buttonGroupContent(),
  'button-icon': () => buttonIconContent(),
  'card': () => cardContent(),
  'card-footer': () => cardFooterContent(),
  'card-header': () => cardHeaderContent(),
  'chips': () => chipsContent(),
  'chip-input': () => chipInputContent(),
  'collapsible': () => collapsibleContent(),
  'badge': () => badgeContent(),
  'divider': () => dividerContent(),
  'status-message': () => statusMessageContent(),
  'empty-state': () => emptyStateContent(),
  'spinner': () => spinnerContent(),
  'skeleton': () => skeletonContent(),
  'file-upload': () => fileUploadContent(),
  'form-group': () => formGroupContent(),
  'icon': () => iconContent(),
  'inputs': () => inputsContent(),
  'link': () => linkContent(),
  'list': () => listContent(),
  'modal': () => modalContent(),
  'nav-links': () => navLinksContent(),
  'playground': () => playgroundContent(),
  'progress': () => progressContent(),
  'search': () => searchContent(),
  'selects': () => selectsContent(),
  'stat': () => statContent(),
  'tabs': () => tabsContent(),
  'textarea': () => textareaContent(),
  'token-copy': () => tokenCopyContent(),
  'toggle': () => toggleContent(),
  'checkbox': () => checkboxContent(),
  'radio': () => radioContent(),
  'form-patterns': () => formPatternsContent(),
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
  const stalePages = ['animation.html', 'data-display.html', 'stats.html', 'files.html', 'tokens.html', 'base.html', 'alias.html', 'forms.html', 'navigation.html', 'foundations.html', 'components.html', 'buttons.html', 'feedback.html', 'key-value.html', 'toggles.html'];
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
