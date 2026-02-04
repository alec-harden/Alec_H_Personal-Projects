# Phase 27: Cut List Integration - Research

**Researched:** 2026-02-04
**Domain:** Cut list optimizer integration with v4.0 BOM schema
**Confidence:** HIGH

## Summary

This phase updates the cut list optimizer to use the new v4.0 BOM schema fields (`cutItem` boolean and `thickness` field) instead of the deprecated `category === 'lumber'` filter and `height` field.

The research scope is narrow and well-defined. All changes are internal to this codebase - no external library research required. The existing codebase has clear patterns established in Phases 23-26 that inform this implementation.

The primary work involves:
1. Changing BOM item filtering from category-based to cutItem flag-based
2. Updating dimension field references from height to thickness
3. Updating UI text from "lumber items" to "cut items"
4. Updating mode detection from checking `category === 'lumber'` with width presence to checking `category === 'sheet'`

**Primary recommendation:** Follow the established codebase patterns exactly. The `isLumberCategory()` helper and `cutItem` flag already exist - this phase just wires them into the cut list flow.

## Standard Stack

This phase uses only existing project dependencies:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SvelteKit | 2.x | Framework | Already in use |
| Drizzle ORM | existing | Database queries | Already in use |
| TypeScript | existing | Type safety | Already in use |

### Supporting
No additional libraries needed. All functionality exists within the codebase.

## Architecture Patterns

### Files to Modify

```
src/
├── routes/cutlist/from-bom/
│   └── +page.server.ts    # Filter and mode detection logic
└── lib/components/cutlist/
    └── BomSelector.svelte  # UI display text
```

### Pattern 1: cutItem Flag Filtering

**What:** Filter BOM items by `cutItem === true` instead of `category === 'lumber'`
**When to use:** When determining which items go to cut list optimizer
**Current code (from-bom/+page.server.ts lines 72-74):**
```typescript
// OLD: Filter to lumber items with valid length dimension
const validLumberItems = lumberItems.filter(
  (item) => item.category === 'lumber' && item.length !== null
);
```
**New pattern:**
```typescript
// NEW: Filter to cut items with valid length dimension
const validCutItems = bomItems.filter(
  (item) => item.cutItem === true && item.length !== null
);
```

### Pattern 2: Sheet Mode Detection

**What:** Detect sheet mode based on category, not just width presence
**When to use:** When determining optimizer mode (linear vs sheet)
**Current code (from-bom/+page.server.ts lines 83-84):**
```typescript
// OLD: Detect mode based on width presence
const hasWidth = validLumberItems.some((item) => item.width !== null);
const mode = hasWidth ? 'sheet' : 'linear';
```
**New pattern:**
```typescript
// NEW: Detect mode based on sheet category
const hasSheetItems = validCutItems.some((item) => item.category === 'sheet');
const mode = hasSheetItems ? 'sheet' : 'linear';
```

**Rationale:** Sheet goods (plywood, MDF) require 2D optimization. Hardwood and common lumber use 1D linear optimization even when they have width (the width is just for reference, cuts are made along length).

### Pattern 3: Thickness Field Usage

**What:** Use `thickness` field instead of deprecated `height` field
**When to use:** Anywhere lumber dimensions are displayed or used
**Note:** The cut list optimizer currently doesn't use thickness directly - it only uses length and width. However, the Stock type should include thickness for future use.

**Current Stock interface (from cutlist.ts):**
```typescript
export interface Stock {
  id: string;
  length: number;
  width: number | null;
  quantity: number;
  label: string;
}
```

The thickness field is used for:
1. Display purposes (labeling stock)
2. Future grouping (same thickness items on same stock)

For Phase 27, thickness should be included in the label when transforming BOM items to Stock.

### Pattern 4: cutItem Count Display

**What:** Show count of items with `cutItem=true` instead of `category === 'lumber'`
**Where:** BomSelector.svelte component
**Current code (BomSelector.svelte lines 28-31):**
```typescript
// OLD: Calculate lumber count for each BOM
function getLumberCount(bom: BOM): number {
  return bom.items.filter((item) => item.category === 'lumber' && item.length !== null)
    .length;
}
```
**New pattern:**
```typescript
// NEW: Calculate cut item count for each BOM
function getCutItemCount(bom: BOM): number {
  return bom.items.filter((item) => item.cutItem === true && item.length !== null)
    .length;
}
```

Also update display text from "lumber items" to "cut items".

### Anti-Patterns to Avoid

- **Mixing old and new patterns:** Don't check both `category === 'lumber'` AND `cutItem === true`. The cutItem flag is the source of truth.
- **Hardcoding categories:** Don't hardcode `'hardwood' || 'common' || 'sheet'` checks. Use the `cutItem` flag which is already set by the API (Phase 25).
- **Ignoring null cutItem:** Remember `cutItem` can be null (defaults to false). Always check `cutItem === true`, not just `cutItem` truthy.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Determining if item is cut-able | Category list check | `item.cutItem === true` | Phase 25 API already sets this flag |
| Category type checking | String comparisons | `isLumberCategory()` helper | Already exists in `$lib/types/bom.ts` |

**Key insight:** Phase 25 already does the heavy lifting by auto-setting `cutItem=true` for lumber categories during BOM save. This phase just consumes that flag.

## Common Pitfalls

### Pitfall 1: Forgetting null handling for cutItem

**What goes wrong:** Treating `cutItem` as boolean when it can be null
**Why it happens:** TypeScript may not enforce strict null checks
**How to avoid:** Always use `item.cutItem === true` (strict equality)
**Warning signs:** Items not showing up that should, or vice versa

### Pitfall 2: Mode detection edge cases

**What goes wrong:** Selecting wrong optimizer mode
**Why it happens:** Mixed lumber and sheet items in same BOM
**How to avoid:** If ANY item has `category === 'sheet'`, use sheet mode
**Warning signs:** Linear cuts appearing on 2D diagrams or vice versa

### Pitfall 3: Interface mismatch in BomSelector

**What goes wrong:** TypeScript errors due to missing `cutItem` in interface
**Why it happens:** BomSelector has its own BOM interface that doesn't include cutItem
**How to avoid:** Update the interface to include `cutItem?: boolean`
**Warning signs:** Build errors, missing property warnings

### Pitfall 4: Error message text still says "lumber"

**What goes wrong:** Error messages reference "lumber items" instead of "cut items"
**Why it happens:** Forgetting to update error text strings
**How to avoid:** Search for all "lumber" strings in affected files
**Warning signs:** Confusing UX when no cut items found

## Code Examples

### Example 1: Updated from-bom server action

```typescript
// src/routes/cutlist/from-bom/+page.server.ts

// Query items from selected BOMs
const allItems = await db.query.bomItems.findMany({
  where: inArray(bomItems.bomId, selectedBomIds)
});

// Filter to cut items with valid length dimension
const validCutItems = allItems.filter(
  (item) => item.cutItem === true && item.length !== null
);

if (validCutItems.length === 0) {
  return fail(400, {
    error: 'No cut items with valid dimensions found in selected BOMs'
  });
}

// Detect mode based on sheet category
const hasSheetItems = validCutItems.some((item) => item.category === 'sheet');
const mode = hasSheetItems ? 'sheet' : 'linear';

// Transform to Stock format with thickness in label
const stock = validCutItems.map((item) => ({
  id: crypto.randomUUID(),
  length: item.length!,
  width: item.width,
  quantity: item.quantity,
  label: item.thickness
    ? `${item.thickness}" ${item.name}`
    : item.name,
  grainMatters: false
}));

return { success: true, stock, mode };
```

### Example 2: Updated BomSelector interface and function

```typescript
// src/lib/components/cutlist/BomSelector.svelte

interface BOM {
  id: string;
  name: string;
  items: Array<{
    id: string;
    category: string;
    cutItem?: boolean;  // Add this
    length: number | null;
    width: number | null;
  }>;
}

// Calculate cut item count for each BOM
function getCutItemCount(bom: BOM): number {
  return bom.items.filter(
    (item) => item.cutItem === true && item.length !== null
  ).length;
}
```

### Example 3: Updated display text

```svelte
<!-- BomSelector.svelte -->
<span class="bom-count">
  {cutItemCount}
  {cutItemCount === 1 ? 'cut item' : 'cut items'}
</span>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `category === 'lumber'` | `cutItem === true` | v4.0 Phase 25 | Flexible filtering, any category can have cuts |
| `height` field | `thickness` field | v4.0 Phase 23 | Clearer naming, semantic meaning |
| Single lumber category | 6 categories (hardwood, common, sheet, hardware, finishes, consumables) | v4.0 Phase 23 | Better material organization |

**Deprecated/outdated:**
- `category === 'lumber'`: No longer exists, split into hardwood/common/sheet
- `height` field: Kept for migration, use `thickness` instead

## Open Questions

None - this phase is straightforward with clear requirements and existing patterns to follow.

## Sources

### Primary (HIGH confidence)
- `src/routes/cutlist/from-bom/+page.server.ts` - Current filter and mode logic
- `src/lib/components/cutlist/BomSelector.svelte` - Current UI and interface
- `src/lib/types/bom.ts` - BOM types including cutItem field
- `src/lib/server/schema.ts` - Database schema with cutItem column
- `src/lib/server/bom-validation.ts` - shouldBeCutItem() helper function
- `.planning/STATE.md` - Prior decisions from Phases 23-26

### Secondary (MEDIUM confidence)
- N/A (all sources are primary codebase)

### Tertiary (LOW confidence)
- N/A (no external research needed)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, using existing code
- Architecture: HIGH - Patterns established in codebase, clear requirements
- Pitfalls: HIGH - Based on actual code review, known TypeScript patterns

**Research date:** 2026-02-04
**Valid until:** Indefinite (internal codebase patterns, not external dependencies)

## Implementation Checklist

For planner reference, the four requirements map to these changes:

1. **CUT-01:** Change BOM filter from `category === 'lumber'` to `cutItem === true`
   - File: `src/routes/cutlist/from-bom/+page.server.ts`
   - Lines: 72-74 (filter logic)
   - Also update: Error message text (line 77)

2. **CUT-02:** Use `thickness` field in optimization
   - File: `src/routes/cutlist/from-bom/+page.server.ts`
   - Lines: 87-94 (Stock transformation)
   - Add thickness to label for display

3. **CUT-03:** Update BomSelector to show cutItem count
   - File: `src/lib/components/cutlist/BomSelector.svelte`
   - Lines: 8-14 (interface definition)
   - Lines: 28-31 (getLumberCount function)
   - Lines: 36, 55-58 (display text)

4. **CUT-04:** Update mode detection logic (sheet category -> sheet mode)
   - File: `src/routes/cutlist/from-bom/+page.server.ts`
   - Lines: 83-84 (mode detection)
   - Change from width-based to category-based detection
