# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WoodShop Toolbox is a modular web application for personal woodworking tools. The flagship tool is a BOM (Bill of Materials) generator that uses AI-powered guided prompts to help plan woodworking projects. The platform is designed for plug-and-play addition of new tools via a dashboard interface.

## Commands

```bash
# Development
npm run dev              # Start dev server (Vite)
npm run build            # Production build
npm run preview          # Preview production build

# Type checking
npm run check            # Run svelte-check once
npm run check:watch      # Run svelte-check in watch mode

# Database
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio (database UI)
```

## Tech Stack

- **Framework**: SvelteKit 2.x with Svelte 5 (uses runes: `$props()`, `$state()`)
- **Styling**: Tailwind CSS v4 with @tailwindcss/vite plugin (CSS-first approach)
- **Database**: Drizzle ORM + LibSQL/Turso (SQLite - `file:local.db` for dev, Turso for prod)
- **AI**: Vercel AI SDK with multi-provider support (Anthropic/OpenAI, configurable via `AI_PROVIDER` env)
- **Deployment**: Serverless (Vercel/Cloudflare) via SvelteKit adapter-auto

## Architecture

### Source Structure
- `src/routes/` - SvelteKit file-based routing. Each tool gets its own route (e.g., `/bom`)
- `src/lib/components/` - Reusable Svelte components
- `src/lib/server/` - Backend utilities (AI provider config, database, schema)
  - `ai.ts` - AI provider selection, exports `getModel()` function
  - `db.ts` - Database connection initialization
  - `schema.ts` - Drizzle ORM schema definitions

### Key Patterns
- **Modular Tools**: Dashboard home displays tool cards; each tool is a separate route
- **AI Chat**: Streaming responses via `/api/chat` endpoint using Vercel AI SDK
- **System Prompts**: Set server-side in API routes (not client-side)
- **Message Handling**: Use `message.parts` for Vercel AI SDK v4 text extraction
- **Icons**: HTML entities preferred over Unicode emoji for encoding reliability
- **Color Theme**: Amber (`amber-700`, `amber-800`) for woodworking branding

### Environment Variables

Required in `.env` (see `.env.example`):
```
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
AI_PROVIDER=anthropic|openai  # Optional, defaults to anthropic
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

## Project Management

This project uses a GSD (Get Shit Done) methodology with structured planning documents in `.planning/`:

- `PROJECT.md` - Core project definition and requirements
- `ROADMAP.md` - Phase-based roadmap (6 phases)
- `STATE.md` - Current progress, velocity metrics, accumulated decisions
- `REQUIREMENTS.md` - Traceable requirements with v1/v2 scope
- `phases/` - Per-phase planning with PLAN.md files

**Current state**: Phase 3 of 6 (BOM Core Flow). Phases 1-2 complete (Foundation, AI Integration).

## Code Conventions

- Svelte 5 syntax: Use `$props()` for component props, `$state()` for reactive state
- TypeScript interfaces for all component props
- No external component library - pure Tailwind utilities
- Server-side logic in `$lib/server/` (auto-excluded from client bundles)
- Dynamic env imports: `import { env } from '$env/dynamic/private'` for optional config
