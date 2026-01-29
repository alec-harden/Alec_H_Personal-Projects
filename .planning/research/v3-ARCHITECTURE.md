# Architecture Research: v3.0 Integration

**Project:** WoodShop Toolbox v3.0
**Focus:** RBAC, Cut List Optimizer, Email Flows
**Researched:** 2026-01-29
**Confidence:** MEDIUM (based on existing codebase analysis and SvelteKit patterns)

## Executive Summary

v3.0 adds three major features to the existing architecture: Role-Based Access Control (RBAC), a Cut List Optimizer tool, and email-based authentication flows. The existing architecture (hooks.server.ts for auth, Drizzle schema with relations, API routes for mutations) provides solid integration points. The primary changes involve extending the user schema with roles, adding new tables for cut lists, and integrating an email service for password reset and verification.

**Key integration insight:** The existing `hooks.server.ts` and `event.locals.user` pattern is well-suited for RBAC extension. Adding a `role` field to the user and checking it in middleware provides defense-in-depth without major refactoring.

---

## RBAC Integration

### Existing Auth Architecture

**Current state (v2.0):**
- `hooks.server.ts` validates session on every request
- `event.locals.user` populated with `{ id, email, createdAt }`
- Protected routes check `if (!locals.user)` and redirect to login
- No role concept currently exists

**Files involved:**
- `src/hooks.server.ts` - Session validation middleware
- `src/app.d.ts` - TypeScript interface for `App.Locals`
- `src/lib/server/schema.ts` - User table definition
- `src/lib/server/auth.ts` - Password hashing, session management

### Schema Changes

**Extend users table:**

```typescript
// src/lib/server/schema.ts
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'), // NEW
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false), // NEW
  disabled: integer('disabled', { mode: 'boolean' }).notNull().default(false), // NEW
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
```

**New tables for email flows:**

```typescript
// Password reset tokens
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// Email verification tokens
export const emailVerificationTokens = sqliteTable('email_verification_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
```

### Middleware Changes

**Extend hooks.server.ts:**

```typescript
// src/hooks.server.ts
export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get('session_token');

  if (sessionToken) {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, sessionToken),
      with: { user: true }
    });

    if (session && session.expiresAt > new Date()) {
      // Check if user is disabled
      if (session.user.disabled) {
        // Clear session and cookie for disabled users
        await db.delete(sessions).where(eq(sessions.id, session.id));
        event.cookies.delete('session_token', { path: '/' });
      } else {
        event.locals.user = {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,           // NEW
          emailVerified: session.user.emailVerified, // NEW
          createdAt: session.user.createdAt
        };
        event.locals.sessionId = session.id;
      }
    }
    // ... existing expiration handling
  }

  return resolve(event);
};
```

**Update App.Locals interface:**

```typescript
// src/app.d.ts
interface Locals {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin';      // NEW
    emailVerified: boolean;       // NEW
    createdAt: Date;
  };
  sessionId?: string;
}
```

### Route Protection Patterns

**Pattern 1: Admin-only routes in +page.server.ts**

```typescript
// src/routes/admin/users/+page.server.ts
export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirect=/admin/users');
  }
  if (locals.user.role !== 'admin') {
    throw error(403, 'Admin access required');
  }
  // Load user list...
};
```

**Pattern 2: Admin-only API endpoints**

```typescript
// src/routes/api/admin/users/+server.ts
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (locals.user.role !== 'admin') {
    return json({ error: 'Admin access required' }, { status: 403 });
  }
  // Return user list...
};
```

**Pattern 3: Reusable auth guard helper**

```typescript
// src/lib/server/guards.ts
import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export function requireAuth(event: RequestEvent) {
  if (!event.locals.user) {
    throw redirect(302, `/auth/login?redirect=${event.url.pathname}`);
  }
  return event.locals.user;
}

export function requireAdmin(event: RequestEvent) {
  const user = requireAuth(event);
  if (user.role !== 'admin') {
    throw error(403, 'Admin access required');
  }
  return user;
}

export function requireVerifiedEmail(event: RequestEvent) {
  const user = requireAuth(event);
  if (!user.emailVerified) {
    throw redirect(302, '/auth/verify-email-required');
  }
  return user;
}
```

### Integration Points Summary

| Existing File | Change Required |
|---------------|-----------------|
| `src/lib/server/schema.ts` | Add `role`, `emailVerified`, `disabled` to users; add token tables |
| `src/hooks.server.ts` | Extend user object with role; check disabled flag |
| `src/app.d.ts` | Update `App.Locals` interface with role |
| `src/routes/admin/*` | Add role check in load functions |
| `src/routes/api/admin/*` | Add role check in handlers |

### Build Order for RBAC

1. **Schema changes** - Add columns to users table
2. **Update hooks.server.ts** - Extend user object
3. **Update app.d.ts** - TypeScript interfaces
4. **Create guards.ts** - Reusable auth helpers
5. **Add admin routes** - /admin/users with CRUD
6. **Update existing admin routes** - /admin/templates already exists, add role check

---

## Cut List Optimizer Architecture

### Feature Overview

The Cut List Optimizer is a new tool that helps users minimize waste when cutting lumber and sheet goods. It supports two modes:

1. **Linear mode (1D bin packing)** - For boards and trim
2. **Sheet mode (2D nesting)** - For plywood and panel goods

### Route Structure

**New routes:**
```
/cutlist                    -> Tool landing page (mode selector)
/cutlist/new                -> Cut list wizard/editor
/cutlist/new?project=[id]   -> Pre-select project
/cutlist/new?bom=[id]       -> Auto-import lumber from BOM
/cutlist/[id]               -> View saved cut list
/cutlist/[id]/edit          -> Edit saved cut list
```

**Route files:**
```
src/routes/cutlist/
  +page.svelte              -> Mode selector UI
  +page.server.ts           -> Load user's cut lists
  new/
    +page.svelte            -> Cut list editor
    +page.server.ts         -> Load project/BOM data if params present
  [id]/
    +page.svelte            -> View cut list with diagrams
    +page.server.ts         -> Load cut list with items
    edit/
      +page.svelte          -> Edit mode
```

### Schema Design

```typescript
// src/lib/server/schema.ts

// Cut Lists (container for optimization)
export const cutLists = sqliteTable('cut_lists', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  mode: text('mode', { enum: ['linear', 'sheet'] }).notNull(),
  kerfWidth: real('kerf_width').notNull().default(0.125), // 1/8" default
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// Stock materials available for cutting
export const cutListStock = sqliteTable('cut_list_stock', {
  id: text('id').primaryKey(),
  cutListId: text('cut_list_id')
    .notNull()
    .references(() => cutLists.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),           // "8ft 2x4", "4x8 Baltic Birch"
  materialType: text('material_type').notNull(), // "lumber", "plywood"
  length: real('length').notNull(),       // Primary dimension
  width: real('width'),                   // For sheet goods
  thickness: real('thickness'),           // Optional
  quantity: integer('quantity').notNull().default(1),
  cost: real('cost'),                     // Optional, per unit
  position: integer('position').notNull()
});

// Required cuts (what we need to produce)
export const cutListCuts = sqliteTable('cut_list_cuts', {
  id: text('id').primaryKey(),
  cutListId: text('cut_list_id')
    .notNull()
    .references(() => cutLists.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),           // "Shelf A", "Rail"
  length: real('length').notNull(),
  width: real('width'),                   // For 2D cuts
  quantity: integer('quantity').notNull().default(1),
  bomItemId: text('bom_item_id')          // Link to source BOM item (optional)
    .references(() => bomItems.id, { onDelete: 'set null' }),
  position: integer('position').notNull()
});

// Optimization results (computed patterns)
export const cutPatterns = sqliteTable('cut_patterns', {
  id: text('id').primaryKey(),
  cutListId: text('cut_list_id')
    .notNull()
    .references(() => cutLists.id, { onDelete: 'cascade' }),
  stockId: text('stock_id')
    .notNull()
    .references(() => cutListStock.id, { onDelete: 'cascade' }),
  patternData: text('pattern_data', { mode: 'json' }).notNull(), // Placement coordinates
  wastePercentage: real('waste_percentage').notNull(),
  position: integer('position').notNull()
});

// Relations
export const cutListsRelations = relations(cutLists, ({ one, many }) => ({
  project: one(projects, {
    fields: [cutLists.projectId],
    references: [projects.id]
  }),
  stock: many(cutListStock),
  cuts: many(cutListCuts),
  patterns: many(cutPatterns)
}));

export const cutListStockRelations = relations(cutListStock, ({ one, many }) => ({
  cutList: one(cutLists, {
    fields: [cutListStock.cutListId],
    references: [cutLists.id]
  }),
  patterns: many(cutPatterns)
}));

export const cutListCutsRelations = relations(cutListCuts, ({ one }) => ({
  cutList: one(cutLists, {
    fields: [cutListCuts.cutListId],
    references: [cutLists.id]
  }),
  bomItem: one(bomItems, {
    fields: [cutListCuts.bomItemId],
    references: [bomItems.id]
  })
}));

export const cutPatternsRelations = relations(cutPatterns, ({ one }) => ({
  cutList: one(cutLists, {
    fields: [cutPatterns.cutListId],
    references: [cutLists.id]
  }),
  stock: one(cutListStock, {
    fields: [cutPatterns.stockId],
    references: [cutListStock.id]
  })
}));
```

### Optimization Algorithm Architecture

**Location:** `src/lib/server/optimizer/`

```
src/lib/server/optimizer/
  index.ts                  -> Main export, algorithm selector
  linear.ts                 -> 1D bin packing (First Fit Decreasing)
  sheet.ts                  -> 2D nesting (Guillotine algorithm)
  types.ts                  -> Shared types
```

**Algorithm interface:**

```typescript
// src/lib/server/optimizer/types.ts
export interface Stock {
  id: string;
  length: number;
  width?: number;
  quantity: number;
}

export interface Cut {
  id: string;
  length: number;
  width?: number;
  quantity: number;
}

export interface Placement {
  cutId: string;
  x: number;
  y?: number;       // For 2D only
  rotated?: boolean; // For 2D only
}

export interface Pattern {
  stockId: string;
  placements: Placement[];
  wastePercentage: number;
}

export interface OptimizationResult {
  patterns: Pattern[];
  totalWaste: number;
  efficiency: number;
  unplacedCuts: string[]; // Cuts that couldn't fit
}
```

**Linear optimizer (1D bin packing):**

```typescript
// src/lib/server/optimizer/linear.ts
// First Fit Decreasing (FFD) algorithm
// Sort cuts by length descending, place in first stock that fits

export function optimizeLinear(
  stock: Stock[],
  cuts: Cut[],
  kerfWidth: number
): OptimizationResult {
  // 1. Expand cuts by quantity
  // 2. Sort by length descending
  // 3. For each cut, find first stock with space
  // 4. If no stock fits, try next stock unit
  // 5. Track placements and compute waste
}
```

**Sheet optimizer (2D nesting):**

```typescript
// src/lib/server/optimizer/sheet.ts
// Guillotine algorithm with best-fit heuristic
// Recursively subdivide sheet into regions

export function optimizeSheet(
  stock: Stock[],
  cuts: Cut[],
  kerfWidth: number
): OptimizationResult {
  // 1. Expand cuts by quantity
  // 2. Sort by area descending (or perimeter)
  // 3. Use guillotine algorithm to place cuts
  // 4. Consider rotation for better fit
  // 5. Track placements with x,y coordinates
}
```

**API integration:**

```typescript
// src/routes/api/cutlist/optimize/+server.ts
import { optimizeLinear, optimizeSheet } from '$lib/server/optimizer';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { mode, stock, cuts, kerfWidth } = await request.json();

  const result = mode === 'linear'
    ? optimizeLinear(stock, cuts, kerfWidth)
    : optimizeSheet(stock, cuts, kerfWidth);

  return json(result);
};
```

### SVG Diagram Generation

**Location:** `src/lib/components/cutlist/`

**Pattern:**
- Diagrams generated client-side using SVG
- No server-side rendering needed
- Component receives pattern data, renders placements

```typescript
// src/lib/components/cutlist/CutDiagram.svelte
<script lang="ts">
  import type { Pattern, Stock } from '$lib/server/optimizer/types';

  interface Props {
    pattern: Pattern;
    stock: Stock;
    scale?: number;  // Pixels per inch
  }

  let { pattern, stock, scale = 4 }: Props = $props();

  // Calculate SVG dimensions
  const svgWidth = $derived(stock.length * scale);
  const svgHeight = $derived((stock.width ?? 4) * scale);
</script>

<svg
  viewBox="0 0 {svgWidth} {svgHeight}"
  class="cut-diagram"
>
  <!-- Stock outline -->
  <rect x="0" y="0" width={svgWidth} height={svgHeight} class="stock" />

  <!-- Cut placements -->
  {#each pattern.placements as placement}
    <rect
      x={placement.x * scale}
      y={(placement.y ?? 0) * scale}
      width={...}
      height={...}
      class="cut"
    />
    <text ...>{placement.cutId}</text>
  {/each}

  <!-- Waste visualization -->
  ...
</svg>
```

### Drag-Drop Component Architecture

**Pattern:** Native HTML5 drag-drop with Svelte 5 state

**Components:**
```
src/lib/components/cutlist/
  CutListEditor.svelte      -> Main editor container
  StockList.svelte          -> Draggable stock items
  CutList.svelte            -> Draggable cut items
  DropZone.svelte           -> Drop target for assignments
  StockItem.svelte          -> Individual stock item
  CutItem.svelte            -> Individual cut item
```

**Drag-drop state management:**

```typescript
// src/lib/components/cutlist/CutListEditor.svelte
<script lang="ts">
  let draggedItem = $state<{ type: 'stock' | 'cut'; id: string } | null>(null);
  let assignments = $state<Map<string, string[]>>(new Map()); // stockId -> cutIds[]

  function handleDragStart(type: 'stock' | 'cut', id: string) {
    draggedItem = { type, id };
  }

  function handleDrop(targetStockId: string) {
    if (draggedItem?.type === 'cut') {
      // Assign cut to stock
      const existing = assignments.get(targetStockId) ?? [];
      assignments.set(targetStockId, [...existing, draggedItem.id]);
    }
    draggedItem = null;
  }

  function handleDragEnd() {
    draggedItem = null;
  }
</script>
```

### BOM Integration

**Auto-filter lumber items:**

```typescript
// src/routes/cutlist/new/+page.server.ts
export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirect=/cutlist/new');
  }

  const bomId = url.searchParams.get('bom');
  let lumberItems: BOMItem[] = [];

  if (bomId) {
    const bom = await db.query.boms.findFirst({
      where: eq(boms.id, bomId),
      with: { items: true, project: true }
    });

    // Security: verify user owns the BOM's project
    if (bom?.project.userId !== locals.user.id) {
      throw error(403, 'Access denied');
    }

    // Filter to lumber category only
    lumberItems = bom.items.filter(item =>
      item.category === 'lumber' && !item.hidden
    );
  }

  return { lumberItems };
};
```

### Integration Points Summary

| Area | New Files | Modified Files |
|------|-----------|----------------|
| Routes | `src/routes/cutlist/**/*` | None |
| Schema | - | `src/lib/server/schema.ts` (add 4 tables + relations) |
| Optimizer | `src/lib/server/optimizer/*` | None |
| Components | `src/lib/components/cutlist/*` | None |
| API | `src/routes/api/cutlist/**/*` | None |
| Sidebar | - | `src/lib/components/Sidebar.svelte` (add Cut List link) |

### Build Order for Cut List Optimizer

1. **Schema** - Add cutLists, cutListStock, cutListCuts, cutPatterns tables
2. **Basic routes** - /cutlist landing page, /cutlist/new skeleton
3. **Stock/cut management** - CRUD for stock and cuts
4. **Linear optimizer** - 1D bin packing algorithm
5. **SVG diagrams** - Linear diagram component
6. **BOM integration** - Auto-import lumber from BOMs
7. **Sheet optimizer** - 2D nesting algorithm (more complex)
8. **2D diagrams** - Sheet diagram component
9. **Persistence** - Save/load cut lists
10. **Shop checklist** - Completion tracking

---

## Email Flows Architecture

### Email Service Integration

**Recommendation:** Use a transactional email service. Options:

| Service | Free Tier | Pros | Cons |
|---------|-----------|------|------|
| Resend | 3,000/month | Simple API, good DX | Newer service |
| SendGrid | 100/day | Established, reliable | Complex setup |
| Mailgun | 5,000/month | Good deliverability | Requires domain verify |
| Postmark | 100/month | Great transactional focus | Limited free tier |

**Recommendation:** Resend for simplicity. Modern API, good SvelteKit examples.

**Implementation pattern:**

```typescript
// src/lib/server/email.ts
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: 'WoodShop Toolbox <noreply@yourdomain.com>',
    to,
    subject: 'Reset your password',
    html: `
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
    `
  });
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  await resend.emails.send({
    from: 'WoodShop Toolbox <noreply@yourdomain.com>',
    to,
    subject: 'Verify your email',
    html: `
      <p>Click the link below to verify your email address:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `
  });
}
```

### Password Reset Flow

**Routes:**
```
/auth/forgot-password       -> Request reset email
/auth/reset-password        -> Enter new password (with token)
```

**Flow:**

```
1. User visits /auth/forgot-password
2. Submits email address
3. Server:
   - Finds user by email
   - Generates cryptographic token
   - Stores token in password_reset_tokens (expires in 1 hour)
   - Sends email with reset link
4. User clicks link: /auth/reset-password?token=xxx
5. Server validates token (not expired, not used)
6. User submits new password
7. Server:
   - Updates user.passwordHash
   - Deletes reset token
   - Optionally invalidates all sessions
8. Redirect to login
```

**Implementation:**

```typescript
// src/routes/auth/forgot-password/+page.server.ts
export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().trim().toLowerCase();

    if (!email) {
      return fail(400, { error: 'Email is required' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true };
    }

    // Generate token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Delete any existing tokens for this user
    await db.delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id));

    // Create new token
    await db.insert(passwordResetTokens).values({
      id: crypto.randomUUID(),
      userId: user.id,
      token,
      expiresAt,
      createdAt: new Date()
    });

    // Send email
    const resetUrl = `${env.PUBLIC_BASE_URL}/auth/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    return { success: true };
  }
};
```

```typescript
// src/routes/auth/reset-password/+page.server.ts
export const load: PageServerLoad = async ({ url }) => {
  const token = url.searchParams.get('token');

  if (!token) {
    throw error(400, 'Reset token is required');
  }

  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.token, token)
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    throw error(400, 'Invalid or expired reset token');
  }

  return { token };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const token = data.get('token')?.toString();
    const password = data.get('password')?.toString();

    if (!token || !password) {
      return fail(400, { error: 'Token and password required' });
    }

    if (password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters' });
    }

    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.token, token)
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return fail(400, { error: 'Invalid or expired reset token' });
    }

    // Update password
    const passwordHash = await hashPassword(password);
    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, resetToken.userId));

    // Delete token
    await db.delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, resetToken.id));

    // Optionally invalidate all sessions
    await db.delete(sessions)
      .where(eq(sessions.userId, resetToken.userId));

    throw redirect(302, '/auth/login?reset=success');
  }
};
```

### Email Verification Flow

**Routes:**
```
/auth/verify-email          -> Handle verification link
/auth/verify-email-required -> Prompt to verify (for restricted features)
/auth/resend-verification   -> Resend verification email
```

**Flow:**

```
1. User signs up at /auth/signup
2. Server:
   - Creates user with emailVerified=false
   - Generates verification token
   - Sends verification email
3. User clicks link: /auth/verify-email?token=xxx
4. Server validates token, sets emailVerified=true
5. Redirect to dashboard with success message

Optional: Restrict certain features until verified
```

**Modify signup to send verification:**

```typescript
// src/routes/auth/signup/+page.server.ts
export const actions: Actions = {
  default: async ({ request, cookies }) => {
    // ... existing validation ...

    // Create user (emailVerified defaults to false)
    const id = crypto.randomUUID();
    await db.insert(users).values({
      id,
      email,
      passwordHash: await hashPassword(password),
      createdAt: new Date()
    });

    // Create verification token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.insert(emailVerificationTokens).values({
      id: crypto.randomUUID(),
      userId: id,
      token,
      expiresAt,
      createdAt: new Date()
    });

    // Send verification email
    const verifyUrl = `${env.PUBLIC_BASE_URL}/auth/verify-email?token=${token}`;
    await sendVerificationEmail(email, verifyUrl);

    // Create session
    await createSession(id, cookies);

    throw redirect(302, '/');
  }
};
```

### Integration Points Summary

| Area | New Files | Modified Files |
|------|-----------|----------------|
| Schema | - | `src/lib/server/schema.ts` (token tables) |
| Email service | `src/lib/server/email.ts` | - |
| Routes | `src/routes/auth/forgot-password/*`, `src/routes/auth/reset-password/*`, `src/routes/auth/verify-email/*` | `src/routes/auth/signup/+page.server.ts` |
| Environment | - | `.env.example` (add RESEND_API_KEY, PUBLIC_BASE_URL) |

### Build Order for Email Flows

1. **Choose email service** - Set up account, get API key
2. **Add email utility** - `src/lib/server/email.ts`
3. **Schema changes** - Token tables
4. **Password reset** - Forgot password and reset password routes
5. **Email verification** - Modify signup, add verify route
6. **Resend flow** - Allow re-requesting verification email

---

## Suggested Phase Structure

Based on dependencies and integration points:

### Phase 1: RBAC Foundation
**Goal:** Users have roles, admin routes are protected.

**Tasks:**
1. Add `role`, `emailVerified`, `disabled` columns to users
2. Update hooks.server.ts to include role in user object
3. Update app.d.ts interface
4. Create guards.ts helper functions
5. Add role check to /admin/templates (already exists)
6. Seed initial admin user via migration

**Dependencies:** None (builds on existing auth)

### Phase 2: Admin User Management
**Goal:** Admin can create, edit, disable users.

**Tasks:**
1. Create /admin/users route
2. Create user list and edit components
3. Implement user CRUD API endpoints
4. Add password reset by admin
5. Add account disable/enable

**Dependencies:** Phase 1 (RBAC)

### Phase 3: Email Infrastructure
**Goal:** Email service integrated and working.

**Tasks:**
1. Set up Resend account and verify domain
2. Implement email utility functions
3. Add token tables to schema
4. Implement password reset flow
5. Implement email verification flow
6. Modify signup to send verification email

**Dependencies:** Phase 1 (emailVerified field)

### Phase 4: BOM Refinements
**Goal:** Eye icon toggle, lumber dimensions, board feet.

**Tasks:**
1. Replace checkbox with eye icon in BOMItem
2. Add dimension fields to bomItems schema (if needed) or BOM type
3. Implement board feet calculation utility
4. Display board feet in BOM display

**Dependencies:** None (can run parallel with Phase 1-3)

### Phase 5: Cut List Optimizer - Foundation
**Goal:** Basic cut list CRUD and linear mode.

**Tasks:**
1. Add cut list tables to schema
2. Create /cutlist routes structure
3. Implement stock and cut management UI
4. Implement linear optimizer algorithm
5. Create linear diagram component
6. Implement BOM lumber import

**Dependencies:** None (can start early)

### Phase 6: Cut List Optimizer - Advanced
**Goal:** Sheet mode, full persistence, shop checklist.

**Tasks:**
1. Implement sheet optimizer algorithm
2. Create 2D diagram component
3. Implement drag-drop material assignment
4. Add persistence (save/load cut lists)
5. Implement shop checklist with completion tracking
6. Add waste/efficiency reporting

**Dependencies:** Phase 5

---

## Component Inventory

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AdminUserList.svelte` | `src/lib/components/admin/` | User management table |
| `AdminUserForm.svelte` | `src/lib/components/admin/` | User edit/create form |
| `CutListEditor.svelte` | `src/lib/components/cutlist/` | Main cut list editor |
| `StockList.svelte` | `src/lib/components/cutlist/` | Stock material list |
| `StockItem.svelte` | `src/lib/components/cutlist/` | Individual stock item |
| `CutList.svelte` | `src/lib/components/cutlist/` | Required cuts list |
| `CutItem.svelte` | `src/lib/components/cutlist/` | Individual cut item |
| `CutDiagram.svelte` | `src/lib/components/cutlist/` | SVG cut pattern diagram |
| `DropZone.svelte` | `src/lib/components/cutlist/` | Drag-drop target |
| `ShopChecklist.svelte` | `src/lib/components/cutlist/` | Completion tracker |
| `WasteReport.svelte` | `src/lib/components/cutlist/` | Efficiency statistics |
| `ForgotPasswordForm.svelte` | `src/lib/components/auth/` | Email input form |
| `ResetPasswordForm.svelte` | `src/lib/components/auth/` | New password form |

### Modified Components

| Component | Changes |
|-----------|---------|
| `BOMItem.svelte` | Replace checkbox with eye icon |
| `Sidebar.svelte` | Add Cut List tool link |
| `Header.svelte` | Show admin badge for admin users |

---

## Risk Factors

### High Risk

1. **Email deliverability** - Emails may land in spam. Mitigate with proper SPF/DKIM setup on sending domain.

2. **2D nesting complexity** - Guillotine algorithm is non-trivial. Start with simpler first-fit approach, optimize later.

3. **Token security** - Reset/verification tokens must be cryptographically random and time-limited. Use crypto.randomUUID() and strict expiration.

### Medium Risk

1. **Schema migration** - Multiple new tables and columns. Test migrations thoroughly on dev database.

2. **Drag-drop UX** - HTML5 drag-drop can be finicky on touch devices. May need fallback or alternative UI.

3. **SVG performance** - Complex cut patterns with many pieces may render slowly. Consider pagination or simplification.

### Low Risk

1. **RBAC integration** - Straightforward extension of existing auth pattern.

2. **BOM refinements** - Isolated changes to existing components.

3. **Linear optimizer** - Well-understood algorithm (FFD).

---

## Sources and Confidence

**Confidence: MEDIUM**

This research is based on:
- Direct analysis of existing v2.0 codebase
- SvelteKit patterns established in v2.0 implementation
- Standard bin packing algorithm knowledge
- Common email service integration patterns

**Items needing validation:**
- Resend API specifics (verify with their documentation)
- 2D nesting algorithm performance (prototype and benchmark)
- Drag-drop accessibility on touch devices (user testing)
- SVG rendering limits (test with large patterns)

**Assumptions:**
- Email service will have domain verification set up
- Turso can handle the additional tables without performance issues
- Users have modern browsers supporting HTML5 drag-drop

---

## Quality Gate Checklist

- [x] Integration points clearly identified
- [x] New vs modified components explicit
- [x] Build order considers existing dependencies
- [x] Schema changes documented with migration implications
- [x] Algorithm locations specified
- [x] Security considerations addressed (token expiration, role checks)
