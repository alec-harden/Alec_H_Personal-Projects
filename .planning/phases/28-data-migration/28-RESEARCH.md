# Phase 28: Data Migration - Research

**Researched:** 2026-02-04
**Domain:** SQLite/Turso data migration with Drizzle ORM
**Confidence:** HIGH

## Summary

This phase requires migrating existing BOM item data to support the v4.0 lumber categorization changes. The migration involves three data transformations: (1) changing category "lumber" to "hardwood", (2) backfilling cutItem=true for lumber items, and (3) copying height values to the new thickness field.

The project already has an established pattern for standalone database scripts in `scripts/seed-templates.ts` using `npx tsx`. This same pattern should be used for the data migration script. The migration is straightforward UPDATE operations that can be executed safely with proper backup and verification steps.

**Primary recommendation:** Create a standalone TypeScript migration script following the existing `seed-templates.ts` pattern. Run it with `npx tsx scripts/migrate-v4-data.ts` for both local development and production databases.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.1 | Database operations | Already used in project, provides type-safe updates |
| @libsql/client | ^0.17.0 | Database connection | Already used for Turso/SQLite connection |
| dotenv | ^17.2.3 | Environment loading | Already used for standalone scripts |
| tsx | (via npx) | TypeScript execution | Already established pattern in seed-templates.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-orm (eq) | ^0.45.1 | WHERE clause building | Filtering records for updates |
| turso CLI | (system) | Production shell access | Optional: verify data via CLI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TypeScript script | Raw SQL file via turso shell | TS script provides logging, error handling, verification |
| Standalone script | SvelteKit API endpoint | Script is one-time, no need for HTTP layer |
| drizzle-orm update | Raw SQL via db.execute() | ORM provides type safety, but raw SQL is faster for bulk |

**Installation:**
No new packages required. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
scripts/
├── seed-templates.ts        # Existing: template seeding
└── migrate-v4-data.ts       # NEW: v4.0 data migration
```

### Pattern 1: Standalone Database Script
**What:** TypeScript script that creates its own database connection and runs independently of SvelteKit
**When to use:** One-time data migrations, database seeding, maintenance tasks
**Example:**
```typescript
// Source: scripts/seed-templates.ts (existing pattern)
import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/server/schema';

// Create standalone database connection for script
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN || undefined
});

const db = drizzle(client, { schema });

async function migrate() {
  console.log('Starting migration...');
  // Migration logic here
  console.log('Migration complete!');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
```

### Pattern 2: Drizzle ORM Bulk Update
**What:** Use Drizzle's `.update().set().where()` for type-safe updates
**When to use:** Updating multiple records matching a condition
**Example:**
```typescript
// Source: Drizzle ORM docs - https://orm.drizzle.team/docs/update
import { eq } from 'drizzle-orm';
import { bomItems } from '../src/lib/server/schema';

// Update all records matching condition
await db.update(bomItems)
  .set({ category: 'hardwood' })
  .where(eq(bomItems.category, 'lumber'));
```

### Pattern 3: Pre-Migration Verification Query
**What:** Count affected records before migration to validate expected changes
**When to use:** Before any data-modifying operation
**Example:**
```typescript
// Source: Project best practice
const lumberCount = await db.query.bomItems.findMany({
  where: eq(bomItems.category, 'lumber')
});
console.log(`Found ${lumberCount.length} lumber items to migrate`);

if (lumberCount.length === 0) {
  console.log('No items to migrate. Exiting.');
  return;
}
```

### Anti-Patterns to Avoid
- **Running migration without backup:** Always verify backup exists before production migration
- **No verification step:** Always count records before and after migration
- **Destructive operations without confirmation:** For production, require explicit flag or confirmation
- **Modifying schema in data migration script:** Keep schema changes separate from data migrations

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Database connection | Manual SQLite connection | `@libsql/client` + `drizzle-orm` | Already configured, handles auth tokens |
| WHERE clause building | String concatenation | `eq()` from drizzle-orm | Type-safe, SQL injection prevention |
| Environment loading | Manual process.env parsing | `dotenv/config` import | Single line, handles .env file |
| TypeScript execution | Compile then run | `npx tsx` | Zero-config TS execution |

**Key insight:** The project already has a working pattern in `seed-templates.ts`. Follow it exactly to avoid configuration issues.

## Common Pitfalls

### Pitfall 1: Forgetting Turso Auth Token for Production
**What goes wrong:** Script connects to wrong database or fails authentication
**Why it happens:** Local dev uses `file:local.db`, production uses Turso cloud with auth token
**How to avoid:**
```typescript
// Always check which database you're connecting to
console.log(`Connecting to: ${process.env.TURSO_DATABASE_URL || 'file:local.db'}`);
```
**Warning signs:** "Unauthorized" errors, empty result sets when data should exist

### Pitfall 2: Running Migration Multiple Times
**What goes wrong:** Idempotent operations are fine, but logging becomes confusing
**Why it happens:** Script doesn't check if migration already ran
**How to avoid:** Check for already-migrated data before updating:
```typescript
const alreadyMigrated = await db.query.bomItems.findMany({
  where: eq(bomItems.category, 'hardwood')
});
if (alreadyMigrated.length > 0) {
  console.log('Migration may have already run. Found existing hardwood items.');
}
```
**Warning signs:** Log shows "0 items updated" when expecting updates

### Pitfall 3: NULL vs Undefined in Updates
**What goes wrong:** Setting a field to `null` vs not updating it
**Why it happens:** SQLite/Drizzle treats NULL differently than omitting field
**How to avoid:** Only include fields in `.set()` that should actually change:
```typescript
// GOOD: Only update thickness where height has a value
await db.update(bomItems)
  .set({ thickness: bomItems.height })  // This doesn't work directly

// CORRECT: Use raw SQL or separate queries
const itemsWithHeight = await db.query.bomItems.findMany({
  where: and(
    eq(bomItems.category, 'lumber'),
    not(isNull(bomItems.height))
  )
});
```
**Warning signs:** thickness becomes NULL when height had a value

### Pitfall 4: Copying height to thickness Incorrectly
**What goes wrong:** Cannot reference another column in `.set()` directly with Drizzle ORM
**Why it happens:** Drizzle's `.set()` expects literal values, not column references
**How to avoid:** Use raw SQL via `db.execute()` for column-to-column copy:
```typescript
import { sql } from 'drizzle-orm';

// Copy height to thickness using raw SQL
await db.execute(sql`
  UPDATE bom_items
  SET thickness = height
  WHERE height IS NOT NULL AND thickness IS NULL
`);
```
**Warning signs:** "Invalid value" errors, null thickness values

### Pitfall 5: Schema Still Has "lumber" Category Check
**What goes wrong:** TypeScript compilation may fail if category types are strict
**Why it happens:** Type definitions updated before data migration runs
**How to avoid:** Data migration should run after schema changes but before removing "lumber" from types (which was already done in Phase 23)
**Warning signs:** Type errors during script compilation

## Code Examples

Verified patterns from official sources:

### Database Connection (from seed-templates.ts)
```typescript
// Source: scripts/seed-templates.ts (existing project code)
import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../src/lib/server/schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN || undefined
});

const db = drizzle(client, { schema });
```

### Bulk Update with WHERE (from Drizzle docs)
```typescript
// Source: https://orm.drizzle.team/docs/update
import { eq } from 'drizzle-orm';

await db.update(bomItems)
  .set({ category: 'hardwood', cutItem: true })
  .where(eq(bomItems.category, 'lumber'));
```

### Raw SQL Execution for Column Copy (from Drizzle docs)
```typescript
// Source: https://orm.drizzle.team/docs/sql
import { sql } from 'drizzle-orm';

// Copy height to thickness
await db.execute(sql`
  UPDATE bom_items
  SET thickness = height
  WHERE height IS NOT NULL
`);
```

### Pre/Post Verification Query
```typescript
// Source: Project best practice
async function countByCategory(): Promise<Record<string, number>> {
  const items = await db.query.bomItems.findMany();
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }
  return counts;
}

// Before migration
console.log('Before:', await countByCategory());
// Run migration...
// After migration
console.log('After:', await countByCategory());
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| drizzle-kit migrate (schema only) | Standalone script for data | Always | Data migrations need custom scripts |
| Raw SQL files | TypeScript with Drizzle | Project convention | Type safety, logging, error handling |

**Deprecated/outdated:**
- `db:push` for data changes: Only handles schema, not data transformation
- Interactive migrations: Not supported in automated deployments

## Open Questions

Things that couldn't be fully resolved:

1. **Should we remove the height column after migration?**
   - What we know: Schema keeps height as deprecated, thickness is the new field
   - What's unclear: Whether to drop height column or keep for backward compatibility
   - Recommendation: Keep height column for now. Phase 29 or later milestone can address cleanup. Current API code syncs both fields.

2. **Production backup strategy**
   - What we know: Turso has point-in-time recovery, can export via `.dump`
   - What's unclear: Exact backup procedure before running production migration
   - Recommendation: Document backup step in migration instructions. Use `turso db shell <db> .dump > backup.sql`

3. **Transaction support for multi-step migration**
   - What we know: SQLite supports transactions, libSQL should as well
   - What's unclear: Whether Drizzle's execute wraps in transaction automatically
   - Recommendation: Keep operations simple. If one fails, re-running should be safe (idempotent checks).

## Sources

### Primary (HIGH confidence)
- Existing project code: `scripts/seed-templates.ts` - established pattern for standalone scripts
- Existing project code: `src/routes/api/bom/[id]/items/[itemId]/+server.ts` - db.update() pattern
- [Drizzle ORM - Update](https://orm.drizzle.team/docs/update) - official update syntax
- [Drizzle ORM - SQL operator](https://orm.drizzle.team/docs/sql) - raw SQL execution

### Secondary (MEDIUM confidence)
- [Turso db shell docs](https://docs.turso.tech/cli/db/shell) - CLI for production access
- [Drizzle ORM - Migrations](https://orm.drizzle.team/docs/migrations) - general migration approach

### Tertiary (LOW confidence)
- WebSearch results for data migration patterns - general best practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all tools already used in project
- Architecture: HIGH - following existing seed-templates.ts pattern
- Pitfalls: HIGH - identified from existing codebase and Drizzle docs
- Column copy approach: MEDIUM - raw SQL needed, verified in Drizzle docs

**Research date:** 2026-02-04
**Valid until:** 60 days (stable domain, no fast-moving dependencies)

---

## Migration Script Outline

Based on research, the migration script should:

1. **Connect to database** (following seed-templates.ts pattern)
2. **Pre-migration verification:**
   - Count items where category = 'lumber'
   - Count items where cutItem is NULL or false
   - Count items where height IS NOT NULL AND thickness IS NULL
3. **Execute migrations:**
   - UPDATE category 'lumber' -> 'hardwood'
   - UPDATE cutItem = true WHERE category IN ('hardwood', 'common', 'sheet')
   - UPDATE thickness = height WHERE height IS NOT NULL
4. **Post-migration verification:**
   - Confirm no items with category = 'lumber'
   - Confirm all lumber categories have cutItem = true
   - Report items migrated
5. **Exit with appropriate code**

**Run command:** `npx tsx scripts/migrate-v4-data.ts`

**For production:** Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` environment variables before running.
