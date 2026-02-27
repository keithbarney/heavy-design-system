# Heavy Design System

Core design system that powers all projects. Inherits from `~/Projects/CLAUDE.md` (symlink to `tools/claude-config/CLAUDE.md`).

---

## Overview

Token-driven design system with plain CSS (native nesting), Node.js page generation, and a self-documenting style guide. Generates CSS custom properties for light/dark theming. No preprocessors — no Sass, no Pug.

## Tech Stack

- **Styling:** Plain CSS (native nesting)
- **Pages:** Node.js template literals (reads token JSON)
- **Build:** Node.js scripts, Browser-Sync
- **Fonts:** Test American Grotesk, Inter, JetBrains Mono

## Commands

```bash
npm run dev           # Watch + serve with live reload
npm run build         # Full build: tokens → styles → themes → pages
npm run build:tokens  # Generate dist/tokens.css from token JSON
npm run build:styles  # Copy main.css + style-guide.css to dist/
npm run build:themes  # Generate dist/heavy-theme.css
npm run build:pages   # Generate HTML pages from token JSON
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/styles/main.css` | Design system styles — variables, reset, typography, grid, layout, components |
| `src/styles/style-guide.css` | Style guide chrome — documentation layout, simulated states, token display |
| `src/scripts/build-tokens.js` | Token JSON → `dist/tokens.css` (for external consumers) |
| `src/scripts/build-pages.js` | Token JSON → `dist/*.html` (style guide pages) |
| `src/scripts/build-themes.js` | Theme files → `dist/heavy-theme.css` |
| `src/scripts/dev.js` | File watcher for dev mode |

---

## Token Build Process

```
~/Projects/design/tokens/*.json → build-tokens.js → dist/tokens.css
~/Projects/design/tokens/*.json → build-pages.js  → dist/*.html (tables auto-populated)
```

The style guide pages read token JSON directly — tables update automatically when tokens change.

**Always run `npm run build` after modifying token JSON files.**

---

## CSS Custom Properties

```css
/* Spacing */
--space-{0,2,4,8,10,12,14,16,20,24,28,32,40,48,60,72}
--gap-{none,xxs,xs,sm,md,lg,xl,2xl,3xl,4xl}
--padding-{xs,sm,md,lg,xl,2xl}

/* Typography */
--type-{8,10,12,14,16,18,20,24,28,32,40,48}
--font-{primary,sans,mono}
--line-height-{tight,base,loose}

/* UI Colors (theme-aware) */
--ui-bg-default
--ui-surface-default
--ui-text-{default,strong,disabled}
--ui-border-{default,strong}
--ui-action-{primary,primary-hover,primary-active}
--ui-feedback-{success,warning,danger,info}
```

---

## Responsive Breakpoints

No mixins — use inline media queries with native CSS nesting:

```css
.element {
  padding: var(--padding-sm);

  @media (min-width: 768px) {
    padding: var(--padding-md);
  }
}
```

Breakpoints: 480px (sm), 768px (md), 1024px (lg), 1200px (xl), 1440px (2xl)

---

## Grid System

Swiss-inspired CSS Grid layout.

```css
.grid              /* Base grid with gap */
.grid--2 to --12   /* Fixed column counts */
.grid--auto        /* Auto-fit (300px min) */
.grid--auto-sm     /* Auto-fit (200px min) */
.grid--auto-lg     /* Auto-fit (400px min) */
.col-span-{1-12}   /* Column spanning */
.gap-{1-6}         /* Gap utilities */
```

---

## Layout Utilities

```css
/* Stack (vertical rhythm) */
.stack > * + * { margin-top: var(--space-16); }

/* Cluster (horizontal grouping) */
.cluster { display: flex; flex-wrap: wrap; gap: var(--space-16); }

/* Sidebar layout */
.with-sidebar { display: flex; flex-wrap: wrap; }

/* Center with max-width */
.center { max-inline-size: var(--measure); margin-inline: auto; }
```

---

## Component Documentation Template

All component pages follow the **style-guide framework's component page principles** (see `~/Projects/design/style-guide/CLAUDE.md` → "Component Page Principles"). The core rules:

- **Narrative arc:** Intro → Anatomy → Dimension sections → Props → Guidelines (fixed order)
- **Dimension isolation:** One section per axis of variation. Show all values of one dimension while holding every other dimension at its default. Never mix dimensions.
- **Instance minimalism:** Every instance teaches one concept. Total = 1 (Anatomy) + N₁ + N₂ + …
- **Layout widths:** Visual sections = 6 grid columns, text sections = 10 columns

Heavy DS extends the base template with additional documentation sections. Use `buttonsContent()` in `build-pages.js` as the reference implementation.

### Sections (canonical order)

1. **Description** — Raw text string passed to `componentPage()`. Renders in the page intro `<p>`.
2. **Anatomy** — Visual breakdown with numbered markers.
3. **Dimensions** — Array of `{ label, content }`. One section per axis of variation. Each playground isolates one dimension. Common labels: Type, Size, States, Form Group.
4. **Props** — Property table.
5. **Guidelines** — Merged `<h4>` sub-sections: When to use, When not to use, Usage, Content, String length. Use `guidelines()` helper for bulleted lists.
6. **Accessibility** — Keyboard interaction table + ARIA notes.
7. **Related** — Links to sibling/alternative components.

Not every section is required. Skip sections that don't apply. But the order is fixed — controlled by `componentPage()`.

### Template engine

All component pages use `componentPage(title, sections)` which renders the canonical section arc. The `dimensions` key is an array of `{ label, content }` — each becomes its own `<section>`. Missing keys are skipped.

```js
componentPage('Button', {
  description: 'One sentence purpose.',
  dimensions: [
    { label: 'Type', content: playground(...) },
    { label: 'Size', content: playground(...) },
  ],
  guidelines: `<h4>When to use</h4>\n` + guidelines([...]) +
              `\n<h4>When not to use</h4>\n` + guidelines([...]),
  accessibility: '...',
  related: guidelines([...]),
});
```

### Helpers

- `componentPage(title, sections)` — Renders canonical arc: Intro → Anatomy → Dimensions → Props → Guidelines → Accessibility → Related.
- `playground(previewHtml, code)` — Preview area + copyable code block.
- `guidelines(items)` — Bulleted list of HTML strings.
- `codeBlock(html)` — Escaped code in `<pre>` with Copy button.
- `esc(str)` — Escapes `<`, `>`, `&`, `"` for safe HTML display.

### CSS classes

| Class | Purpose | Grid placement |
|-------|---------|---------------|
| `.style-guide-description` | Intro paragraph | col 3 / -1 |
| `.style-guide-code-block` | Copy button + code wrapper | col 3 / -1 |
| `.style-guide-code` | Monospace `<pre>` block | inside `.style-guide-code-block` |
| `.style-guide-guidelines` | Bulleted list container | col 3 / -1 |

### Naming rule

Component variants use the **base name first** so they sort together in the sidebar: Button, Button Group, Button Icon — not Icon Button. This applies to all components.

### Adding a new component page

1. Add entry to `PAGES` array in `build-pages.js` (file, id, label, group)
2. Write content function following the template above
3. Add entry to `contentMap`
4. Run `npm run build` and verify

---

## Notes

- `src/styles/main.css` is the design system — standalone, no style-guide dependencies
- `src/styles/style-guide.css` is documentation chrome — only needed by the style guide pages
- `dist/tokens.css` is auto-generated for external consumers — do not edit
- Mobile-first responsive design
- `[data-theme="dark"]` enables dark mode
- Type scale: 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48px
- Optimal line length: 65 characters (`--measure`)
- No Sass, no Pug — plain CSS + Node.js only
