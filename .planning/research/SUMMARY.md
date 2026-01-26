# Research Summary: v2.0 Architecture & Stack Integration

**Project:** WoodShop Toolbox v2.0
**Research Date:** 2026-01-26
**Focus:** Authentication, persistence, admin features - architecture and stack
**Overall Confidence:** MEDIUM (patterns validated, specifics need verification)

## Executive Summary

v2.0 adds authentication, persistence, and admin features to the existing WoodShop Toolbox SvelteKit app. Research covered two dimensions: (1) stack additions for auth utilities and CSV parsing, and (2) architectural integration patterns for auth middleware, database schema, and route protection.

**Key finding on stack:** No auth framework needed. Lucia auth was deprecated in late 2024, with its creator recommending custom auth built on smaller utility libraries (oslo). This aligns perfectly with the single-user, email/password-only requirements. Minimal additions: oslo (auth utils), @node-rs/argon2 (password hashing), papaparse (CSV parsing).

**Key finding on architecture:** SvelteKit's `hooks.server.ts` and `event.locals` provide clean foundation for session-based auth. The existing BOM wizard flow remains fully functional for unauthenticated users (demo mode), while authenticated users gain persistence through database-backed sessions and normalized schema extensions.

**Integration philosophy:** Extend, don't replace. Preserve working v1.0 flows and layer new features around them.

## Key Findings

### Stack Additions

**Add:** oslo (auth utils), @node-rs/argon2 (password hashing), papaparse (CSV parsing)

**Don't add:** Auth framework (Auth.js is OAuth-focused, Lucia is deprecated), session store (use Turso DB), file storage layer (FormData in-memory)

**Critical consideration:** Argon2 requires native bindings - verify serverless compatibility with deployment platform (likely fine for Vercel, may need check for Cloudflare Workers).

### Architecture Patterns

**Auth middleware:** SvelteKit hooks.server.ts validates session cookie on each request, attaches user to event.locals

**Database schema:** Five-table design (users, sessions, projects, boms, bomItems, templates) with normalized relationships:
```
users (1) → (many) projects
projects (1) → (many) boms
boms (1) → (many) bomItems
users (1) → (many) sessions
templates (independent, admin-managed)
```

**Route protection:** Three-layer approach:
1. Server load functions (+page.server.ts) - redirect to login
2. Hooks middleware (hooks.server.ts) - global route pattern protection
3. API guards (+server.ts) - return 401/403 status codes

**Critical pitfall:** Session management bugs have security implications. Use established patterns (bcrypt/Argon2 hashing with proper salt, crypto-random tokens, httpOnly cookies, server-side expiration checks).

## Implications for Roadmap

### Phase Structure Recommendation

**Phase 1: Auth Foundation**
- Add users and sessions tables to Drizzle schema
- Implement password hashing with Argon2
- Build signup/login forms with SvelteKit form actions
- Create hooks.server.ts for session management
- **Rationale:** Auth is foundational - everything else needs user context
- **Verification needed:** oslo API, Argon2 serverless compatibility

**Phase 2: Route Protection**
- Implement session cookie handling and validation
- Add logout functionality
- Create protected route guards for /projects and /admin
- Add role-based access control (admin vs. user)
- **Rationale:** Can't build user-specific features without working sessions
- **Standard patterns:** Unlikely to need additional research

**Phase 3: Project Persistence**
- Add userId foreign key to projects table
- Implement /api/projects endpoints (GET, POST, PATCH, DELETE)
- Create /projects route with project list UI
- Update dashboard to load user projects
- **Rationale:** Foundation for BOM persistence (hierarchical dependency)
- **Standard CRUD:** Unlikely to need additional research

**Phase 4: BOM Persistence**
- Add boms and bomItems tables to schema
- Implement /api/bom/save endpoint
- Add "Save" button to BOMDisplay component
- Support loading saved BOMs for editing
- **Rationale:** Core value-add feature, depends on project structure
- **Research flag:** May need Drizzle transaction API verification for atomic saves

**Phase 5: Template Management (Admin)**
- Add templates table to schema
- Migrate existing templates from hardcoded file to DB (seed script)
- Implement /api/templates endpoints (admin-protected)
- Create /admin/templates UI for CRUD operations
- **Rationale:** Independent feature, least coupled, can be added last
- **Standard CRUD:** Unlikely to need additional research

**Phase 6: CSV Upload (Optional/Defer)**
- Add CSV upload form
- Implement PapaParse integration
- Validate and transform CSV data to BOM format
- **Rationale:** Nice-to-have, not core to v2.0 value prop
- **Research flag:** Domain-specific validation rules for BOM templates

### Phase Ordering Rationale

**Sequential dependencies:**
- Phase 1 → Phase 2 (can't test sessions without auth)
- Phase 2 → Phase 3 (can't save user data without sessions)
- Phase 3 → Phase 4 (BOMs belong to projects)

**Parallel opportunities:**
- Phase 5 (Templates) can be developed after Phase 2 (independent of persistence)
- Phase 6 (CSV) can be developed anytime after Phase 1 (independent feature)

**Deferral candidates:**
- Phase 6 (CSV Upload) - defer to v2.1 if not critical
- Admin features within Phase 5 - defer user management if single-user remains true
- Session caching (Redis/Upstash) - post-v2.0 optimization

### Research Flags for Phases

| Phase | Research Needed | Reason |
|-------|----------------|--------|
| Phase 1 | Verify oslo API | Couldn't access external docs, need to confirm utility functions |
| Phase 1 | Verify Argon2 serverless | Check Vercel/Cloudflare Workers compatibility for native bindings |
| Phase 1 | SvelteKit hooks.server.ts API | Training data may not reflect SvelteKit 2.x changes |
| Phase 4 | Drizzle transaction API | Verify syntax for atomic multi-table inserts (BOM + items) |
| Phase 6 | CSV validation patterns | Domain-specific validation rules for BOM templates |

**Low research phases:**
- Phase 2 (Route Protection) - Standard SvelteKit patterns
- Phase 3 (Project Persistence) - Straightforward Drizzle CRUD
- Phase 5 (Template Management) - Standard CRUD operations

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Auth approach | MEDIUM | Custom auth is right choice, but oslo API not verified |
| Password hashing | HIGH | Argon2 is industry best practice, well-documented |
| Session storage | HIGH | Database sessions are standard for low-traffic apps |
| Auth middleware pattern | MEDIUM | SvelteKit hooks well-documented, but API specifics need verification |
| Database schema | HIGH | Standard normalized design, well-understood patterns |
| Route protection | HIGH | SvelteKit load functions and redirects are well-documented |
| API structure | HIGH | RESTful conventions, straightforward mapping |
| CSV parsing | MEDIUM | PapaParse is industry standard, but version/API not verified |
| Integration | HIGH | All additions fit cleanly with existing Drizzle/Turso/SvelteKit stack |

### Verification Needed

**Before Phase 1 starts:**
- [ ] npm view oslo (check current version, API surface)
- [ ] npm view @node-rs/argon2 (check version, platform compatibility)
- [ ] Review SvelteKit 2.x hooks.server.ts API (kit.svelte.dev/docs)
- [ ] Verify Lucia auth status (lucia-auth.com - confirm deprecation)
- [ ] Review Drizzle relations API (orm.drizzle.team/docs)

**Before Phase 4:**
- [ ] Review Drizzle transaction API for multi-table inserts
- [ ] Verify Turso-specific considerations (network latency, connection pooling)

**Before Phase 6 (if in scope):**
- [ ] npm view papaparse (check current version)
- [ ] Check PapaParse error handling patterns
- [ ] Survey BOM CSV template formats (domain research)

**Lower priority:**
- [ ] Review Argon2 parameter recommendations (OWASP, 2025+)
- [ ] CSRF protection in SvelteKit (form actions vs. API endpoints)

## Gaps to Address

### Unable to Verify (Web access blocked)

**Due to unavailable WebSearch, the following remain unverified:**
1. Current versions of recommended packages (oslo, argon2, papaparse)
2. Lucia auth deprecation status (training data: deprecated late 2024)
3. Oslo package API surface (know it exists, don't know exact functions)
4. @node-rs/argon2 serverless platform support matrix
5. SvelteKit 2.x hooks.server.ts API specifics
6. Drizzle relations and transactions API for current version

**Mitigation:** All recommendations are based on established patterns and training data through Jan 2025. Verification step added to Phase 1 planning.

### Domain-Specific Research Deferred

**CSV template format research not conducted:**
- What columns are standard in woodworking BOMs?
- What validation rules apply (material types, measurement units)?
- Are there industry-standard BOM formats to support?

**Rationale:** This is domain/feature-specific research, better conducted during Phase 6 planning when requirements are refined (if CSV upload confirmed in scope).

### Multi-User Considerations Deferred

**Research focused on single-user scope:**
- Session caching strategy (Redis, Upstash) not evaluated
- Multi-tenancy patterns not explored
- Rate limiting / abuse prevention not considered
- Pagination for project lists not designed

**Rationale:** v2.0 is single-user focused. Multi-user is v3.0+ scope. Don't over-engineer now.

## Ready for Roadmap

**Synthesis complete:** Stack additions identified, architecture patterns documented, integration points clear, phase structure recommended.

### Key Recommendations

1. **Start with Auth Foundation (Phase 1)** using custom auth + oslo utilities
   - Avoid auth frameworks (Auth.js is OAuth-focused, Lucia is deprecated)
   - Use Argon2 for password hashing
   - Store sessions in existing Turso database

2. **Preserve existing flows** while adding auth layer
   - Keep /bom/new accessible without login (demo mode)
   - Add "Save" option only for authenticated users
   - Extend, don't replace

3. **Build sequentially with clear dependencies**
   - Auth → Protection → Projects → BOMs → Templates
   - Allows parallel work on independent features (Templates, CSV)

4. **Verify before implementing**
   - Check package versions and APIs (oslo, Argon2, SvelteKit hooks)
   - Test Argon2 serverless compatibility on target platform
   - Add verification checklist to Phase 1 PLAN.md

### Risk Mitigation

**High-risk areas:**
- Session management bugs (security implications)
- Password hashing misconfiguration
- SQL injection (Drizzle parameterizes, but verify)
- CSRF attacks (SvelteKit has built-in protection, verify for APIs)

**Mitigation strategies:**
- Use established security patterns (httpOnly cookies, crypto-random tokens)
- Verify Argon2 parameters against OWASP recommendations
- Test auth flow in isolation before building dependent features
- Incremental schema migrations (additive → modifications)

### Open Questions for Scoping

**Decisions needed before roadmap finalization:**
1. Include user registration or admin-only account creation? (Recommend admin-only)
2. CSV upload in v2.0 or defer to v2.1? (Recommend defer unless critical)
3. Email verification and password reset flows? (Recommend defer)
4. Rate limiting on auth endpoints? (Recommend defer for single-user app)
5. File uploads for project attachments? (Research didn't cover deeply, defer unless critical)

## Detailed Findings

Full research available in:
- `.planning/research/ARCHITECTURE.md` - Comprehensive architecture patterns, integration strategy, code examples
- `.planning/research/STACK.md` - Stack additions, package rationale, alternatives considered
- `.planning/research/PITFALLS.md` - Domain pitfalls, security considerations, common mistakes

### Critical Patterns (from ARCHITECTURE.md)

**1. Session validation (runs on every request):**
```typescript
// src/hooks.server.ts
export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get('session_token');
  if (sessionToken) {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, sessionToken),
      with: { user: true }
    });
    if (session && session.expiresAt > new Date()) {
      event.locals.user = session.user;
    }
  }
  return resolve(event);
};
```

**2. Route protection (in load functions):**
```typescript
// +page.server.ts
export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/auth/login');
  }
  return { user: locals.user };
};
```

**3. Database schema (hierarchical relationships):**
```typescript
// Key tables with foreign keys
users → projects (userId)
projects → boms (projectId)
boms → bomItems (bomId)
users → sessions (userId)
// templates (independent, admin-managed)
```

**4. API authentication:**
```typescript
// API handler
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }
  // Proceed with authenticated logic
};
```

### Integration with Existing Code

**Preserve:**
- `/bom/new` unauthenticated flow (demo mode)
- `/api/bom/generate` endpoint (auth-optional, supports demo)
- Existing BOM wizard component logic

**Extend:**
- Add `onSave` callback to BOMDisplay component
- Add authenticated navigation links to Sidebar
- Modify dashboard to load user projects via `+page.server.ts`
- Add UserMenu to Header component

**New:**
- `/auth/login` and `/auth/logout` routes
- `/projects` routes (list, detail, edit)
- `/admin` routes (templates management)
- API endpoints for projects, BOMs, templates

## Research Methodology Notes

**Limitations:**
- WebSearch unavailable - relied on training data (January 2025 cutoff)
- SvelteKit 2.x may have API changes not reflected in training
- Package versions may have changed (training → Jan 2026)
- Couldn't verify Lucia deprecation timeline or oslo current API

**Confidence factors:**
- Auth patterns are industry-standard (high confidence in general approach)
- SvelteKit hooks.server.ts is well-documented feature (medium confidence in specifics)
- Database schema design follows normalization principles (high confidence)
- API structure follows REST conventions (high confidence)
- Argon2 as password hashing standard (high confidence, OWASP recommendation)

**Verification protocol followed:**
- Treated pre-training knowledge as hypothesis, not fact
- Flagged areas needing official doc verification
- Marked recommendations as "based on patterns" vs. "verified with sources"
- Honest reporting of gaps and unknowns

**Recommendation:** Treat this research as strong architectural guidance with verification pass needed before Phase 1 implementation.

---

## Next Steps for Roadmap Creation

1. Structure phases per recommendations above (6 phases)
2. Add verification tasks to Phase 1 (package APIs, Argon2 serverless)
3. Flag Phase 4 for Drizzle transaction research
4. Flag Phase 6 for domain research (CSV validation) if in scope
5. Defer multi-user optimizations to v3.0
6. Make scoping decisions on open questions (registration, CSV upload, file attachments)
7. Create REQUIREMENTS.md with traceable requirements
8. Create ROADMAP.md with phase structure and dependencies
