---
phase: 23-schema-foundation
plan: 01
subsystem: database
tags: [drizzle, zod, typescript, sqlite, schema]

# Dependency graph
requires:
  - phase: v3.0 (Phases 13-22)
    provides: Drizzle schema with bomItems table, existing BOM types
provides:
  - Updated BOMCategory type with hardwood/common/sheet split
  - LumberCategory helper type and isLumberCategory type guard
  - CATEGORY_ORDER const for UI display
  - cutItem boolean field in bomItems table
  - thickness field in bomItems table (height preserved for migration)
  - Dimension validation constants utility
  - Updated Zod schema for AI generation with new categories
affects: [24-ui-updates, 25-api-updates, 28-data-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Union type categories with derived helper types
    - Zod enum for runtime validation matching TypeScript types
    - Dimension validation with tolerance-based comparison
    - Nullable field strategy for SQLite schema migrations

key-files:
  created:
    - src/lib/utils/dimension-validation.ts
  modified:
    - src/lib/types/bom.ts
    - src/lib/server/schemas/bom-schema.ts
    - src/lib/server/schema.ts

key-decisions:
  - "cutItem field nullable with default false (SQLite migration constraint)"
  - "thickness field added, height preserved for Phase 28 data migration"
  - "Dimension validation uses 1/64 inch tolerance for floating point comparison"

patterns-established:
  - "LumberCategory as derived union type from BOMCategory for type narrowing"
  - "Category-specific validation constants via getThicknessValues() switch"
  - "Validation returns warning strings, allows save (per v4.0 design decision)"

# Metrics
duration: 6min
completed: 2026-02-03
---

# Phase 23 Plan 01: Schema Foundation Summary

**Split lumber category into hardwood/common/sheet with cutItem flag and thickness field using Drizzle schema updates, Zod validation, and dimension validation constants**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-03T20:53:26Z
- **Completed:** 2026-02-03T20:59:02Z
- **Tasks:** 4
- **Files modified:** 3
- **Files created:** 1

## Accomplishments
- BOMCategory type split from single 'lumber' to 'hardwood', 'common', 'sheet' categories
- Database schema updated with cutItem boolean flag and thickness field
- Dimension validation constants created with NHLA hardwood standards, dimensional lumber standards, and plywood standards
- Zod schema synchronized with TypeScript types for AI generation

## Task Commits

Each task was committed atomically:

1. **Task 1: Update TypeScript BOM types** - `83f3595` (feat)
2. **Task 2: Update Zod schema for AI generation** - `74beefa` (feat)
3. **Task 3: Update Drizzle database schema** - `8f0a07b` (feat)
4. **Task 4: Create dimension validation constants** - `97e6f61` (feat)

## Files Created/Modified

**Created:**
- `src/lib/utils/dimension-validation.ts` - Validation constants for standard woodworking dimensions (hardwood, common, sheet)

**Modified:**
- `src/lib/types/bom.ts` - BOMCategory type with 6 categories, LumberCategory helper, CATEGORY_ORDER array, isLumberCategory type guard, cutItem and thickness fields
- `src/lib/server/schemas/bom-schema.ts` - Updated category enum and added length/width/thickness optional fields
- `src/lib/server/schema.ts` - Added cutItem (nullable boolean with default false) and thickness (nullable real) fields

## Decisions Made

**1. cutItem field made nullable instead of NOT NULL**
- **Rationale:** SQLite limitations prevent adding NOT NULL columns with defaults to existing tables without data loss. Made nullable with default false to allow safe migration.
- **Impact:** Phase 25 API validation will ensure new items set cutItem correctly.

**2. thickness field added, height field preserved**
- **Rationale:** Per research document, SQLite column rename requires special handling. Adding thickness as new field avoids data loss; height will be removed in Phase 28 after data migration.
- **Impact:** Both fields coexist temporarily. Components will migrate to thickness in Phase 24.

**3. Dimension validation constants use 1/64" tolerance**
- **Rationale:** Floating point comparison needs tolerance for equality checks. 1/64" (0.015625") is smallest practical woodworking precision.
- **Impact:** isStandardValue() function checks within tolerance, not exact equality.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Changed cutItem from NOT NULL to nullable**
- **Found during:** Task 3 (Database schema update)
- **Issue:** drizzle-kit push detected data loss when adding NOT NULL column with default to table with 21 existing rows
- **Fix:** Removed .notNull() constraint, kept .default(false) to allow safe addition
- **Files modified:** src/lib/server/schema.ts
- **Verification:** drizzle-kit push succeeded without data loss warning
- **Committed in:** 8f0a07b (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary to avoid SQLite migration limitations. Nullable with default achieves same outcome as NOT NULL for new rows, existing rows get null (will be updated in Phase 28).

## Issues Encountered

None - SQLite migration constraint was expected from research document and handled via nullable field pattern.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 24 (UI Updates):**
- TypeScript types updated with new categories
- CATEGORY_ORDER provides display order
- isLumberCategory() type guard available for conditional rendering
- Dimension validation constants available for input validation

**Ready for Phase 25 (API Updates):**
- Drizzle schema has cutItem and thickness fields
- Zod schema has new categories for validation
- cutItem default false prevents null values for new items

**Blockers/Concerns:**
- Components still reference 'lumber' category (expected TypeScript errors)
- CSV export still uses old category order (expected)
- These will be fixed in Phase 24 and 25

---
*Phase: 23-schema-foundation*
*Completed: 2026-02-03*
