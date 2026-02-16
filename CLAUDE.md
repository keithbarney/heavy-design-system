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

Every component page follows this structure. Use `buttonsContent()` in `build-pages.js` as the reference implementation.

### Sections (in order)

1. **Description** — `<p class="style-guide-description">`. One or two sentences: what it is, what it does.
2. **When to use** — `<div class="style-guide-guidelines">`. Bulleted scenarios where this component is the right choice.
3. **When not to use** — Same format. Each bullet names the alternative: "Use X instead."
4. **Variants / Demo** — Visual demos with simulated states (`.is-hover`, `.is-active`, `.is-disabled`), followed by a `codeBlock()` per variant showing copyable HTML.
5. **Formatting** — Sizes, block, modifiers — whatever applies. Each gets a demo + code block.
6. **Usage Guidelines** — When to use each variant, hierarchy rules.
7. **Content** — Label/copy rules: verbs, casing, length, specificity.
8. **String Length** — Live demos showing how the component handles short and long strings.
9. **Keyboard** — Table mapping keys to actions. Notes on `aria-disabled` vs `disabled`, `aria-label` requirements.
10. **Related** — Links to sibling/alternative components with one-line descriptions.

Not every section is required for every component. Skip sections that don't apply (e.g. String Length for a toggle). But the order is fixed — don't rearrange.

### Template engine

All component pages use `componentPage(title, sections)` which renders sections in `COMPONENT_SECTIONS` order. Each content function passes an object with named keys — the template controls the stacking order. To reorder sections across all pages, edit the `COMPONENT_SECTIONS` array.

### Helpers

- `componentPage(title, sections)` — Renders a `<section>` with `<h2>` and named sections in `COMPONENT_SECTIONS` order. Missing keys are skipped.
- `codeBlock(html)` — Escapes HTML via `esc()`, wraps in `<pre class="style-guide-code">` with a Copy button. Reuse for every code example.
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
