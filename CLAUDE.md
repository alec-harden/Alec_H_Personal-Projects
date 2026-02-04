# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WoodShop Toolbox is a modular web application for personal woodworking tools with multi-user support. Features include:
- **BOM Generator** (flagship) - AI-powered guided prompts for material list generation
- **Cut List Optimizer** - 1D (FFD) and 2D (Guillotine) algorithms for minimizing material waste

The platform is designed for plug-and-play addition of new tools via a dashboard interface.

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
- **Auth**: Custom auth with oslo utilities + Argon2; sessions stored in database
- **Email**: Resend API for transactional email (password reset, verification)
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
- **Auth**: Custom session management with SHA-256 hashed tokens, 1-hour expiry for resets
- **RBAC**: Binary admin/user roles; first registered user becomes admin
- **Optimistic UI**: Instant feedback for BOM edits (quantities, visibility)
- **Cascade Deletes**: user → projects → boms → items; cut lists follow same pattern
- **Drag-Drop**: svelte-dnd-action for cut assignment, native HTML5 for manual overrides
- **Navigation State**: Use SvelteKit `goto()` with state option for passing data between routes

### Environment Variables

Required in `.env` (see `.env.example`):
```
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
AI_PROVIDER=anthropic|openai  # Optional, defaults to anthropic
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=              # For password reset and email verification
```

## Project Management

This project uses a GSD (Get Shit Done) methodology with structured planning documents in `.planning/`:

- `PROJECT.md` - Core project definition and requirements
- `ROADMAP.md` - Phase-based roadmap (current milestone)
- `STATE.md` - Current progress, velocity metrics, accumulated decisions
- `milestones/` - Archived milestone roadmaps (v1.0, v2.0, v3.0)
- `phases/` - Per-phase planning with PLAN.md files

**Current state**: v3.0 shipped (2026-01-30). Between milestones - run `/gsd:new-milestone` to start v4.0.

**Milestone history**:
- v1.0 MVP (shipped 2026-01-23) - Dashboard, AI BOM generator, templates, CSV export
- v2.0 Persistence (shipped 2026-01-28) - Auth, projects, BOM persistence, admin panel
- v3.0 Multi-User & Cut Optimizer (shipped 2026-01-30) - RBAC, email flows, cut list optimizer

## Codebase Documentation

The `.planning/codebase/` directory contains detailed analysis files that document the codebase. These files should be kept current as the codebase evolves.

**Files:**
- `ARCHITECTURE.md` - Application layers, data flows, entry points, error handling patterns
- `STACK.md` - Technology stack, dependencies, environment variables
- `STRUCTURE.md` - Source directory organization and file purposes
- `CONVENTIONS.md` - Code conventions and established patterns
- `INTEGRATIONS.md` - External service integrations (AI, database, email)
- `CONCERNS.md` - Tech debt, known bugs, security considerations, performance bottlenecks
- `TESTING.md` - Testing approach and coverage gaps

**Maintenance:**
- Run `/gsd:map-codebase` to regenerate all files after significant architectural changes
- Update individual files manually when making focused changes (e.g., adding a new integration)
- Review `CONCERNS.md` when fixing bugs or addressing tech debt
- Keep `STACK.md` current when updating dependencies or adding new packages

## Code Conventions

- Svelte 5 syntax: Use `$props()` for component props, `$state()` for reactive state
- TypeScript interfaces for all component props
- No external component library - pure Tailwind utilities
- Server-side logic in `$lib/server/` (auto-excluded from client bundles)
- Dynamic env imports: `import { env } from '$env/dynamic/private'` for optional config
