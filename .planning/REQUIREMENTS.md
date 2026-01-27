# Requirements: WoodShop Toolbox v2.0

**Defined:** 2026-01-26
**Core Value:** Generate accurate, complete bills of materials for woodworking projects through intelligent guided questioning — reducing planning time and ensuring nothing is forgotten.

## v2.0 Requirements

Requirements for v2.0 milestone. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can log in with email and password
- [x] **AUTH-03**: User session persists across browser refresh
- [x] **AUTH-04**: User can log out

### Project Management

- [ ] **PROJ-01**: User can create a named project with description
- [ ] **PROJ-02**: User can view list of their projects
- [ ] **PROJ-03**: User can edit project metadata (name, description, notes)
- [ ] **PROJ-04**: User can delete a project

### BOM Persistence

- [ ] **BOM-01**: User can save generated BOM to a project
- [ ] **BOM-02**: User can view saved BOMs in a project
- [ ] **BOM-03**: User can edit a saved BOM (quantities, items, visibility)
- [ ] **BOM-04**: User can delete a saved BOM

### Template Management

- [ ] **TMPL-01**: Templates stored in database (migrated from code)
- [ ] **TMPL-02**: User can view all templates in admin panel
- [ ] **TMPL-03**: User can add a new template
- [ ] **TMPL-04**: User can edit an existing template
- [ ] **TMPL-05**: User can delete a template

### CSV Import

- [ ] **CSV-01**: User can upload CSV file to create BOM
- [ ] **CSV-02**: CSV import validates format and shows errors
- [ ] **CSV-03**: Imported BOM can be edited like AI-generated BOM
- [ ] **CSV-04**: Imported BOM can be saved to a project

## Future Requirements

Deferred to v2.1 or later. Tracked but not in current roadmap.

### Authentication (v2.1)

- **AUTH-05**: User can reset password via email link
- **AUTH-06**: User receives email verification after signup
- **AUTH-07**: Rate limiting on auth endpoints

### Multi-User (v3.0)

- **USER-01**: Admin can create additional user accounts
- **USER-02**: Users have distinct data isolation
- **USER-03**: Role-based access control (admin vs. user)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| OAuth login (Google/GitHub) | Email/password sufficient for single-user app |
| Real-time collaboration | Single user focus |
| Mobile app | Web-first, responsive design sufficient |
| Pricing/cost estimation | May add in future, not v2.0 |
| Inventory tracking | Separate tool if needed |
| Cut list optimization | Separate tool if needed |
| 3D visualization | Complexity not justified |
| Session caching (Redis) | Over-optimization for single-user |
| Multi-tenancy | v3.0+ scope |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 8 | Complete |
| AUTH-02 | Phase 8 | Complete |
| AUTH-03 | Phase 8 | Complete |
| AUTH-04 | Phase 8 | Complete |
| PROJ-01 | Phase 9 | Pending |
| PROJ-02 | Phase 9 | Pending |
| PROJ-03 | Phase 9 | Pending |
| PROJ-04 | Phase 9 | Pending |
| BOM-01 | Phase 10 | Pending |
| BOM-02 | Phase 10 | Pending |
| BOM-03 | Phase 10 | Pending |
| BOM-04 | Phase 10 | Pending |
| TMPL-01 | Phase 11 | Pending |
| TMPL-02 | Phase 11 | Pending |
| TMPL-03 | Phase 11 | Pending |
| TMPL-04 | Phase 11 | Pending |
| TMPL-05 | Phase 11 | Pending |
| CSV-01 | Phase 12 | Pending |
| CSV-02 | Phase 12 | Pending |
| CSV-03 | Phase 12 | Pending |
| CSV-04 | Phase 12 | Pending |

**Coverage:**
- v2.0 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-01-26*
*Last updated: 2026-01-26 after initial definition*
