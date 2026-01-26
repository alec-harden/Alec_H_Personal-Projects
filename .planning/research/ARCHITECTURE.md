# Architecture Research: v2.0 Integration

**Project:** WoodShop Toolbox v2.0
**Focus:** Auth, Persistence, Admin Features
**Researched:** 2026-01-26
**Confidence:** MEDIUM (based on SvelteKit documentation patterns, no live verification)

## Executive Summary

v2.0 adds authentication, persistence, and admin features to the existing SvelteKit app. The architecture leverages SvelteKit's built-in hooks system for auth middleware, extends the existing Drizzle schema with user/project relationships, and follows RESTful API patterns for new endpoints. Key insight: SvelteKit's hooks.server.ts and App.Locals provide the foundation for session management and route protection.

**Integration approach:** Extend, don't replace. The existing BOM wizard flow remains intact; new features wrap around it with auth gates and persistence hooks.

---

## Auth Integration

### Middleware Pattern: hooks.server.ts

SvelteKit provides `src/hooks.server.ts` as the central point for request interception. This is where auth middleware lives.

**Location:** `src/hooks.server.ts` (create new file at project root)

**Pattern:**
```typescript
// src/hooks.server.ts
import { redirect, type Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
  // 1. Extract session token from cookie
  const sessionToken = event.cookies.get('session_token');

  // 2. Validate session and attach user to locals
  if (sessionToken) {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, sessionToken),
      with: { user: true }
    });

    if (session && session.expiresAt > new Date()) {
      event.locals.user = session.user;
      event.locals.sessionId = session.id;
    } else if (session) {
      // Expired session - clean up
      await db.delete(sessions).where(eq(sessions.id, session.id));
      event.cookies.delete('session_token');
    }
  }

  // 3. Route protection (see below)

  return resolve(event);
};
```

**Key points:**
- Runs on every request before page/endpoint handlers
- Attaches authenticated user to `event.locals` for downstream access
- Handles session expiration automatically
- Cookie-based sessions (httpOnly, secure, sameSite)

**App.Locals typing:**
```typescript
// src/app.d.ts
declare global {
  namespace App {
    interface Locals {
      user?: {
        id: string;
        email: string;
        name: string | null;
        role: 'user' | 'admin';
      };
      sessionId?: string;
    }
  }
}
```

### Protected Routes

SvelteKit uses file-based routing. Routes are protected in three ways:

#### 1. Server Load Functions (+page.server.ts)

Best for page-level protection. Redirects before rendering.

```typescript
// src/routes/projects/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/auth/login');
  }

  // User is authenticated - load their projects
  return {
    user: locals.user
  };
};
```

#### 2. Hooks Middleware (hooks.server.ts)

Best for global protection of route patterns.

```typescript
export const handle: Handle = async ({ event, resolve }) => {
  // ... session validation ...

  // Protect /projects/* routes
  if (event.url.pathname.startsWith('/projects') && !event.locals.user) {
    throw redirect(302, '/auth/login?redirect=' + event.url.pathname);
  }

  // Protect /admin/* routes (admin only)
  if (event.url.pathname.startsWith('/admin')) {
    if (!event.locals.user) {
      throw redirect(302, '/auth/login');
    }
    if (event.locals.user.role !== 'admin') {
      throw redirect(302, '/'); // Not authorized
    }
  }

  return resolve(event);
};
```

#### 3. API Route Guards (+server.ts)

Best for API endpoint protection. Returns 401/403 instead of redirecting.

```typescript
// src/routes/api/projects/+server.ts
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  // Fetch user's projects
  const projects = await db.query.projects.findMany({
    where: eq(projects.userId, locals.user.id)
  });

  return json(projects);
};
```

**Recommendation:** Use server load functions for page protection (better UX with redirects) and API guards for endpoints (proper HTTP status codes).

### Session Flow

```
1. User submits login form → POST /api/auth/login
2. Validate credentials (bcrypt password check)
3. Create session record in DB
4. Set httpOnly cookie with session token
5. Redirect to dashboard (or original destination)

On each request:
1. hooks.server.ts reads session token from cookie
2. Looks up session in DB, validates expiration
3. Attaches user to event.locals
4. Page/API handlers access via locals.user
```

**Session properties:**
- Token: Cryptographically random (crypto.randomUUID() or similar)
- Expiration: 30 days default, refresh on activity
- Storage: Database table, indexed on token
- Cleanup: Cron job or lazy deletion on access

**Security:**
- Cookies: `{ httpOnly: true, secure: true, sameSite: 'lax', path: '/' }`
- Passwords: bcrypt with salt rounds 10-12
- CSRF: SvelteKit's built-in CSRF protection via origin check
- Rate limiting: Consider for /api/auth/* endpoints (not in scope for v2.0, flag for later)

---

## Database Schema

### Table Design

Current schema has only `projects` table (minimal). v2.0 extends with:

```typescript
// src/lib/server/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// NEW: Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// NEW: Sessions table
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(), // Session token (stored in cookie)
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// MODIFIED: Projects table (add userId)
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// NEW: BOMs table
export const boms = sqliteTable('boms', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  version: integer('version').notNull().default(1), // Support versioning later
  generatedAt: integer('generated_at', { mode: 'timestamp' }).notNull(),

  // Project details (from wizard)
  templateId: text('template_id').notNull(),
  dimensions: text('dimensions', { mode: 'json' }).notNull(), // { length, width, height? }
  joinery: text('joinery', { mode: 'json' }).notNull(), // string[]
  woodSpecies: text('wood_species').notNull(),
  finish: text('finish').notNull(),
  additionalNotes: text('additional_notes'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// NEW: BOM Items table
export const bomItems = sqliteTable('bom_items', {
  id: text('id').primaryKey(),
  bomId: text('bom_id').notNull().references(() => boms.id, { onDelete: 'cascade' }),
  category: text('category', { enum: ['lumber', 'hardware', 'finishes', 'consumables'] }).notNull(),
  name: text('name').notNull(),
  quantity: real('quantity').notNull(),
  unit: text('unit').notNull(),
  notes: text('notes'),
  hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull(), // Preserve user ordering
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// NEW: Templates table (for admin-managed templates)
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),

  // Template configuration (JSON)
  joineryOptions: text('joinery_options', { mode: 'json' }).notNull(), // JoineryOption[]
  typicalHardware: text('typical_hardware', { mode: 'json' }).notNull(), // string[]
  defaultDimensions: text('default_dimensions', { mode: 'json' }), // Dimension hints

  // Metadata
  icon: text('icon'), // Icon identifier
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// Relations (for Drizzle query API)
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  sessions: many(sessions)
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id]
  }),
  boms: many(boms)
}));

export const bomsRelations = relations(boms, ({ one, many }) => ({
  project: one(projects, {
    fields: [boms.projectId],
    references: [projects.id]
  }),
  items: many(bomItems)
}));

export const bomItemsRelations = relations(bomItems, ({ one }) => ({
  bom: one(boms, {
    fields: [bomItems.bomId],
    references: [boms.id]
  })
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}));
```

### Relationships

```
users (1) ──→ (many) projects
projects (1) ──→ (many) boms
boms (1) ──→ (many) bomItems
users (1) ──→ (many) sessions

templates (independent, admin-managed)
```

**Key design decisions:**

1. **User → Project → BOM hierarchy:** Projects own BOMs (not just BOMs directly on users). Supports future expansion (project notes, photos, etc.).

2. **BOM Items as separate table:** Normalized design. Easier to query, edit, and maintain item ordering.

3. **Templates as database records:** Migrates from hardcoded `src/lib/data/templates.ts` to admin-editable database records. Existing templates seeded via migration.

4. **Soft delete:** Use `isActive` flag on templates instead of hard delete. Preserves referential integrity for old BOMs.

5. **Version field on BOMs:** Reserved for future versioning feature (user edits BOM, saves new version).

### Migration Strategy

**Phase 1: Additive changes (safe)**
1. Add `users`, `sessions`, `templates` tables
2. Seed initial admin user (via migration or script)
3. Seed existing templates from `templates.ts` into database

**Phase 2: Schema modifications (requires data handling)**
1. Add `userId` column to `projects` (nullable temporarily)
2. Backfill existing projects with admin userId
3. Make `userId` non-nullable
4. Add foreign key constraint

**Phase 3: BOM persistence tables**
1. Add `boms` and `bomItems` tables
2. No existing data to migrate (v1.0 didn't persist BOMs)

**Drizzle migration workflow:**
```bash
# Generate migration after schema changes
npm run db:push  # For dev (applies directly)

# For production (generate SQL files)
npx drizzle-kit generate:sqlite
npx drizzle-kit migrate
```

**Seed script pattern:**
```typescript
// scripts/seed-admin.ts
import { db } from './src/lib/server/db';
import { users } from './src/lib/server/schema';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';

const passwordHash = await bcrypt.hash(adminPassword, 10);

await db.insert(users).values({
  id: nanoid(),
  email: adminEmail,
  passwordHash,
  name: 'Admin',
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date()
});
```

---

## Route Structure

### New Routes

#### Auth Routes
```
/auth/login          → Login page (+page.svelte)
/auth/register       → Registration page (optional for v2.0, may defer)
/auth/logout         → Logout endpoint (form action, no page)
```

**Pattern:**
- `/auth/login/+page.svelte` - Login form UI
- `/auth/login/+page.server.ts` - Form actions (POST handler)
- Redirect to `/` (dashboard) on success, or `?redirect=` param destination

#### Project Routes
```
/projects            → List user's saved projects
/projects/[id]       → View project detail (shows saved BOMs)
/projects/[id]/edit  → Edit project metadata (name, etc.)
```

**Pattern:**
- Dynamic routes with `[id]` slug
- Load project via `+page.server.ts` with userId check
- 404 if project not found or doesn't belong to user

#### Admin Routes
```
/admin               → Admin dashboard
/admin/templates     → Manage templates (CRUD)
/admin/users         → User management (optional, defer to v2.1)
```

**Pattern:**
- Role-based protection in `hooks.server.ts`
- Admin-only UI components

### Modified Routes

#### Dashboard (/)
```
/                    → No auth required initially (shows demo)
                       Auth'd users see their projects
```

**Change:**
- `+page.server.ts` loads user's projects if authenticated
- Show "Login" CTA if not authenticated
- Sample projects only for unauthenticated users

#### BOM Wizard (/bom/new)
```
/bom/new             → Create new BOM (auth optional initially)
/bom/new?project=[id] → Create BOM for existing project
```

**Changes:**
- Add "Save" button after generation (only if authenticated)
- If authenticated and no `?project=` param, prompt to create project first
- POST to `/api/bom/save` on save

#### BOM Display (part of /bom/new result view)
```
No route change       → Stays in wizard result view
```

**Changes:**
- Add "Save to Project" button
- Show saved indicator if BOM came from `/projects/[id]`

### API Endpoints

#### Auth APIs
```
POST   /api/auth/login      → Email/password login
POST   /api/auth/register   → Create new user (optional for v2.0)
POST   /api/auth/logout     → Destroy session
GET    /api/auth/me         → Get current user (for client-side checks)
```

#### Project APIs
```
GET    /api/projects        → List user's projects
POST   /api/projects        → Create new project
GET    /api/projects/[id]   → Get project detail
PATCH  /api/projects/[id]   → Update project metadata
DELETE /api/projects/[id]   → Delete project (cascade deletes BOMs)
```

#### BOM APIs
```
POST   /api/bom/generate    → EXISTING (no auth required, stays for wizard)
POST   /api/bom/save        → NEW - Save BOM to project
GET    /api/projects/[id]/boms → List BOMs for project
GET    /api/boms/[id]       → Get specific BOM with items
PATCH  /api/boms/[id]       → Update BOM (edit items, quantities)
DELETE /api/boms/[id]       → Delete BOM
```

#### Template APIs (Admin only)
```
GET    /api/templates       → List all templates (public, filtered by isActive)
POST   /api/templates       → Create template (admin)
PATCH  /api/templates/[id]  → Update template (admin)
DELETE /api/templates/[id]  → Soft-delete template (admin, set isActive=false)
```

**API Response patterns:**
```typescript
// Success
{ data: T, message?: string }

// Error
{ error: string, details?: any }

// List response
{ data: T[], total: number, page?: number }
```

**Authentication:**
- Check `locals.user` in handler
- Return 401 if missing, 403 if unauthorized
- No bearer tokens needed (session via cookie)

---

## Component Changes

### New Components

#### Auth Components
- `src/lib/components/auth/LoginForm.svelte` - Email/password form with validation
- `src/lib/components/auth/AuthGuard.svelte` - Client-side auth UI wrapper (optional)

#### Project Components
- `src/lib/components/projects/ProjectList.svelte` - Grid of project cards
- `src/lib/components/projects/ProjectCard.svelte` - Individual project card (extends existing)
- `src/lib/components/projects/BOMList.svelte` - List of BOMs within a project
- `src/lib/components/projects/BOMCard.svelte` - BOM summary card

#### Admin Components
- `src/lib/components/admin/TemplateForm.svelte` - CRUD form for templates
- `src/lib/components/admin/TemplateList.svelte` - Admin template management table

#### Utility Components
- `src/lib/components/SaveBOMButton.svelte` - Handles save flow (reusable)
- `src/lib/components/UserMenu.svelte` - User dropdown (logout, profile link)

### Modified Components

#### Existing: BOMDisplay.svelte
**Changes:**
- Add `onSave` callback prop
- Add "Save to Project" button (conditionally shown if authenticated)
- Show "Saved" indicator if BOM has an ID

```typescript
interface BOMDisplayProps {
  bom: BOM;
  saved?: boolean; // NEW - indicates if BOM is persisted
  projectId?: string; // NEW - if editing existing BOM
  onSave?: (bomData: BOM) => Promise<void>; // NEW
  onStartOver: () => void;
  // ... existing props
}
```

#### Existing: BOMWizard.svelte
**Changes:**
- Add optional `projectId` prop (for creating BOM in existing project)
- Pass projectId to generation API if present
- No visual changes, just data flow

```typescript
interface BOMWizardProps {
  projectId?: string; // NEW - pre-select project for BOM
  onComplete: (details: ProjectDetails) => void;
}
```

#### Existing: Header.svelte
**Changes:**
- Add UserMenu component (top-right)
- Show "Login" link if not authenticated
- Show user name + dropdown if authenticated

```svelte
<Header onMenuClick={...}>
  {#if user}
    <UserMenu {user} />
  {:else}
    <a href="/auth/login">Login</a>
  {/if}
</Header>
```

#### Existing: Sidebar.svelte
**Changes:**
- Add "My Projects" link (if authenticated)
- Add "Admin" link (if user.role === 'admin')
- Conditionally show based on auth state

```svelte
<nav>
  <a href="/">Dashboard</a>
  <a href="/bom/new">New BOM</a>
  {#if user}
    <a href="/projects">My Projects</a>
  {/if}
  {#if user?.role === 'admin'}
    <a href="/admin">Admin</a>
  {/if}
</nav>
```

#### Existing: Dashboard (+page.svelte)
**Changes:**
- Load projects from server (`data.projects`)
- Show actual user projects instead of hardcoded samples
- Add "No projects yet" empty state

---

## Build Order

### Phase Dependencies

**Critical path:**
1. Auth must come first (everything else depends on user context)
2. Database schema changes (tables for users, sessions)
3. Protected routes (depends on auth middleware)
4. Persistence (depends on schema + auth)
5. Admin features (depends on auth roles + persistence)

**Parallel work opportunities:**
- UI components can be built alongside API endpoints
- Template migration can happen independently of auth
- Admin features are isolated from user features

### Suggested Sequence

#### Phase 1: Auth Foundation
**Goal:** Users can register, login, logout. Session management works.

**Tasks:**
1. Create `hooks.server.ts` with session handling
2. Add `users` and `sessions` tables to schema
3. Implement `/api/auth/login` endpoint
4. Implement `/api/auth/logout` endpoint
5. Create `LoginForm.svelte` component
6. Create `/auth/login/+page.svelte` route
7. Update `app.d.ts` with Locals interface
8. Seed initial admin user (script)

**Verification:** User can login, session persists across page loads, logout clears session.

#### Phase 2: Route Protection
**Goal:** Protected routes redirect to login. Dashboard shows user's data.

**Tasks:**
1. Add route protection logic to `hooks.server.ts`
2. Protect `/projects/*` routes (redirect if not authenticated)
3. Protect `/admin/*` routes (redirect if not admin role)
4. Update Header with UserMenu component
5. Update Sidebar with authenticated links
6. Modify dashboard to load user projects (if authenticated)

**Verification:** Unauthenticated users redirected to login. Admin-only routes reject regular users.

#### Phase 3: Project Persistence
**Goal:** Users can create projects, view project list, manage projects.

**Tasks:**
1. Add `projectId` column to existing `projects` table (with userId)
2. Implement `/api/projects` endpoints (GET, POST, PATCH, DELETE)
3. Create `/projects/+page.svelte` (project list)
4. Create `/projects/[id]/+page.svelte` (project detail)
5. Create ProjectList and ProjectCard components
6. Update dashboard to link to projects
7. Backfill existing projects with admin userId (migration)

**Verification:** User can create a project, see it in list, view details, edit name, delete.

#### Phase 4: BOM Persistence
**Goal:** Users can save BOMs to projects, view saved BOMs, edit them.

**Tasks:**
1. Add `boms` and `bomItems` tables to schema
2. Implement `/api/bom/save` endpoint
3. Implement `/api/projects/[id]/boms` endpoint (list BOMs)
4. Implement `/api/boms/[id]` endpoint (get BOM with items)
5. Implement `/api/boms/[id]` PATCH endpoint (update BOM)
6. Modify BOMDisplay to show "Save" button
7. Create BOMList and BOMCard components
8. Add BOM list to project detail page
9. Support loading saved BOM for editing

**Verification:** User completes wizard, saves BOM to project, sees it in project detail, can reload and edit.

#### Phase 5: Template Management (Admin)
**Goal:** Admin can manage templates via UI instead of code changes.

**Tasks:**
1. Add `templates` table to schema
2. Migrate existing templates from `templates.ts` to DB (seed script)
3. Implement `/api/templates` endpoints (GET public, POST/PATCH/DELETE admin)
4. Create `/admin/templates/+page.svelte` route
5. Create TemplateForm and TemplateList components
6. Protect admin routes with role check
7. Update BOM wizard to load templates from DB instead of file

**Verification:** Admin can create/edit/deactivate templates. Users see updated templates in wizard.

#### Phase 6: File Upload (if in scope)
**Goal:** Users can upload reference images or files to projects.

**Tasks:**
1. Add `projectFiles` table (if needed)
2. Choose file storage strategy (blob storage, local upload folder, etc.)
3. Implement file upload endpoint
4. Add file upload UI to project detail page
5. Display uploaded files with download links

**Verification:** User uploads file to project, file persists, can be downloaded.

### Risk Factors

**High Risk:**
- Session management bugs (security implications)
- Password hashing misconfiguration (use bcrypt, salt rounds 10-12)
- SQL injection (Drizzle parameterizes queries, but verify)
- CSRF attacks (SvelteKit protects form actions, verify for APIs)

**Medium Risk:**
- Migration errors (test on dev database first)
- Schema changes breaking existing code (incremental migrations)
- Role-based access control bugs (test admin/user paths separately)

**Low Risk:**
- UI component integration (well-isolated)
- API endpoint structure (follows REST conventions)

---

## Integration Points with Existing Code

### Preserve Existing Flows

**BOM Wizard (unauthenticated flow):**
- Keep `/bom/new` accessible without login (demo mode)
- Generated BOM works without saving (ephemeral, like v1.0)
- Add "Save" option only if authenticated

**Dashboard:**
- Unauthenticated: Show sample projects + "Login" CTA
- Authenticated: Show user's actual projects

**API Endpoint `/api/bom/generate`:**
- No auth required (supports demo flow)
- Add optional `projectId` param for context (if saving)

### New Integration Points

**hooks.server.ts → All routes:**
- Injects `locals.user` into every request
- Page components access via `data.user` (from load function)
- API handlers access via `locals.user` directly

**+page.server.ts → Dashboard:**
- Load user projects if authenticated
- Return empty array if not authenticated

**BOMDisplay → Save flow:**
- User clicks "Save" → triggers `onSave` callback
- Parent page handles POST to `/api/bom/save`
- On success, redirect to `/projects/[id]`

**Wizard → Project context:**
- If `?project=[id]` param present, associate BOM with project
- Pass projectId to generation API
- Pre-fill project name in wizard UI

---

## Data Flow Changes

### v1.0 Flow (Ephemeral)
```
User → Wizard → POST /api/bom/generate → AI → BOM JSON → Display → Export CSV
(No persistence, BOM lost on page refresh)
```

### v2.0 Flow (Persistent)
```
User (authenticated) → Wizard → POST /api/bom/generate → AI → BOM JSON → Display
                                                               ↓ (User clicks "Save")
                                                       POST /api/bom/save
                                                               ↓
                                                       Save to DB (boms + bomItems tables)
                                                               ↓
                                                       Redirect to /projects/[id]
                                                               ↓
                                                       User can reload, edit, re-export
```

### Session Flow
```
Login form → POST /api/auth/login → Validate password → Create session → Set cookie
                                                                  ↓
                                          hooks.server.ts reads cookie on each request
                                                                  ↓
                                          Attaches user to locals → Available in load functions and handlers
```

### Admin Template Flow
```
Admin → /admin/templates → Create template form → POST /api/templates → Save to DB
                                                                          ↓
                                          BOM wizard loads templates from DB (not hardcoded file)
                                                                          ↓
                                          Users see new template in wizard dropdown
```

---

## Performance Considerations

### Database Queries

**Optimization strategies:**

1. **Index on foreign keys:** userId, projectId, bomId for fast joins
2. **Index on session token:** Fast lookup in hooks.server.ts (runs on every request)
3. **Eager loading with relations:** Use Drizzle's `with` for one-query fetches
4. **Pagination for project lists:** Defer to v2.1 (not needed for single user initially)

**Example optimized query:**
```typescript
// Get project with all BOMs and their items (one query via relations)
const project = await db.query.projects.findFirst({
  where: eq(projects.id, projectId),
  with: {
    boms: {
      with: {
        items: true
      },
      orderBy: desc(boms.createdAt)
    }
  }
});
```

### Session Storage

**Tradeoff: Database sessions vs. JWT**

| Approach | Pros | Cons |
|----------|------|------|
| DB sessions (recommended) | Easy revocation, server-controlled expiry, simple | Extra DB query on each request |
| JWT tokens | No DB lookup, stateless | Hard to revoke, larger cookie size, clock skew issues |

**Recommendation:** Database sessions for v2.0. Single-user app means query overhead is negligible. Easier to implement and secure.

**Optimization:** Session queries are fast (indexed on token, <1ms lookup).

### File Uploads (if implemented)

**Storage options:**

1. **Local file system** - Simple, but not scalable (loses files on serverless redeploy)
2. **Blob storage (S3, R2, etc.)** - Recommended for production, costs ~$0.023/GB
3. **Database blobs** - Avoid (bloats database, slow queries)

**Recommendation:** Defer file uploads to v2.1. If needed in v2.0, use Cloudflare R2 (free tier: 10GB storage).

---

## Security Checklist

- [ ] Passwords hashed with bcrypt (salt rounds 10-12)
- [ ] Sessions use httpOnly, secure, sameSite cookies
- [ ] Session tokens are cryptographically random (UUID v4 or crypto.randomUUID())
- [ ] SQL queries use parameterized statements (Drizzle handles this)
- [ ] User input validated on server (Zod schemas for API bodies)
- [ ] Role checks in both hooks.server.ts and API handlers (defense in depth)
- [ ] CSRF protection enabled (SvelteKit's built-in origin check)
- [ ] Rate limiting on auth endpoints (optional, defer to v2.1)
- [ ] Session expiration checked on each request (implemented in hooks.server.ts)
- [ ] Expired sessions cleaned up (lazy deletion or cron job)

---

## Open Questions / Flags for Validation

1. **Email verification:** Out of scope for v2.0? (Single-user app doesn't need it)
2. **Password reset flow:** Defer to v2.1? (Admin can manually reset in DB)
3. **User registration:** Open registration or admin-created accounts only?
4. **File uploads:** In scope for v2.0 or defer?
5. **Rate limiting:** Needed for single-user app? (Probably not, defer)
6. **Session cleanup:** Cron job or lazy deletion? (Lazy deletion simpler for v2.0)

**Recommendations:**
- Defer email verification, password reset, and rate limiting to v2.1
- Admin-created accounts only for v2.0 (no public registration)
- Defer file uploads unless explicitly required
- Use lazy session cleanup (delete expired sessions on access)

---

## Sources

**Confidence level: MEDIUM**

Based on:
- SvelteKit documentation patterns (hooks, load functions, form actions)
- Drizzle ORM API (relations, schema definition)
- Standard auth practices (bcrypt, session management, CSRF)
- SQLite constraints and best practices

**Verification needed:**
- Actual SvelteKit 2.x hooks.server.ts implementation (API may have changed)
- Drizzle ORM relations API (verify syntax with official docs)
- Turso-specific considerations (network latency, connection pooling)

**Suggested validation:**
- Review SvelteKit hooks documentation: https://kit.svelte.dev/docs/hooks
- Review Drizzle relations API: https://orm.drizzle.team/docs/rqb
- Test session management flow in isolated prototype
- Verify CSRF protection in SvelteKit form actions

---

## Summary for Roadmap

**Phase structure recommendation:**
1. Auth Foundation (sessions, login/logout)
2. Route Protection (hooks middleware, protected pages)
3. Project Persistence (projects table, CRUD APIs)
4. BOM Persistence (boms/bomItems tables, save flow)
5. Template Management (admin UI, DB migration)
6. File Uploads (optional, defer if not critical)

**Build order rationale:**
- Auth first (foundation for everything else)
- Protection second (ensures security before adding data)
- Projects before BOMs (hierarchy dependency)
- Templates last (least coupled, can be added independently)

**Integration approach:**
- Extend existing routes with auth guards
- Preserve unauthenticated demo flow
- Add persistence hooks to BOM display component
- Migrate templates from code to database gradually

**Risk mitigation:**
- Test auth flow in isolation first
- Incremental schema migrations (additive → modifications)
- Keep existing wizard flow working throughout
- Use feature flags if needed (optional auth for initial rollout)
