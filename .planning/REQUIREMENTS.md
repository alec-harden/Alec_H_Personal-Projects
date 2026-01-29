# Requirements: WoodShop Toolbox v3.0

**Defined:** 2026-01-29
**Core Value:** Enable real multi-user operation with proper security, enhance BOM with lumber dimensions, and add a new Cut List Optimizer tool for material efficiency.

## v3.0 Requirements

Requirements for v3.0 Multi-User & Cut Optimizer milestone. Grouped by feature area.

### RBAC & Security

- [ ] **RBAC-01**: Users have a role field (admin or user)
- [ ] **RBAC-02**: Admin role grants elevated permissions
- [ ] **RBAC-03**: User role is default for new registrations
- [ ] **RBAC-04**: Admin routes (/admin/*) check role before access
- [ ] **RBAC-05**: Users can only see their own projects, BOMs, and cut lists
- [ ] **RBAC-06**: First registered user becomes admin (or seed admin)

### User Management (Admin)

- [ ] **USER-01**: Admin can view list of all users
- [ ] **USER-02**: Admin can create new user account
- [ ] **USER-03**: Admin can reset a user's password
- [ ] **USER-04**: Admin can disable a user account
- [ ] **USER-05**: Admin can view user details (email, created date, role)
- [ ] **USER-06**: Disabled users cannot log in

### Email Flows

- [ ] **EMAIL-01**: User can request password reset from login page
- [ ] **EMAIL-02**: User receives email with password reset link
- [ ] **EMAIL-03**: User can set new password via reset link (expires in 1 hour)
- [ ] **EMAIL-04**: New user receives email verification request after signup
- [ ] **EMAIL-05**: User can verify email by clicking link in email
- [ ] **EMAIL-06**: User profile shows email verification status

### BOM Refinements

- [ ] **BOM-05**: Visibility toggle uses eye icon (not checkbox)
- [ ] **BOM-06**: Lumber items have dimension fields (length, width, height)
- [ ] **BOM-07**: Lumber items display board feet (calculated from dimensions)
- [ ] **BOM-08**: Lumber category shows total board feet
- [ ] **BOM-09**: CSV export includes dimension columns for lumber
- [ ] **BOM-10**: CSV import parses dimension columns for lumber

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
| RBAC-01 | — | Pending |
| RBAC-02 | — | Pending |
| RBAC-03 | — | Pending |
| RBAC-04 | — | Pending |
| RBAC-05 | — | Pending |
| RBAC-06 | — | Pending |
| USER-01 | — | Pending |
| USER-02 | — | Pending |
| USER-03 | — | Pending |
| USER-04 | — | Pending |
| USER-05 | — | Pending |
| USER-06 | — | Pending |
| EMAIL-01 | — | Pending |
| EMAIL-02 | — | Pending |
| EMAIL-03 | — | Pending |
| EMAIL-04 | — | Pending |
| EMAIL-05 | — | Pending |
| EMAIL-06 | — | Pending |
| BOM-05 | — | Pending |
| BOM-06 | — | Pending |
| BOM-07 | — | Pending |
| BOM-08 | — | Pending |
| BOM-09 | — | Pending |
| BOM-10 | — | Pending |
| CUT-01 | — | Pending |
| CUT-02 | — | Pending |
| CUT-03 | — | Pending |
| CUT-04 | — | Pending |
| CUT-05 | — | Pending |
| CUT-06 | — | Pending |
| CUT-07 | — | Pending |
| CUT-08 | — | Pending |
| CUT-09 | — | Pending |
| CUT-10 | — | Pending |
| CUT-11 | — | Pending |
| CUT-12 | — | Pending |
| CUT-13 | — | Pending |
| CUT-14 | — | Pending |
| CUT-15 | — | Pending |
| CUT-16 | — | Pending |
| CUT-17 | — | Pending |
| CUT-18 | — | Pending |
| CUT-19 | — | Pending |
| CUT-20 | — | Pending |
| CUT-21 | — | Pending |
| CUT-22 | — | Pending |
| CUT-23 | — | Pending |
| CUT-24 | — | Pending |
| CUT-25 | — | Pending |
| CUT-26 | — | Pending |
| CUT-27 | — | Pending |
| CUT-28 | — | Pending |
| CUT-29 | — | Pending |
| CUT-30 | — | Pending |
| CUT-31 | — | Pending |
| CUT-32 | — | Pending |

**Coverage:**
- v3.0 requirements: 44 total
- Mapped to phases: 0
- Unmapped: 44 ⚠️

---
*Requirements defined: 2026-01-29*
*Last updated: 2026-01-29 after initial definition*
