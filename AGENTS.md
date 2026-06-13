# Agent Guidance for this Repository

Purpose: provide concise, actionable instructions for AI coding agents working on this repo.

Quick actions
- **Start dev server**: `npm run dev` (Vite) — serves the React app at http://localhost:5173
- **Build**: `npm run build` — TypeScript check + Vite build into `dist/`
- **Preview build**: `npm run preview`
- **Workers dev**: `wrangler dev` (see `workers/README.md`)

Key files and places to inspect (link, don't duplicate)
- **Repository README**: [README.md](README.md)
- **Project Copilot instructions** (canonical): [.github/copilot-instructions.md](.github/copilot-instructions.md)
- **Workers docs**: [workers/README.md](workers/README.md)
- **Supabase integration**: [SUPABASE-INTEGRATION.md](SUPABASE-INTEGRATION.md)
- **Vite config & alias**: [vite.config.ts](vite.config.ts)
- **Cloudflare config**: [wrangler.toml](wrangler.toml)

Conventions agents should follow
- **Link, don't embed**: reference existing docs instead of copying long sections.
- **Minimal edits**: prefer small, focused changes (follow existing code style).
- **Legacy projects**: `projects/` contains isolated experiments — avoid changing them unless asked.
- **Styling helpers**: use the `cn()` utility in `src/lib/utils.ts` for className merging.
- **Tailwind**: dark mode uses `class` strategy; see `tailwind.config.js` and `styles.css`.
- **Build output**: `dist/` is preserved during builds (`emptyOutDir: false`) — do not commit build artifacts.
- **Workers**: deploy Cloudflare Workers separately with Wrangler; do not bundle worker code into the Vite build.

Agent behavior recommendations
- When exploring: prefer automated searches (search_subagent) and reading the files linked above.
- For edits: create small PRs with clear titles and link to relevant docs; run `npm run build` before opening PRs that touch the app.
- For Supabase changes: consult [SUPABASE-INTEGRATION.md](SUPABASE-INTEGRATION.md) and the `supabase/` folder; use the Supabase MCP tools for live project info.
- For Workers: consult [workers/README.md](workers/README.md) and use `wrangler` for deploy/testing.