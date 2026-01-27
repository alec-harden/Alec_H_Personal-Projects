# Phase 9: Project Management - Research

**Researched:** 2026-01-27
**Domain:** SvelteKit CRUD operations with Drizzle ORM
**Confidence:** HIGH

## Summary

Phase 9 implements project management CRUD operations for authenticated users. The existing codebase provides clear, consistent patterns from Phase 8 (Authentication) that should be followed. The projects table already exists in the schema but needs to be extended with `userId`, `description`, and `notes` fields.

The implementation follows established SvelteKit patterns: form actions for mutations, +page.server.ts for server-side data loading, and the existing auth middleware in hooks.server.ts that populates `locals.user`. Protected routes should check `locals.user` and redirect to login if not authenticated.

**Primary recommendation:** Extend existing projects table schema, create /projects route with list view, /projects/[id] for detail/edit, and use SvelteKit form actions for all mutations. Follow the auth route patterns exactly.

## Standard Stack

The stack is already established - no new libraries needed.

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SvelteKit | 2.49.1 | Framework | Already in use, file-based routing |
| Drizzle ORM | 0.45.1 | Database | Already in use for users/sessions |
| @libsql/client | 0.17.0 | Turso/SQLite | Already configured |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-orm | 0.45.1 | Schema definitions, queries | All DB operations |
| $app/forms enhance | built-in | Progressive enhancement | All form submissions |

### No New Dependencies Needed
The project has everything required. Do not add any new libraries.

**Installation:** None required - all dependencies are present.

## Architecture Patterns

### Existing Project Structure
```
src/
├── routes/
│   ├── +layout.server.ts       # Provides user to all pages
│   ├── +layout.svelte          # Passes user to Header
│   ├── auth/
│   │   ├── login/
│   │   │   ├── +page.server.ts # load() + actions
│   │   │   └── +page.svelte
│   │   ├── signup/             # Same pattern
│   │   └── logout/             # actions only
├── lib/
│   ├── server/
│   │   ├── schema.ts           # Drizzle schema
│   │   ├── db.ts               # Database connection
│   │   └── auth.ts             # Auth helpers
│   └── components/
│       ├── ProjectCard.svelte  # Already exists!
│       └── UserMenu.svelte     # Auth-aware component
```

### New Routes to Create
```
src/routes/
├── projects/
│   ├── +page.server.ts         # Load user's projects, handle create
│   ├── +page.svelte            # List view with create form
│   └── [id]/
│       ├── +page.server.ts     # Load project, handle edit/delete
│       └── +page.svelte        # Detail view with edit form
```

### Pattern 1: Protected Route with Load Function
**What:** Server load function that requires authentication
**When to use:** Any route that needs user data
**Example:**
```typescript
// Source: Existing pattern from auth/login/+page.server.ts (inverted)
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
    // Redirect if NOT logged in
    if (!locals.user) {
        throw redirect(302, '/auth/login?redirect=/projects');
    }

    const userProjects = await db.query.projects.findMany({
        where: eq(projects.userId, locals.user.id),
        orderBy: (projects, { desc }) => [desc(projects.updatedAt)]
    });

    return { projects: userProjects };
};
```

### Pattern 2: Form Actions for CRUD
**What:** SvelteKit form actions for mutations
**When to use:** Create, update, delete operations
**Example:**
```typescript
// Source: Existing pattern from auth/signup/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/schema';

export const actions: Actions = {
    create: async ({ request, locals }) => {
        if (!locals.user) {
            throw redirect(302, '/auth/login');
        }

        const data = await request.formData();
        const name = data.get('name')?.toString().trim();
        const description = data.get('description')?.toString().trim() || null;

        if (!name || name.length < 1) {
            return fail(400, { error: 'Project name is required', name, description });
        }

        const id = crypto.randomUUID();
        const now = new Date();

        await db.insert(projects).values({
            id,
            userId: locals.user.id,
            name,
            description,
            notes: null,
            createdAt: now,
            updatedAt: now
        });

        throw redirect(302, `/projects/${id}`);
    }
};
```

### Pattern 3: Client Form with Progressive Enhancement
**What:** Form using `use:enhance` for no-JS fallback
**When to use:** All forms
**Example:**
```svelte
<!-- Source: Existing pattern from auth/login/+page.svelte -->
<script lang="ts">
    import { enhance } from '$app/forms';

    let loading = $state(false);
</script>

<form
    method="POST"
    action="?/create"
    use:enhance={() => {
        loading = true;
        return async ({ update }) => {
            await update();
            loading = false;
        };
    }}
>
    <!-- form fields -->
    <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Project'}
    </button>
</form>
```

### Pattern 4: Delete with Confirmation
**What:** Delete action with client-side confirmation
**When to use:** Destructive operations
**Example:**
```svelte
<!-- New pattern based on existing button styles -->
<form method="POST" action="?/delete" use:enhance>
    <button
        type="submit"
        class="btn-secondary"
        onclick={(e) => {
            if (!confirm('Delete this project? This cannot be undone.')) {
                e.preventDefault();
            }
        }}
    >
        Delete Project
    </button>
</form>
```

### Anti-Patterns to Avoid
- **API routes for simple CRUD:** Use form actions instead of /api/projects endpoints
- **Client-side auth checks only:** Always verify auth server-side in load/actions
- **Direct db access in +page.svelte:** All DB operations go in +page.server.ts
- **New component library:** Use existing CSS classes (btn-primary, input-field, etc.)

## Don't Hand-Roll

Problems that have existing solutions in the codebase:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| User authentication check | Custom middleware | `locals.user` from hooks.server.ts | Already implemented |
| Form handling | Fetch API | SvelteKit form actions + enhance | Progressive enhancement |
| UUID generation | uuid library | `crypto.randomUUID()` | Built-in, already used |
| Timestamps | moment/date-fns | `new Date()` | Simple, already used |
| Form validation feedback | Custom state | `fail()` + `form` prop | SvelteKit standard |
| Project card display | New component | Existing `ProjectCard.svelte` | Already exists! |

**Key insight:** The codebase has established patterns. Phase 9 should copy auth route patterns, not invent new ones.

## Common Pitfalls

### Pitfall 1: Forgetting Auth Check in Actions
**What goes wrong:** Form action executes without verifying user
**Why it happens:** Load function checks auth but action doesn't
**How to avoid:** ALWAYS check `locals.user` at start of every action
**Warning signs:** Actions that access `locals.user.id` without null check

### Pitfall 2: Missing userId in Queries
**What goes wrong:** User can see/edit other users' projects
**Why it happens:** Query doesn't filter by userId
**How to avoid:** Always include `where: eq(projects.userId, locals.user.id)`
**Warning signs:** Queries that only filter by project id

### Pitfall 3: Not Updating updatedAt
**What goes wrong:** Last modified time is stale
**Why it happens:** Forgetting to set updatedAt on edits
**How to avoid:** Always set `updatedAt: new Date()` on UPDATE
**Warning signs:** Projects showing wrong "last updated" time

### Pitfall 4: Redirect Without Preserving Return Path
**What goes wrong:** User loses context after login
**Why it happens:** Not passing redirect parameter
**How to avoid:** Use `/auth/login?redirect=/projects` pattern
**Warning signs:** User always returns to home after login

### Pitfall 5: Form Resubmission on Refresh
**What goes wrong:** Duplicate records on page refresh
**Why it happens:** Not redirecting after successful action
**How to avoid:** Always `throw redirect()` after successful mutation
**Warning signs:** "Confirm form resubmission" dialog on refresh

## Code Examples

Verified patterns from the existing codebase:

### Schema Extension for Projects
```typescript
// Source: Extend existing src/lib/server/schema.ts
export const projects = sqliteTable('projects', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// Add relation
export const projectsRelations = relations(projects, ({ one }) => ({
    user: one(users, {
        fields: [projects.userId],
        references: [users.id]
    })
}));

// Update users relation
export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
    projects: many(projects)  // Add this
}));
```

### Project List Page (load + create action)
```typescript
// Source: Pattern from auth routes
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(302, '/auth/login?redirect=/projects');
    }

    const userProjects = await db.query.projects.findMany({
        where: eq(projects.userId, locals.user.id),
        orderBy: [desc(projects.updatedAt)]
    });

    return { projects: userProjects };
};

export const actions: Actions = {
    create: async ({ request, locals }) => {
        if (!locals.user) {
            throw redirect(302, '/auth/login');
        }

        const data = await request.formData();
        const name = data.get('name')?.toString().trim();
        const description = data.get('description')?.toString().trim() || null;

        if (!name) {
            return fail(400, { error: 'Project name is required' });
        }

        const id = crypto.randomUUID();
        const now = new Date();

        await db.insert(projects).values({
            id,
            userId: locals.user.id,
            name,
            description,
            notes: null,
            createdAt: now,
            updatedAt: now
        });

        throw redirect(302, `/projects/${id}`);
    }
};
```

### Project Detail Page (load + edit + delete)
```typescript
// Source: Pattern from auth routes
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        throw redirect(302, '/auth/login?redirect=/projects/' + params.id);
    }

    const project = await db.query.projects.findFirst({
        where: and(
            eq(projects.id, params.id),
            eq(projects.userId, locals.user.id)
        )
    });

    if (!project) {
        throw error(404, 'Project not found');
    }

    return { project };
};

export const actions: Actions = {
    update: async ({ request, locals, params }) => {
        if (!locals.user) throw redirect(302, '/auth/login');

        const data = await request.formData();
        const name = data.get('name')?.toString().trim();
        const description = data.get('description')?.toString().trim() || null;
        const notes = data.get('notes')?.toString().trim() || null;

        if (!name) {
            return fail(400, { error: 'Project name is required' });
        }

        await db.update(projects)
            .set({ name, description, notes, updatedAt: new Date() })
            .where(and(
                eq(projects.id, params.id),
                eq(projects.userId, locals.user.id)
            ));

        return { success: true };
    },

    delete: async ({ locals, params }) => {
        if (!locals.user) throw redirect(302, '/auth/login');

        await db.delete(projects)
            .where(and(
                eq(projects.id, params.id),
                eq(projects.userId, locals.user.id)
            ));

        throw redirect(302, '/projects');
    }
};
```

### Button and Form Styling (Existing Classes)
```svelte
<!-- Use existing CSS classes from app.css -->

<!-- Primary action button -->
<button type="submit" class="btn-primary">Create Project</button>

<!-- Secondary/Cancel button -->
<button type="button" class="btn-secondary">Cancel</button>

<!-- Ghost/text button -->
<button type="button" class="btn-ghost">Back</button>

<!-- Input field -->
<input type="text" class="input-field" placeholder="Project name" />

<!-- Card container -->
<div class="artisan-card">...</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API routes for CRUD | Form actions | SvelteKit 1.0+ | Simpler, progressive enhancement |
| Client fetch + state | use:enhance | SvelteKit 1.0+ | Better UX, no JS required |
| Manual auth middleware | hooks.server.ts | SvelteKit 1.0+ | Centralized auth handling |

**Deprecated/outdated:**
- `/api/projects` REST endpoints: Use form actions instead (already the pattern in this codebase)

## Open Questions

Things that were resolved during research:

1. **ProjectCard component exists** - Already in codebase with progress bar, last updated time. May need minor modifications or new variant for project list.

2. **Dashboard integration** - The home page shows sample projects. Phase 9 should update this to show real user projects when authenticated.

## Sources

### Primary (HIGH confidence)
- `src/lib/server/schema.ts` - Existing schema with projects table stub
- `src/routes/auth/login/+page.server.ts` - Load + actions pattern
- `src/routes/auth/signup/+page.server.ts` - Form validation pattern
- `src/hooks.server.ts` - Auth middleware pattern
- `src/app.d.ts` - App.Locals.user type definition

### Secondary (HIGH confidence)
- `src/lib/components/ProjectCard.svelte` - Existing project display component
- `src/routes/+layout.server.ts` - User data flow to client
- `src/app.css` - Button, input, card styling classes

### No External Research Needed
All patterns exist in the codebase. SvelteKit and Drizzle documentation confirm these are standard approaches.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Already established in project
- Architecture: HIGH - Clear patterns from auth implementation
- Pitfalls: HIGH - Based on common CRUD mistakes + existing code review

**Research date:** 2026-01-27
**Valid until:** Indefinite - patterns are stable, internal to codebase
