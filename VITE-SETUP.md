# Modern Development Stack Setup

This document describes the Vite + TypeScript + React + Tailwind CSS configuration added to this project.

## Overview

The project supports **both** the original static HTML site **and** a modern React development environment:

- **Original Site**: `index.html` - The main site using static HTML with local Tailwind CSS
- **React App**: `index-vite.html` - Optional TypeScript/React application with Vite

## Tech Stack

### Core Technologies

- **Vite** (v7.3.1): Lightning-fast build tool and development server
- **React** (v19+): Modern UI library for building component-based interfaces
- **TypeScript** (v5+): Type-safe JavaScript with enhanced IDE support
- **Tailwind CSS** (v4+): Utility-first CSS framework, built locally with PostCSS
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

### Supporting Libraries

- **@vitejs/plugin-react**: Fast Refresh and JSX transformation
- **PostCSS & Autoprefixer**: CSS processing and vendor prefixing
- **class-variance-authority**: Type-safe component variants
- **clsx & tailwind-merge**: Utility for merging Tailwind classes
- **lucide-react**: Beautiful icon library

## Project Structure

```
/
├── src/                          # React application source
│   ├── components/
│   │   └── ui/                  # shadcn/ui components
│   │       ├── button.tsx       # Button component
│   │       └── card.tsx         # Card component
│   ├── lib/
│   │   └── utils.ts            # Utility functions (cn helper)
│   ├── App.tsx                  # Main React component
│   ├── main.tsx                 # React entry point
│   ├── index.css                # Tailwind CSS imports
│   └── vite-env.d.ts           # Vite type definitions
├── public/                       # Static assets for Vite
├── dist/                         # Build output (gitignored)
├── index.html                    # Original static site (preserved)
├── index-vite.html              # Vite/React app entry
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── tsconfig.node.json           # TypeScript config for Node scripts
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── components.json              # shadcn/ui configuration
└── package.json                 # Dependencies and scripts
```

## Configuration Files

### vite.config.ts

Configures Vite with:

- React plugin for Fast Refresh
- Path alias `@` → `./src` for cleaner imports
- Source maps for debugging
- Custom build output to `dist/`
- Preserves existing files during build

### tsconfig.json

TypeScript configuration with:

- Target: ES2020
- Strict type checking enabled
- Path mapping for `@/*` imports
- React JSX transformation
- Bundler module resolution

### tailwind.config.js

Tailwind CSS v4 configuration with:

- Dark mode support via `class` strategy
- Extended color palette
- Custom animations
- Container utilities
- Border radius customization
- Plugin: tailwindcss-animate

### components.json

shadcn/ui configuration for:

- Component installation path: `@/components`
- Utilities path: `@/lib/utils`
- CSS variables and theming
- TypeScript support

## Available Scripts

### Development

```bash
npm run dev
```

Starts the Vite development server with:

- Hot Module Replacement (HMR)
- Fast Refresh for React
- TypeScript type checking
- Tailwind CSS processing
- Accessible at `http://localhost:5173`

### Build

```bash
npm run build
```

Creates an optimized production build:

1. Runs TypeScript compiler to check types
2. Bundles with Vite/Rollup
3. Outputs to `dist/` directory
4. Generates source maps for debugging
5. Optimizes and minifies assets

### Preview

```bash
npm run preview
```

Previews the production build locally:

- Serves the `dist/` directory
- Tests the production build before deployment

## Using shadcn/ui Components

### Adding New Components

You can add more shadcn/ui components using npx:

```bash
npx shadcn@latest add [component-name]
```

Examples:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

### Available Components

shadcn/ui provides 40+ accessible components:

- **Layout**: Card, Separator, Tabs, Accordion
- **Forms**: Input, Textarea, Select, Checkbox, Radio
- **Feedback**: Alert, Toast, Dialog, Progress
- **Navigation**: Dropdown Menu, Context Menu, Menubar
- **Data Display**: Table, Avatar, Badge, Tooltip
- And many more...

See full list at: https://ui.shadcn.com/docs/components

## TypeScript Usage

### Type Safety

All React components are fully typed:

```typescript
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Typed Component</CardTitle>
      </CardHeader>
    </Card>
  )
}
```

### Path Aliases

Use `@/` for cleaner imports:

```typescript
// Instead of: import { cn } from '../../lib/utils'
import { cn } from "@/lib/utils";

// Instead of: import { Button } from '../../components/ui/button'
import { Button } from "@/components/ui/button";
```

## Tailwind CSS

### Custom Classes

Tailwind v4 uses a new import syntax:

```css
@import "tailwindcss";
```

### Dark Mode

Dark mode is configured with the `class` strategy. Add the `dark` class to any parent element:

```tsx
<div className="dark">
  <div className="bg-white dark:bg-slate-950">Content adapts to dark mode</div>
</div>
```

### Utility Classes

Full Tailwind utility classes are available:

```tsx
<div className="flex items-center gap-4 p-6 rounded-lg border shadow-sm">
  <Button className="bg-blue-500 hover:bg-blue-600">Custom Button</Button>
</div>
```

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

### 2. Create Components

Create new components in `src/components/`:

```tsx
// src/components/MyComponent.tsx
import { Button } from "@/components/ui/button";

export function MyComponent() {
  return <Button>Click me</Button>;
}
```

### 3. Use in App

Import and use in `src/App.tsx`:

```tsx
import { MyComponent } from "@/components/MyComponent";

function App() {
  return (
    <div>
      <MyComponent />
    </div>
  );
}
```

### 4. Build for Production

```bash
npm run build
```

### 5. Preview Production Build

```bash
npm run preview
```

## Integration with Existing Site

The React app is completely separate from the original site:

- **Original Site**: Access via `index.html` (root of GitHub Pages)
- **React App**: Access via `index-vite.html` (after building, available at `/dist/index-vite.html`)

Both can coexist and be deployed together.

## Deployment

### GitHub Pages

To deploy the React app to GitHub Pages alongside the existing site:

1. Build the project:

   ```bash
   npm run build
   ```

2. The `dist/` directory will contain:
   - `index-vite.html` - React app entry
   - `assets/` - Bundled JS and CSS

3. Commit and push the `dist/` directory (or configure GitHub Actions)

4. Access at: `https://yourdomain.com/dist/index-vite.html`

### Cloudflare Pages

The project is already configured with Cloudflare Workers. The React app can be deployed to Cloudflare Pages:

1. Connect your repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set build output directory: `dist`
4. Deploy

## Best Practices

### Component Organization

- Place reusable components in `src/components/`
- Keep UI primitives in `src/components/ui/`
- Create feature-specific components in feature folders

### Styling

- Use Tailwind utility classes for styling
- Create component variants with `class-variance-authority`
- Use the `cn()` utility to merge classes conditionally

### Type Safety

- Define prop types with TypeScript interfaces
- Use React.FC or explicit return types
- Leverage TypeScript's strict mode

### Performance

- Code-split with React.lazy() for large components
- Use React.memo() for expensive components
- Optimize images with Vite's asset handling

## Troubleshooting

### TypeScript Errors

Run type checking:

```bash
npx tsc --noEmit
```

### Build Fails

Clear cache and reinstall:

```bash
rm -rf node_modules dist
npm install
npm run build
```

### Styles Not Applying

Ensure Tailwind imports are at the top of `src/index.css`:

```css
@import "tailwindcss";
```

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)

## Future Enhancements

Potential additions to consider:

- **React Router**: Add routing for multi-page app
- **State Management**: Add Zustand or Redux Toolkit
- **Form Handling**: Add React Hook Form + Zod
- **API Integration**: Add TanStack Query (React Query)
- **Testing**: Add Vitest + React Testing Library
- **Storybook**: Add component documentation
- **ESLint + Prettier**: Add code quality tools
