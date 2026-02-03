# Architecture

**Analysis Date:** 2026-02-03

## Pattern Overview

**Overall:** Modular SvelteKit full-stack with layered separation - routes (UI), API (backend), server utilities (DB/AI/Auth), and shared types.

**Key Characteristics:**
- File-based routing with SvelteKit +layout.ts/+server.ts conventions
- Server-side logic isolated in `$lib/server/` (auto-excluded from client bundles)
- API-first endpoints for all data operations
- Type-safe with TypeScript and shared interfaces
- Session-based authentication with database persistence
- Drizzle ORM for type-safe database access with relations

## Layers

**Presentation Layer (Routes/Components):**
- Purpose: Render Svelte 5 UIs with reactive state, handle form submission and client-side state
- Location: `src/routes/` and `src/lib/components/`
- Contains: Page components (+page.svelte), layout wrappers, reusable UI components (BOM wizard, cut list forms)
- Depends on: API endpoints, shared types, components
- Used by: Browser (rendered HTML/CSS/JS)

**API Layer (Server Handlers):**
- Purpose: Expose JSON endpoints for data mutation, AI generation, optimization
- Location: `src/routes/api/` (+server.ts files)
- Contains: POST/PATCH/DELETE handlers with validation, transaction logic
- Depends on: Server utilities (db, ai, auth), schema, types
- Used by: Client-side fetch(), form actions

**Server Utilities Layer:**
- Purpose: Core backend logic shared across routes and API endpoints
- Location: `src/lib/server/`
- Contains:
  - `db.ts` - Database connection (Drizzle + LibSQL/Turso)
  - `schema.ts` - Drizzle ORM table definitions and relations
  - `ai.ts` - AI provider selection (Anthropic/OpenAI via Vercel AI SDK)
  - `auth.ts` - Password hashing (Argon2), session management, ownership checks
  - `cutOptimizer.ts` - 1D/2D bin packing algorithms
  - `email.ts` - Transactional email via Resend API
- Depends on: External SDKs (Drizzle, Vercel AI, Argon2, Resend)
- Used by: Routes, API endpoints

**Type Layer:**
- Purpose: Shared interfaces across client and server
- Location: `src/lib/types/`
- Contains: BOMItem, BOM, ProjectDetails, Cut, Stock, etc.
- Used by: All layers

**Middleware Layer:**
- Purpose: Request-wide concerns (authentication, session validation)
- Location: `src/hooks.server.ts`
- Validates session tokens, attaches user to event.locals, handles expired/disabled accounts

## Data Flow

**BOM Generation Flow:**

1. User visits `/bom/new` (page load)
2. Fetch `/api/templates` → loads ProjectTemplate[] from database
3. User fills BOMWizard (4 steps: template, dimensions, joinery, materials)
4. On complete, POST `/api/bom/generate` with ProjectDetails
5. API calls `generateObject()` (Vercel AI SDK) with prompt + Zod schema
6. Returns generated BOM with items
7. User clicks "Save Project" → POST `/api/bom/save` with projectId + BOM
8. API validates projectId ownership (userId check), inserts bom + bomItems via transaction
9. Redirect to project page with list of saved BOMs

**Project Persistence:**

1. User creates project → POST `/projects` (create action)
2. Inserts into projects table with userId ownership
3. User generates BOM and saves to project
4. Each BOM is linked: bom.projectId → project.id → project.userId
5. Cascade deletes: user → projects → boms → bomItems

**Cut List Optimization Flow:**

1. User navigates to `/cutlist` or `/cutlist/from-bom`
2. User enters cuts (pieces needed) and stock (available material)
3. User selects mode (linear/sheet) and kerf (blade width)
4. On optimize, POST `/api/cutlist/optimize` with cuts[], stock[], mode, kerf
5. API calls `optimizeCuts1D()` or `optimizeCuts2D()` (greedy FFD algorithm)
6. Returns StockPlan[] with cut assignments and waste calculations
7. User can save cut list → POST `/api/cutlist/save` with cuts and stock
8. Saved cut list linked to project and user

**Authentication Flow:**

1. User submits login form → POST action in `src/routes/auth/login/+page.server.ts`
2. Look up user by email, verify password with Argon2
3. Create session via `createSession()` → inserts into sessions table, sets httpOnly cookie
4. On next request, `src/hooks.server.ts` validates session token
5. Session attached to `event.locals.user`
6. Routes check `locals.user` for auth guard; redirect to login if missing

**State Management:**

- Server state: Database (Drizzle ORM, SQLite)
- Session state: sessions table (persistent across page reloads)
- Client state: Svelte 5 runes ($state, $props) in components
- Form state: SvelteKit form actions (POST with progressive enhancement)

## Key Abstractions

**ProjectTemplate:**
- Purpose: Reusable woodworking project blueprints with joinery options, dimensions, hardware
- Examples: `src/lib/data/templates.ts` (in-memory), `src/lib/server/schema.ts` (templates table)
- Pattern: Fetched from API `/api/templates`, passed through wizard steps

**BOM (Bill of Materials):**
- Purpose: Hierarchical list of materials organized by category (lumber, hardware, finishes, consumables)
- Examples: `src/lib/types/bom.ts` (TypeScript interface), generated by `/api/bom/generate`
- Pattern: Generated by AI, stored as bom + bomItems records (one-to-many)

**Cut & Stock:**
- Purpose: Optimize material cutting by matching cuts needed to stock available
- Examples: `src/lib/types/cutlist.ts` (Cut, Stock interfaces), `src/lib/server/cutOptimizer.ts` (algorithms)
- Pattern: User input lists → optimization algorithm → StockPlan[] with assignments

**User/Project Ownership:**
- Purpose: Multi-user isolation - all data filtered by userId
- Examples: `src/routes/projects/[id]/+page.server.ts` (dual check: id AND userId)
- Pattern: Every data-bearing table has userId foreign key; queries use `and(eq(id, ...), eq(userId, ...))`

## Entry Points

**Web Application (SvelteKit):**
- Location: `src/routes/+layout.svelte` (root layout)
- Triggers: HTTP request to any route
- Responsibilities: Load user from session, render page structure, nav, auth flows

**Home/Dashboard:**
- Location: `src/routes/+page.svelte` and `+page.server.ts`
- Triggers: GET `/`
- Responsibilities: Show hero, tool cards (BOM Generator, Cut List Optimizer), projects list (if authenticated)

**BOM Generator Tool:**
- Location: `src/routes/bom/new/+page.svelte`
- Triggers: GET `/bom/new`
- Responsibilities: Host BOMWizard component, orchestrate 4-step flow

**Cut List Optimizer Tool:**
- Location: `src/routes/cutlist/+page.svelte`
- Triggers: GET `/cutlist`
- Responsibilities: Host cut/stock input forms, call optimize API, display results

**Admin Panel:**
- Location: `src/routes/admin/templates/+page.svelte`, `src/routes/admin/users/+page.svelte`
- Triggers: GET `/admin/*`
- Responsibilities: Manage project templates, disable/enable users (admin-only)

**API Entry Points:**
- `/api/bom/generate` - POST with ProjectDetails → returns generated BOM
- `/api/bom/save` - POST with projectId + BOM → persists to database
- `/api/cutlist/optimize` - POST with cuts/stock → returns optimization result
- `/api/templates` - GET → returns all project templates
- `/api/auth/*` - POST for signup/login/password reset

## Error Handling

**Strategy:** Try-catch in API endpoints, form validation in page actions, error boundaries in components.

**Patterns:**

- **API Errors:** Return JSON with `{ error: string, status: number }` (e.g., 400 for validation, 401 for auth, 403 for ownership, 500 for server)
  - Example: `src/routes/api/bom/generate/+server.ts` (timeout/rate-limit/network detection)
- **Auth Errors:** Redirect to login with `?redirect=` param (e.g., `src/routes/auth/login/+page.server.ts`)
- **Ownership Errors:** 404 if not found OR 403 if found but not owned by user (security - don't leak existence)
  - Example: `src/routes/projects/[id]/+page.server.ts` uses `and(eq(id, ...), eq(userId, ...))` to fail silently
- **Form Validation:** Return `fail(400, { error, fieldValue })` to re-render with error display (SvelteKit pattern)
  - Example: `src/routes/auth/signup/+page.server.ts` validates email/password
- **AI Generation:** Timeout/rate-limit/API key specific messages to guide user retry

## Cross-Cutting Concerns

**Logging:** Console.error in try-catch blocks; no structured logging library configured.

**Validation:**
- Form fields: Checked in page actions before DB write
- API inputs: Validated in +server.ts (required fields, type checks, array validation)
- Database: Drizzle schema enforces types, FK constraints, NOT NULL
- Type safety: TypeScript interfaces ensure shape consistency

**Authentication:**
- Session tokens: cryptographically random UUID, stored hashed in sessions table (session.token), 30-day expiry
- Password hashing: Argon2id (OWASP recommended), 19 MiB memory, 2 iterations
- Account disabling: Check `user.disabled` in middleware; if true, invalidate session
- Email verification: Optional flow via emailVerificationTokens table (hash-based, 24-hour expiry)

**Authorization (RBAC):**
- Binary roles: user, admin (enum in users.role)
- Data isolation: All queries filter by userId (no row-level security in DB, enforced in app code)
- Admin features: `/admin/*` routes check `locals.user.role === 'admin'` (first registered user becomes admin)
- Ownership verification: Before any mutation, verify resource.userId === locals.user.id

**Performance:**
- Database indexing: Primary keys on id, foreign key on userId (not explicitly shown in schema but assumed)
- Lazy loading: Templates fetched on-demand via `/api/templates`, not pre-bundled
- Transactions: BOM save uses `db.transaction()` to atomically insert bom + bomItems
- Client-side caching: Wizard state held in $state(), no page reload needed until save

**Accessibility:**
- HTML semantics: Form, button, aria labels in components (not fully audited)
- Keyboard navigation: SvelteKit form submission works without JS (progressive enhancement)
- Color contrast: Amber/walnut theme checked (assumed per CLAUDE.md "amber-700, amber-800")

