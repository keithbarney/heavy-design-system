# Keith Barney Portfolio

Personal portfolio site for a Design Systems Designer, built with Pug and Sass.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Structure

```
keith-barney-portfolio/
├── src/
│   ├── pug/              # Pug templates
│   │   ├── index.pug
│   │   ├── case-studies.pug
│   │   ├── contact.pug
│   │   └── partials/
│   └── sass/             # Sass stylesheets
│       ├── main.sass
│       └── partials/
├── dist/                 # Built output
├── tokens/dist/          # Design tokens
├── styles/               # Core styles
└── grid/                 # Grid system
```

## Scripts

- `npm run dev` - Start development server with live reload
- `npm run build` - Build for production
- `npm run build:sass` - Compile Sass only
- `npm run build:pug` - Compile Pug only

## Pages

- `/` - Home page
- `/case-studies.html` - Case studies listing
- `/contact.html` - Contact information
