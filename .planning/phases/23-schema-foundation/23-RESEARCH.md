# Phase 23: Schema Foundation - Research

**Researched:** 2026-02-03
**Domain:** Database schema, TypeScript types, Drizzle ORM migrations
**Confidence:** HIGH

## Summary

This phase focuses on updating the database schema and TypeScript types to support a new lumber categorization system. The current single "lumber" category will be split into three distinct categories (hardwood, common, sheet), and a new `cutItem` boolean flag will be added to mark items eligible for the cut list optimizer. Additionally, the `height` field will be renamed to `thickness` for clarity in woodworking terminology.

The project uses Drizzle ORM v0.45.1 with SQLite (LibSQL/Turso). Schema changes are applied using `drizzle-kit push` for development. For the `height` to `thickness` column rename, special care is needed because SQLite has limited ALTER TABLE support. The `drizzle-kit push` command may interpret renames as drop + add operations, which could cause data loss. A safer approach is to add the new column, migrate data, then remove the old column in Phase 28 (Data Migration).

**Primary recommendation:** Update TypeScript types and Zod schemas first, then update Drizzle schema with new `cutItem` and `thickness` fields (keeping `height` temporarily for Phase 28 migration). Create dimension validation constants as a new utility module.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.1 | Database ORM | Already in use, SQLite-core for LibSQL |
| drizzle-kit | ^0.31.8 | Schema management | Push-based schema sync for development |
| zod | ^4.3.5 | Runtime validation | Already used for BOM schema validation |
| typescript | ^5.9.3 | Type definitions | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @libsql/client | (transitive) | Turso client | Database connection via drizzle-orm |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| drizzle-kit push | drizzle-kit generate + migrate | Migration files for production, but push is established pattern in this project |
| Zod enums | TypeScript literal unions | Zod provides runtime validation, but unions are lighter for type-only scenarios |

**Installation:**
No new packages needed - all dependencies already installed.

## Architecture Patterns

### Recommended File Organization
```
src/
├── lib/
│   ├── types/
│   │   └── bom.ts              # TypeScript types (BOMCategory, BOMItem)
│   ├── server/
│   │   ├── schema.ts           # Drizzle schema (bomItems table)
│   │   └── schemas/
│   │       └── bom-schema.ts   # Zod schemas for AI generation
│   └── utils/
│       ├── board-feet.ts       # REMOVE: calculateBoardFeet, formatBoardFeet
│       └── dimension-validation.ts  # NEW: validation constants
```

### Pattern 1: Union Type Categories
**What:** Use TypeScript union types for category definitions
**When to use:** Type-only validation where runtime validation is not needed
**Example:**
```typescript
// Source: Existing pattern in src/lib/types/bom.ts
export type BOMCategory =
  | 'hardwood'
  | 'common'
  | 'sheet'
  | 'hardware'
  | 'finishes'
  | 'consumables';

// Derived helper: categories that are "lumber" (have dimensions, cutItem)
export type LumberCategory = 'hardwood' | 'common' | 'sheet';

export function isLumberCategory(category: BOMCategory): category is LumberCategory {
  return ['hardwood', 'common', 'sheet'].includes(category);
}
```

### Pattern 2: Zod Enum for Runtime Validation
**What:** Use Zod enum for AI response validation
**When to use:** Validating external data (AI responses, API inputs)
**Example:**
```typescript
// Source: Pattern from existing bom-schema.ts
export const bomCategorySchema = z.enum([
  'hardwood',
  'common',
  'sheet',
  'hardware',
  'finishes',
  'consumables'
]);

// Item schema with cutItem
export const bomItemSchema = z.object({
  // ... existing fields
  category: bomCategorySchema.describe('Classification category'),
  cutItem: z.boolean().optional().describe('Whether item goes to cut list')
});
```

### Pattern 3: Drizzle Schema with Boolean Field
**What:** Add boolean field with default value based on category
**When to use:** Database schema definition
**Example:**
```typescript
// Source: Drizzle ORM documentation + existing schema.ts pattern
export const bomItems = sqliteTable('bom_items', {
  // ... existing fields
  category: text('category').notNull(),
  cutItem: integer('cut_item', { mode: 'boolean' }).notNull().default(false),
  // New field - will coexist with height during migration period
  thickness: real('thickness'), // inches
});
```

### Pattern 4: Dimension Validation Constants
**What:** Centralized validation constants for allowed dimension values
**When to use:** Validating user input against standard woodworking dimensions
**Example:**
```typescript
// Source: Standard woodworking dimension values from NHLA and plywood standards

// Hardwood: Quarter-sawn thicknesses (4/4, 5/4, 6/4, 8/4, etc.)
// Values represent SURFACED thickness (what user measures after planing)
export const HARDWOOD_THICKNESS = [
  0.8125, // 13/16" (surfaced 4/4)
  1.0625, // 1-1/16" (surfaced 5/4)
  1.25,   // 1-1/4" (surfaced 6/4)
  1.75,   // 1-3/4" (surfaced 8/4)
  2.75,   // 2-3/4" (surfaced 12/4)
  3.75,   // 3-3/4" (surfaced 16/4)
  // Also accept common rough-cut values
  1.0,    // 1" (rough 4/4)
  1.25,   // 1-1/4" (rough 5/4)
  1.5,    // 1-1/2" (rough 6/4)
  2.0,    // 2" (rough 8/4)
];

// Common boards: Dimensional lumber (nominal 1x, 2x)
export const COMMON_THICKNESS = [
  0.75,   // 3/4" (actual 1x boards)
  1.5,    // 1-1/2" (actual 2x boards)
];

// Sheet goods: Plywood/MDF standard thicknesses
export const SHEET_THICKNESS = [
  0.125,  // 1/8"
  0.25,   // 1/4"
  0.375,  // 3/8" (actual 11/32")
  0.5,    // 1/2" (actual 15/32")
  0.625,  // 5/8" (actual 19/32")
  0.75,   // 3/4" (actual 23/32")
  1.0,    // 1"
  1.125,  // 1-1/8"
];

// Standard widths vary by category
export const COMMON_WIDTH = [
  1.5,    // 1-1/2" (actual 2x)
  2.5,    // 2-1/2" (actual 1x3)
  3.5,    // 3-1/2" (actual 1x4, 2x4)
  5.5,    // 5-1/2" (actual 1x6, 2x6)
  7.25,   // 7-1/4" (actual 1x8, 2x8)
  9.25,   // 9-1/4" (actual 1x10, 2x10)
  11.25,  // 11-1/4" (actual 1x12, 2x12)
];

export const SHEET_WIDTH = [
  24,     // 2 feet
  48,     // 4 feet (standard)
  60,     // 5 feet (utility)
];

export const SHEET_LENGTH = [
  48,     // 4 feet
  96,     // 8 feet (standard)
  120,    // 10 feet (utility)
];
```

### Anti-Patterns to Avoid
- **Dropping height column directly:** SQLite limitations make this risky; use migration phase
- **Hardcoding category arrays in multiple files:** Use exported constants from types
- **Using string comparison for category checks:** Use `isLumberCategory()` helper

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fraction parsing | Custom regex parser | `parseFractionalInches()` from board-feet.ts | Already handles mixed fractions, edge cases |
| Fraction formatting | Custom formatter | `formatDimension()` from board-feet.ts | Already handles decimal-to-fraction conversion |
| Schema updates | Manual SQL | `drizzle-kit push` | Handles type mapping, constraints correctly |

**Key insight:** The project already has excellent fraction handling utilities in `board-feet.ts`. These should be KEPT even though `calculateBoardFeet` and `formatBoardFeet` are removed.

## Common Pitfalls

### Pitfall 1: Destructive Column Rename in SQLite
**What goes wrong:** Using `drizzle-kit push` to rename `height` to `thickness` causes data loss
**Why it happens:** SQLite lacks native column rename; Drizzle may interpret as drop + add
**How to avoid:** Add `thickness` as NEW column, migrate data in Phase 28, remove `height` after
**Warning signs:** Empty thickness values after push while height had data

### Pitfall 2: Category Mismatch Between Files
**What goes wrong:** TypeScript types, Zod schemas, and component arrays get out of sync
**Why it happens:** Categories defined in multiple places without shared source of truth
**How to avoid:** Export `CATEGORY_ORDER` array from types file, derive others from it
**Warning signs:** TypeScript errors don't match runtime validation errors

### Pitfall 3: Missing cutItem Auto-Assignment
**What goes wrong:** Items saved with lumber categories but cutItem=false
**Why it happens:** Forgetting to set cutItem based on category in save logic
**How to avoid:** Phase 23 adds schema; Phase 25 adds API validation to auto-set
**Warning signs:** Cut list shows 0 items when lumber items exist

### Pitfall 4: Board Feet Import Still Referenced
**What goes wrong:** Runtime errors from removed exports
**Why it happens:** Components still import calculateBoardFeet/formatBoardFeet
**How to avoid:** Grep for all imports before removing; update BOMItem.svelte
**Warning signs:** Build fails with "export not found" errors

### Pitfall 5: Dimension Validation Too Strict
**What goes wrong:** Users can't enter valid custom dimensions
**Why it happens:** Blocking save on non-standard values
**How to avoid:** Validation WARNS but allows save (per v4.0 design decision)
**Warning signs:** User complaints about "invalid" dimensions that are valid

## Code Examples

Verified patterns from official sources and existing codebase:

### TypeScript Type Update (bom.ts)
```typescript
// Source: Existing pattern in src/lib/types/bom.ts

/**
 * Categories for organizing BOM items
 * Updated for v4.0: lumber split into hardwood/common/sheet
 */
export type BOMCategory =
  | 'hardwood'    // Premium hardwoods: Oak, Maple, Walnut, Cherry, etc.
  | 'common'      // Dimensional lumber: Pine, Fir, SPF, etc.
  | 'sheet'       // Sheet goods: Plywood, MDF, Particle board, etc.
  | 'hardware'
  | 'finishes'
  | 'consumables';

/**
 * Lumber categories (items with dimensions, eligible for cut list)
 */
export type LumberCategory = 'hardwood' | 'common' | 'sheet';

/**
 * Category display order for UI
 */
export const CATEGORY_ORDER: BOMCategory[] = [
  'hardwood',
  'common',
  'sheet',
  'hardware',
  'finishes',
  'consumables'
];

/**
 * Check if a category is a lumber category (has dimensions)
 */
export function isLumberCategory(category: BOMCategory): category is LumberCategory {
  return category === 'hardwood' || category === 'common' || category === 'sheet';
}

/**
 * Individual item in a Bill of Materials
 */
export interface BOMItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  category: BOMCategory;
  notes?: string;
  hidden?: boolean;
  cutItem?: boolean;  // NEW: Whether this item goes to cut list
  // Lumber dimensions (for lumber category items only)
  length?: number;    // inches
  width?: number;     // inches
  thickness?: number; // inches (renamed from height)
  /** @deprecated Use thickness instead. Kept for migration compatibility. */
  height?: number;    // inches - DEPRECATED
}
```

### Drizzle Schema Update (schema.ts)
```typescript
// Source: Existing pattern in src/lib/server/schema.ts

// BOM items table - individual line items in a BOM
export const bomItems = sqliteTable('bom_items', {
  id: text('id').primaryKey(),
  bomId: text('bom_id')
    .notNull()
    .references(() => boms.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  quantity: integer('quantity').notNull(),
  unit: text('unit').notNull(),
  category: text('category').notNull(),
  notes: text('notes'),
  hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false),
  position: integer('position').notNull(),
  // NEW: Cut list eligibility flag
  cutItem: integer('cut_item', { mode: 'boolean' }).notNull().default(false),
  // Lumber dimensions (nullable, for lumber items only)
  length: real('length'),     // inches
  width: real('width'),       // inches
  height: real('height'),     // inches - KEEP during migration
  thickness: real('thickness') // inches - NEW field
});
```

### Zod Schema Update (bom-schema.ts)
```typescript
// Source: Existing pattern in src/lib/server/schemas/bom-schema.ts

import { z } from 'zod';

/**
 * Schema for BOM category
 */
export const bomCategorySchema = z.enum([
  'hardwood',
  'common',
  'sheet',
  'hardware',
  'finishes',
  'consumables'
]).describe('Classification category');

/**
 * Schema for an individual BOM item
 */
export const bomItemSchema = z.object({
  id: z.string().describe('Unique identifier for the item'),
  name: z.string().describe('Name of the material or component'),
  description: z.string().optional().describe('Additional details'),
  quantity: z.number().describe('Amount needed'),
  unit: z.string().describe('Unit of measurement'),
  category: bomCategorySchema,
  notes: z.string().optional().describe('Special instructions'),
  // NEW: Dimensions for lumber categories
  length: z.number().optional().describe('Length in inches'),
  width: z.number().optional().describe('Width in inches'),
  thickness: z.number().optional().describe('Thickness in inches')
});
```

### Dimension Validation (NEW: dimension-validation.ts)
```typescript
// Source: NHLA hardwood standards, plywood industry standards

/**
 * Dimension Validation Constants
 *
 * Standard values for woodworking dimensions.
 * Used for validation warnings (not blocking).
 */

// Tolerance for floating point comparison (1/64")
export const DIMENSION_TOLERANCE = 0.015625;

/**
 * Standard hardwood thickness values (surfaced)
 * Based on NHLA quarter-sawn system
 */
export const HARDWOOD_THICKNESS_VALUES = [
  0.75,    // 3/4" (thin)
  0.8125,  // 13/16" (surfaced 4/4)
  1.0,     // 1" (rough 4/4)
  1.0625,  // 1-1/16" (surfaced 5/4)
  1.25,    // 1-1/4" (surfaced 6/4 / rough 5/4)
  1.5,     // 1-1/2" (rough 6/4)
  1.75,    // 1-3/4" (surfaced 8/4)
  2.0,     // 2" (rough 8/4)
  2.75,    // 2-3/4" (surfaced 12/4)
  3.0,     // 3" (rough 12/4)
  3.75,    // 3-3/4" (surfaced 16/4)
  4.0,     // 4" (rough 16/4)
] as const;

/**
 * Standard common board thickness values
 * Based on dimensional lumber standards (actual sizes)
 */
export const COMMON_THICKNESS_VALUES = [
  0.75,    // 3/4" (actual 1x nominal)
  1.5,     // 1-1/2" (actual 2x nominal)
] as const;

/**
 * Standard sheet goods thickness values
 * Based on plywood industry standards
 */
export const SHEET_THICKNESS_VALUES = [
  0.125,   // 1/8"
  0.1875,  // 3/16"
  0.25,    // 1/4"
  0.3125,  // 5/16"
  0.34375, // 11/32" (actual 3/8")
  0.375,   // 3/8"
  0.46875, // 15/32" (actual 1/2")
  0.5,     // 1/2"
  0.59375, // 19/32" (actual 5/8")
  0.625,   // 5/8"
  0.71875, // 23/32" (actual 3/4")
  0.75,    // 3/4"
  1.0,     // 1"
  1.125,   // 1-1/8"
] as const;

/**
 * Standard common board widths (actual sizes)
 */
export const COMMON_WIDTH_VALUES = [
  1.5,     // 2x2
  2.5,     // 1x3
  3.5,     // 1x4, 2x4
  5.5,     // 1x6, 2x6
  7.25,    // 1x8, 2x8
  9.25,    // 1x10, 2x10
  11.25,   // 1x12, 2x12
] as const;

/**
 * Standard sheet widths (inches)
 */
export const SHEET_WIDTH_VALUES = [
  24,      // 2'
  48,      // 4' (standard)
  60,      // 5' (utility)
] as const;

/**
 * Standard sheet lengths (inches)
 */
export const SHEET_LENGTH_VALUES = [
  48,      // 4'
  96,      // 8' (standard)
  120,     // 10' (utility)
] as const;

export type LumberCategory = 'hardwood' | 'common' | 'sheet';

/**
 * Get allowed thickness values for a lumber category
 */
export function getThicknessValues(category: LumberCategory): readonly number[] {
  switch (category) {
    case 'hardwood':
      return HARDWOOD_THICKNESS_VALUES;
    case 'common':
      return COMMON_THICKNESS_VALUES;
    case 'sheet':
      return SHEET_THICKNESS_VALUES;
  }
}

/**
 * Check if a value is within tolerance of any standard value
 */
export function isStandardValue(value: number, standards: readonly number[]): boolean {
  return standards.some(std => Math.abs(value - std) <= DIMENSION_TOLERANCE);
}

/**
 * Validate a thickness value against category standards
 * Returns null if valid, or a warning message if non-standard
 */
export function validateThickness(
  value: number,
  category: LumberCategory
): string | null {
  const standards = getThicknessValues(category);
  if (isStandardValue(value, standards)) {
    return null;
  }
  return `Non-standard thickness: ${value}" is not a common ${category} thickness`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single "lumber" category | hardwood/common/sheet split | v4.0 (Feb 2026) | Better material organization |
| Board feet calculations | Piece count only | v4.0 (Feb 2026) | Simpler, user-focused |
| "height" field name | "thickness" field name | v4.0 (Feb 2026) | Clearer woodworking terminology |
| Category-based cut list filter | cutItem boolean flag | v4.0 (Feb 2026) | More flexible cut list eligibility |

**Deprecated/outdated:**
- `calculateBoardFeet()`: Remove in this phase
- `formatBoardFeet()`: Remove in this phase
- `height` field: Keep temporarily, remove in Phase 28
- `lumber` category value: Migrate to `hardwood` in Phase 28

## Open Questions

Things that couldn't be fully resolved:

1. **Exact timing of height column removal**
   - What we know: Column rename in SQLite requires special handling
   - What's unclear: Whether drizzle-kit push will handle gracefully
   - Recommendation: Add thickness now, migrate data and remove height in Phase 28

2. **Hardwood width validation standards**
   - What we know: Hardwood boards come in random widths from the mill
   - What's unclear: Whether to validate width at all for hardwood category
   - Recommendation: Skip width validation for hardwood (only validate sheet dimensions)

3. **Existing data migration scope for Phase 28**
   - What we know: All "lumber" items become "hardwood", cutItem=true for lumber
   - What's unclear: Whether to update AI-generated historical items
   - Recommendation: Migrate ALL items with lumber category; future AI handles new categories

## Sources

### Primary (HIGH confidence)
- Existing codebase files examined:
  - `src/lib/server/schema.ts` - Current Drizzle schema
  - `src/lib/types/bom.ts` - Current TypeScript types
  - `src/lib/server/schemas/bom-schema.ts` - Current Zod schemas
  - `src/lib/utils/board-feet.ts` - Current dimension utilities
  - `src/lib/components/bom/BOMItem.svelte` - Current height field usage
  - `src/routes/api/bom/[id]/items/[itemId]/+server.ts` - Current API handling
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations) - Schema migration patterns
- [Drizzle ORM Push](https://orm.drizzle.team/docs/drizzle-kit-push) - Push command behavior
- [Drizzle ORM Custom Migrations](https://orm.drizzle.team/docs/kit-custom-migrations) - Manual migration approach

### Secondary (MEDIUM confidence)
- [Woodworkers Source - Quarter System](https://www.woodworkerssource.com/blog/woodworking-101/tips-tricks/what-does-44-mean-when-talking-about-lumber/) - Hardwood thickness standards
- [Rockler - Quarter System](https://www.rockler.com/learn/what-does-quarter-system-of-lumber-thickness-mean) - NHLA standards
- [Conner Industries - Plywood Sizes](https://www.connerindustries.com/plywood-sizes/) - Sheet goods standards
- [EZ Wood Shop - Lumber Dimensions](https://www.ezwoodshop.com/lumber-dimensions.html) - Common board dimensions

### Tertiary (LOW confidence)
- [GitHub Issue #3653](https://github.com/drizzle-team/drizzle-orm/issues/3653) - Column rename bug (priority fix planned)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies
- Architecture: HIGH - Following established patterns in codebase
- Pitfalls: HIGH - Based on codebase analysis and Drizzle documentation
- Dimension values: MEDIUM - Based on industry standards, may need user feedback

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable domain, minimal external dependencies)
