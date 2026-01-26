# Feature Landscape: Auth & Persistence (v2.0)

**Domain:** Authentication, data persistence, admin features for SaaS web app
**Research Date:** 2026-01-26
**Context:** Single-user woodworking BOM tool with planned multi-user expansion

## Table Stakes

Features users expect. Missing = product feels broken or insecure.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Email/password signup | Standard auth method | Low | Form + validation + password hashing |
| Email/password login | Standard auth method | Low | Form + credential check + session creation |
| Logout | Required for security | Low | Clear session cookie, delete from DB |
| Session persistence | Stay logged in across page loads | Medium | Cookie + database lookup on each request |
| Password requirements | Security baseline (length, complexity) | Low | Client + server validation |
| Protected routes | Prevent unauthenticated access | Low | Check in hooks.server.ts, redirect to login |
| Save BOM project | Core value - don't lose work | Medium | Drizzle insert/update, user association |
| Load saved projects | Access saved work | Low | Drizzle query by user ID |
| List user's projects | See all saved work | Low | Drizzle query with list view |
| Delete project | Manage saved work | Low | Drizzle delete with confirmation |
| CSV file upload | Import existing data | Medium | FormData handling, file validation |
| CSV parsing | Extract data from upload | Medium | PapaParse integration, error handling |

## Differentiators

Features that set product apart. Not expected, but create delight.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| BOM templates from CSV | Jumpstart projects with existing data | Medium | Pre-built template library + upload |
| Auto-save drafts | Never lose work in progress | Medium | Debounced auto-save, conflict resolution |
| Project versioning | Compare changes over time | High | Snapshot on save, diff view |
| Duplicate project | Clone existing BOM as starting point | Low | Drizzle insert with copied data |
| Export to CSV | Take data elsewhere | Low | Generate CSV from BOM data |
| Email verification | Prevent spam accounts | Medium | Token generation, email sending (deferred for single-user) |
| Password reset flow | Recover locked accounts | Medium | Token generation, email sending (deferred for single-user) |
| Remember me checkbox | Extended session duration | Low | Longer expiration time for session |
| Project sharing link | Collaborate with others | High | Public token, permission system (v3.0 feature) |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| OAuth providers (Google, GitHub) | Over-engineering for single-user app | Email/password only. Add OAuth in v3.0 if multi-user |
| Password reset (v2.0) | Requires email infrastructure, single-user doesn't need it | Manual password reset via direct database access. Add in v3.0. |
| Email verification (v2.0) | Unnecessary for single-user | Skip verification. Add in v3.0 for multi-user spam prevention. |
| Two-factor authentication | Over-engineering for woodworking tool | Defer to v3.0+. Not a security-critical app. |
| Role-based permissions (v2.0) | YAGNI - single user doesn't have roles | Single admin flag only. Full RBAC in v3.0 if needed. |
| Real-time collaboration | Extreme over-engineering | Defer to v4.0+ (if ever). Not a collaboration tool. |
| File storage for uploads | Unnecessary - CSV is parsed and discarded | Parse CSV in-memory, extract data, discard file |
| Client-side encryption | Over-engineering, adds complexity | Server-side security is sufficient. HTTPS encrypts in transit. |
| Password strength meter | Nice-to-have, not essential | Basic length/complexity validation only |
| Account deletion | Single-user doesn't need self-service | Manual DB deletion if needed. Add in v3.0. |
| Audit logs | Over-engineering for single user | Defer to v3.0+ for compliance needs |
| Rate limiting | Single-user doesn't need it | Defer to v3.0 when multi-user. Add if abuse occurs. |

## Feature Dependencies

```
Authentication Flow:
Signup → Email validation → Password hashing → User creation → Session creation → Session cookie
Login → Credential check → Session creation → Session cookie
Protected routes → Session cookie → Session lookup → User context

Persistence Flow:
Auth foundation → User ID → Save BOM (with user association) → Load BOM (filtered by user)

CSV Upload Flow:
Auth foundation → Protected route → File upload form → FormData parsing → CSV parsing → Data extraction → BOM seeding

Admin Features:
Auth foundation → Admin flag → Protected admin routes → User CRUD
```

**Critical path:** Auth must be complete before persistence or CSV upload (user ID is required).

**Parallel opportunity:** BOM persistence and CSV upload can be developed simultaneously after auth foundation.

## MVP Recommendation

**For v2.0 MVP, prioritize:**

### Phase 1: Auth Foundation (Must-Have)
1. Email/password signup
2. Email/password login
3. Logout
4. Password hashing (Argon2)

### Phase 2: Session Management (Must-Have)
1. Session persistence (database sessions)
2. Protected routes (hooks.server.ts)
3. Session cookie handling

### Phase 3: BOM Persistence (Core Value)
1. Save BOM project (with user association)
2. Load saved projects (list view)
3. Delete project
4. Update existing project

### Phase 4: CSV Upload (High Value)
1. CSV file upload form
2. PapaParse integration
3. Data validation and transformation
4. Seed BOM from CSV data

### Phase 5: Nice-to-Haves (Defer or Parallel)
1. Duplicate project (low complexity, high value)
2. Export BOM to CSV (low complexity, symmetry with import)
3. Remember me checkbox (low complexity)

**Defer to post-MVP or v3.0:**
- Email verification (requires email infrastructure)
- Password reset flow (requires email infrastructure)
- Auto-save drafts (complexity vs value for single user)
- Project versioning (high complexity, low immediate value)
- OAuth providers (YAGNI for single user)
- Admin user management (wait for multi-user requirements)
- Rate limiting (wait for abuse evidence)

## Feature Complexity Assessment

### Low Complexity (< 1 day)
- Logout
- Password requirements validation
- Protected route guards
- Delete project
- List user projects
- Duplicate project
- Export to CSV
- Remember me checkbox

### Medium Complexity (1-3 days)
- Signup form + backend
- Login form + backend
- Session persistence
- Save BOM project
- Load saved projects
- CSV file upload
- CSV parsing integration
- BOM template import

### High Complexity (3-7 days)
- Auto-save drafts (conflict resolution)
- Project versioning (snapshot + diff)
- Email verification (email infrastructure)
- Password reset flow (email infrastructure)
- Project sharing (permissions system)

## Security Considerations

### Must-Have (v2.0)
- Password hashing with Argon2
- HTTP-only session cookies
- CSRF protection (SvelteKit default)
- SQL injection prevention (Drizzle parameterized queries)
- File upload validation (type, size)
- Server-side input validation

### Nice-to-Have (v3.0+)
- Rate limiting (login attempts)
- Email verification
- Password reset with expiring tokens
- Two-factor authentication
- Audit logs

### Don't Overdo It
- Client-side encryption (HTTPS is sufficient)
- Zero-knowledge architecture (not needed for BOM tool)
- Advanced threat detection (not a high-value target)

## UX Considerations

### Smooth Onboarding
- Signup form should be simple (email + password + confirm)
- Login form prominently placed
- Clear error messages (avoid "invalid credentials" ambiguity)
- Success feedback on save operations

### Session Management
- Sessions should last 7 days (remember me: 30 days)
- Auto-redirect to login on session expiry
- Preserve intended destination after login

### BOM Persistence
- Save button always visible
- Auto-generate project names ("Untitled Project 1")
- Confirmation before delete
- Last modified timestamp

### CSV Upload
- Drag-and-drop support (nice-to-have)
- File type validation feedback
- Parsing error reporting (line numbers, column names)
- Preview parsed data before import

## Sources

**Research based on:**
- Common SaaS auth patterns (email/password standard)
- Security best practices (OWASP, password hashing recommendations)
- SvelteKit form action patterns
- Single-user vs multi-user feature scoping
- Training data through January 2025

**Domain context:**
- Woodworking BOM tool is low-security domain (no PII, financial data, or sensitive info)
- Single-user v2.0 scope reduces auth complexity
- Multi-user v3.0 scope will require email verification, rate limiting, admin features

**Feature prioritization principles:**
- Table stakes first (auth, sessions, basic persistence)
- High-value differentiators second (CSV import/export)
- Over-engineering avoided (OAuth, 2FA, real-time, RBAC)
- Email infrastructure deferred (verification, password reset)
