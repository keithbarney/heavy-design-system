# Heavy Design System

Core design system that powers all projects. Inherits from `~/Projects/CLAUDE.md`.

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
npm run build:styles  # Copy src/styles/main.css to dist/
npm run build:themes  # Generate dist/heavy-theme.css
npm run build:pages   # Generate HTML pages from token JSON
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/styles/main.css` | All styles in one file — hand-authored, source of truth |
| `src/scripts/build-tokens.js` | Token JSON → `dist/tokens.css` (for external consumers) |
| `src/scripts/build-pages.js` | Token JSON → `dist/*.html` (style guide pages) |
| `src/scripts/build-themes.js` | Theme files → `dist/heavy-theme.css` |
| `src/scripts/dev.js` | File watcher for dev mode |

---

## Token Build Process

```
~/Projects/tokens/*.json → build-tokens.js → dist/tokens.css
~/Projects/tokens/*.json → build-pages.js  → dist/*.html (tables auto-populated)
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

## Notes

- `src/styles/main.css` is the single source of truth for all styles
- `dist/tokens.css` is auto-generated for external consumers — do not edit
- Mobile-first responsive design
- `[data-theme="dark"]` enables dark mode
- Type scale: 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48px
- Optimal line length: 65 characters (`--measure`)
- No Sass, no Pug — plain CSS + Node.js only
