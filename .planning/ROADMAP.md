# ROADMAP.md

**Current Milestone:** v4.0 BOM Lumber Categorization

## v4.0 Phases

| Phase | Name | Goal | Requirements | Status |
|-------|------|------|--------------|--------|
| 23 | Schema Foundation | Update schema and types for new categories and cutItem flag | CAT-01 to CAT-04, DIM-01, DIM-02 | ✓ Complete |
| 24 | Display Updates | Update UI for 6 categories, remove board feet, add thickness prefix | UI-01 to UI-05 | ✓ Complete |
| 25 | API Validation | Add dimension validation and CSV updates | VAL-01 to VAL-04, DIM-03, DIM-04 | ✓ Complete |
| 26 | AI & Wizard | Update AI prompts and add consumables toggle | AI-01 to AI-03, WIZ-01 to WIZ-03 | ✓ Complete |
| 27 | Cut List Integration | Update optimizer to filter by cutItem flag | CUT-01 to CUT-04 | ✓ Complete |
| 28 | Data Migration | Migrate existing data and verify all flows | MIG-01 to MIG-03 | ○ Pending |
| 29 | Admin Dimensions | Admin management of accepted dimension values | ADM-01 to ADM-08 | ○ Pending |

**Total:** 7 phases | 35 requirements

---

## Phase Details

### Phase 23: Schema Foundation

**Goal:** Update database schema and TypeScript types for new category structure and Cut_Item flag.

**Plans:** 2 plans

Plans:
- [x] 23-01-PLAN.md — Update TypeScript types, Zod schemas, Drizzle schema, create dimension validation
- [x] 23-02-PLAN.md — Remove board feet calculation functions

**Requirements:**
- CAT-01: Replace `lumber` category with `hardwood`, `common`, `sheet` in all type definitions
- CAT-02: Add `cutItem` boolean field to bomItems table schema
- CAT-03: Set `cutItem = true` automatically for hardwood/common/sheet categories
- CAT-04: Remove board feet utility functions and calculations
- DIM-01: Rename `height` field to `thickness` for clarity (schema migration)
- DIM-02: Add dimensional validation constants (allowed values per category type)

**Success Criteria:**
1. TypeScript compilation passes with new BOMCategory type
2. Database schema includes cutItem and thickness fields
3. board-feet.ts no longer exports calculateBoardFeet/formatBoardFeet
4. dimension-validation.ts exports validation constants

**Key Files:**
- `src/lib/server/schema.ts`
- `src/lib/types/bom.ts`
- `src/lib/server/schemas/bom-schema.ts`
- `src/lib/utils/board-feet.ts` (DELETE functions)
- `src/lib/utils/dimension-validation.ts` (NEW)

---

### Phase 24: Display Updates

**Goal:** Update UI components to handle new categories, remove board feet display, add thickness prefix to names.

**Plans:** 1 plan

Plans:
- [x] 24-01-PLAN.md — Update category configuration, labels, colors, thickness prefix, unit options

**Requirements:**
- UI-01: Update category order and color configuration for 6 categories
- UI-02: Remove board feet calculations from BOMItem and BOMCategory components
- UI-03: Display lumber item names with fractional thickness prefix ("3/4 Oak")
- UI-04: Force `unit = 'pcs'` for all lumber categories in AddItemForm
- UI-05: Update category header labels (Hardwood Lumber, Common Boards, Sheet Goods)

**Success Criteria:**
1. BOM displays 6 categories with distinct colors
2. No board feet visible anywhere in UI
3. Lumber items show "3/4 Oak" style naming
4. AddItemForm only offers 'pcs' for lumber categories

**Key Files:**
- `src/lib/components/bom/BOMDisplay.svelte`
- `src/lib/components/bom/BOMCategory.svelte`
- `src/lib/components/bom/BOMItem.svelte`
- `src/lib/components/bom/AddItemForm.svelte`

---

### Phase 25: API Validation

**Goal:** Update API endpoints to validate dimensions for lumber items and enforce constraints.

**Plans:** 2 plans

Plans:
- [x] 25-01-PLAN.md — API validation core: bom-validation.ts helper, save/update endpoints
- [x] 25-02-PLAN.md — CSV updates: export with CutItem/Thickness, import 6-category fix

**Requirements:**
- VAL-01: Validate dimensions are present when saving items with cutItem=true
- VAL-02: Validate dimension values against allowed lists (warn, don't block)
- VAL-03: Auto-set `cutItem` based on category when saving BOM items
- VAL-04: Update CSV import/export for new categories and cutItem field
- DIM-03: Validate dimensions are present when saving items with cutItem=true
- DIM-04: Display warning (not block) for non-standard dimension values

**Success Criteria:**
1. API returns validation warnings for non-standard dimensions
2. Save succeeds even with warnings (user override)
3. cutItem is auto-set based on category
4. CSV export includes new categories and cutItem column
5. CSV import parses new format correctly

**Key Files:**
- `src/lib/server/bom-validation.ts` (NEW)
- `src/routes/api/bom/save/+server.ts`
- `src/routes/api/bom/[id]/items/[itemId]/+server.ts`
- `src/lib/utils/csv-import.ts`
- `src/lib/utils/csv.ts`

---

### Phase 26: AI & Wizard Updates

**Goal:** Update AI prompts for new categories and add consumables toggle to wizard.

**Plans:** 2 plans

Plans:
- [x] 26-01-PLAN.md — Wizard consumables toggle (WIZ-01, WIZ-03)
- [x] 26-02-PLAN.md — AI prompt updates for 6 categories and dimensions (AI-01, AI-02, AI-03, WIZ-02)

**Requirements:**
- AI-01: Update AI system prompt to use new lumber categories
- AI-02: AI assigns correct category (hardwood/common/sheet) based on material type
- AI-03: AI includes dimensions (L/W/T) for all lumber items
- WIZ-01: Add "Include Consumable Items" toggle at BOM wizard start
- WIZ-02: Modify prompt generation based on consumables toggle setting
- WIZ-03: Update ProjectDetails type for consumables flag

**Success Criteria:**
1. AI generates BOMs with hardwood/common/sheet categories
2. AI assigns correct category based on wood species
3. All lumber items have L/W/T dimensions
4. Toggle controls whether consumables appear in generated BOM

**Key Files:**
- `src/routes/api/bom/generate/+server.ts`
- `src/lib/components/bom/BOMWizard.svelte`
- `src/lib/components/bom/ProjectTypeStep.svelte`
- `src/lib/types/bom.ts`

---

### Phase 27: Cut List Integration

**Goal:** Update cut list optimizer to filter by cutItem flag instead of category.

**Requirements:**
- CUT-01: Change BOM filter from `category === 'lumber'` to `cutItem === true`
- CUT-02: Use `thickness` field (formerly `height`) in optimization
- CUT-03: Update BomSelector component to show cutItem count
- CUT-04: Update mode detection logic (sheet category → sheet mode)

**Success Criteria:**
1. Cut list only imports items where cutItem=true
2. Optimizer uses thickness field correctly
3. BomSelector shows "X cut items" count
4. Sheet goods auto-select sheet mode

**Key Files:**
- `src/routes/cutlist/from-bom/+page.server.ts`
- `src/lib/components/cutlist/BomSelector.svelte`

---

### Phase 28: Data Migration

**Goal:** Migrate existing data and ensure all flows work correctly.

**Requirements:**
- MIG-01: Create migration script for existing BOMs (lumber → hardwood by default)
- MIG-02: Backfill cutItem=true for existing lumber items
- MIG-03: Rename height → thickness in existing data

**Success Criteria:**
1. All existing "lumber" items → "hardwood" category
2. All lumber items have cutItem=true
3. height field data moved to thickness field
4. Full app test passes (BOM create, edit, cut list, CSV)

**Key Files:**
- Migration script (one-time)
- Database verification queries

---

### Phase 29: Admin Dimension Management

**Goal:** Allow admin users to manage accepted dimension values for lumber categories.

**Requirements:**
- ADM-01: Create `dimensionValues` database table
- ADM-02: Seed default dimension values on first run
- ADM-03: Create `/admin/dimensions` route for dimension management UI
- ADM-04: Admin can view current accepted values per category/dimension type
- ADM-05: Admin can add new accepted values
- ADM-06: Admin can remove accepted values
- ADM-07: Admin can reset dimension values to defaults
- ADM-08: Validation logic reads from database instead of hardcoded constants

**Success Criteria:**
1. Admin can access /admin/dimensions
2. Dimension values stored in database
3. Adding value makes it pass validation
4. Removing value makes it trigger warning
5. Reset restores original defaults
6. Non-admin cannot access page

**Key Files:**
- `src/lib/server/schema.ts` (add dimensionValues table)
- `src/routes/admin/dimensions/+page.svelte` (NEW)
- `src/routes/admin/dimensions/+page.server.ts` (NEW)
- `src/routes/api/admin/dimensions/+server.ts` (NEW)
- `src/lib/utils/dimension-validation.ts` (read from DB)

---

## Completed Milestones

- **v3.0 Multi-User & Cut Optimizer** — Phases 13-22 (shipped 2026-01-30) — [Archive](milestones/v3.0-ROADMAP.md)
- **v2.0 Persistence & Project Management** — Phases 8-12 (shipped 2026-01-28) — [Archive](milestones/v2.0-ROADMAP.md)
- **v1.0 MVP** — Phases 1-7 (shipped 2026-01-23) — [Archive](milestones/v1.0-ROADMAP.md)

---
*Updated: 2026-02-04 after Phase 27 execution*
