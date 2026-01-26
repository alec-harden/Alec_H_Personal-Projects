# Pitfalls Research: v2.0 Features

**Project:** WoodShop Toolbox v2.0
**Researched:** 2026-01-26
**Context:** Adding auth, persistence, and admin to EXISTING working MVP
**Confidence:** MEDIUM (based on training knowledge, SvelteKit patterns, and codebase analysis)

## Critical Integration Warning

This research focuses on pitfalls when **adding** auth and persistence to an **existing** SvelteKit application. The challenges are different from greenfield projects because:

- Existing routes must continue working during migration
- Current BOM wizard flow (4 steps) cannot break
- Database already exists with minimal schema (projects table only)
- No auth currently means all routes are public
- Templates hardcoded in code need migration to database without data loss

---

## Authentication Pitfalls

### Pitfall 1: Breaking Existing Routes with Auth Guards

**What goes wrong:** Adding authentication hooks that protect all routes by default breaks the current working BOM wizard. Users suddenly can't access `/bom/new` without logging in, but there's no login page yet.

**Warning signs:**
- `hooks.server.ts` with blanket redirect logic (`if (!session) redirect('/login')`)
- All routes require auth by default (opt-out instead of opt-in)
- Testing only authenticated flows, not unauthenticated fallback

**Prevention:**
- **Phase 1 (Auth Infrastructure):** Build auth system but don't enforce it on existing routes yet
- Use explicit route-level protection via `+page.server.ts` load functions, not global hooks
- Create allowlist of public routes: `/`, `/bom/*` (wizard), `/api/chat` (used by wizard)
- Add auth gradually: first make login available, then protect new features (history, admin), finally protect BOM creation
- Test unauthenticated access to existing routes after each auth change

**Phase to address:** Phase 1 (Auth Infrastructure) - build but don't enforce globally; Phase 3 (Protected Routes) - enforce selectively

**Code pattern to avoid:**
```typescript
// hooks.server.ts - DON'T DO THIS
export async function handle({ event, resolve }) {
  const session = await getSession(event);
  if (!session) {
    throw redirect(303, '/login'); // Breaks everything!
  }
  return resolve(event);
}
```

**Code pattern to use:**
```typescript
// routes/admin/+page.server.ts - Explicit protection
export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  // Protected content
}
```

---

### Pitfall 2: Session Data Not Available in Locals

**What goes wrong:** `hooks.server.ts` sets `event.locals.user`, but downstream routes/endpoints don't see it. This happens when hook order is wrong or locals typing is missing.

**Warning signs:**
- `locals.user` is `undefined` in `+page.server.ts` but session cookie exists
- TypeScript errors about `locals.user` not existing on type
- Having to re-fetch session in every route instead of using `locals`

**Prevention:**
- Define `locals` type in `src/app.d.ts` FIRST, before writing hooks
- Set `event.locals.user` early in `handle` hook (before any other logic)
- Use `event.locals.user` consistently (not `event.cookies.get('session')` directly)
- Test locals availability in both SSR load functions and API routes

**Phase to address:** Phase 1 (Auth Infrastructure) - type definitions and hook setup

**Required setup:**
```typescript
// src/app.d.ts
declare global {
  namespace App {
    interface Locals {
      user: { id: string; email: string } | null;
    }
  }
}
```

---

### Pitfall 3: Auth State Not Reactive in Client

**What goes wrong:** User logs in successfully, but UI still shows "Login" button until page refresh. Client components don't know about server-side session changes.

**Warning signs:**
- Login works but navigation bar doesn't update
- Need to manually refresh page after login/logout
- Checking `$page.data.user` but it's stale

**Prevention:**
- Use `invalidateAll()` after login/logout actions to trigger fresh load
- Pass user from root `+layout.server.ts` load function (available to all pages)
- Client components read from `$page.data.user` (reactive to load data changes)
- Don't store auth state in client-only `$state()` runes

**Phase to address:** Phase 1 (Auth Infrastructure) - reactive auth state pattern

**Pattern:**
```typescript
// routes/+layout.server.ts
export async function load({ locals }) {
  return {
    user: locals.user // Available to all descendant routes
  };
}

// routes/login/+page.server.ts (action)
export const actions = {
  login: async ({ cookies, request }) => {
    // ... login logic
    return { success: true };
  }
};

// routes/login/+page.svelte
import { invalidateAll } from '$app/navigation';
import { enhance } from '$app/forms';

// After successful login
use:enhance={() => {
  return async ({ result }) => {
    if (result.type === 'success') {
      await invalidateAll(); // Triggers all load functions
      goto('/');
    }
  };
}}
```

---

## Database Migration Pitfalls

### Pitfall 4: Drizzle Schema Changes Without Migration Files

**What goes wrong:** Changing `schema.ts` (adding columns, tables) and running `drizzle-kit push` directly to production loses data or causes constraint violations. Drizzle push is for development; production needs migrations.

**Warning signs:**
- Using `npm run db:push` in production deployments
- No `drizzle/migrations/` folder in repository
- Schema changes applied without SQL migration review
- Adding `NOT NULL` columns to existing tables without defaults

**Prevention:**
- **Development:** Use `drizzle-kit push` for rapid iteration (local.db only)
- **Production:** Use `drizzle-kit generate` → review SQL → `drizzle-kit migrate`
- Never add `NOT NULL` columns without `DEFAULT` or backfill strategy
- Test migrations on a copy of production data before applying
- Version control migration files (commit to git)

**Phase to address:** Phase 2 (Database Schema) - establish migration workflow before production changes

**Migration workflow:**
```bash
# Development (local.db) - OK to push
npm run db:push

# Production (Turso) - MUST generate migrations
drizzle-kit generate:sqlite  # Creates SQL in drizzle/migrations/
# Review SQL file manually
drizzle-kit migrate          # Applies migration to Turso
```

**Schema change pattern (safe):**
```typescript
// Adding column to existing table - provide default
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  userId: text('user_id').default('single-user'), // Safe: has default
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
```

---

### Pitfall 5: Foreign Key Violations from Template Migration

**What goes wrong:** Migrating templates from hardcoded TypeScript to database, but existing BOMs reference template IDs that don't exist in DB yet. Foreign key constraints fail.

**Warning signs:**
- `FOREIGN KEY constraint failed` errors when saving BOMs
- Template IDs in code (e.g., "table", "cabinet") don't match database primary keys
- No seed script to populate templates table before enabling FK constraints

**Prevention:**
- Migration order: (1) Create templates table, (2) Seed with hardcoded templates, (3) Add FK constraints, (4) Update code to read from DB
- Use same IDs in database as in code (text PK: "table", "cabinet" - not auto-increment)
- Write seed script that's idempotent (can run multiple times safely)
- Test on empty database AND database with existing projects

**Phase to address:** Phase 2 (Database Schema) - template migration strategy; Phase 4 (Admin Panel) - template seeding

**Safe migration pattern:**
```typescript
// schema.ts - Use text IDs matching code
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(), // "table", "cabinet", etc.
  name: text('name').notNull(),
  // ... template data
});

export const boms = sqliteTable('boms', {
  id: text('id').primaryKey(),
  templateId: text('template_id').references(() => templates.id),
  // ... other fields
});

// seed.ts - Idempotent seeding
const defaultTemplates = [
  { id: 'table', name: 'Table', /* ... */ },
  { id: 'cabinet', name: 'Cabinet', /* ... */ }
];

for (const template of defaultTemplates) {
  await db.insert(templates)
    .values(template)
    .onConflictDoNothing(); // Idempotent
}
```

---

### Pitfall 6: SQLite Concurrency Issues with Turso

**What goes wrong:** Multiple requests try to write to SQLite simultaneously. With local `file:local.db`, this can cause `SQLITE_BUSY` errors. Turso handles this, but local dev might not.

**Warning signs:**
- `database is locked` errors in development
- Writes fail intermittently under load
- Different behavior between local dev and Turso production

**Prevention:**
- Accept that local `file:local.db` has different concurrency than Turso
- For local dev with heavy writes: use Turso dev database (not file:local.db)
- Set busy timeout in database connection config
- Design writes to be retryable (idempotent operations)
- Avoid long transactions that hold locks

**Phase to address:** Phase 1 (Auth Infrastructure) - database connection config

**Connection config:**
```typescript
// lib/server/db.ts
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const client = createClient({
  url: env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: env.TURSO_AUTH_TOKEN,
  // For local dev only
  ...(env.TURSO_DATABASE_URL ? {} : {
    // SQLite busy timeout (milliseconds)
    // Note: libsql client may not support this directly
  })
});

export const db = drizzle(client);
```

---

## Session Management Pitfalls

### Pitfall 7: Session Invalidation Race Condition

**What goes wrong:** User logs out, session is deleted from database, but cookie still exists. A concurrent request uses the stale cookie and fails with "session not found" error.

**Warning signs:**
- Logout sometimes shows errors instead of redirecting cleanly
- Race condition between cookie deletion and session DB deletion
- Client makes request with old session cookie after logout

**Prevention:**
- Delete session from DB first, then delete cookie (order matters)
- Set cookie with `maxAge: 0` to ensure browser deletion
- Use `throw redirect()` in logout action (prevents further processing)
- Handle "session not found" gracefully in hooks (treat as logged out)

**Phase to address:** Phase 1 (Auth Infrastructure) - logout action implementation

**Safe logout pattern:**
```typescript
// routes/logout/+server.ts or action
export async function POST({ cookies, locals }) {
  if (locals.user?.sessionId) {
    // 1. Delete from database first
    await db.delete(sessions)
      .where(eq(sessions.id, locals.user.sessionId));
  }

  // 2. Then delete cookie
  cookies.delete('session', { path: '/' });

  // 3. Redirect (prevents race with other requests)
  throw redirect(303, '/');
}

// hooks.server.ts - handle missing session gracefully
const sessionId = event.cookies.get('session');
if (sessionId) {
  const session = await db.select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get();

  if (!session) {
    // Session deleted - clean up cookie
    event.cookies.delete('session', { path: '/' });
    event.locals.user = null;
  }
}
```

---

### Pitfall 8: Session Expiry Not Enforced

**What goes wrong:** Sessions stored with `expiresAt` timestamp, but hooks don't check it. Users stay logged in forever, even with "expired" sessions in database.

**Warning signs:**
- Sessions table has `expires_at` column but it's never checked
- Users logged in for weeks despite 7-day session policy
- Dead sessions accumulate in database (never cleaned up)

**Prevention:**
- Check `session.expiresAt` in hooks (before setting `locals.user`)
- Delete expired cookie if session is expired
- Run periodic cleanup job to delete old sessions (cron or scheduled function)
- Consider sliding expiration (extend session on each request)

**Phase to address:** Phase 1 (Auth Infrastructure) - session validation in hooks; Phase 5 (Cleanup Job) - session cleanup

**Expiry check pattern:**
```typescript
// hooks.server.ts
const session = await db.select()
  .from(sessions)
  .where(eq(sessions.id, sessionId))
  .get();

if (!session || session.expiresAt < new Date()) {
  // Expired or missing - clean up
  event.cookies.delete('session', { path: '/' });
  event.locals.user = null;

  if (session) {
    // Delete expired session from DB
    await db.delete(sessions)
      .where(eq(sessions.id, sessionId));
  }
} else {
  event.locals.user = { id: session.userId, sessionId: session.id };
}
```

---

## File Upload Pitfalls

### Pitfall 9: Unrestricted File Upload Size

**What goes wrong:** User uploads 500MB CSV file, exhausting serverless function memory (256MB default) or hitting request body size limits. App crashes or hangs.

**Warning signs:**
- No `Content-Length` header check in upload endpoint
- No file size validation before parsing
- Memory usage spikes during large file uploads
- Serverless timeouts (10s limit on some platforms)

**Prevention:**
- Validate `Content-Length` header BEFORE reading body (reject oversized requests early)
- Set reasonable limit (CSV templates: 1MB should be plenty)
- Use streaming parser for CSV (don't load entire file into memory)
- Return clear error message for oversized files

**Phase to address:** Phase 4 (Admin Panel) - template upload validation

**Size validation pattern:**
```typescript
// routes/admin/templates/upload/+server.ts
export async function POST({ request }) {
  const contentLength = request.headers.get('content-length');
  const MAX_SIZE = 1024 * 1024; // 1MB

  if (!contentLength || parseInt(contentLength) > MAX_SIZE) {
    return json(
      { error: 'File too large. Maximum size: 1MB' },
      { status: 413 }
    );
  }

  // Use streaming parser (e.g., csv-parse with stream mode)
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return json({ error: 'No file provided' }, { status: 400 });
  }

  // Further validation...
}
```

---

### Pitfall 10: CSV Injection via Template Upload

**What goes wrong:** Admin uploads CSV template with formula injection: `=1+1` in a cell. When BOM is exported and opened in Excel, the formula executes (potential security risk).

**Warning signs:**
- No sanitization of CSV cell values
- Cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` (formula prefixes)
- Blindly trusting admin-uploaded content

**Prevention:**
- Sanitize CSV cells during import: prefix dangerous characters with single quote `'`
- Validate template structure (expected columns only)
- Show preview of parsed template before saving to database
- Admin templates are trusted but still validate format

**Phase to address:** Phase 4 (Admin Panel) - CSV parsing with sanitization

**CSV injection prevention:**
```typescript
function sanitizeCSVCell(value: string): string {
  // Prevent formula injection
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousChars.some(char => value.startsWith(char))) {
    return `'${value}`; // Prefix with single quote
  }
  return value;
}

// When parsing uploaded CSV
const rows = parseCSV(fileContent);
const sanitizedRows = rows.map(row =>
  row.map(cell => sanitizeCSVCell(cell))
);
```

---

### Pitfall 11: Missing File Type Validation

**What goes wrong:** Admin uploads a PNG image to CSV template endpoint. Parser tries to read it as CSV, fails with cryptic error, or worse - partially succeeds with garbage data.

**Warning signs:**
- Only checking file extension (client-provided, easily spoofed)
- No MIME type validation
- No content validation (does it actually parse as CSV?)
- Generic error messages that don't explain file type issue

**Prevention:**
- Validate MIME type from `File.type` (but don't rely solely on this)
- Attempt to parse as CSV and catch errors
- Check for expected column headers (template-specific validation)
- Return specific error: "Invalid file type. Expected CSV file."

**Phase to address:** Phase 4 (Admin Panel) - upload validation

**File type validation:**
```typescript
export async function POST({ request }) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  // 1. Check MIME type (basic check)
  if (!['text/csv', 'application/csv', 'text/plain'].includes(file.type)) {
    return json(
      { error: 'Invalid file type. Expected CSV file.' },
      { status: 400 }
    );
  }

  // 2. Try to parse as CSV
  const content = await file.text();
  let rows;
  try {
    rows = parseCSV(content);
  } catch (e) {
    return json(
      { error: 'File is not valid CSV format.' },
      { status: 400 }
    );
  }

  // 3. Validate expected structure
  const expectedHeaders = ['name', 'description', 'defaultMaterials'];
  if (!headersMatch(rows[0], expectedHeaders)) {
    return json(
      { error: 'CSV has incorrect columns. Expected: ' + expectedHeaders.join(', ') },
      { status: 400 }
    );
  }

  // Proceed with import
}
```

---

## SvelteKit Hooks Pitfalls

### Pitfall 12: Hook Order of Operations

**What goes wrong:** Multiple hooks in `hooks.server.ts` (auth, logging, error handling) execute in wrong order. Auth happens after error handling, so errors don't have user context. Or CSRF check happens before auth, blocking legitimate requests.

**Warning signs:**
- `locals.user` is undefined in error handler
- CSRF tokens rejected for authenticated requests
- Logging shows anonymous user despite session cookie present
- Hooks that depend on each other fail intermittently

**Prevention:**
- Understand hook execution order: `handle` runs top-to-bottom, wrapping resolve()
- Use sequence() helper to compose multiple hooks explicitly
- Order: (1) Logging/request ID, (2) Auth, (3) CSRF, (4) Business logic, (5) Error handling
- Document hook dependencies in comments

**Phase to address:** Phase 1 (Auth Infrastructure) - hook composition

**Hook ordering pattern:**
```typescript
// hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';

// 1. Request logging (first - logs everything)
async function logRequest({ event, resolve }) {
  event.locals.requestId = crypto.randomUUID();
  console.log(`[${event.locals.requestId}] ${event.request.method} ${event.url.pathname}`);
  return resolve(event);
}

// 2. Authentication (populates locals.user)
async function authenticate({ event, resolve }) {
  const sessionId = event.cookies.get('session');
  if (sessionId) {
    // ... fetch user
    event.locals.user = user;
  }
  return resolve(event);
}

// 3. CSRF protection (needs locals.user for exemptions)
async function csrfProtection({ event, resolve }) {
  if (event.request.method !== 'GET' && !event.locals.user) {
    // CSRF check
  }
  return resolve(event);
}

// Compose in order
export const handle = sequence(
  logRequest,
  authenticate,
  csrfProtection
);
```

---

### Pitfall 13: Performance Degradation from Hook DB Queries

**What goes wrong:** Auth hook queries database on EVERY request (including static assets, CSS, images). Database connection pool exhausted, response times degrade.

**Warning signs:**
- Database query logs show session lookups for `/favicon.ico`, `/styles.css`
- Slow page loads despite simple pages
- Connection pool warnings in logs
- Hook queries run even for 404 errors

**Prevention:**
- Skip auth for static assets: check `event.url.pathname` starts with `/assets/`, `/favicon.ico`
- Skip auth for API routes that have their own auth (avoid double-querying)
- Consider caching session data in-memory (with TTL) for high-traffic scenarios
- Use database connection pooling (Turso handles this automatically)

**Phase to address:** Phase 1 (Auth Infrastructure) - efficient hook implementation

**Optimized auth hook:**
```typescript
async function authenticate({ event, resolve }) {
  // Skip static assets
  const path = event.url.pathname;
  if (path.startsWith('/assets/') ||
      path === '/favicon.ico' ||
      path.endsWith('.css') ||
      path.endsWith('.js')) {
    return resolve(event);
  }

  // Only query DB if session cookie exists
  const sessionId = event.cookies.get('session');
  if (!sessionId) {
    event.locals.user = null;
    return resolve(event);
  }

  // Query session (consider in-memory cache for production)
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId)
  });

  // ... validation
}
```

---

## Template Migration Pitfalls

### Pitfall 14: Data Model Mismatch Between Code and Database

**What goes wrong:** Templates in `templates.ts` have complex nested structures (prompts array, materials object). Database schema uses JSON column. JSON serialization/deserialization bugs cause data corruption or type errors.

**Warning signs:**
- TypeScript types don't match database JSON structure
- `JSON.parse()` errors when loading templates
- Nested arrays become strings: `"[object Object]"`
- Template data works in code but breaks when loaded from DB

**Prevention:**
- Define TypeScript interface for template structure FIRST
- Use Drizzle's `.json()` column type with explicit typing: `.json().$type<TemplateData>()`
- Validate JSON structure on insert (zod schema)
- Test roundtrip: code → DB → code (ensure data survives serialization)
- Consider flattening structure if JSON is problematic (normalize to multiple tables)

**Phase to address:** Phase 2 (Database Schema) - template data modeling

**Safe JSON column pattern:**
```typescript
// types.ts - Define structure
export interface TemplateData {
  prompts: Array<{
    step: number;
    question: string;
    type: 'select' | 'text' | 'number';
    options?: string[];
  }>;
  defaultMaterials: {
    lumber: string[];
    hardware: string[];
  };
}

// schema.ts - Type the JSON column
import { TemplateData } from './types';

export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  data: text('data', { mode: 'json' }).$type<TemplateData>().notNull()
});

// Validate on insert
import { z } from 'zod';

const templateDataSchema = z.object({
  prompts: z.array(z.object({
    step: z.number(),
    question: z.string(),
    type: z.enum(['select', 'text', 'number']),
    options: z.array(z.string()).optional()
  })),
  defaultMaterials: z.object({
    lumber: z.array(z.string()),
    hardware: z.array(z.string())
  })
});

// Before insert
const validated = templateDataSchema.parse(templateData);
```

---

### Pitfall 15: Template ID Coupling Across Codebase

**What goes wrong:** Template IDs ("table", "cabinet") are hardcoded as string literals in multiple files. Changing ID breaks wizard, BOM display, exports. No single source of truth.

**Warning signs:**
- String literals: `if (templateId === "table")` scattered in code
- TypeScript doesn't catch typos: `"tabel"` compiles fine
- Adding new template requires changes in 5+ files
- Dead code for removed templates still exists

**Prevention:**
- Define template IDs as const enum or union type
- Single source of truth: `const TEMPLATE_IDS = ['table', 'cabinet', ...] as const`
- Use type: `type TemplateId = typeof TEMPLATE_IDS[number]`
- During migration: keep code templates, add DB templates, then remove code templates
- Use template slug/ID consistently (URL, database, code)

**Phase to address:** Phase 2 (Database Schema) - template ID management; Phase 4 (Admin Panel) - template CRUD

**Template ID pattern:**
```typescript
// lib/templates/constants.ts
export const TEMPLATE_IDS = [
  'table',
  'cabinet',
  'shelf',
  'workbench',
  'box',
  'chair'
] as const;

export type TemplateId = typeof TEMPLATE_IDS[number];

// Usage - TypeScript enforces valid IDs
function getTemplate(id: TemplateId) {
  // ...
}

getTemplate('table'); // OK
getTemplate('tabel'); // TypeScript error
```

---

## Integration Pitfalls

### Pitfall 16: Breaking BOM Wizard State Management

**What goes wrong:** Adding persistence to BOM wizard introduces save/load logic that conflicts with existing client-side state (`$state()` runes). Wizard steps get out of sync with database, duplicate BOMs created.

**Warning signs:**
- Wizard shows step 3 but database has step 1 data
- Creating new BOM loads data from previous session
- Back button doesn't work after saving mid-wizard
- State lost on page refresh (expected), but also lost on navigation (unexpected)

**Prevention:**
- Keep wizard state client-side ($state) for new BOMs (no DB writes until final save)
- Only load from DB when editing existing BOM (explicit intent)
- Clear wizard state when starting new BOM (`/bom/new` vs `/bom/edit/[id]`)
- Use URL parameter or route to distinguish new vs edit mode
- Save drafts as explicit user action (button), not automatic

**Phase to address:** Phase 3 (BOM Persistence) - save/edit flow design

**State management pattern:**
```typescript
// routes/bom/new/+page.svelte - New BOM (client state only)
let wizardState = $state({
  step: 1,
  template: null,
  dimensions: {},
  joinery: {},
  materials: []
});

// routes/bom/edit/[id]/+page.server.ts - Edit existing (load from DB)
export async function load({ params }) {
  const bom = await db.query.boms.findFirst({
    where: eq(boms.id, params.id)
  });
  return { bom }; // Client initializes state from this
}

// routes/bom/edit/[id]/+page.svelte - Edit mode
let wizardState = $state($page.data.bom); // Initialize from DB
```

---

### Pitfall 17: User Association Retroactive Application

**What goes wrong:** Adding `userId` foreign key to existing `projects` table, but existing rows have NULL userId. Queries with `WHERE user_id = ?` return nothing, user can't see their own projects.

**Warning signs:**
- Existing projects disappear after auth is added
- New projects work, old projects don't
- Migration adds column but doesn't backfill data
- NULL constraint violation when trying to enforce NOT NULL later

**Prevention:**
- Add `userId` column as NULLABLE first (migration)
- Backfill existing rows with single-user ID: `UPDATE projects SET user_id = 'single-user'`
- Update queries to handle NULL userId (show all if single-user mode)
- Later: enforce NOT NULL if multi-user is required
- Document single-user → multi-user migration path

**Phase to address:** Phase 2 (Database Schema) - user_id column addition with backfill

**Migration pattern:**
```sql
-- Migration: Add user_id column (nullable)
ALTER TABLE projects ADD COLUMN user_id TEXT;

-- Backfill existing rows (single-user mode)
UPDATE projects SET user_id = 'single-user' WHERE user_id IS NULL;

-- Optional: Add foreign key (if users table exists)
-- But don't add NOT NULL yet (allows gradual migration)
```

```typescript
// Query pattern - handle both single-user and multi-user
export async function load({ locals }) {
  const userId = locals.user?.id || 'single-user';

  const userProjects = await db.select()
    .from(projects)
    .where(eq(projects.userId, userId));

  return { projects: userProjects };
}
```

---

### Pitfall 18: CSV Export Breaks with Persisted BOMs

**What goes wrong:** CSV export currently uses client-side BOM state (`materials` array). After persistence, BOM data is in database with different structure (normalized tables). Export code doesn't handle DB-loaded BOMs.

**Warning signs:**
- Export works for new BOMs, fails for loaded BOMs
- TypeScript errors about missing properties on BOM items
- Different data shapes: client state vs DB query results
- CSV columns missing or in wrong order

**Prevention:**
- Define canonical BOM data interface (used by both client state and DB queries)
- Transform DB query results to match interface (in load function)
- CSV export function accepts interface, doesn't care about source
- Test export with both new (unsaved) and persisted BOMs

**Phase to address:** Phase 3 (BOM Persistence) - ensure consistent data shape; Phase 6 (CSV Export Update) - handle persisted BOMs

**Data shape consistency:**
```typescript
// types.ts - Canonical interface
export interface BOMItem {
  id: string;
  category: 'Lumber' | 'Hardware' | 'Finishes' | 'Consumables';
  description: string;
  quantity: number;
  unit: string;
  notes?: string;
  hidden: boolean;
}

export interface BOM {
  id: string;
  name: string;
  items: BOMItem[];
}

// routes/bom/edit/[id]/+page.server.ts - Transform DB to interface
export async function load({ params }) {
  const bomRecord = await db.query.boms.findFirst({
    where: eq(boms.id, params.id),
    with: { items: true } // Include related items
  });

  // Transform to canonical interface
  const bom: BOM = {
    id: bomRecord.id,
    name: bomRecord.name,
    items: bomRecord.items.map(item => ({
      id: item.id,
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      notes: item.notes,
      hidden: item.hidden
    }))
  };

  return { bom };
}

// lib/utils/csv.ts - Works with interface, not DB
export function exportBOMToCSV(bom: BOM): string {
  // Uses canonical interface - works for both new and loaded BOMs
}
```

---

## Phase Assignment Summary

| Pitfall | Primary Phase | Secondary Phase |
|---------|---------------|-----------------|
| Breaking existing routes | Phase 1 (Auth) | Phase 3 (Protected Routes) |
| Session not in locals | Phase 1 (Auth) | - |
| Auth state not reactive | Phase 1 (Auth) | - |
| Schema changes without migrations | Phase 2 (Schema) | - |
| Foreign key violations (templates) | Phase 2 (Schema) | Phase 4 (Admin) |
| SQLite concurrency | Phase 1 (Auth) | - |
| Session invalidation race | Phase 1 (Auth) | - |
| Session expiry not enforced | Phase 1 (Auth) | Phase 5 (Cleanup) |
| Unrestricted file upload size | Phase 4 (Admin) | - |
| CSV injection | Phase 4 (Admin) | - |
| Missing file type validation | Phase 4 (Admin) | - |
| Hook order of operations | Phase 1 (Auth) | - |
| Hook performance degradation | Phase 1 (Auth) | - |
| Data model mismatch (JSON) | Phase 2 (Schema) | - |
| Template ID coupling | Phase 2 (Schema) | Phase 4 (Admin) |
| Breaking wizard state | Phase 3 (BOM Persist) | - |
| User association retroactive | Phase 2 (Schema) | - |
| CSV export breaks | Phase 3 (BOM Persist) | Phase 6 (Export) |

---

## Sources and Confidence

**Confidence: MEDIUM**

This research is based on:
- SvelteKit patterns from training knowledge (January 2025 cutoff)
- Drizzle ORM patterns from training knowledge
- Analysis of existing codebase (PROJECT.md, schema.ts, page.server.ts)
- Common pitfalls from adding auth to existing apps (general experience)

**Not verified with:**
- Context7 (no SvelteKit documentation queries - would increase confidence)
- Official SvelteKit docs (no WebFetch - would verify hook patterns)
- Official Drizzle docs (no WebFetch - would verify migration workflow)

**Recommendations for validation:**
- Test each pitfall prevention strategy in a branch before main implementation
- Review SvelteKit hooks documentation for current best practices (docs.svelte.dev)
- Review Drizzle migration workflow documentation (orm.drizzle.team)
- Consider pilot testing auth on a single route before global rollout

**Known gaps:**
- Specific Turso limitations or features not researched
- SvelteKit adapter-auto deployment constraints (Vercel/Cloudflare differences)
- Performance characteristics of Drizzle queries with Turso (latency, connection pooling)

---

## Recommendations for Roadmap

Based on pitfall severity and dependencies:

**Phase 1 (Auth Infrastructure):**
- Build but don't enforce globally (prevent Pitfall 1)
- Set up hooks correctly from start (prevent Pitfall 12, 13)
- Define locals types first (prevent Pitfall 2)
- Implement session expiry checks (prevent Pitfall 8)

**Phase 2 (Database Schema):**
- Establish migration workflow before production (prevent Pitfall 4)
- Design template schema carefully (prevent Pitfall 14)
- Add userId with backfill strategy (prevent Pitfall 17)
- Use text PKs for templates matching code IDs (prevent Pitfall 5)

**Phase 3 (BOM Persistence):**
- Maintain separate new/edit flows (prevent Pitfall 16)
- Ensure data shape consistency (prevent Pitfall 18)
- Test with existing BOMs and new BOMs

**Phase 4 (Admin Panel):**
- Implement file upload validation comprehensively (prevent Pitfalls 9, 10, 11)
- Seed templates before adding FK constraints (prevent Pitfall 5)

**Critical success factors:**
- Don't break existing BOM wizard (highest priority)
- Test auth migration on isolated routes first
- Use migrations for schema changes, not push
- Validate all file uploads thoroughly
