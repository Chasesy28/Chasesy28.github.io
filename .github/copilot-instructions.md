# Copilot Instructions for Chasesy28.github.io

## Project Overview

This is a testing/experimentation site combining a Vite + React + TypeScript frontend with Cloudflare Workers for serverless edge computing. The codebase spans multiple independent systems: a modern React component library, legacy testing projects (vanilla JS/HTML), and edge worker deployments. The React is primarily for the main page and not for any of the other projects.

## Architecture Patterns

### Frontend Stack

- **Framework**: Vite + React 19 with TypeScript (for main page components)
- **Styling**: Tailwind CSS v4 built locally with PostCSS, includes dark mode support
- **Build Output**: `dist/` directory (Vite), configured to preserve existing files
- **Path Aliases**: `@/` maps to `src/` (see `vite.config.ts`)
- **Static Pages**: Main index.html uses vanilla HTML/JS with local Tailwind CSS
- **Projects**: Independent vanilla JS/HTML experiments in `projects/` directory

### Utility Functions

- `cn()` in [src/lib/utils.ts](src/lib/utils.ts) - use for all className merging (twMerge + clsx)
- Always import from `@/lib/utils` to maintain consistency

## Developer Workflows

### Local Development

```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # TypeScript check + Vite build to dist/
npm run preview  # Preview built site locally
```

### DEV RULES

- **Testing**: If `Chrome-Dev-Tools-MCP` is active, use it to inspect and validate UI/DOM changes immediately after generation.
- **Assets**: Use [Lucide React](https://lucide.dev) for iconography.
- **Styles**: Refer to `tailwind.config.js` for custom animations provided by the `tailwindcss-animate` plugin.
- **Legacy Code**: Avoid modifying legacy projects in `projects/` unless necessary; they are isolated experiments.
- **Workers**: Deploy Cloudflare Workers separately using Wrangler CLI; do not include worker code in the Vite build.
- **Documentation**: Update this file with any architectural changes or new patterns introduced during development.
- **Code Quality**: Follow consistent code style and best practices; use linters and formatters as configured in the project.
- **Clutter Avoidance**: Keep the `dist/` directory clean; do not commit build artifacts to version control. Additinally do not create random .md files even as documentation, use this file for all documentation purposes.

### Deployment Strategy

- **Frontend**: Deployed as static assets via Cloudflare Workers Sites (KV storage at edge)
- **Workers**: Deploy separately with Wrangler CLI
  - Main worker: `wrangler deploy` (handles security headers, caching)
  - Image optimizer: `wrangler deploy workers/image-optimizer.js --name silly-site-image-optimizer`

### Build Configuration Notes

- `emptyOutDir: false` in vite.config.ts - preserves existing dist files during builds
- Source maps enabled (`sourcemap: true`)
- Entry point: `index-vite.html` (distinct from static `index.html`)

## Critical Patterns

### Cloudflare Workers Integration

Located in `workers/` directory:

- `index.js` - main worker: security headers (CSP, X-Frame-Options), intelligent caching by content type
- `image-optimizer.js` - edge-based image transformation (WebP/AVIF conversion, dynamic resize, quality optimization)
- See [workers/README.md](workers/README.md) for deployment details

**Configuration**: [wrangler.toml](wrangler.toml) excludes build artifacts and source code from edge deployment; only static assets uploaded via KV.

### Project Structure (Mixed Codebases)

- `src/` - Modern TypeScript/React (production code)
- `projects/` - Legacy testing projects (Finder app, Pop-ups, WebGL experiments) - independent from main app
- `scripts.js` - Legacy global scripts
- `icons/` - Static assets

**Note**: Projects in `projects/` are isolated experiments, not part of the React app build.

### Tailwind + Dark Mode

- Dark mode via class strategy (`darkMode: ["class"]`)
- Tailwind CSS v4 built locally with PostCSS from `styles.css` (includes @tailwind directives)
- Custom CSS variables and animations in `styles.css`
- Projects use local Tailwind via relative links to `../../styles.css`

## Integration Points

### External Services

- **Cloudflare**: DNS, Workers, KV storage, R2 buckets (configured in wrangler.toml)
- **GitHub**: Static site hosting via Pages (CNAME: chasesy28.github.io)
- **Package Managers**: lucide-react (icons), tailwind-merge, class-variance-authority

### TypeScript Configuration

- `tsconfig.json` - main app config with path aliases
- `tsconfig.node.json` - Vite/build tool config (separate to avoid bloat)

## File References

- Component library: [src/components/ui/](src/components/ui/)
- App entry: [src/App.tsx](src/App.tsx), [src/main.tsx](src/main.tsx)
- Config: [vite.config.ts](vite.config.ts), [tailwind.config.js](tailwind.config.js), [wrangler.toml](wrangler.toml)
- Package info: [package.json](package.json)
