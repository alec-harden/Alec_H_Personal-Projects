# Phase 11: Template Management - Research

**Researched:** 2026-01-28
**Domain:** Database-backed template storage with admin CRUD interface
**Confidence:** HIGH

## Summary

This phase migrates hardcoded project templates from TypeScript files to database storage with a complete admin CRUD interface. The research identified proven patterns for handling complex JSON data structures in SQLite, SvelteKit form-based CRUD operations, and secure admin route protection.

The existing codebase already implements the foundational patterns needed: custom authentication with session management in hooks.server.ts, route protection via locals.user checks, and optimistic UI updates with API endpoints. Templates contain complex nested data (joinery options array, dimension ranges, string arrays) that map well to SQLite's text-based JSON columns.

**Primary recommendation:** Use Drizzle's `text({ mode: 'json' }).$type<T>()` for type-safe JSON columns, implement standard SvelteKit form actions for CRUD, create a seed script to migrate existing templates, and protect admin routes with the existing session-based authentication.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Drizzle ORM | Current (project uses) | Schema definition and queries | Already integrated, excellent SQLite JSON support |
| SvelteKit Form Actions | 2.x | Server-side form handling | Framework native, progressive enhancement built-in |
| text({ mode: 'json' }) | Drizzle SQLite | JSON column storage | Supports SQLite JSON functions, recommended over blob |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-seed | Latest | Database seeding | For migration script to populate initial templates |
| Zod | Latest (optional) | Form validation | If complex validation needed beyond basic checks |
| use:enhance | SvelteKit built-in | Progressive enhancement | For all forms to add loading states and optimistic UI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Form actions | Superforms library | Superforms adds schema validation and nested data utilities but increases complexity - not needed for this straightforward CRUD |
| JSON in text column | Separate tables for joinery | Normalized design is more "correct" but adds complexity when templates are atomic units read/written together |
| Manual parsing | 'flat' package for FormData | Useful for deep nesting but current template structure is shallow enough for manual handling |

**Installation:**
```bash
# No new dependencies required - all tools already in project
# Optional: Add drizzle-seed if using their seeding utilities
npm install drizzle-seed --save-dev
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── routes/
│   ├── admin/
│   │   └── templates/
│   │       ├── +page.server.ts      # List + Create action
│   │       ├── +page.svelte         # Template list UI with create form
│   │       └── [id]/
│   │           ├── +page.server.ts  # Load + Update/Delete actions
│   │           └── +page.svelte     # Edit form + delete button
│   └── api/
│       └── templates/
│           └── +server.ts           # GET endpoint for BOM wizard
├── lib/
│   ├── server/
│   │   └── schema.ts                # Add templates table
│   └── data/
│       └── templates.ts             # Keep types, remove hardcoded data
└── scripts/
    └── seed-templates.ts            # Migration script
```

### Pattern 1: Text-based JSON Columns
**What:** Store complex objects in SQLite text columns with JSON mode
**When to use:** When data is read/written as atomic units (templates are never partially updated)
**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/column-types/sqlite
import { text, sqliteTable, integer } from 'drizzle-orm/sqlite-core';

interface DimensionRange {
  min: number;
  max: number;
  default: number;
}

interface JoineryOption {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  description: text('description').notNull(),

  // JSON columns with type safety
  defaultDimensions: text('default_dimensions', { mode: 'json' })
    .$type<{
      length: DimensionRange;
      width: DimensionRange;
      height?: DimensionRange;
      unit: 'inches';
    }>()
    .notNull(),

  joineryOptions: text('joinery_options', { mode: 'json' })
    .$type<JoineryOption[]>()
    .notNull(),

  // Simple string arrays as JSON
  suggestedWoods: text('suggested_woods', { mode: 'json' })
    .$type<string[]>()
    .notNull(),

  suggestedFinishes: text('suggested_finishes', { mode: 'json' })
    .$type<string[]>()
    .notNull(),

  typicalHardware: text('typical_hardware', { mode: 'json' })
    .$type<string[]>()
    .notNull(),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});
```

**Why this pattern:** Text mode supports SQLite JSON functions (blob mode doesn't), `.$type<T>()` provides compile-time type safety for inserts/selects, and JSON is perfect for data that's always read/written as a complete unit.

### Pattern 2: Protected Admin Routes
**What:** Use existing session authentication to protect admin routes
**When to use:** All admin/* routes requiring authentication
**Example:**
```typescript
// Source: Existing project pattern from src/routes/projects/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Require authentication - locals.user is set by hooks.server.ts
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirect=/admin/templates');
  }

  // Load templates from database
  const allTemplates = await db.query.templates.findMany({
    orderBy: [asc(templates.name)]
  });

  return { templates: allTemplates };
};
```

**Why this pattern:** Hooks.server.ts already validates sessions and attaches user to locals, consistent with existing project routes, and provides automatic redirect to login with return path.

### Pattern 3: Form Actions for CRUD
**What:** Use named form actions in +page.server.ts for create, update, delete
**When to use:** Standard CRUD operations with progressive enhancement
**Example:**
```typescript
// Source: https://svelte.dev/docs/kit/form-actions
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) throw redirect(302, '/auth/login');

    const data = await request.formData();
    const name = data.get('name')?.toString().trim();

    // Validation
    if (!name) {
      return fail(400, { error: 'Name is required', name: '' });
    }

    // Parse JSON fields from textarea inputs
    const joineryOptions = JSON.parse(
      data.get('joineryOptions')?.toString() || '[]'
    );

    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(templates).values({
      id,
      name,
      icon: data.get('icon')?.toString() || '&#128736;',
      description: data.get('description')?.toString() || '',
      defaultDimensions: JSON.parse(data.get('defaultDimensions')?.toString() || '{}'),
      joineryOptions,
      suggestedWoods: JSON.parse(data.get('suggestedWoods')?.toString() || '[]'),
      suggestedFinishes: JSON.parse(data.get('suggestedFinishes')?.toString() || '[]'),
      typicalHardware: JSON.parse(data.get('typicalHardware')?.toString() || '[]'),
      createdAt: now,
      updatedAt: now
    });

    throw redirect(302, '/admin/templates');
  },

  update: async ({ request, locals, params }) => {
    if (!locals.user) throw redirect(302, '/auth/login');

    // Similar to create but with WHERE clause
    const data = await request.formData();
    await db.update(templates)
      .set({ /* fields */, updatedAt: new Date() })
      .where(eq(templates.id, params.id));

    return { success: true };
  },

  delete: async ({ locals, params }) => {
    if (!locals.user) throw redirect(302, '/auth/login');

    await db.delete(templates).where(eq(templates.id, params.id));
    throw redirect(302, '/admin/templates');
  }
};
```

**Why this pattern:** Progressive enhancement works without JavaScript, consistent with existing project patterns, and named actions keep operations separate and clear.

### Pattern 4: Seed Script for Migration
**What:** Node script that reads existing template data and inserts into database
**When to use:** One-time migration from hardcoded data to database
**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/seed-overview
import { db } from './src/lib/server/db';
import { templates as templatesTable } from './src/lib/server/schema';
import { templates as hardcodedTemplates } from './src/lib/data/templates';

async function seedTemplates() {
  console.log('Seeding templates...');

  for (const template of hardcodedTemplates) {
    const now = new Date();
    await db.insert(templatesTable).values({
      ...template,
      createdAt: now,
      updatedAt: now
    });
    console.log(`  ✓ ${template.name}`);
  }

  console.log('Seeding complete!');
}

seedTemplates()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
```

**Why this pattern:** Preserves existing data structure exactly, runs once as Node script (not web server), and can be safely re-run on fresh databases.

### Pattern 5: Handling Dynamic Form Arrays
**What:** Use indexed input names for arrays of complex objects
**When to use:** Editing joinery options (array of objects)
**Example:**
```html
<!-- Source: https://www.codingwithjesse.com/blog/use-arrays-with-html-form-inputs/ -->
{#each joineryOptions as option, i}
  <div class="joinery-option">
    <input
      name="joinery.{i}.id"
      value={option.id}
      placeholder="ID (e.g., mortise-tenon)"
    />
    <input
      name="joinery.{i}.name"
      value={option.name}
      placeholder="Name"
    />
    <textarea
      name="joinery.{i}.description"
      placeholder="Description"
    >{option.description}</textarea>
    <select name="joinery.{i}.difficulty">
      <option value="beginner" selected={option.difficulty === 'beginner'}>Beginner</option>
      <option value="intermediate" selected={option.difficulty === 'intermediate'}>Intermediate</option>
      <option value="advanced" selected={option.difficulty === 'advanced'}>Advanced</option>
    </select>
  </div>
{/each}
```

**Server-side parsing:**
```typescript
// Parse indexed array inputs into structured objects
function parseJoineryFromFormData(data: FormData): JoineryOption[] {
  const options: JoineryOption[] = [];
  let i = 0;

  while (data.get(`joinery.${i}.id`) !== null) {
    options.push({
      id: data.get(`joinery.${i}.id`)?.toString() || '',
      name: data.get(`joinery.${i}.name`)?.toString() || '',
      description: data.get(`joinery.${i}.description`)?.toString() || '',
      difficulty: data.get(`joinery.${i}.difficulty`)?.toString() as any
    });
    i++;
  }

  return options;
}
```

**Why this pattern:** Works with native FormData, maintains field order, and supports dynamic add/remove without library dependencies.

### Anti-Patterns to Avoid
- **Blob mode for JSON:** SQLite JSON functions throw errors with blob arguments - always use text mode
- **Normalizing template structure:** Templates are atomic - splitting into multiple tables adds complexity without benefit
- **Client-side only validation:** Forms must validate server-side for security (client validation is UX enhancement)
- **Partial template updates:** Always update complete template object to maintain data consistency
- **Storing templates in session/local storage:** Templates are shared data, not user-specific - they belong in the database

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation library | Custom validation framework | Native HTML5 validation + server-side checks | HTML5 provides required, pattern, min/max; server validates with fail() return |
| JSON parsing errors | Manual try/catch everywhere | Zod schema validation (if needed) | Zod provides type-safe parsing with detailed error messages, but may be overkill for templates |
| Session management | Custom token system | Existing hooks.server.ts pattern | Project already has battle-tested session validation |
| CSRF protection | Custom token generation | SvelteKit's built-in CSRF | SvelteKit automatically handles CSRF for form actions |
| Progressive enhancement | Custom loading states | use:enhance directive | Framework provides callback for loading states and optimistic UI |
| Route authorization | Middleware framework | Load function checks | SvelteKit load functions run before page render, perfect for auth checks |

**Key insight:** SvelteKit's form actions and progressive enhancement patterns handle 90% of CRUD UI patterns. The existing project demonstrates these patterns well (projects CRUD, BOM item editing). Don't introduce libraries unless existing patterns can't handle the requirement.

## Common Pitfalls

### Pitfall 1: Schema-Data Migration Mismatch
**What goes wrong:** Creating the schema and running seed script in wrong order, or seeds failing due to constraint violations
**Why it happens:** Developers run seed script before pushing schema changes, or forget timestamps/required fields
**How to avoid:**
1. Always run `npm run db:push` first to apply schema
2. Then run seed script: `node scripts/seed-templates.ts`
3. Include all required fields in seed data (createdAt, updatedAt)
4. Test seed script on empty database first

**Warning signs:**
- "Table not found" errors when seeding
- "NOT NULL constraint failed" errors
- Seed appears successful but data doesn't show in Drizzle Studio

### Pitfall 2: JSON Parse Errors in Form Handling
**What goes wrong:** Form submissions fail with JSON.parse() errors when users enter malformed JSON in textareas
**Why it happens:** Expecting users to hand-write valid JSON, no client-side syntax checking
**How to avoid:**
- Provide structured form inputs (indexed arrays) instead of raw JSON textareas where possible
- Wrap JSON.parse() in try/catch with user-friendly error messages
- For simple arrays (woods, finishes), use comma-separated text input and split server-side
- For complex objects (dimensions, joinery), use individual form fields per property

**Example:**
```typescript
// BAD: Fails silently or with cryptic error
const woods = JSON.parse(data.get('suggestedWoods'));

// GOOD: User-friendly error handling
const woodsInput = data.get('suggestedWoods')?.toString() || '';
let woods: string[];
try {
  // Support both JSON array and comma-separated
  if (woodsInput.trim().startsWith('[')) {
    woods = JSON.parse(woodsInput);
  } else {
    woods = woodsInput.split(',').map(s => s.trim()).filter(Boolean);
  }
} catch (err) {
  return fail(400, {
    error: 'Invalid wood species format. Use comma-separated values.',
    ...formData
  });
}
```

**Warning signs:**
- Form submissions silently fail
- Generic "500 Internal Server Error" messages
- Users complaining about "invalid input" without guidance

### Pitfall 3: Template ID Conflicts
**What goes wrong:** Creating new template with ID that already exists (either from seed data or another admin)
**Why it happens:** Using template name as ID, or not checking for existence before insert
**How to avoid:**
- Always use crypto.randomUUID() for new templates (not user-provided ID)
- Keep the "id" field as display/reference only in edit form (not editable)
- Alternatively, use database's AUTOINCREMENT integer primary key
- For migration, check if template ID exists before seeding (use INSERT OR IGNORE)

**Example:**
```typescript
// BAD: User-provided ID could conflict
const id = data.get('id')?.toString();
await db.insert(templates).values({ id, /* ... */ });

// GOOD: Generated UUID guarantees uniqueness
const id = crypto.randomUUID();
await db.insert(templates).values({ id, /* ... */ });

// GOOD: Seed script with conflict handling
await db.insert(templates)
  .values({ id: 'table', /* ... */ })
  .onConflictDoNothing(); // SQLite syntax
```

**Warning signs:**
- "UNIQUE constraint failed" errors on insert
- Seed script fails partway through
- Existing templates get overwritten accidentally

### Pitfall 4: Missing Auth Checks in Form Actions
**What goes wrong:** Load function checks auth, but form actions don't - unauthenticated POST requests succeed
**Why it happens:** Assuming load function auth check applies to actions (it doesn't)
**How to avoid:**
- **ALWAYS** check `locals.user` in EVERY action
- Use consistent pattern: `if (!locals.user) throw redirect(302, '/auth/login');`
- Consider helper function for DRY principle

**Example:**
```typescript
// BAD: Auth only in load function
export const load = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/auth/login');
  // ...
};

export const actions = {
  delete: async ({ params }) => {
    // VULNERABLE: No auth check!
    await db.delete(templates).where(eq(templates.id, params.id));
  }
};

// GOOD: Auth in both load and actions
export const actions = {
  delete: async ({ params, locals }) => {
    if (!locals.user) throw redirect(302, '/auth/login');
    await db.delete(templates).where(eq(templates.id, params.id));
  }
};
```

**Warning signs:**
- Security audit reveals unprotected endpoints
- Unauthenticated curl/fetch requests succeed
- Session timeout doesn't prevent form submissions

### Pitfall 5: Forgetting to Update BOM Wizard
**What goes wrong:** Templates migrate to database but BOM wizard still imports hardcoded array
**Why it happens:** Changing data source without updating all consumers
**How to avoid:**
1. Identify all files importing from `src/lib/data/templates.ts`
2. Update BOM wizard to fetch from `/api/templates` or database query
3. Keep template types in templates.ts, remove hardcoded data
4. Search codebase for "from '$lib/data/templates'" to find all imports

**Example:**
```typescript
// Before: BOM wizard imports hardcoded array
import { templates } from '$lib/data/templates';

// After: BOM wizard fetches from database
// Option 1: Load in +page.server.ts
export const load: PageServerLoad = async () => {
  const templates = await db.query.templates.findMany();
  return { templates };
};

// Option 2: API endpoint
// src/routes/api/templates/+server.ts
export async function GET() {
  const templates = await db.query.templates.findMany();
  return json(templates);
}
```

**Warning signs:**
- Template edits don't appear in BOM wizard
- New templates created in admin don't show up
- Have to restart server to see template changes

### Pitfall 6: Text vs Blob Confusion
**What goes wrong:** Using `blob({ mode: 'json' })` then getting errors when querying with SQLite JSON functions
**Why it happens:** Assuming blob and text are interchangeable for JSON storage
**How to avoid:**
- **Always use `text({ mode: 'json' })` for JSON columns**
- SQLite JSON functions (json_extract, etc.) require text, not blob
- Blob is reserved for future SQLite enhancements
- Drizzle documentation explicitly recommends text mode

**Warning signs:**
- "JSON functions throw error if arguments are BLOBs" in logs
- Query works in TypeScript but fails with SQL functions
- Data shows as binary in database browser

## Code Examples

Verified patterns from official sources:

### Complete Template Schema Definition
```typescript
// Source: https://orm.drizzle.team/docs/column-types/sqlite
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export interface JoineryOption {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface DimensionRange {
  min: number;
  max: number;
  default: number;
}

export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(), // HTML entity
  description: text('description').notNull(),

  // Complex nested object
  defaultDimensions: text('default_dimensions', { mode: 'json' })
    .$type<{
      length: DimensionRange;
      width: DimensionRange;
      height?: DimensionRange;
      unit: 'inches';
    }>()
    .notNull(),

  // Array of complex objects
  joineryOptions: text('joinery_options', { mode: 'json' })
    .$type<JoineryOption[]>()
    .notNull(),

  // Simple string arrays
  suggestedWoods: text('suggested_woods', { mode: 'json' })
    .$type<string[]>()
    .notNull(),

  suggestedFinishes: text('suggested_finishes', { mode: 'json' })
    .$type<string[]>()
    .notNull(),

  typicalHardware: text('typical_hardware', { mode: 'json' })
    .$type<string[]>()
    .notNull(),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});
```

### Template List Page with Create Form
```typescript
// +page.server.ts
// Source: Existing project pattern from src/routes/projects/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/schema';
import { asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirect=/admin/templates');
  }

  const allTemplates = await db.query.templates.findMany({
    orderBy: [asc(templates.name)]
  });

  return { templates: allTemplates };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) throw redirect(302, '/auth/login');

    const data = await request.formData();
    const name = data.get('name')?.toString().trim();
    const icon = data.get('icon')?.toString().trim();
    const description = data.get('description')?.toString().trim();

    // Validation
    if (!name || name.length < 1) {
      return fail(400, { error: 'Template name is required' });
    }

    if (!icon) {
      return fail(400, { error: 'Icon is required' });
    }

    // Parse dimensions
    const dimensions = {
      length: {
        min: Number(data.get('length_min')) || 0,
        max: Number(data.get('length_max')) || 100,
        default: Number(data.get('length_default')) || 50
      },
      width: {
        min: Number(data.get('width_min')) || 0,
        max: Number(data.get('width_max')) || 100,
        default: Number(data.get('width_default')) || 50
      },
      height: data.get('has_height') ? {
        min: Number(data.get('height_min')) || 0,
        max: Number(data.get('height_max')) || 100,
        default: Number(data.get('height_default')) || 50
      } : undefined,
      unit: 'inches' as const
    };

    // Parse string arrays (comma-separated)
    const parseList = (input: string | null) =>
      input?.split(',').map(s => s.trim()).filter(Boolean) || [];

    const suggestedWoods = parseList(data.get('suggested_woods')?.toString());
    const suggestedFinishes = parseList(data.get('suggested_finishes')?.toString());
    const typicalHardware = parseList(data.get('typical_hardware')?.toString());

    // Parse joinery options (this would be dynamic form fields)
    const joineryOptions: JoineryOption[] = [];
    let i = 0;
    while (data.get(`joinery.${i}.id`) !== null) {
      joineryOptions.push({
        id: data.get(`joinery.${i}.id`)?.toString() || '',
        name: data.get(`joinery.${i}.name`)?.toString() || '',
        description: data.get(`joinery.${i}.description`)?.toString() || '',
        difficulty: data.get(`joinery.${i}.difficulty`)?.toString() as any
      });
      i++;
    }

    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(templates).values({
      id,
      name,
      icon,
      description: description || '',
      defaultDimensions: dimensions,
      joineryOptions,
      suggestedWoods,
      suggestedFinishes,
      typicalHardware,
      createdAt: now,
      updatedAt: now
    });

    throw redirect(302, `/admin/templates/${id}`);
  }
};
```

### Template Edit Form
```svelte
<!-- +page.svelte -->
<!-- Source: Existing project pattern from src/routes/projects/[id]/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();
  let loading = $state(false);

  // Dynamic joinery options management
  let joineryOptions = $state([...data.template.joineryOptions]);

  function addJoineryOption() {
    joineryOptions.push({
      id: '',
      name: '',
      description: '',
      difficulty: 'beginner'
    });
  }

  function removeJoineryOption(index: number) {
    joineryOptions = joineryOptions.filter((_, i) => i !== index);
  }
</script>

<form
  method="POST"
  action="?/update"
  use:enhance={() => {
    loading = true;
    return async ({ update }) => {
      await update();
      loading = false;
    };
  }}
>
  {#if form?.error}
    <div class="error">{form.error}</div>
  {/if}

  <!-- Basic fields -->
  <label>
    Template Name <span class="required">*</span>
    <input
      type="text"
      name="name"
      value={data.template.name}
      required
    />
  </label>

  <label>
    Icon (HTML entity) <span class="required">*</span>
    <input
      type="text"
      name="icon"
      value={data.template.icon}
      placeholder="&amp;#128736;"
      required
    />
  </label>

  <label>
    Description
    <textarea name="description">{data.template.description}</textarea>
  </label>

  <!-- Dimensions -->
  <fieldset>
    <legend>Length Dimensions</legend>
    <input type="number" name="length_min" value={data.template.defaultDimensions.length.min} />
    <input type="number" name="length_max" value={data.template.defaultDimensions.length.max} />
    <input type="number" name="length_default" value={data.template.defaultDimensions.length.default} />
  </fieldset>

  <!-- Similar for width, height... -->

  <!-- Joinery options (dynamic array) -->
  <fieldset>
    <legend>Joinery Options</legend>
    {#each joineryOptions as option, i}
      <div class="joinery-option">
        <input name="joinery.{i}.id" bind:value={option.id} placeholder="ID" />
        <input name="joinery.{i}.name" bind:value={option.name} placeholder="Name" />
        <textarea name="joinery.{i}.description" bind:value={option.description}></textarea>
        <select name="joinery.{i}.difficulty" bind:value={option.difficulty}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button type="button" onclick={() => removeJoineryOption(i)}>Remove</button>
      </div>
    {/each}
    <button type="button" onclick={addJoineryOption}>Add Joinery Option</button>
  </fieldset>

  <!-- String arrays as comma-separated -->
  <label>
    Suggested Woods (comma-separated)
    <input
      type="text"
      name="suggested_woods"
      value={data.template.suggestedWoods.join(', ')}
      placeholder="oak, walnut, maple"
    />
  </label>

  <button type="submit" disabled={loading}>
    {loading ? 'Saving...' : 'Save Template'}
  </button>
</form>
```

### Seed Script
```typescript
// scripts/seed-templates.ts
// Source: https://orm.drizzle.team/docs/seed-overview
import { db } from '../src/lib/server/db';
import { templates as templatesTable } from '../src/lib/server/schema';
import { templates as hardcodedTemplates } from '../src/lib/data/templates';

async function seedTemplates() {
  console.log('Migrating templates to database...');

  for (const template of hardcodedTemplates) {
    const now = new Date();

    try {
      await db.insert(templatesTable).values({
        id: template.id,
        name: template.name,
        icon: template.icon,
        description: template.description,
        defaultDimensions: template.defaultDimensions,
        joineryOptions: template.joineryOptions,
        suggestedWoods: template.suggestedWoods,
        suggestedFinishes: template.suggestedFinishes,
        typicalHardware: template.typicalHardware,
        createdAt: now,
        updatedAt: now
      });

      console.log(`  ✓ ${template.name}`);
    } catch (err) {
      console.error(`  ✗ ${template.name}: ${err.message}`);
    }
  }

  console.log('Migration complete!');
}

seedTemplates()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
```

### API Endpoint for BOM Wizard
```typescript
// src/routes/api/templates/+server.ts
// Source: Existing API pattern from src/routes/api/bom/[id]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/schema';
import { asc } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
  const allTemplates = await db.query.templates.findMany({
    orderBy: [asc(templates.name)]
  });

  return json(allTemplates);
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded template array in TypeScript | Database-backed templates | Phase 11 | Enables runtime template management, no code deploys for template changes |
| Blob JSON columns | Text JSON columns | Drizzle best practices (2024+) | Enables SQLite JSON functions, better query capabilities |
| Superforms for all forms | Native form actions for simple CRUD | SvelteKit 2.x maturity | Reduces dependencies, simpler code for straightforward operations |
| Separate route + API pattern | Form actions only | SvelteKit pattern evolution | Progressive enhancement built-in, less boilerplate |

**Deprecated/outdated:**
- **Lucia Auth:** Deprecated in 2024, project uses custom auth with oslo utilities instead
- **Blob mode for JSON:** Still supported but text mode recommended since Drizzle 1.0
- **Client-side template storage:** Never appropriate for shared configuration data

## Open Questions

Things that couldn't be fully resolved:

1. **Multi-user template editing conflicts**
   - What we know: Project is single-user focused but database design is multi-user ready
   - What's unclear: Should templates be globally shared or user-specific? Can any user edit any template?
   - Recommendation: Phase 11 assumes global shared templates (no user_id FK). If future phases add multiple woodworkers, consider template ownership or approval workflow

2. **Template versioning**
   - What we know: Templates have updatedAt timestamp but no version history
   - What's unclear: Should editing a template create a new version or update in place? What happens to existing BOMs that reference old template structure?
   - Recommendation: For v1, update in place. BOMs store project type as string, not FK to template, so they're decoupled. Consider versioning if users request "restore old template" feature

3. **Template validation complexity**
   - What we know: Templates have complex nested structures that could be invalid (negative dimensions, empty arrays, etc.)
   - What's unclear: How thorough should server-side validation be? Should we use Zod or custom validators?
   - Recommendation: Start with basic checks (required fields, positive numbers). Add Zod schema validation if users create invalid templates in practice

4. **Joinery option reuse across templates**
   - What we know: Multiple templates share common joinery options (pocket screws appears in 4/5 templates)
   - What's unclear: Should joinery options be a separate table with M:N relationship, or stay embedded in templates?
   - Recommendation: Keep embedded for Phase 11. Joinery options are lightweight and templates are read as atomic units. Normalize only if admin UI becomes cumbersome with repeated data entry

## Sources

### Primary (HIGH confidence)
- [Drizzle ORM - SQLite column types](https://orm.drizzle.team/docs/column-types/sqlite) - Text vs blob JSON storage, type safety
- [Drizzle ORM - Seed overview](https://orm.drizzle.team/docs/seed-overview) - Seeding strategies and patterns
- [SvelteKit Form Actions](https://svelte.dev/docs/kit/form-actions) - Official form action documentation
- Existing project patterns (src/routes/projects/, hooks.server.ts, API routes) - Established codebase patterns

### Secondary (MEDIUM confidence)
- [Drizzle ORM - Migrations](https://orm.drizzle.team/docs/migrations) - Migration best practices
- [Drizzle ORM - Custom migrations](https://orm.drizzle.team/docs/kit-custom-migrations) - Seed script patterns
- [Forms in SvelteKit — Actions, Validation & Progressive Enhancement](https://dev.to/a1guy/forms-in-sveltekit-actions-validation-progressive-enhancement-3leh) - Form validation patterns
- [Progressive Enhancement in SvelteKit Forms Guide](https://sveltetalk.com/posts/sveltekit-forms) - use:enhance patterns
- [Use Arrays in HTML Form Variables](https://www.codingwithjesse.com/blog/use-arrays-with-html-form-inputs/) - Dynamic array form handling
- [Nested arrays and objects in Form Data](https://www.jacobparis.com/content/conform-nested-formdata) - Complex form structures
- [Protecting SvelteKit routes from unauthenticated users](https://dev.to/thiteago/protecting-sveltekit-routes-from-unauthenticated-users-nb9) - Auth patterns
- [SvelteKit Auth - Let's Decide What To Use](https://sveltekit.io/blog/sveltekit-auth) - Auth ecosystem overview

### Tertiary (LOW confidence)
- [Database migration checklist 2026](https://lumenalta.com/insights/database-migration-checklist) - General migration strategies
- [CRUD tutorial for Superforms](https://superforms.rocks/crud) - Alternative approach reference
- [Addressing Security Risks in CRUD Interfaces](https://www.forestadmin.com/blog/crud-security-interfaces-mitigating-risks-in-internal-tools/) - Security considerations
- [All You Need to Know About Security in CRUD Apps](https://appmaster.io/blog/security-in-crud-apps) - Security best practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Drizzle text JSON columns verified in official docs, existing project patterns proven
- Architecture: HIGH - All patterns extracted from official docs or existing working code
- Pitfalls: MEDIUM-HIGH - Some from experience (JSON parsing), some inferred from common patterns

**Research date:** 2026-01-28
**Valid until:** 2026-04-28 (90 days - stable stack, SvelteKit patterns mature, Drizzle established)
