# Requirements: WoodShop Toolbox v3.0

**Defined:** 2026-01-29
**Core Value:** Enable real multi-user operation with proper security, enhance BOM with lumber dimensions, and add a new Cut List Optimizer tool for material efficiency.

## v3.0 Requirements

Requirements for v3.0 Multi-User & Cut Optimizer milestone. Grouped by feature area.

### RBAC & Security ✓

- [x] **RBAC-01**: Users have a role field (admin or user)
- [x] **RBAC-02**: Admin role grants elevated permissions
- [x] **RBAC-03**: User role is default for new registrations
- [x] **RBAC-04**: Admin routes (/admin/*) check role before access
- [x] **RBAC-05**: Users can only see their own projects, BOMs, and cut lists
- [x] **RBAC-06**: First registered user becomes admin (or seed admin)

### User Management (Admin) ✓

- [x] **USER-01**: Admin can view list of all users
- [x] **USER-02**: Admin can create new user account
- [x] **USER-03**: Admin can reset a user's password
- [x] **USER-04**: Admin can disable a user account
- [x] **USER-05**: Admin can view user details (email, created date, role)
- [x] **USER-06**: Disabled users cannot log in

### Email Flows ✓

- [x] **EMAIL-01**: User can request password reset from login page
- [x] **EMAIL-02**: User receives email with password reset link
- [x] **EMAIL-03**: User can set new password via reset link (expires in 1 hour)
- [x] **EMAIL-04**: New user receives email verification request after signup
- [x] **EMAIL-05**: User can verify email by clicking link in email
- [x] **EMAIL-06**: User profile shows email verification status

### BOM Refinements ✓

- [x] **BOM-05**: Visibility toggle uses eye icon (not checkbox)
- [x] **BOM-06**: Lumber items have dimension fields (length, width, height)
- [x] **BOM-07**: Lumber items display board feet (calculated from dimensions)
- [x] **BOM-08**: Lumber category shows total board feet
- [x] **BOM-09**: CSV export includes dimension columns for lumber
- [x] **BOM-10**: CSV import parses dimension columns for lumber

### Cut List Optimizer - Core

- [ ] **CUT-01**: New tool accessible from dashboard (/cutlist)
- [ ] **CUT-02**: User can select Linear or Sheet optimization mode
- [ ] **CUT-03**: User can input required cuts with dimensions
- [ ] **CUT-04**: User can input available stock dimensions
- [ ] **CUT-05**: User can configure kerf/blade width
- [ ] **CUT-06**: User can run optimization algorithm
- [ ] **CUT-07**: Results display waste percentage
- [ ] **CUT-08**: Results display which cuts come from which stock
- [ ] **CUT-09**: User can clear all inputs and start over
- [ ] **CUT-10**: User can save cut list to a project

### Cut List Optimizer - Linear (1D)

- [ ] **CUT-11**: Linear mode accepts cut lengths
- [ ] **CUT-12**: Linear mode accepts stock lengths
- [ ] **CUT-13**: Linear mode supports multiple stock length options
- [ ] **CUT-14**: Linear mode displays total linear feet summary
- [ ] **CUT-15**: Linear mode visualizes unused portions of stock
- [ ] **CUT-16**: 1D bin packing algorithm (FFD) produces optimal-ish cuts

### Cut List Optimizer - Sheet (2D)

- [ ] **CUT-17**: Sheet mode accepts cut dimensions (L x W)
- [ ] **CUT-18**: Sheet mode accepts sheet dimensions
- [ ] **CUT-19**: Sheet mode supports grain direction toggle per cut
- [ ] **CUT-20**: Sheet mode displays cut diagram visualization
- [ ] **CUT-21**: Sheet mode displays number of sheets needed
- [ ] **CUT-22**: 2D nesting algorithm (guillotine) produces optimal-ish placement

### Cut List Optimizer - BOM Integration

- [ ] **CUT-23**: User can select a project
- [ ] **CUT-24**: User can multi-select BOMs within selected project
- [ ] **CUT-25**: Selected BOMs auto-filter to lumber items only
- [ ] **CUT-26**: Lumber items pre-populate as cuts with dimensions

### Cut List Optimizer - Shop Checklist

- [ ] **CUT-27**: User can view cut list as shop checklist
- [ ] **CUT-28**: User can mark individual cuts as complete
- [ ] **CUT-29**: Checklist shows completion progress indicator
- [ ] **CUT-30**: Checklist completion state persists to project

### Cut List Optimizer - Differentiators

- [ ] **CUT-31**: User can drag-drop materials to assign stock to cuts
- [ ] **CUT-32**: User can manually override algorithm cut placement

## v4.0+ Requirements (Deferred)

Acknowledged but deferred to future milestones.

### Admin Differentiators

- **ADMIN-01**: Admin can send invite email instead of creating password
- **ADMIN-02**: Admin can see user last login timestamp
- **ADMIN-03**: Admin can search/filter user list

### BOM Differentiators

- **BOM-11**: Standard dimension presets (2x4, 2x6, 4/4, 8/4)
- **BOM-12**: Running total board feet updates while editing

### Cut List Differentiators

- **CUT-33**: Export cut list to PDF for shop
- **CUT-34**: Generate labels for each cut
- **CUT-35**: Track stock inventory
- **CUT-36**: Compare multiple optimization strategies
- **CUT-37**: Optimization history and comparison

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| 3D visualization | Extreme complexity, 2D diagrams sufficient |
| CNC machine integration | Niche feature, adds complexity |
| Real-time optimization | Unnecessary, optimize on button click |
| AI-powered optimization | Algorithms are deterministic |
| Multi-material optimization | Optimize one material at a time |
| Curved cuts / irregular shapes | Different problem domain |
| Granular permissions | Admin/User binary sufficient |
| Two-factor authentication | Over-engineering for woodworking tool |
| OAuth providers | Email/password sufficient |
| User self-delete | Risky, admin handles deletion |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RBAC-01 | 13 | Complete |
| RBAC-02 | 13 | Complete |
| RBAC-03 | 13 | Complete |
| RBAC-04 | 13 | Complete |
| RBAC-05 | 13 | Complete |
| RBAC-06 | 13 | Complete |
| USER-01 | 14 | Complete |
| USER-02 | 14 | Complete |
| USER-03 | 14 | Complete |
| USER-04 | 14 | Complete |
| USER-05 | 14 | Complete |
| USER-06 | 14 | Complete |
| EMAIL-01 | 15 | Complete |
| EMAIL-02 | 15 | Complete |
| EMAIL-03 | 15 | Complete |
| EMAIL-04 | 16 | Complete |
| EMAIL-05 | 16 | Complete |
| EMAIL-06 | 16 | Complete |
| BOM-05 | 17 | Complete |
| BOM-06 | 17 | Complete |
| BOM-07 | 17 | Complete |
| BOM-08 | 17 | Complete |
| BOM-09 | 17 | Complete |
| BOM-10 | 17 | Complete |
| CUT-01 | 18 | Pending |
| CUT-02 | 18 | Pending |
| CUT-03 | 18 | Pending |
| CUT-04 | 18 | Pending |
| CUT-05 | 18 | Pending |
| CUT-06 | 18 | Pending |
| CUT-07 | 18 | Pending |
| CUT-08 | 18 | Pending |
| CUT-09 | 18 | Pending |
| CUT-10 | 18 | Pending |
| CUT-11 | 19 | Pending |
| CUT-12 | 19 | Pending |
| CUT-13 | 19 | Pending |
| CUT-14 | 19 | Pending |
| CUT-15 | 19 | Pending |
| CUT-16 | 19 | Pending |
| CUT-17 | 20 | Pending |
| CUT-18 | 20 | Pending |
| CUT-19 | 20 | Pending |
| CUT-20 | 20 | Pending |
| CUT-21 | 20 | Pending |
| CUT-22 | 20 | Pending |
| CUT-23 | 21 | Pending |
| CUT-24 | 21 | Pending |
| CUT-25 | 21 | Pending |
| CUT-26 | 21 | Pending |
| CUT-27 | 21 | Pending |
| CUT-28 | 21 | Pending |
| CUT-29 | 21 | Pending |
| CUT-30 | 21 | Pending |
| CUT-31 | 21 | Pending |
| CUT-32 | 21 | Pending |

**Coverage:**
- v3.0 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2026-01-29*
*Last updated: 2026-01-29 after phase 17 completion*
