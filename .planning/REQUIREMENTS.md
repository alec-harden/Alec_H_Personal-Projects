# Requirements: WoodShop Toolbox

**Defined:** 2026-01-20
**Core Value:** Generate accurate, complete bills of materials for woodworking projects through intelligent guided questioning — reducing planning time and ensuring nothing is forgotten.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Platform

- [ ] **PLAT-01**: User can view dashboard home page with tool cards

### BOM Generator - Core Flow

- [ ] **BOM-01**: User completes guided prompt workflow (project type → dimensions → joinery → materials)
- [ ] **BOM-02**: User receives AI-powered material suggestions from configurable LLM provider
- [ ] **BOM-03**: User can select project template (table, cabinet, shelf, etc.) to guide AI suggestions
- [ ] **BOM-04**: System generates comprehensive BOM covering lumber, hardware, finishes, consumables

### BOM Generator - Editing

- [ ] **EDIT-01**: User can edit quantities for any material
- [ ] **EDIT-02**: User can add custom materials not suggested by AI
- [ ] **EDIT-03**: User can toggle visibility on items (greyed out, excluded from export and totals)
- [ ] **EDIT-04**: Materials are grouped by category (Lumber, Hardware, Finishes, Consumables)

### BOM Generator - Export

- [ ] **EXPORT-01**: User can export BOM to CSV format

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Platform

- **PLAT-02**: Modular tool architecture allowing plug-and-play addition of new tools
- **PLAT-03**: Responsive design for desktop and tablet use
- **PLAT-04**: Cloud deployment with persistent data storage
- **PLAT-05**: Single-user authentication with design for future multi-user support

### BOM Persistence

- **PERS-01**: User can save BOMs for later access and editing
- **PERS-02**: User can view saved project history
- **PERS-03**: AI conversation history preserved for context on return

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time collaboration | Single user focus for v1 |
| Mobile app | Web-first, responsive design sufficient |
| Pricing/cost estimation | May add later, not v1 |
| Inventory tracking | Separate tool if needed |
| Cut list optimization | Separate tool if needed |
| 3D visualization | Complexity not justified for v1 |
| PDF export | CSV sufficient for v1 |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Complete |
| BOM-01 | Phase 3 | Pending |
| BOM-02 | Phase 2 | Complete |
| BOM-03 | Phase 3 | Pending |
| BOM-04 | Phase 3 | Pending |
| EDIT-01 | Phase 4 | Pending |
| EDIT-02 | Phase 4 | Pending |
| EDIT-03 | Phase 4 | Pending |
| EDIT-04 | Phase 4 | Pending |
| EXPORT-01 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-20*
*Last updated: 2026-01-20 after Phase 2 completion*
