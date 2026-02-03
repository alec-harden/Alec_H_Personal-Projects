# Technology Stack

**Analysis Date:** 2026-02-03

## Languages

**Primary:**
- TypeScript 5.9.3 - Full codebase (frontend and backend)
- Svelte 5.45.6 - UI components using Svelte 5 runes (`$props()`, `$state()`)
- JavaScript (module type: ESM) - Configuration files

**Secondary:**
- CSS - Styling via Tailwind CSS (no hand-written CSS)
- SQL - SQLite dialect via Drizzle ORM

## Runtime

**Environment:**
- Node.js (version not pinned, no .nvmrc or .node-version file)

**Package Manager:**
- npm - `package.json` present
- Lockfile: `package-lock.json` (committed)

## Frameworks

**Core:**
- SvelteKit 2.49.1 - Full-stack framework with file-based routing
  - Adapter: `@sveltejs/adapter-auto` 7.0.0 - Auto-detects deployment target (serverless/edge/node)
  - Preprocessing: Vite plugin for Svelte 5 support

**Styling:**
- Tailwind CSS 4.1.18 - Utility-first CSS framework
  - Plugin: `@tailwindcss/vite` 4.1.18 - Vite integration for CSS-first approach
  - PostCSS 8.5.6 - CSS processing
  - Autoprefixer 10.4.23 - Browser prefix handling

**Build & Dev:**
- Vite 7.2.6 - Build tool and dev server
  - `@sveltejs/vite-plugin-svelte` 6.2.1 - Svelte integration
- Drizzle Kit 0.31.8 - ORM tooling for schema management and migrations
- svelte-check 4.3.4 - TypeScript checking for Svelte components
- dotenv 17.2.3 - Environment variable loading

## Key Dependencies

**Critical:**
- `ai` 6.0.42 (Vercel AI SDK) - Streaming LLM responses, structured generation via `generateObject()` and provider APIs
- `drizzle-orm` 0.45.1 - Type-safe ORM for SQLite with schema relations
- `@ai-sdk/anthropic` 3.0.16 - Anthropic Claude provider for Vercel AI SDK
- `@ai-sdk/openai` 3.0.12 - OpenAI provider for Vercel AI SDK (fallback)
- `@libsql/client` 0.17.0 - SQLite client for Turso (cloud SQLite) with local file support

**Security & Auth:**
- `@node-rs/argon2` 2.0.2 - Argon2id password hashing (OWASP recommended)
- `oslo` 1.2.1 - Auth utilities for token generation and session handling

**Data & Validation:**
- `zod` 4.3.5 - Runtime schema validation for BOM generation and type safety
- `papaparse` 5.5.3 - CSV parsing/export for BOM and cut list data

**Email:**
- `resend` 6.9.1 - Transactional email service for password reset and email verification

## Configuration

**Environment:**
- `.env` file with required variables (see below)
- Dynamic imports: `$env/dynamic/private` for optional config (AI provider selection)
- Static imports: `$env/static/private` for critical secrets (database credentials)

**TypeScript:**
- `tsconfig.json` with strict mode enabled
- Source maps enabled for debugging
- Module resolution: bundler (Vite-based)
- Type checking: `svelte-check` with watch mode support

**Build Configuration:**
- `vite.config.ts` - Integrates Tailwind CSS and SvelteKit plugins
- `svelte.config.js` - Configures preprocessing with Vite plugin and adapter-auto

**Database:**
- `drizzle.config.ts` - SQLite dialect, schema location, migrations output directory

## Required Environment Variables

**Database:**
- `TURSO_DATABASE_URL` - Turso database URL or local file path (`file:local.db` for development)
- `TURSO_AUTH_TOKEN` - Authentication token for Turso (optional for local dev)

**AI Provider:**
- `AI_PROVIDER` - One of `anthropic` or `openai` (defaults to `anthropic`)
- `ANTHROPIC_API_KEY` - Claude API key (required if using Anthropic)
- `OPENAI_API_KEY` - OpenAI API key (required if using OpenAI)

**Email:**
- `RESEND_API_KEY` - Resend email service API key (required for password reset and verification)
- `RESEND_FROM_EMAIL` - Optional sender address (defaults to Resend test domain `onboarding@resend.dev`)

**Optional:**
- `PUBLIC_BASE_URL` - Base URL for email links (defaults to `http://localhost:5173`)

## Platform Requirements

**Development:**
- Node.js with npm
- Local SQLite database (`local.db` in project root)
- API keys for Anthropic or OpenAI
- API key for Resend (email)

**Production:**
- Serverless runtime: Vercel, Cloudflare Pages, or similar (via adapter-auto)
- Turso cloud database or compatible LibSQL endpoint
- Same API keys as development (via environment variables)

## Key Decisions

1. **Multi-provider AI:** Vercel AI SDK abstracts provider selection; switch via `AI_PROVIDER` env var
2. **SQLite + Drizzle:** Type-safe, relational data model with cascade deletes for data integrity
3. **No component library:** Pure Tailwind CSS utilities (faster builds, smaller bundle)
4. **Database connections:** LibSQL client connects to both Turso (cloud) and local SQLite files
5. **TypeScript strict mode:** All code type-checked; no implicit `any`
6. **Argon2id hashing:** OWASP-recommended algorithm for password storage with high memory cost

---

*Stack analysis: 2026-02-03*
