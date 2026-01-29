# Feature Landscape: v3.0 Multi-User & Cut Optimizer

**Domain:** Cut list optimization, multi-user admin, woodworking planning enhancements
**Researched:** 2026-01-29
**Confidence:** MEDIUM (domain knowledge + established UX patterns, WebSearch unavailable)

## Context

This research covers NEW features for v3.0 of WoodShop Toolbox. The app already has:
- Dashboard with tool cards
- AI-powered 4-step BOM wizard with 6 templates
- Full BOM editing (quantities, visibility toggle, custom items)
- CSV import/export with round-trip compatibility
- Email/password auth with sessions
- Project management (CRUD)
- BOM persistence (save/load/edit/delete)
- Admin template management

**v3.0 Focus Areas:**
1. Cut List Optimizer - New tool for material efficiency
2. Multi-User Security - RBAC, user management, email flows
3. BOM Refinements - Dimensions, board feet, improved visibility toggle

---

## Cut List Optimizer

### How Cut List Optimizers Typically Work

Cut list optimizers solve a classic combinatorial problem: given required cuts and available stock, minimize waste. Two distinct modes exist:

**1D Linear Optimization (Boards/Trim):**
- Used for: dimensional lumber, molding, trim, dowels
- Problem: Pack cuts of varying lengths into stock pieces of fixed length
- Algorithm: 1D bin packing (First Fit Decreasing, Best Fit, or branch-and-bound)
- Input: List of cuts (lengths), stock lengths available
- Output: Which cuts come from which stock piece, cut positions

**2D Sheet Optimization (Plywood/MDF):**
- Used for: plywood, MDF, sheet goods, panel products
- Problem: Nest rectangles onto rectangular sheets with minimal waste
- Algorithm: 2D nesting (guillotine cuts constraint typical for woodworking)
- Input: List of rectangles (L x W), sheet dimensions
- Output: Cut diagrams showing placement of each piece

**Kerf Consideration:**
Both modes must account for blade kerf (material lost to the saw cut). Typical values:
- Table saw: 1/8" (3mm)
- Circular saw: 1/8" (3mm)
- Miter saw: 1/8" to 3/16"
- Track saw: 3/32" to 1/8"

### Table Stakes - Cut List Optimizer

Features users expect from any cut list optimizer. Missing these = tool feels incomplete.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Mode selection (Linear vs Sheet) | Different optimization for different materials | Low | None |
| Input cuts with dimensions | Core input for optimization | Low | None |
| Input stock dimensions | Define available material | Low | None |
| Kerf/blade width setting | Critical for accurate optimization | Low | None |
| Run optimization | Execute the algorithm | High | Algorithm implementation |
| Waste percentage display | Key metric for success | Low | Optimization output |
| Cut list output | Show which cuts from which stock | Medium | Optimization output |
| Clear all / reset | Start over easily | Low | None |
| Save results | Persist optimization to project | Medium | Project integration |

### Table Stakes - Linear Optimizer (1D)

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Cut length input | Primary dimension for boards | Low | None |
| Stock length input | Standard lumber lengths (8', 10', 12') | Low | None |
| Multiple stock length options | Real world has mixed stock | Medium | None |
| Cut list summary | Total linear feet needed | Low | Optimization output |
| Waste visualization (linear) | Show unused portions | Medium | Optimization output |

### Table Stakes - Sheet Optimizer (2D)

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Cut dimensions (L x W) | Both dimensions required | Low | None |
| Sheet dimensions | Standard sheets (4x8, 5x5, etc.) | Low | None |
| Grain direction toggle | Wood grain matters for appearance | Medium | UI per cut |
| Cut diagram visualization | Visual layout of cuts on sheet | High | Optimization output |
| Number of sheets needed | Key output metric | Low | Optimization output |

### Table Stakes - BOM Integration

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Select project | Choose which project to optimize | Low | Projects exist |
| Select BOMs from project | Projects can have multiple BOMs | Low | BOMs exist |
| Auto-filter lumber items | Only lumber is cuttable | Medium | BOM category field |
| Pre-populate cuts from BOM | One-click import from BOM | Medium | BOM items with dimensions |

### Table Stakes - Shop Checklist

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Checklist view of cuts | Print-friendly task list | Medium | Optimization output |
| Mark cut as complete | Physical tracking in shop | Low | Checklist UI |
| Progress indicator | See completion percentage | Low | Completion state |
| Save checklist state | Persist completion to project | Medium | Project integration |

### Differentiators - Cut List Optimizer

Features that elevate the tool above basic optimizers. Not expected, but create delight.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Drag-drop material assignment | Intuitive UX for assigning cuts to stock | High | Drag-drop library |
| Manual cut placement override | Expert users can improve on algorithm | High | Interactive diagram |
| Multiple optimization strategies | Compare First Fit vs Best Fit results | Medium | Multiple algorithms |
| Board feet calculation | Woodworker-friendly measurement | Low | Dimension inputs |
| Cost estimation | Dollar value of waste | Medium | Price per unit input |
| Export cut list to PDF | Take to shop without device | Medium | PDF generation |
| Label generation | Print labels for each cut | Medium | PDF generation |
| Stock inventory tracking | Remember what stock you have | High | New data model |
| Optimization history | Compare different runs | Medium | History storage |
| Grain direction matching | Group cuts with same grain | High | Visual matching |

### Anti-Features - Cut List Optimizer

Features to explicitly NOT build. Common mistakes or over-engineering.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| 3D visualization | Extreme complexity, low value for cutting | 2D diagrams are standard and sufficient |
| Optimal stock purchasing | Too many variables (availability, price changes) | Show what stock is needed, let user decide |
| CNC machine integration | Niche feature, adds complexity | Export to standard formats (CSV, PDF) |
| Real-time optimization | Unnecessary complexity | Optimize on button click |
| Cloud sync with other apps | Integration complexity | Self-contained tool |
| AI-powered optimization | Algorithms are deterministic, AI adds nothing | Use proven bin-packing algorithms |
| Multi-material optimization | Mixing wood species/thicknesses | Optimize one material type at a time |
| Curved cuts / irregular shapes | 2D nesting for rectangles only | Out of scope - different problem domain |
| Joinery cut integration | Adds complexity, separate concern | BOM handles joinery, optimizer handles stock |

---

## Multi-User Admin Features

### How Admin Features Typically Work

Multi-user SaaS apps follow established patterns:

**RBAC (Role-Based Access Control):**
- Roles: Admin, User (minimal hierarchy)
- Admin: Full access + user management
- User: Own data only
- Implementation: Role field on user, middleware checks

**User Management:**
- Admin can: Create users, reset passwords, disable accounts
- Self-service: Registration, password reset via email
- Data isolation: Users only see own projects/BOMs

**Email Flows:**
- Password reset: Magic link with expiring token
- Email verification: Confirm ownership, prevent spam
- Implementation: Transactional email service (SendGrid, Resend, Postmark)

### Table Stakes - RBAC & Security

Features required for proper multi-user operation. Missing = security vulnerability.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Admin role flag | Distinguish admin from regular users | Low | Schema change |
| User role (default) | Standard access level | Low | Schema change |
| Admin route protection | Only admins access /admin/* | Low | Middleware |
| User data isolation | Users only see own projects/BOMs | Medium | Query filtering |
| Session user context | Know who is logged in | Low | Already implemented |

### Table Stakes - User Management (Admin)

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| List all users | See who has accounts | Low | Admin route |
| Create user account | Onboard new users | Medium | Admin route |
| Reset user password | Help locked-out users | Medium | Password hashing |
| Disable user account | Revoke access without delete | Low | Disabled flag |
| View user details | See email, created date, last login | Low | Admin route |

### Table Stakes - Email Flows

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Password reset request | "Forgot password" link | Medium | Email service |
| Password reset link (email) | Magic link with expiring token | Medium | Email service, token table |
| Set new password | Form after clicking link | Low | Token validation |
| Email verification request | After signup | Medium | Email service |
| Email verification link | Confirm ownership | Medium | Email service, token table |
| Verified status display | Show if email is verified | Low | Schema change |

### Differentiators - Admin Features

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Admin invite flow | Send invite instead of creating password | Medium | Email service |
| Bulk user operations | Enable/disable multiple users | Low | UI pattern |
| User activity log | Audit trail for security | Medium | Logging table |
| Last login display | See active vs inactive users | Low | Track on login |
| User project count | Quick view of user activity | Low | Aggregate query |
| Export user list | Download for records | Low | CSV generation |
| Search/filter users | Find specific users | Low | Query params |

### Anti-Features - Admin Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Granular permissions | Over-engineering for 2 roles | Admin/User binary is sufficient |
| Permission editor UI | YAGNI for small user base | Hardcode role capabilities |
| User self-delete | Risky, requires data cleanup | Admin deletes users if needed |
| Multiple admin levels | Complexity without value | Single admin role |
| User groups/teams | Multi-tenant complexity | Flat user list |
| Admin approval workflow | Unnecessary friction | Direct admin actions |
| Two-factor authentication | Over-engineering for woodworking tool | Defer to v4.0+ if demand |
| OAuth providers | Complexity for small benefit | Email/password sufficient |

---

## BOM Refinements

### How BOM Dimension Tracking Typically Works

**Lumber Dimensions:**
- Standard format: Length x Width x Thickness (or L x W x H)
- Units: Inches (US) or mm (metric)
- Board feet formula: (L x W x T) / 144 (when all in inches)

**Board Feet:**
- Standard lumber measurement for pricing
- 1 board foot = 1" x 12" x 12" (or 144 cubic inches)
- Displayed per item and as total for lumber category

**Visibility Toggle UX:**
- Eye icon is standard (open eye = visible, closed = hidden)
- Click to toggle state
- Hidden items greyed out but still visible
- Hidden items excluded from exports and totals

### Table Stakes - BOM Refinements

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Eye icon visibility toggle | Standard UX pattern (replaces checkbox) | Low | Component update |
| Lumber dimension fields (L/W/H) | Required for cut optimization | Medium | Schema change |
| Dimension input UI | Per-item fields for lumber | Medium | Form updates |
| Board feet display (per item) | Standard lumber measurement | Low | Calculation |
| Board feet total (lumber category) | Summary metric | Low | Aggregation |
| Dimension import from CSV | Round-trip compatibility | Low | CSV parser update |
| Dimension export to CSV | Complete data export | Low | CSV generator update |

### Differentiators - BOM Refinements

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Standard dimension presets | Common lumber sizes (2x4, 2x6, 4/4, 8/4) | Medium | Preset library |
| Dimension calculator | Convert between units | Low | Calculation |
| Rough vs finished dimensions | Track both for planning | Medium | Additional fields |
| Waste factor input | Account for material loss | Low | Calculation modifier |
| Running total while editing | Live board feet calculation | Low | Reactive state |

### Anti-Features - BOM Refinements

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| 3D preview of materials | High complexity, low value | Text dimensions sufficient |
| Price per board foot | Prices change, data maintenance | User tracks externally |
| Lumber grade tracking | Too detailed for BOM tool | Use notes field |
| Species-specific shrinkage | Specialized calculator territory | Out of scope |
| Metric/Imperial toggle | Pick one, avoid complexity | Inches (target audience) |

---

## Feature Dependencies

```
v3.0 Dependency Graph:

RBAC Foundation
    |
    +---> Admin User Management
    |         |
    |         +---> Admin route protection
    |
    +---> User Data Isolation (audit existing queries)

Email Infrastructure (Resend/SendGrid)
    |
    +---> Password Reset Flow
    |
    +---> Email Verification Flow

BOM Dimension Fields (schema)
    |
    +---> Board Feet Calculation
    |
    +---> Cut List Optimizer Integration

Cut List Optimizer (new route)
    |
    +---> Linear Optimizer (1D algorithm)
    |
    +---> Sheet Optimizer (2D algorithm)
    |
    +---> Drag-Drop Material Assignment
    |
    +---> Cut Diagram Visualization
    |
    +---> Shop Checklist
```

**Critical paths:**
1. RBAC must be first (security foundation)
2. Email infrastructure before password reset/verification
3. BOM dimensions before cut optimizer (or parallel with integration deferred)
4. Optimizer algorithm before visualization

**Parallel opportunities:**
- Eye icon toggle (isolated UI change)
- Admin user management (after RBAC)
- Linear and Sheet optimizers can be developed in parallel

---

## MVP Recommendation

### Phase 1: RBAC Foundation (Security First)

| Feature | Complexity | Rationale |
|---------|------------|-----------|
| Admin role flag on users | Low | Schema foundation |
| Admin middleware (route protection) | Low | Security gate |
| User data isolation audit | Medium | Must verify existing queries filter by userId |

**Defer:** Granular permissions, permission UI

### Phase 2: Admin User Management

| Feature | Complexity | Rationale |
|---------|------------|-----------|
| Admin user list | Low | Core admin function |
| Create user (admin) | Medium | Onboarding |
| Reset user password (admin) | Medium | Support function |
| Disable user account | Low | Security control |

**Defer:** Bulk operations, activity log, export

### Phase 3: Email Infrastructure

| Feature | Complexity | Rationale |
|---------|------------|-----------|
| Email service integration (Resend) | Medium | Foundation for flows |
| Password reset request | Medium | Self-service |
| Password reset via email link | Medium | Complete flow |

**Defer:** Email verification (can add after core flow works)

### Phase 4: BOM Refinements

| Feature | Complexity | Rationale |
|---------|------------|-----------|
| Eye icon visibility toggle | Low | Quick UX win |
| Lumber dimension fields (schema) | Medium | Required for optimizer |
| Board feet calculation | Low | Derived from dimensions |

**Defer:** Dimension presets, waste factor

### Phase 5: Cut List Optimizer Foundation

| Feature | Complexity | Rationale |
|---------|------------|-----------|
| New tool route (/cut-optimizer) | Low | Page shell |
| Mode selector (Linear vs Sheet) | Low | UI foundation |
| Project/BOM selection | Medium | Integration |
| Cut definition UI | Medium | Input form |
| Kerf configuration | Low | Input field |

**Defer:** Drag-drop (use simpler assignment first)

### Phase 6: Linear Optimizer (1D)

| Feature | Complexity | Rationale |
|---------|------------|-----------|
| 1D bin packing algorithm | High | Core functionality |
| Linear cut list output | Medium | Results display |
| Waste percentage | Low | Key metric |
| Save to project | Medium | Persistence |

### Phase 7: Sheet Optimizer (2D)

| Feature | Complexity | Rationale |
|---------|------------|-----------|
| 2D nesting algorithm (guillotine) | High | Core functionality |
| Cut diagram visualization | High | Visual output |
| Grain direction toggle | Medium | Woodworking requirement |
| Sheet count output | Low | Key metric |

### Phase 8: Shop Checklist

| Feature | Complexity | Rationale |
|---------|------------|-----------|
| Checklist view | Medium | Shop-friendly format |
| Completion tracking | Low | Physical workflow |
| Progress indicator | Low | Visual feedback |
| Save checklist state | Medium | Persistence |

### Phase 9: Polish & Integration

| Feature | Complexity | Rationale |
|---------|------------|-----------|
| Drag-drop material assignment | High | Improved UX |
| Email verification | Medium | Spam prevention |
| Manual cut placement override | High | Expert feature |

---

## Complexity Assessment Summary

| Feature Area | Overall Complexity | Riskiest Part | Mitigation |
|--------------|-------------------|---------------|------------|
| RBAC | Low | Data isolation audit | Review all queries for userId filtering |
| User Management | Low-Medium | Password reset flow | Use proven token pattern |
| Email Flows | Medium | Email deliverability | Use established service (Resend/SendGrid) |
| BOM Dimensions | Low-Medium | Schema migration | Careful migration with default values |
| Linear Optimizer | High | Algorithm correctness | Use proven FFD algorithm, extensive testing |
| Sheet Optimizer | High | 2D visualization | Canvas/SVG library, guillotine constraint |
| Drag-Drop | High | Cross-browser, mobile | Use established library (dnd-kit, Sortable) |
| Shop Checklist | Medium | State persistence | Follow existing BOM patterns |

**Highest risk:** 2D sheet optimizer visualization (algorithm + rendering)
**Lowest risk:** Eye icon toggle (isolated UI change)
**Most unknown:** Drag-drop UX for material assignment

---

## Algorithm Notes

### 1D Bin Packing (Linear Optimizer)

**First Fit Decreasing (FFD):**
1. Sort cuts by length (descending)
2. For each cut, place in first bin that fits
3. If no bin fits, open new bin

**Performance:** FFD is not optimal but runs fast and gives good results. Optimal solutions require branch-and-bound (exponential time).

**Implementation consideration:** Client-side JavaScript is sufficient. Even 1000 cuts computes in milliseconds.

### 2D Nesting (Sheet Optimizer)

**Guillotine constraint:** All cuts must be achievable with straight cuts across the full width/length (like a table saw). No nested pockets.

**Algorithm approaches:**
- Bottom-left heuristic (fast, decent results)
- Skyline algorithm (good for rectangles)
- Genetic algorithms (slow, better results)
- Maximal rectangles (good balance)

**Recommendation:** Maximal rectangles algorithm with guillotine constraint. Good results, reasonable implementation complexity.

**Implementation consideration:** Client-side viable but may need Web Worker for large inputs to avoid UI blocking.

---

## Sources

**Confidence: MEDIUM**

This research is based on:
- Domain knowledge of woodworking cut optimization software (CutList Plus, SketchUp CutList, Optimalon)
- Standard UX patterns for admin interfaces
- Established algorithms for bin packing and 2D nesting
- Training data through May 2025

**WebSearch unavailable** - claims are based on training data and should be verified against:
- Current cut list optimizer feature comparisons
- Latest drag-drop library recommendations (dnd-kit, Sortable, react-beautiful-dnd)
- 2D nesting algorithm implementations and libraries

**Verification needed for:**
- Current state of JavaScript 2D nesting libraries
- Email service pricing and feature comparison (Resend vs SendGrid vs Postmark)
- Drag-drop library compatibility with Svelte 5
