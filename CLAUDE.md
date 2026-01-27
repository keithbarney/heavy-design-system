# Keith Design System

Core design system that powers all projects. Inherits from `~/Projects/CLAUDE.md`.

---

## Overview

Token-driven design system with Sass compilation, Pug templates, and a self-documenting style guide. Generates CSS custom properties for light/dark theming.

## Tech Stack

- **Templating:** Pug
- **Styling:** Sass
- **Build:** Node.js scripts, Browser-Sync
- **Fonts:** Test American Grotesk, Inter, Departure Mono

## Commands

```bash
npm run dev           # Build + watch + serve with live reload
npm run build         # Full build: tokens → assets → pages → styles
npm run build:tokens  # Generate Sass from token JSON
npm run build:styles  # Compile Sass to CSS
npm run build:pages   # Compile Pug to HTML
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/styles/main.sass` | Entry point, imports all partials |
| `src/styles/_tokens.sass` | **AUTO-GENERATED** — do not edit |
| `src/styles/_variables.sass` | CSS custom properties (light/dark themes) |
| `src/styles/_grid.sass` | Swiss grid system (12-col, auto-fit) |
| `src/styles/_breakpoints.sass` | Responsive mixins |
| `src/scripts/build-tokens.js` | Token JSON → Sass generator |

---

## Token Build Process

```
~/Projects/tokens/*.json → build-tokens.js → _tokens.sass
```

The script reads shared base tokens and generates:
- Sass variables (`$spacing-16`, `$color-red-500`)
- CSS custom properties (`--space-16`, `--ui-text-default`)
- Dark theme overrides (`[data-theme="dark"]`)

**Always run `npm run build:tokens` after modifying token JSON files.**

---

## CSS Custom Properties

```scss
// Spacing
--space-{0,2,4,8,10,12,14,16,20,24,28,32,40,48,60,72}
--gap-{none,xxs,xs,sm,md,lg,xl,2xl,3xl,4xl}
--padding-{xs,sm,md,lg,xl,2xl}

// Typography
--type-{8,10,12,14,20,28,32}
--font-{primary,sans,mono}
--line-height-{tight,base,loose}

// UI Colors (theme-aware)
--ui-bg-default
--ui-surface-default
--ui-text-{default,strong,disabled}
--ui-border-{default,strong}
--ui-action-{primary,primary-hover,primary-active}
--ui-feedback-{success,warning,danger,info}
```

---

## Responsive Breakpoints

| Mixin | Min-Width |
|-------|-----------|
| `@include sm` | 480px |
| `@include md` | 768px |
| `@include lg` | 1024px |
| `@include xl` | 1200px |
| `@include xxl` | 1440px |

```scss
.element {
  padding: var(--padding-sm);

  @include md {
    padding: var(--padding-md);
  }
}
```

---

## Grid System

Swiss-inspired CSS Grid layout.

```scss
.grid              // Base grid with gap
.grid--2 to --12   // Fixed column counts
.grid--auto        // Auto-fit (200px min)
.grid--auto-300    // Auto-fit (300px min)
.grid--auto-400    // Auto-fit (400px min)
.col-span-{1-12}   // Column spanning
.gap-{1-6}         // Gap utilities
```

---

## Layout Utilities

```scss
// Stack (vertical rhythm)
.stack > * + * { margin-block-start: var(--gap-md); }

// Cluster (horizontal grouping)
.cluster { display: flex; flex-wrap: wrap; gap: var(--gap-sm); }

// Sidebar layout
.with-sidebar { display: flex; flex-wrap: wrap; }

// Center with max-width
.center { max-width: var(--measure); margin-inline: auto; }
```

---

## Notes

- `_tokens.sass` is auto-generated — never edit directly
- Mobile-first responsive design
- `[data-theme="dark"]` enables dark mode
- Type scale is 8, 10, 12, 14, 20, 28, 32px (not strict 8pt)
- Optimal line length: 65 characters (`--measure`)
