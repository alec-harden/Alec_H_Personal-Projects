# 29-01: Database Schema & Validation Logic

## Status: Complete

## One-liner

Database-backed dimension validation with startup seeding and 1-minute TTL cache.

## Deliverables

- dimensionValues table in schema.ts for admin-managed dimension standards
- seedDefaultDimensions function creates 41 default values on startup
- hooks.server.ts seeds dimension_values table on first request if empty
- dimension-validation.ts reads from database with 1-minute cache TTL
- All validation functions now async (validateThickness, validateWidth, validateLength)
- API routes await async validation calls

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1 | d2935fa | src/lib/server/schema.ts |
| 2 | 7fde9f1 | src/lib/server/seed-dimensions.ts (NEW) |
| 3 | e115819 | src/hooks.server.ts |
| 4 | 4502f00 | src/lib/utils/dimension-validation.ts |
| 5 | 51fc88b | src/lib/server/bom-validation.ts |
| 6 | c1331e1 | src/routes/api/bom/save/+server.ts, src/routes/api/bom/[id]/items/[itemId]/+server.ts |
| 7 | (db:push) | dimension_values table created |
| fix | b48592d | src/lib/server/seed-dimensions.ts (type fix) |

## Technical Details

### Database Schema

```typescript
dimensionValues = sqliteTable('dimension_values', {
  id: text('id').primaryKey(),
  category: text('category', { enum: ['hardwood', 'common', 'sheet'] }).notNull(),
  dimensionType: text('dimension_type', { enum: ['thickness', 'width', 'length'] }).notNull(),
  value: real('value').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});
```

### Seeded Values (41 total)

- **Hardwood thickness**: 12 values (0.75" to 4" based on NHLA system)
- **Common thickness**: 2 values (0.75", 1.5")
- **Common width**: 7 values (1.5" to 11.25")
- **Sheet thickness**: 14 values (0.125" to 1.125")
- **Sheet width**: 3 values (24", 48", 60")
- **Sheet length**: 3 values (48", 96", 120")

### Caching

- 1-minute TTL cache in dimension-validation.ts
- invalidateDimensionCache() exported for admin updates
- Cache loads all values on first validation call

## Verification

- [x] TypeScript compiles (plan files compile; pre-existing errors in unrelated files)
- [x] `npm run db:push` creates dimension_values table
- [x] Dev server console shows "Seeding default dimension values..."
- [x] 41 rows created in dimension_values table

## Issues

None - plan executed as written.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed DB type in seed-dimensions.ts**

- **Found during:** Task 7 verification
- **Issue:** LibSQLDatabase<Record<string, never>> type incompatible with db instance that uses schema
- **Fix:** Changed type to LibSQLDatabase<typeof schema>
- **Files modified:** src/lib/server/seed-dimensions.ts
- **Commit:** b48592d
