# External Integrations

**Analysis Date:** 2026-02-03

## APIs & External Services

**Large Language Models (Pluggable):**
- Anthropic Claude API (default provider)
  - SDK: `@ai-sdk/anthropic` 3.0.16
  - Model: `claude-sonnet-4-20250514`
  - Auth: `ANTHROPIC_API_KEY` env var
  - Usage: BOM generation via `generateObject()` at `POST /api/bom/generate`

- OpenAI API (alternative provider)
  - SDK: `@ai-sdk/openai` 3.0.12
  - Model: `gpt-4o`
  - Auth: `OPENAI_API_KEY` env var
  - Usage: Same as Anthropic, selected via `AI_PROVIDER=openai` env var

**Email Service:**
- Resend
  - SDK: `resend` 6.9.1
  - Auth: `RESEND_API_KEY` env var
  - From address: `RESEND_FROM_EMAIL` env var (defaults to test domain `onboarding@resend.dev`)
  - Endpoints used:
    - Email verification: `POST /auth/verify-email` sends link via `sendVerificationEmail()`
    - Password reset: `POST /auth/forgot-password` sends link via `sendPasswordResetEmail()`
    - Link expiry: 24 hours (verification), 1 hour (password reset)

## Data Storage

**Databases:**
- LibSQL/Turso (SQLite compatible)
  - Provider: Turso cloud database or local SQLite file
  - Connection: `@libsql/client` 0.17.0
  - ORM: Drizzle ORM 0.45.1
  - URL config: `TURSO_DATABASE_URL` (format: `libsql://db.turso.io` or `file:local.db`)
  - Auth token: `TURSO_AUTH_TOKEN` env var (optional for local dev)
  - Schema location: `src/lib/server/schema.ts`
  - Migrations: Drizzle Kit via `npm run db:push`

**File Storage:**
- Local filesystem only (no cloud storage integration)
  - CSV export generated in-memory, sent as download headers
  - No S3, Cloud Storage, or CDN integration

**Caching:**
- None detected (in-memory only)
  - Session data stored in database tables, not cached

## Authentication & Identity

**Auth Provider:**
- Custom (OAuth-free, in-house implementation)
  - Implementation: Email/password with SHA-256 hashed tokens
  - Session management: `src/lib/server/auth.ts` exports functions:
    - `createSession()` - Creates 30-day session with httpOnly cookie
    - `deleteSession()` - Logs out user, deletes cookie
    - `verifyPassword()` - Argon2id verification
  - Token storage:
    - Sessions: `sessions` table with 30-day expiry
    - Password reset tokens: `password_reset_tokens` table (hashed with SHA-256), 1-hour expiry
    - Email verification tokens: `email_verification_tokens` table (hashed with SHA-256), 24-hour expiry
  - RBAC: Binary roles (`user`, `admin`); first registered user becomes admin
  - CORS: Not configured (SvelteKit-handled)

## Monitoring & Observability

**Error Tracking:**
- None detected
  - Errors logged to console only (`console.error()`)

**Logs:**
- Console-based logging
  - Auth errors: `src/lib/server/auth.ts`
  - BOM generation errors: `src/routes/api/bom/generate/+server.ts`
  - Email service errors: `src/lib/server/email.ts`
  - No external log aggregation (Sentry, Datadog, etc.)

## CI/CD & Deployment

**Hosting:**
- Serverless (auto-detected via SvelteKit adapter-auto)
- Compatible platforms: Vercel, Cloudflare Pages, AWS Lambda, Node.js servers
- Database: Turso cloud SQLite (or local for development)

**CI Pipeline:**
- None detected in codebase
  - Runs via npm scripts: `npm run build`, `npm run check`, `npm run check:watch`

## Environment Configuration

**Required env vars (production):**
- `TURSO_DATABASE_URL` - Database connection string
- `TURSO_AUTH_TOKEN` - Database auth token
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` - LLM provider key
- `RESEND_API_KEY` - Email service key
- `AI_PROVIDER` - Provider selection (`anthropic` or `openai`, defaults to `anthropic`)

**Optional env vars:**
- `RESEND_FROM_EMAIL` - Custom email sender address
- `PUBLIC_BASE_URL` - Base URL for email links (auto-detected from request in production)

**Secrets location:**
- `.env` file in project root (development)
- Platform environment variables (Vercel, Cloudflare, etc. for production)
- Imported via `$env/static/private` (critical) or `$env/dynamic/private` (optional)

## Webhooks & Callbacks

**Incoming:**
- None detected
  - No third-party webhook handlers (Stripe, GitHub, etc.)

**Outgoing:**
- Email callbacks: Resend handles delivery/bounce internally
  - No custom webhook subscriptions to Resend events

## Data Flow

**BOM Generation Flow:**
1. Client POST to `/api/bom/generate` with project details
2. Server fetches template from database
3. Server calls Anthropic/OpenAI via Vercel AI SDK's `generateObject()`
4. AI returns structured BOM JSON with Zod validation
5. Server returns JSON to client

**Authentication Flow:**
1. User signs up at `/auth/signup`: password hashed with Argon2id, stored in `users` table
2. Email verification token generated (SHA-256 hashed), sent via Resend
3. User clicks link, token validated, `emailVerified` flag set
4. Login creates session in `sessions` table, sets httpOnly cookie
5. Protected routes verify session via `requireAuth()` middleware in `+layout.server.ts`

**Password Reset Flow:**
1. User submits email at `/auth/forgot-password`
2. Password reset token generated (SHA-256 hashed), sent via Resend with 1-hour expiry
3. User clicks link, submits new password at `/auth/reset-password`
4. Token validated, password updated, all sessions invalidated (force re-login)

---

*Integration audit: 2026-02-03*
