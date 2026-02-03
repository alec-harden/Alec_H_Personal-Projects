# Codebase Structure

**Analysis Date:** 2026-02-03

## Directory Layout

```
project-root/
├── src/
│   ├── routes/                          # SvelteKit file-based routing (URL structure)
│   │   ├── +layout.svelte              # Root layout wrapper
│   │   ├── +layout.server.ts           # Root load - passes user data
│   │   ├── +page.svelte                # Home/dashboard (/)
│   │   ├── +page.server.ts             # Home load - fetch projects
│   │   ├── admin/                       # Admin panel (/admin/*)
│   │   │   ├── templates/              # Template management (/admin/templates)
│   │   │   │   ├── +page.svelte
│   │   │   │   ├── +page.server.ts
│   │   │   │   └── [id]/               # Template detail editor
│   │   │   └── users/                  # User management (/admin/users)
│   │   ├── api/                        # JSON API endpoints (no HTML rendering)
│   │   │   ├── bom/
│   │   │   │   ├── generate/           # POST - AI BOM generation
│   │   │   │   ├── save/               # POST - persist BOM to project
│   │   │   │   └── [id]/               # BOM detail endpoints
│   │   │   ├── cutlist/                # Cut optimization endpoints
│   │   │   │   ├── optimize/           # POST - run 1D/2D algorithm
│   │   │   │   └── save/               # POST - persist cut list
│   │   │   ├── templates/              # GET - list project templates
│   │   │   └── chat/                   # POST - streaming chat (placeholder)
│   │   ├── auth/                       # Authentication flows
│   │   │   ├── login/                  # POST login + GET login form
│   │   │   ├── signup/                 # POST signup + GET signup form
│   │   │   ├── logout/                 # POST logout
│   │   │   ├── forgot-password/        # Password reset request
│   │   │   ├── reset-password/         # Password reset completion
│   │   │   ├── verify-email/           # Email verification link
│   │   │   └── resend-verification/    # Resend email verification
│   │   ├── bom/
│   │   │   ├── new/                    # BOM generator UI (/bom/new)
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts     # Load user projects
│   │   │   └── [id]/                   # BOM view detail (nested in project)
│   │   ├── cutlist/                    # Cut list optimizer UI
│   │   │   ├── +page.svelte            # Main input form (/cutlist)
│   │   │   ├── from-bom/               # Create from existing BOM
│   │   │   ├── [id]/                   # Saved cut list detail
│   │   │   ├── results/                # Optimization results display
│   │   │   └── +page.server.ts
│   │   ├── cutlists/                   # Cut list list view (/cutlists)
│   │   ├── projects/                   # Project management
│   │   │   ├── +page.svelte            # Projects list view
│   │   │   ├── +page.server.ts         # Load user projects, create action
│   │   │   └── [id]/                   # Project detail page
│   │   │       ├── +page.svelte
│   │   │       ├── +page.server.ts     # Load BOMs, update/delete actions
│   │   │       └── bom/
│   │   │           └── [bomId]/        # BOM view within project
│   │   │               ├── +page.svelte
│   │   │               └── +page.server.ts
│   │   │
│   ├── lib/                            # Shared utilities and components (not routes)
│   │   ├── components/                 # Reusable Svelte components
│   │   │   ├── ToolCard.svelte         # Tool card display
│   │   │   ├── ProjectCard.svelte      # Project card in grid
│   │   │   ├── bom/                    # BOM-specific components
│   │   │   │   ├── BOMWizard.svelte    # 4-step wizard orchestrator
│   │   │   │   ├── ProjectTypeStep.svelte
│   │   │   │   ├── DimensionsStep.svelte
│   │   │   │   ├── JoineryStep.svelte
│   │   │   │   ├── MaterialsStep.svelte
│   │   │   │   ├── WizardProgress.svelte
│   │   │   │   ├── BOMDisplay.svelte   # Read-only BOM viewer
│   │   │   │   ├── BOMCategory.svelte  # Category section
│   │   │   │   ├── BOMItem.svelte      # Item row with edit
│   │   │   │   ├── AddItemForm.svelte  # Add new item form
│   │   │   │   ├── CSVUpload.svelte    # CSV import
│   │   │   │   └── SaveToProjectModal.svelte
│   │   │   ├── cutlist/                # Cut list specific components
│   │   │   │   ├── CutInputForm.svelte # Enter cuts
│   │   │   │   ├── StockInputForm.svelte
│   │   │   │   ├── KerfConfig.svelte   # Blade width selector
│   │   │   │   ├── BomSelector.svelte  # Select BOM to create from
│   │   │   │   └── CutResultsDisplay.svelte
│   │   │   └── auth/                   # Auth-specific components
│   │   │       └── [form components]
│   │   │
│   │   ├── server/                     # Backend-only utilities (excluded from client bundle)
│   │   │   ├── db.ts                   # Drizzle ORM setup
│   │   │   ├── schema.ts               # Drizzle table & relation definitions
│   │   │   ├── ai.ts                   # AI provider selector (Anthropic/OpenAI)
│   │   │   ├── auth.ts                 # Session, password hashing, auth helpers
│   │   │   ├── cutOptimizer.ts         # 1D & 2D bin packing algorithms
│   │   │   ├── email.ts                # Resend transactional email
│   │   │   └── schemas/                # Zod validation schemas
│   │   │       └── bom-schema.ts       # Zod schema for BOM generation output
│   │   │
│   │   ├── types/                      # Shared TypeScript interfaces
│   │   │   ├── bom.ts                  # BOMItem, BOM, ProjectDetails
│   │   │   └── cutlist.ts              # Cut, Stock, CutListMode
│   │   │
│   │   ├── utils/                      # Shared utility functions
│   │   │   ├── board-feet.ts           # Lumber dimension conversions
│   │   │   ├── csv.ts                  # CSV parsing/generation
│   │   │   └── csv-import.ts           # CSV → BOM transformation
│   │   │
│   │   ├── data/                       # Static data
│   │   │   └── templates.ts            # Project templates in-memory or seed
│   │   │
│   │   ├── assets/                     # Static images/fonts (if any)
│   │   │
│   │   └── index.ts                    # Barrel export (empty in this project)
│   │
│   ├── app.css                         # Global styles (Tailwind directives)
│   ├── app.d.ts                        # Global type definitions (App namespace)
│   └── hooks.server.ts                 # SvelteKit server hooks (auth middleware)
│
├── .planning/                          # GSD planning documents
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   ├── STATE.md
│   ├── milestones/
│   └── phases/
│
├── drizzle.config.ts                   # Drizzle ORM config (migrations)
├── svelte.config.js                    # SvelteKit config
├── vite.config.ts                      # Vite build config
├── tsconfig.json                       # TypeScript config
├── package.json                        # Dependencies, scripts
├── .env.example                        # Env var template
└── local.db                            # SQLite database (development only)
```

## Directory Purposes

**src/routes/:**
- Purpose: File-based routing - each file/folder becomes a URL path
- Contains: Page components (+page.svelte), server load/action functions (+page.server.ts), API endpoints (+server.ts)
- Pattern: URL structure mirrors folder structure (e.g., `/projects/[id]` → `src/routes/projects/[id]`)

**src/routes/api/:**
- Purpose: JSON API endpoints (no HTML rendering)
- Contains: +server.ts files with POST/PATCH/DELETE handlers
- Pattern: Each +server.ts exports RequestHandler functions (POST, GET, PATCH, DELETE)

**src/routes/auth/:**
- Purpose: Authentication flows (signup, login, password reset, email verification)
- Contains: Page components for forms + server actions to handle form submission
- Pattern: Each route has +page.svelte (form) and +page.server.ts (validation + DB operation)

**src/routes/admin/:**
- Purpose: Admin-only management pages (templates, users)
- Contains: Tables, forms for CRUD operations
- Pattern: Access checked by `locals.user.role === 'admin'` in load() functions

**src/lib/server/:**
- Purpose: Backend logic shared across routes and API endpoints
- Access: Server-only (auto-excluded from client bundles by SvelteKit)
- Pattern: Imported with `$lib/server/` alias; exported functions and singletons (db connection)

**src/lib/components/:**
- Purpose: Reusable Svelte components (presentational logic only)
- Pattern: Subdirectories by feature (bom/, cutlist/, auth/) for organization
- Usage: Imported in +page.svelte files

**src/lib/types/:**
- Purpose: TypeScript interfaces shared between client and server
- Pattern: No dependencies on `$lib/server/` (purely type definitions)
- Usage: Imported in components, API endpoints, and actions

**src/lib/utils/:**
- Purpose: Pure utility functions (conversions, transformations)
- Pattern: No side effects, no external dependencies
- Usage: Board feet calculations, CSV parsing, etc.

## Key File Locations

**Entry Points:**
- `src/routes/+layout.svelte` - Root Svelte layout wrapper
- `src/routes/+layout.server.ts` - Load user from session, pass to all pages
- `src/routes/+page.svelte` - Home/dashboard
- `src/hooks.server.ts` - Middleware to validate session on each request

**Configuration:**
- `svelte.config.js` - SvelteKit config (adapter-auto for serverless)
- `vite.config.ts` - Vite bundler config
- `tsconfig.json` - TypeScript strictness settings
- `drizzle.config.ts` - Database migrations path

**Core Logic:**
- `src/lib/server/db.ts` - Database connection (Drizzle + LibSQL)
- `src/lib/server/schema.ts` - All table definitions and relations
- `src/lib/server/ai.ts` - AI model selection
- `src/lib/server/auth.ts` - Auth helpers (password hash, session creation)
- `src/lib/server/cutOptimizer.ts` - Optimization algorithms

**Testing:**
- Not detected - no test files found

**BOM Workflow:**
- `src/routes/bom/new/+page.svelte` - BOM generator UI
- `src/lib/components/bom/BOMWizard.svelte` - 4-step wizard
- `src/routes/api/bom/generate/+server.ts` - AI generation endpoint
- `src/routes/api/bom/save/+server.ts` - Persistence endpoint
- `src/routes/projects/[id]/bom/[bomId]/+page.svelte` - BOM detail view

**Cut List Workflow:**
- `src/routes/cutlist/+page.svelte` - Cut list input form
- `src/lib/components/cutlist/CutInputForm.svelte` - Cut entry UI
- `src/routes/api/cutlist/optimize/+server.ts` - Optimization endpoint
- `src/routes/cutlist/results/+page.svelte` - Results display

## Naming Conventions

**Files:**
- Routes: `+page.svelte` (pages), `+page.server.ts` (server load/actions), `+server.ts` (API)
- Components: PascalCase.svelte (e.g., BOMWizard.svelte, ToolCard.svelte)
- Utilities: camelCase.ts (e.g., board-feet.ts, csv-import.ts)
- Types: camelCase.ts (e.g., bom.ts, cutlist.ts)

**Directories:**
- Feature folders: lowercase with hyphens (e.g., bom/, cutlist/, cut-optimizer/)
- Nested routes: [brackets] for dynamic segments (e.g., [id], [bomId])
- Server-only: Explicitly named `server/` folder

**Type Names:**
- Interfaces: PascalCase (e.g., BOMItem, ProjectTemplate, Cut)
- Type aliases: PascalCase (e.g., BOMCategory = 'lumber' | 'hardware' | ...)
- Enum values: SCREAMING_SNAKE_CASE in comments, but uses string literal unions in code

**Function Names:**
- Async API handlers: export const POST/GET/PATCH/DELETE
- Auth helpers: camelCase (e.g., hashPassword, verifyPassword, createSession)
- Utilities: camelCase (e.g., optimizeCuts1D, convertBoardFeet)
- Svelte callbacks: on[Event] (e.g., onComplete, onSelect)

**Variables:**
- Svelte $state: camelCase (e.g., currentStep, projectDetails, templatesLoading)
- Svelte $props: camelCase (e.g., onComplete, title, description)
- Component let bindings: camelCase (e.g., let selectedTemplate, let projects)
- Constants: SCREAMING_SNAKE_CASE (e.g., ARGON2_OPTIONS, KERF_PRESETS)

## Where to Add New Code

**New Feature (e.g., Wood Movement Calculator):**
- Primary code: `src/routes/feature-name/+page.svelte` + `src/routes/feature-name/+page.server.ts`
- Components: `src/lib/components/feature-name/FeatureName.svelte`
- API endpoints: `src/routes/api/feature-name/operation/+server.ts`
- Types: Add to `src/lib/types/feature-name.ts` or create new file
- Tests: Would go in `src/routes/feature-name/feature-name.test.ts` or similar (pattern not yet established)

**New Component (e.g., Feedback Form):**
- Implementation: `src/lib/components/FeedbackForm.svelte`
- Co-located styling: Use <style> block in .svelte (Tailwind utility classes preferred)
- Props interface: Define in component script (TypeScript `interface Props`)
- Usage: Import in any page that needs it

**Utilities (e.g., Unit Conversion):**
- Shared helpers: `src/lib/utils/[feature].ts`
- Pure functions: No side effects, testable
- Export named functions for tree-shaking

**Database Changes:**
- Schema: Edit `src/lib/server/schema.ts` (add table or relation)
- Migration: Run `npm run db:push` to apply changes
- Relations: Add Drizzle relations() definitions in same file

**New API Endpoint:**
1. Create folder: `src/routes/api/[resource]/[operation]/`
2. Add `+server.ts`: Export POST/PATCH/DELETE handler
3. Validate request body (type check, required fields)
4. Check auth: `if (!locals.user) return json({ error: ... }, { status: 401 })`
5. Check ownership: Load resource, verify `resource.userId === locals.user.id`
6. Use transaction for multi-table writes: `db.transaction(async (tx) => { ... })`
7. Return json() with result or error

## Special Directories

**src/lib/server/:*
- Purpose: Backend code (excluded from client bundle)
- Generated: No
- Committed: Yes
- Note: Imports here never leak to client; SvelteKit enforces this

**.svelte-kit/:*
- Purpose: Generated SvelteKit build artifacts
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**local.db:**
- Purpose: SQLite database file (development)
- Generated: Yes (by `npm run db:push`)
- Committed: No (in .gitignore)
- Production: Uses Turso (cloud SQLite)

**node_modules/:*
- Purpose: Installed dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in .gitignore)

