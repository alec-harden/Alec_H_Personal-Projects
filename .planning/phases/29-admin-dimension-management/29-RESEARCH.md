# Phase 29: Admin Dimension Management - Research

**Researched:** 2026-02-04
**Domain:** Admin CRUD, database seeding, dynamic validation
**Confidence:** HIGH

## Summary

This phase enables admin users to manage the accepted dimension values for lumber categories through a web UI, replacing the current hardcoded constants in `dimension-validation.ts`. The system needs to store dimension values in a database table, seed defaults on first run, provide admin UI for CRUD operations, and update validation logic to read from the database instead of constants.

The project already has strong patterns for admin pages (requireAdmin, form actions, PRG), database seeding (seed-templates.ts script), and validation (dimension-validation.ts with warning-only approach). The key technical challenge is making validation logic read from the database efficiently without N+1 queries, and providing a seeding mechanism that runs automatically on first deployment.

**Primary recommendation:** Create dimensionValues table with category/dimensionType/value columns, seed via startup hook in hooks.server.ts, build admin UI following /admin/templates pattern, and update validation to query dimension values with in-memory caching for performance.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.1 | Database ORM | Project standard for all tables |
| drizzle-kit | ^0.31.8 | Schema management | Push-based schema sync |
| SvelteKit | ^2.49.1 | Full-stack framework | Server actions for CRUD |
| Tailwind CSS | ^4.1.18 | Styling | Amber theme for admin |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | N/A | All needed deps installed | N/A |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Startup hook seeding | Manual seed script | Hook ensures defaults exist on every boot, no manual step |
| In-memory cache | Query on every validation | Cache prevents N+1 but needs invalidation strategy |
| Single values table | Separate tables per category | Single table simpler, extensible to other config |

**Installation:**
No new packages needed - all dependencies already installed.

## Architecture Patterns

### Recommended File Organization
```
src/
├── lib/
│   ├── server/
│   │   ├── schema.ts                      # ADD: dimensionValues table
│   │   └── bom-validation.ts              # UPDATE: read from db
│   └── utils/
│       └── dimension-validation.ts        # UPDATE: query functions
├── routes/
│   ├── admin/
│   │   └── dimensions/
│   │       ├── +page.server.ts            # NEW: load & actions
│   │       └── +page.svelte               # NEW: admin UI
│   └── api/
│       └── dimensions/
│           └── reset/+server.ts           # NEW: reset to defaults endpoint
└── hooks.server.ts                        # UPDATE: seed on startup
scripts/
└── seed-dimensions.ts                     # NEW: standalone seeding (optional)
```

### Pattern 1: Database Table for Configuration
**What:** Store configuration values in a dedicated table with category/type/value structure
**When to use:** When configuration needs admin management and runtime modification
**Example:**
```typescript
// Source: Existing pattern from schema.ts (templates table)
export const dimensionValues = sqliteTable('dimension_values', {
  id: text('id').primaryKey(),
  category: text('category', { enum: ['hardwood', 'common', 'sheet'] }).notNull(),
  dimensionType: text('dimension_type', {
    enum: ['thickness', 'width', 'length']
  }).notNull(),
  value: real('value').notNull(), // inches
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// Composite unique constraint: category + dimensionType + value
// (one category can have multiple values per dimension type)
```

### Pattern 2: Startup Hook Seeding
**What:** Seed default data in hooks.server.ts handle() function on every boot
**When to use:** When defaults must exist for app to function correctly
**Example:**
```typescript
// Source: SvelteKit hooks.server.ts pattern, similar to session validation
import { db } from '$lib/server/db';
import { dimensionValues } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

// Track seeding in module scope (runs once per process)
let dimensionsSeeded = false;

export async function handle({ event, resolve }) {
  // Seed defaults on first request if not already done
  if (!dimensionsSeeded) {
    const existingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(dimensionValues);

    if (existingCount[0].count === 0) {
      await seedDefaultDimensions(db);
    }
    dimensionsSeeded = true;
  }

  // ... existing auth logic
  return resolve(event);
}
```

### Pattern 3: Admin CRUD with Form Actions
**What:** Load page with requireAdmin(), use SvelteKit form actions for mutations
**When to use:** Admin-only CRUD operations (established pattern in /admin/users and /admin/templates)
**Example:**
```typescript
// Source: src/routes/admin/templates/+page.server.ts
export const load: PageServerLoad = async (event) => {
  requireAdmin(event);

  const dimensions = await db.query.dimensionValues.findMany({
    orderBy: [asc(dimensionValues.category), asc(dimensionValues.dimensionType)]
  });

  // Group by category and type for display
  const grouped = groupDimensionsByCategory(dimensions);
  return { dimensions: grouped };
};

export const actions: Actions = {
  add: async (event) => {
    requireAdmin(event);
    const data = await event.request.formData();
    const category = data.get('category')?.toString();
    const dimensionType = data.get('dimension_type')?.toString();
    const value = parseFloat(data.get('value')?.toString() || '0');

    // Validation
    if (!category || !dimensionType || !value) {
      return fail(400, { error: 'All fields required' });
    }

    // Check for duplicate
    const existing = await db.query.dimensionValues.findFirst({
      where: and(
        eq(dimensionValues.category, category),
        eq(dimensionValues.dimensionType, dimensionType),
        eq(dimensionValues.value, value)
      )
    });

    if (existing) {
      return fail(400, { error: 'Dimension value already exists' });
    }

    await db.insert(dimensionValues).values({
      id: crypto.randomUUID(),
      category,
      dimensionType,
      value,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return { success: true };
  },

  remove: async (event) => {
    requireAdmin(event);
    const data = await event.request.formData();
    const id = data.get('id')?.toString();

    if (!id) {
      return fail(400, { error: 'ID required' });
    }

    await db.delete(dimensionValues).where(eq(dimensionValues.id, id));
    return { success: true };
  },

  reset: async (event) => {
    requireAdmin(event);

    // Delete all non-default values, then re-seed
    await db.delete(dimensionValues).where(eq(dimensionValues.isDefault, false));
    await db.delete(dimensionValues); // Clear all
    await seedDefaultDimensions(db);

    throw redirect(303, '/admin/dimensions'); // PRG pattern
  }
};
```

### Pattern 4: Validation with Database Query
**What:** Update dimension-validation.ts to query database instead of using constants
**When to use:** Runtime validation against admin-managed values
**Example:**
```typescript
// Source: Updated from existing dimension-validation.ts pattern
import { db } from '$lib/server/db';
import { dimensionValues } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';
import type { LumberCategory } from '$lib/types/bom';

// In-memory cache to avoid N+1 queries during validation
let dimensionCache: Map<string, number[]> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Get allowed thickness values for a lumber category (from database)
 */
export async function getThicknessValues(category: LumberCategory): Promise<number[]> {
  return getDimensionValues(category, 'thickness');
}

/**
 * Get dimension values from database with caching
 */
async function getDimensionValues(
  category: LumberCategory,
  dimensionType: 'thickness' | 'width' | 'length'
): Promise<number[]> {
  const cacheKey = `${category}:${dimensionType}`;
  const now = Date.now();

  // Check cache
  if (dimensionCache && (now - cacheTimestamp) < CACHE_TTL) {
    const cached = dimensionCache.get(cacheKey);
    if (cached) return cached;
  }

  // Refresh cache
  if (!dimensionCache || (now - cacheTimestamp) >= CACHE_TTL) {
    dimensionCache = new Map();
    cacheTimestamp = now;
  }

  // Query database
  const values = await db.query.dimensionValues.findMany({
    where: and(
      eq(dimensionValues.category, category),
      eq(dimensionValues.dimensionType, dimensionType)
    ),
    columns: { value: true }
  });

  const result = values.map(v => v.value);
  dimensionCache.set(cacheKey, result);
  return result;
}

/**
 * Validate a thickness value against category standards (async version)
 * Returns null if valid, or a warning message if non-standard
 */
export async function validateThickness(
  value: number,
  category: LumberCategory
): Promise<string | null> {
  const standards = await getThicknessValues(category);
  if (isStandardValue(value, standards)) {
    return null;
  }
  return `Non-standard thickness: ${value}" is not a common ${category} thickness`;
}

// Export cache invalidation for admin actions
export function invalidateDimensionCache() {
  dimensionCache = null;
  cacheTimestamp = 0;
}
```

### Pattern 5: Admin UI with Grouped Display
**What:** Display dimensions grouped by category, with add/remove controls per group
**When to use:** Admin management of categorized configuration values
**Example:**
```svelte
<!-- Source: Pattern from admin/templates/+page.svelte -->
<script lang="ts">
  interface DimensionGroup {
    category: string;
    types: {
      thickness?: number[];
      width?: number[];
      length?: number[];
    };
  }

  let { data, form } = $props();
  let showAddForm = $state<string | null>(null); // category:type

  function formatDimension(value: number): string {
    // Convert to fraction if common (e.g., 0.75 -> 3/4")
    const fractions = {
      0.75: '3/4',
      0.5: '1/2',
      0.25: '1/4',
      // ... more common fractions
    };
    return fractions[value] || `${value}`;
  }
</script>

<div class="max-w-6xl mx-auto">
  <h1 class="text-3xl font-bold text-stone-800 mb-6">Dimension Management</h1>

  {#each data.dimensions as group}
    <div class="bg-white shadow-lg rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold text-stone-800 mb-4 capitalize">
        {group.category}
      </h2>

      <!-- Thickness -->
      {#if group.types.thickness}
        <div class="mb-4">
          <h3 class="text-sm font-medium text-stone-700 mb-2">Thickness</h3>
          <div class="flex flex-wrap gap-2">
            {#each group.types.thickness as value}
              <div class="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-lg">
                <span>{formatDimension(value)}"</span>
                <form method="POST" action="?/remove" use:enhance>
                  <input type="hidden" name="id" value={value.id} />
                  <button type="submit" class="text-red-600 hover:text-red-800">
                    ×
                  </button>
                </form>
              </div>
            {/each}
            <button
              onclick={() => showAddForm = `${group.category}:thickness`}
              class="px-3 py-1 border-2 border-dashed border-stone-300 rounded-lg hover:border-amber-500"
            >
              + Add
            </button>
          </div>
        </div>
      {/if}

      <!-- Width, Length similar structure -->
    </div>
  {/each}

  <!-- Reset to Defaults -->
  <form method="POST" action="?/reset" use:enhance>
    <button
      type="submit"
      class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      onclick="return confirm('Reset all dimension values to defaults?')"
    >
      Reset to Defaults
    </button>
  </form>
</div>
```

### Anti-Patterns to Avoid
- **Querying db on every validation call:** Use caching to avoid N+1 queries
- **Not seeding defaults:** App breaks if dimension values table is empty
- **Blocking validation:** Keep warning-only approach (per existing pattern)
- **Not invalidating cache on admin changes:** Stale cache shows old values

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fraction display | Custom parser | Existing fraction utilities in board-feet.ts | Already handles edge cases |
| Admin auth | Custom middleware | `requireAdmin(event)` from auth.ts | Tested, throws correct errors |
| Form validation | Client-side only | SvelteKit form actions | Server-side validation prevents bypass |
| Seeding on deploy | Migration files | Startup hook in hooks.server.ts | Works for both dev and prod |

**Key insight:** The project has excellent admin patterns already (users, templates). Follow the same structure for consistency.

## Common Pitfalls

### Pitfall 1: N+1 Queries in Validation
**What goes wrong:** Validating 100 BOM items makes 100+ database queries
**Why it happens:** Each validateThickness() call queries database independently
**How to avoid:** Implement in-memory cache with TTL, refresh cache on admin changes
**Warning signs:** Slow BOM save/generate operations, database connection pool exhaustion

### Pitfall 2: Empty Dimension Values Table
**What goes wrong:** Validation fails with "no standard values" when table is empty
**Why it happens:** Forgot to seed defaults on fresh database
**How to avoid:** Use hooks.server.ts to seed on startup if count === 0
**Warning signs:** All dimensions show as "non-standard" even for common values

### Pitfall 3: Cache Not Invalidated
**What goes wrong:** Admin adds new dimension value but validation still fails
**Why it happens:** In-memory cache not cleared when admin makes changes
**How to avoid:** Call invalidateDimensionCache() in add/remove/reset actions
**Warning signs:** Admin sees new value in UI but validation doesn't recognize it

### Pitfall 4: Duplicate Values Allow Inconsistency
**What goes wrong:** Same dimension value added multiple times
**Why it happens:** No unique constraint on category + dimensionType + value
**How to avoid:** Check for existing value before insert, or add unique index
**Warning signs:** Duplicate values visible in admin UI

### Pitfall 5: Async Validation Breaking Existing Code
**What goes wrong:** Changing validateThickness() to async breaks all callers
**Why it happens:** Existing code expects synchronous validation
**How to avoid:** Keep async separate, or update all callers in same phase
**Warning signs:** TypeScript errors about Promise<string | null> vs string | null

### Pitfall 6: Non-Admin Access to Dimension Management
**What goes wrong:** Regular users can access /admin/dimensions
**Why it happens:** Forgot requireAdmin() in load function
**How to avoid:** Always call requireAdmin(event) as first line in load and actions
**Warning signs:** Non-admin users report seeing admin pages

## Code Examples

Verified patterns from official sources and existing codebase:

### Database Schema (schema.ts)
```typescript
// Source: Existing pattern from templates table in schema.ts

export const dimensionValues = sqliteTable('dimension_values', {
  id: text('id').primaryKey(),
  category: text('category', {
    enum: ['hardwood', 'common', 'sheet']
  }).notNull(),
  dimensionType: text('dimension_type', {
    enum: ['thickness', 'width', 'length']
  }).notNull(),
  value: real('value').notNull(), // inches
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// Relations (standalone table, no foreign keys needed)
export const dimensionValuesRelations = relations(dimensionValues, () => ({}));
```

### Seeding Function
```typescript
// Source: Pattern from scripts/seed-templates.ts

import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '$lib/server/schema';

/**
 * Seed default dimension values
 * Can be called from hooks.server.ts or standalone script
 */
export async function seedDefaultDimensions(
  db: LibSQLDatabase<typeof schema>
) {
  const defaults = [
    // Hardwood thickness
    { category: 'hardwood', dimensionType: 'thickness', value: 0.75 },
    { category: 'hardwood', dimensionType: 'thickness', value: 0.8125 },
    { category: 'hardwood', dimensionType: 'thickness', value: 1.0 },
    { category: 'hardwood', dimensionType: 'thickness', value: 1.0625 },
    { category: 'hardwood', dimensionType: 'thickness', value: 1.25 },
    { category: 'hardwood', dimensionType: 'thickness', value: 1.5 },
    { category: 'hardwood', dimensionType: 'thickness', value: 1.75 },
    { category: 'hardwood', dimensionType: 'thickness', value: 2.0 },
    { category: 'hardwood', dimensionType: 'thickness', value: 2.75 },
    { category: 'hardwood', dimensionType: 'thickness', value: 3.0 },
    { category: 'hardwood', dimensionType: 'thickness', value: 3.75 },
    { category: 'hardwood', dimensionType: 'thickness', value: 4.0 },

    // Common thickness
    { category: 'common', dimensionType: 'thickness', value: 0.75 },
    { category: 'common', dimensionType: 'thickness', value: 1.5 },

    // Common width
    { category: 'common', dimensionType: 'width', value: 1.5 },
    { category: 'common', dimensionType: 'width', value: 2.5 },
    { category: 'common', dimensionType: 'width', value: 3.5 },
    { category: 'common', dimensionType: 'width', value: 5.5 },
    { category: 'common', dimensionType: 'width', value: 7.25 },
    { category: 'common', dimensionType: 'width', value: 9.25 },
    { category: 'common', dimensionType: 'width', value: 11.25 },

    // Sheet thickness (14 values from existing constants)
    { category: 'sheet', dimensionType: 'thickness', value: 0.125 },
    { category: 'sheet', dimensionType: 'thickness', value: 0.1875 },
    { category: 'sheet', dimensionType: 'thickness', value: 0.25 },
    { category: 'sheet', dimensionType: 'thickness', value: 0.3125 },
    { category: 'sheet', dimensionType: 'thickness', value: 0.34375 },
    { category: 'sheet', dimensionType: 'thickness', value: 0.375 },
    { category: 'sheet', dimensionType: 'thickness', value: 0.46875 },
    { category: 'sheet', dimensionType: 'thickness', value: 0.5 },
    { category: 'sheet', dimensionType: 'thickness', value: 0.59375 },
    { category: 'sheet', dimensionType: 'thickness', value: 0.625 },
    { category: 'sheet', dimensionType: 'thickness', value: 0.71875 },
    { category: 'sheet', dimensionType: 'thickness', value: 0.75 },
    { category: 'sheet', dimensionType: 'thickness', value: 1.0 },
    { category: 'sheet', dimensionType: 'thickness', value: 1.125 },

    // Sheet width
    { category: 'sheet', dimensionType: 'width', value: 24 },
    { category: 'sheet', dimensionType: 'width', value: 48 },
    { category: 'sheet', dimensionType: 'width', value: 60 },

    // Sheet length
    { category: 'sheet', dimensionType: 'length', value: 48 },
    { category: 'sheet', dimensionType: 'length', value: 96 },
    { category: 'sheet', dimensionType: 'length', value: 120 }
  ];

  const now = new Date();

  for (const dim of defaults) {
    await db.insert(schema.dimensionValues).values({
      id: crypto.randomUUID(),
      category: dim.category as 'hardwood' | 'common' | 'sheet',
      dimensionType: dim.dimensionType as 'thickness' | 'width' | 'length',
      value: dim.value,
      isDefault: true,
      createdAt: now,
      updatedAt: now
    });
  }
}
```

### Startup Hook Integration (hooks.server.ts)
```typescript
// Source: SvelteKit hooks pattern, session validation from existing code

import { seedDefaultDimensions } from '$lib/server/seed-dimensions';
import { db } from '$lib/server/db';
import { dimensionValues } from '$lib/server/schema';
import { sql } from 'drizzle-orm';

let dimensionsSeeded = false;

export async function handle({ event, resolve }) {
  // Seed dimension defaults on first request
  if (!dimensionsSeeded) {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(dimensionValues);

      if (result[0].count === 0) {
        console.log('Seeding default dimension values...');
        await seedDefaultDimensions(db);
        console.log('Dimension values seeded successfully');
      }
      dimensionsSeeded = true;
    } catch (error) {
      console.error('Failed to seed dimension values:', error);
      // Don't block app startup on seed failure
    }
  }

  // ... existing session validation logic

  return resolve(event);
}
```

### Admin Page Server Logic (+page.server.ts)
```typescript
// Source: Pattern from admin/templates/+page.server.ts

import { requireAdmin } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { dimensionValues } from '$lib/server/schema';
import { eq, and, asc } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { invalidateDimensionCache } from '$lib/utils/dimension-validation';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async (event) => {
  requireAdmin(event);

  const allDimensions = await db.query.dimensionValues.findMany({
    orderBy: [
      asc(dimensionValues.category),
      asc(dimensionValues.dimensionType),
      asc(dimensionValues.value)
    ]
  });

  // Group by category and type for UI
  const grouped = groupDimensionsByCategory(allDimensions);
  return { dimensions: grouped };
};

export const actions: Actions = {
  add: async (event) => {
    requireAdmin(event);

    const data = await event.request.formData();
    const category = data.get('category')?.toString();
    const dimensionType = data.get('dimension_type')?.toString();
    const valueStr = data.get('value')?.toString();

    // Validation
    if (!category || !dimensionType || !valueStr) {
      return fail(400, { error: 'All fields required' });
    }

    const value = parseFloat(valueStr);
    if (isNaN(value) || value <= 0) {
      return fail(400, { error: 'Value must be a positive number' });
    }

    // Check for duplicate
    const existing = await db.query.dimensionValues.findFirst({
      where: and(
        eq(dimensionValues.category, category),
        eq(dimensionValues.dimensionType, dimensionType),
        sql`abs(${dimensionValues.value} - ${value}) < 0.001` // floating point tolerance
      )
    });

    if (existing) {
      return fail(400, {
        error: 'This dimension value already exists',
        category,
        dimensionType,
        value: valueStr
      });
    }

    const now = new Date();
    await db.insert(dimensionValues).values({
      id: crypto.randomUUID(),
      category: category as 'hardwood' | 'common' | 'sheet',
      dimensionType: dimensionType as 'thickness' | 'width' | 'length',
      value,
      isDefault: false,
      createdAt: now,
      updatedAt: now
    });

    // Invalidate cache so validation uses new value immediately
    invalidateDimensionCache();

    return { success: true };
  },

  remove: async (event) => {
    requireAdmin(event);

    const data = await event.request.formData();
    const id = data.get('id')?.toString();

    if (!id) {
      return fail(400, { error: 'ID required' });
    }

    await db.delete(dimensionValues).where(eq(dimensionValues.id, id));

    // Invalidate cache
    invalidateDimensionCache();

    return { success: true };
  },

  reset: async (event) => {
    requireAdmin(event);

    // Delete all values
    await db.delete(dimensionValues);

    // Re-seed defaults
    await seedDefaultDimensions(db);

    // Invalidate cache
    invalidateDimensionCache();

    // PRG pattern - redirect after mutation
    throw redirect(303, '/admin/dimensions');
  }
};

// Helper to group dimensions for UI display
function groupDimensionsByCategory(dimensions: any[]) {
  const grouped: Record<string, any> = {};

  for (const dim of dimensions) {
    if (!grouped[dim.category]) {
      grouped[dim.category] = {
        category: dim.category,
        types: {}
      };
    }
    if (!grouped[dim.category].types[dim.dimensionType]) {
      grouped[dim.category].types[dim.dimensionType] = [];
    }
    grouped[dim.category].types[dim.dimensionType].push(dim);
  }

  return Object.values(grouped);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded constants | Database-driven values | Phase 29 (Feb 2026) | Admin can customize without code changes |
| Code deployment for dimension changes | Admin UI changes | Phase 29 (Feb 2026) | Faster iteration, user-specific needs |
| Synchronous validation | Async validation with cache | Phase 29 (Feb 2026) | Database reads without N+1 queries |

**Deprecated/outdated:**
- Hardcoded HARDWOOD_THICKNESS_VALUES: Migrate to database table
- Hardcoded COMMON_THICKNESS_VALUES: Migrate to database table
- Hardcoded SHEET_THICKNESS_VALUES: Migrate to database table
- Hardcoded width/length constants: Migrate to database table

## Open Questions

Things that couldn't be fully resolved:

1. **Cache invalidation across serverless instances**
   - What we know: In-memory cache works for single instance
   - What's unclear: How to invalidate cache across multiple serverless instances
   - Recommendation: Accept eventual consistency (1 minute TTL) or use Redis for shared cache in future

2. **Decimal precision for dimension values**
   - What we know: SQLite real has precision limitations
   - What's unclear: Whether to round values or store exact decimals
   - Recommendation: Use tolerance-based comparison (existing DIMENSION_TOLERANCE = 1/64")

3. **Custom dimension values vs standard warnings**
   - What we know: Validation currently warns for non-standard values
   - What's unclear: Whether admin-added values should suppress warnings
   - Recommendation: Any value in database is "standard" (no warning)

4. **Metric system support**
   - What we know: All current dimensions in inches
   - What's unclear: Whether to support cm/mm for international users
   - Recommendation: Defer to future phase; add unit column to dimensionValues if needed

## Sources

### Primary (HIGH confidence)
- Existing codebase files examined:
  - `src/lib/server/schema.ts` - Templates table pattern
  - `src/routes/admin/templates/+page.server.ts` - Admin CRUD pattern
  - `src/routes/admin/users/+page.server.ts` - requireAdmin usage
  - `src/lib/server/auth.ts` - requireAdmin implementation
  - `scripts/seed-templates.ts` - Seeding pattern
  - `src/lib/utils/dimension-validation.ts` - Current constants
  - `src/lib/server/bom-validation.ts` - Validation usage
  - `drizzle.config.ts` - Schema push configuration
- [Drizzle ORM Schema](https://orm.drizzle.team/docs/sql-schema-declaration) - Table definition
- [SvelteKit Hooks](https://kit.svelte.dev/docs/hooks) - Server hooks for startup logic

### Secondary (MEDIUM confidence)
- [SvelteKit Form Actions](https://kit.svelte.dev/docs/form-actions) - Server-side mutations
- [Drizzle ORM Queries](https://orm.drizzle.team/docs/select) - Query patterns

### Tertiary (LOW confidence)
- None - all patterns verified from existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies
- Architecture: HIGH - Following established admin and seeding patterns
- Pitfalls: HIGH - Based on database caching best practices and SvelteKit patterns
- Seeding approach: MEDIUM - Startup hook vs standalone script tradeoff

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stable domain, established patterns)
