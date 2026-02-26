# Heavy Design System

Token-driven design system powering all Heavy projects (including Keith Slides and Heavy Figma plugins). Plain CSS with native nesting, Node.js page generation, and a self-documenting style guide.

**No preprocessors** — no Sass, no Pug, no PostCSS.

## Quick Start

```bash
npm install
npm run build    # Full build: tokens → styles → themes → pages
npm run dev      # Watch + live reload
```

## Architecture

```
heavy-design-system/
├── src/
│   ├── styles/
│   │   ├── main.css              # ← THE design system (standalone)
│   │   └── style-guide.css       # Style guide docs chrome only
│   ├── scripts/
│   │   ├── build-tokens.js       # Token JSON → dist/tokens.css
│   │   ├── build-pages.js        # Token JSON → dist/*.html (style guide)
│   │   ├── build-themes.js       # Theme CSS → dist/heavy-theme.css
│   │   └── dev.js                # File watcher
│   ├── themes/
│   │   └── heavy-plugin/         # Figma plugin theme (Spacegray/Base16 Ocean)
│   │       ├── variables.css
│   │       └── components.css
│   └── assets/fonts/             # JetBrains Mono (woff2)
├── dist/                         # Built output (HTML pages, CSS, fonts)
└── package.json
```

## Token System

The design system uses a **three-layer token architecture**:

### 1. Base Tokens (Primitives)

Raw values with no semantic meaning. Defined as CSS custom properties in `main.css`:

```css
/* UI Scale — the numeric building blocks */
--ui-0: 0px;  --ui-2: 2px;  --ui-4: 4px;  --ui-8: 8px;
--ui-10: 10px; --ui-12: 12px; --ui-14: 14px; --ui-16: 16px;
--ui-20: 20px; --ui-24: 24px; --ui-28: 28px; --ui-32: 32px;
--ui-40: 40px; --ui-48: 48px; --ui-60: 60px; --ui-64: 64px;
```

### 2. Alias Tokens (Semantic)

Named references to base tokens that communicate *intent*:

```css
/* Spacing (t-shirt sizes) */
--spacing-none: var(--ui-0);   --spacing-xxs: var(--ui-2);
--spacing-xs: var(--ui-4);     --spacing-sm: var(--ui-8);
--spacing-md: var(--ui-16);    --spacing-lg: var(--ui-24);
--spacing-xl: var(--ui-32);    --spacing-2xl: var(--ui-40);

/* Numeric spacing */
--space-4: var(--ui-4);  --space-8: var(--ui-8);  --space-16: var(--ui-16); ...

/* Font sizes */
--font-size-body-xs: var(--ui-10);  --font-size-body-sm: var(--ui-12);
--font-size-body: var(--ui-14);       --font-size-h1: var(--ui-40);

/* Radius */
--radius-none: 0px;  --radius-sm: 4px;  --radius-md: 8px;
--radius-lg: 12px;   --radius-full: 999px;
```

### 3. Component Tokens (Contextual)

Scoped to specific UI elements, themed for light/dark:

```css
/* Action tokens (buttons) */
--action-primary-bg-default: #282828;      /* light */
--action-primary-bg-default: #E8E8E8;      /* dark */

/* Form input tokens */
--forms-input-bg-default: #E8E8E8;         /* light */
--forms-input-bg-default: #282828;          /* dark */

/* Feedback */
--ui-feedback-success: #0E8345;
--ui-feedback-danger: #DE1135;
```

### External Token JSON (Optional)

The build scripts (`build-tokens.js`, `build-pages.js`) can read from external token JSON files at `~/Projects/tokens/` (base) and `~/Projects/design/tokens/` (alias). These populate `dist/tokens.css` and the style guide color/typography tables. If the token JSON files don't exist, the style guide pages render with empty tables but `main.css` still works standalone — all values are hardcoded there.

## Theming

Dark mode via `data-theme` attribute:

```html
<html data-theme="dark">
```

Toggle in JS:
```js
document.documentElement.setAttribute('data-theme', 'dark'); // or 'light'
```

Light mode is the default (`:root`). Dark overrides live in `[data-theme="dark"]`.

## CSS Custom Properties Reference

### Spacing
| Pattern | Example | Description |
|---------|---------|-------------|
| `--space-{N}` | `--space-16` | Numeric spacing (0–72) |
| `--spacing-{size}` | `--spacing-md` | T-shirt sizing (none → 4xl) |
| `--padding-{size}` | `--padding-md` | Padding aliases (xs → 2xl) |
| `--gap-{size}` | `--gap-md` | Gap aliases (from token build) |

### Typography
| Property | Values |
|----------|--------|
| `--font-primary` | Test American Grotesk |
| `--font-secondary` | JetBrains Mono |
| `--font-sans` | Inter |
| `--font-size-body-{xsm,sm,body,lg,xlg}` | 10–20px |
| `--font-size-h{1-6}` | 16–40px |
| `--font-size-display` | 48px |

### UI Colors (theme-aware)
| Token | Purpose |
|-------|---------|
| `--ui-bg-default` | Page background |
| `--ui-surface-default` | Card/panel background |
| `--ui-text-{default,strong,disabled}` | Text hierarchy |
| `--ui-border-{default,strong}` | Borders |
| `--ui-action-primary` | Primary action color |
| `--ui-feedback-{success,warning,danger,info}` | Status colors |

## Layout System

CSS Grid + flexbox primitives:

```css
.heavy-grid            /* Base grid */
.heavy-grid--{2-12}    /* Fixed columns */
.heavy-grid--auto      /* Auto-fit (300px min) */
.heavy-col-span-{1-9}  /* Column spanning */
.heavy-stack            /* Vertical rhythm (16px default) */
.heavy-cluster          /* Horizontal flex wrap */
.heavy-with-sidebar     /* Sidebar + content layout */
.heavy-center           /* Max-width centering */
.heavy-cover            /* Full-height cover layout */
.heavy-box              /* Padding box (sm/md/lg/xl) */
```

Breakpoints: `480px` (sm), `768px` (md), `1024px` (lg), `1200px` (xl), `1440px` (2xl)

## Components

All components use the `heavy-` prefix:

| Component | Classes |
|-----------|---------|
| **Button** | `.heavy-btn`, `--primary`, `--secondary`, `--tertiary`, `--danger` |
| **Button sizes** | `--xs`, `--sm`, (default), `--lg`, `--block` |
| **Button Icon** | `.heavy-btn-icon` |
| **Button Group** | `.heavy-btn-group` |
| **Select** | `.heavy-select`, `--xs`, `--sm`, `--lg` |
| **Search** | `.heavy-search > input`, `--xs`, `--sm`, `--lg` |
| **Input** | `.heavy-form-input`, `--xs`, `--sm`, `--lg`, `--error`, `--success` |
| **Textarea** | `.heavy-form-input.heavy-form-textarea` |
| **Toggle** | `.heavy-form-toggle` (wraps checkbox) |
| **Checkbox/Radio** | `.heavy-form-check` + `.heavy-form-check-input` |
| **File Upload** | `.heavy-form-file` + `.heavy-form-file-trigger` |
| **Form Group** | `.heavy-form-group` + `.heavy-form-label` + `.heavy-form-hint` |
| **Chips** | `.heavy-chip`, `--active` |
| **Tabs** | `.heavy-tabs` > `.heavy-tab`, `--active` |
| **Breadcrumbs** | `.heavy-breadcrumbs` |
| **Nav Links** | `.heavy-nav-link`, `--active` |
| **Badge** | `.heavy-badge`, `--success`, `--warning`, `--danger`, `--info` |
| **Card** | `.heavy-card`, `--elevated`, `--interactive` |
| **Stat** | `.heavy-stat` > `.heavy-stat-value` + `.heavy-stat-label` |
| **Key-Value** | `.heavy-kv` > `.heavy-kv-key` + `.heavy-kv-value` |
| **Progress** | `.heavy-progress` > `.heavy-progress-bar` |
| **Status Message** | `.heavy-status-msg`, `--success`, `--error`, `--warning`, `--info` |
| **Empty State** | `.heavy-empty-state` |
| **Spinner** | `.heavy-spinner` |
| **Skeleton** | `.heavy-skeleton` |
| **Collapsible** | `details.collapsible` > `summary` |

## Heavy Plugin Theme

`dist/heavy-theme.css` — a separate theme for Figma plugins (Spacegray/Base16 Ocean palette). Built from `src/themes/heavy-plugin/`. Uses its own token namespace (`--color-*`, `--space-*`, `--font-size-*`). Import instead of `main.css` for plugin UIs.

## Using in Other Projects

### Option A: Link the CSS directly
```html
<link rel="stylesheet" href="path/to/heavy-design-system/dist/main.css">
```

### Option B: Copy `main.css`
The file is self-contained — copy it into your project. All custom properties are defined inline.

### Option C: Use `tokens.css` only
For projects that only need the token values (custom properties) without component styles. Requires external token JSON files to be populated.

## Build Scripts

| Command | What it does |
|---------|-------------|
| `npm run build` | Full build (tokens → styles → themes → pages) |
| `npm run build:tokens` | `~/Projects/tokens/*.json` → `dist/tokens.css` |
| `npm run build:styles` | Copies `main.css`, `style-guide.css`, fonts → `dist/` |
| `npm run build:themes` | `src/themes/` → `dist/heavy-theme.css` |
| `npm run build:pages` | Token JSON → `dist/*.html` (style guide) |
| `npm run dev` | Watch + Browser-Sync live reload |

## License

MIT
