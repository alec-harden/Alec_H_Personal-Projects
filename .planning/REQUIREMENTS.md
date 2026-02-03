# Requirements: WoodShop Toolbox v4.0

**Defined:** 2026-02-03
**Core Value:** Generate accurate, complete bills of materials for woodworking projects through intelligent guided questioning — reducing planning time and ensuring nothing is forgotten.

## v4.0 Requirements

Requirements for BOM Lumber Categorization & Cut Item Integration milestone.

### Lumber Categorization

- [ ] **CAT-01**: Replace `lumber` category with `hardwood`, `common`, `sheet` in all type definitions
- [ ] **CAT-02**: Add `cutItem` boolean field to bomItems table schema
- [ ] **CAT-03**: Set `cutItem = true` automatically for hardwood/common/sheet categories
- [ ] **CAT-04**: Remove board feet utility functions and calculations entirely

### Dimensional Requirements

- [ ] **DIM-01**: Rename `height` field to `thickness` for clarity (schema migration)
- [ ] **DIM-02**: Add dimensional validation with admin-managed allowed values
- [ ] **DIM-03**: Validate dimensions are present when saving items with cutItem=true
- [ ] **DIM-04**: Display warning (not block) for non-standard dimension values

### BOM Display

- [ ] **UI-01**: Update category order and color configuration for 6 categories
- [ ] **UI-02**: Remove board feet calculations from BOMItem and BOMCategory components
- [ ] **UI-03**: Display lumber item names with fractional thickness prefix ("3/4 Oak")
- [ ] **UI-04**: Force `unit = 'pcs'` for all lumber categories in AddItemForm
- [ ] **UI-05**: Update category header labels (Hardwood Lumber, Common Boards, Sheet Goods)

### AI & Wizard

- [ ] **AI-01**: Update AI system prompt to use new lumber categories
- [ ] **AI-02**: AI assigns correct category (hardwood/common/sheet) based on material type
- [ ] **AI-03**: AI includes dimensions (L/W/T) for all lumber items with actual measurements
- [ ] **WIZ-01**: Add "Include Consumable Items" toggle at BOM wizard start
- [ ] **WIZ-02**: Modify prompt generation based on consumables toggle setting
- [ ] **WIZ-03**: Update ProjectDetails type for consumables flag

### API & Validation

- [ ] **VAL-01**: Validate dimensions are present when saving items with cutItem=true
- [ ] **VAL-02**: Validate dimension values against allowed lists (warn, don't block)
- [ ] **VAL-03**: Auto-set `cutItem` based on category when saving BOM items
- [ ] **VAL-04**: Update CSV import/export for new categories and cutItem field

### Cut List Integration

- [ ] **CUT-01**: Change BOM filter from `category === 'lumber'` to `cutItem === true`
- [ ] **CUT-02**: Use `thickness` field (formerly `height`) in optimization calculations
- [ ] **CUT-03**: Update BomSelector component to show cutItem count
- [ ] **CUT-04**: Update mode detection logic (sheet category → sheet mode)

### Admin Dimension Management

- [ ] **ADM-01**: Create `dimensionValues` database table (category, dimension_type, values JSON)
- [ ] **ADM-02**: Seed default dimension values on first run
- [ ] **ADM-03**: Create `/admin/dimensions` route for dimension management UI
- [ ] **ADM-04**: Admin can view current accepted values per category/dimension type
- [ ] **ADM-05**: Admin can add new accepted values
- [ ] **ADM-06**: Admin can remove accepted values
- [ ] **ADM-07**: Admin can reset dimension values to defaults
- [ ] **ADM-08**: Validation logic reads from database instead of hardcoded constants

### Data Migration

- [ ] **MIG-01**: Create migration script for existing BOMs (lumber → hardwood by default)
- [ ] **MIG-02**: Backfill cutItem=true for existing lumber items
- [ ] **MIG-03**: Rename height → thickness in existing data

## Future Requirements

Deferred to future releases. Tracked but not in current roadmap.

### BOM Enhancements

- **BOM-11**: BOM presets for standard lumber dimensions
- **BOM-12**: Cost estimation for BOM items

### Cut List Enhancements

- **CUT-40**: Cut list PDF export with cutting diagram
- **CUT-41**: Cut labels for workshop printing
- **CUT-42**: Optimization history/comparison

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Board feet calculations | Replaced with piece-based counting; not useful for actual dimensions |
| Nominal dimensions | Only actual dimensions used; matches real woodworking practice |
| Multiple thickness values per item | One thickness per BOM item; use separate items for different thicknesses |
| Lumber sub-categories | Categories are flat (hardwood, common, sheet); no hierarchical structure |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAT-01 | Phase 23 | Pending |
| CAT-02 | Phase 23 | Pending |
| CAT-03 | Phase 23 | Pending |
| CAT-04 | Phase 23 | Pending |
| DIM-01 | Phase 23 | Pending |
| DIM-02 | Phase 23 | Pending |
| UI-01 | Phase 24 | Pending |
| UI-02 | Phase 24 | Pending |
| UI-03 | Phase 24 | Pending |
| UI-04 | Phase 24 | Pending |
| UI-05 | Phase 24 | Pending |
| VAL-01 | Phase 25 | Pending |
| VAL-02 | Phase 25 | Pending |
| VAL-03 | Phase 25 | Pending |
| VAL-04 | Phase 25 | Pending |
| AI-01 | Phase 26 | Pending |
| AI-02 | Phase 26 | Pending |
| AI-03 | Phase 26 | Pending |
| WIZ-01 | Phase 26 | Pending |
| WIZ-02 | Phase 26 | Pending |
| WIZ-03 | Phase 26 | Pending |
| CUT-01 | Phase 27 | Pending |
| CUT-02 | Phase 27 | Pending |
| CUT-03 | Phase 27 | Pending |
| CUT-04 | Phase 27 | Pending |
| MIG-01 | Phase 28 | Pending |
| MIG-02 | Phase 28 | Pending |
| MIG-03 | Phase 28 | Pending |
| DIM-03 | Phase 25 | Pending |
| DIM-04 | Phase 25 | Pending |
| ADM-01 | Phase 29 | Pending |
| ADM-02 | Phase 29 | Pending |
| ADM-03 | Phase 29 | Pending |
| ADM-04 | Phase 29 | Pending |
| ADM-05 | Phase 29 | Pending |
| ADM-06 | Phase 29 | Pending |
| ADM-07 | Phase 29 | Pending |
| ADM-08 | Phase 29 | Pending |

**Coverage:**
- v4.0 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-03 after initial definition*
