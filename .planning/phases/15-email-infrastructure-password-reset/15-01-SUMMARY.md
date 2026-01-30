---
phase: 15-email-infrastructure-password-reset
plan: 01
subsystem: auth
tags: [resend, email, password-reset, tokens, sha256, crypto]

# Dependency graph
requires:
  - phase: 13-rbac-foundation
    provides: users table and auth utilities
provides:
  - passwordResetTokens table schema
  - Resend email integration
  - Token generation with SHA-256 hashing
  - Token validation and consumption functions
affects: [15-02-password-reset-flow, 16-email-verification]

# Tech tracking
tech-stack:
  added: [resend]
  patterns: [token-hash-before-storage, one-hour-expiry, session-invalidation-on-reset]

key-files:
  created:
    - src/lib/server/email.ts
  modified:
    - src/lib/server/schema.ts
    - src/lib/server/auth.ts

key-decisions:
  - "SHA-256 hash tokens before storage (never store plaintext)"
  - "1-hour token expiry (OWASP standard)"
  - "Single active token per user (delete existing before creating new)"
  - "Invalidate all sessions on password reset (OWASP recommendation)"
  - "Lazy Resend client initialization (only when API key exists)"

patterns-established:
  - "Token hashing: crypto.randomBytes(32) -> SHA-256 -> store hash"
  - "Token validation: hash submitted token, compare to stored"
  - "Email templates: inline CSS for maximum email client compatibility"

# Metrics
duration: 8min
completed: 2026-01-29
---

# Phase 15 Plan 01: Email Infrastructure Summary

**Resend email integration with SHA-256 hashed password reset tokens and secure token lifecycle utilities**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-29T12:00:00Z
- **Completed:** 2026-01-29T12:08:00Z
- **Tasks:** 3
- **Files modified:** 3 (+ package.json, package-lock.json)

## Accomplishments
- passwordResetTokens table with SHA-256 hash as primary key
- Resend email client with mobile-responsive HTML template
- Token generation, validation, and consumption functions
- Session invalidation on password reset for security

## Task Commits

Each task was committed atomically:

1. **Task 1: Add passwordResetTokens table to schema** - `0bbf201` (feat)
2. **Task 2: Create email client with Resend** - `b87f6ba` (feat)
3. **Task 3: Add token generation and validation functions** - `174a051` (feat)

## Files Created/Modified
- `src/lib/server/schema.ts` - Added passwordResetTokens table and relations
- `src/lib/server/email.ts` - New file with Resend client and sendPasswordResetEmail
- `src/lib/server/auth.ts` - Added generatePasswordResetToken, validatePasswordResetToken, consumePasswordResetToken

## Decisions Made
- **SHA-256 token hashing:** Plaintext tokens never stored in database, only hashed version
- **1-hour expiry:** OWASP-recommended duration for password reset tokens
- **Single token per user:** Delete existing tokens before creating new (prevents token accumulation)
- **Session invalidation:** All sessions deleted when password is reset (forces re-login on all devices)
- **Lazy Resend init:** Client only initialized when RESEND_API_KEY exists (graceful dev mode)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** For password reset emails to work:

1. **Get Resend API key:**
   - Sign up at https://resend.com
   - Create an API key in your dashboard

2. **Add environment variables to `.env`:**
   ```
   RESEND_API_KEY=re_your_api_key_here
   PUBLIC_BASE_URL=http://localhost:5173  # or your production URL
   RESEND_FROM_EMAIL=Your App <noreply@yourdomain.com>  # optional, defaults to Resend test domain
   ```

3. **For production:** Verify your domain in Resend for custom from addresses

## Next Phase Readiness
- Email infrastructure ready for password reset flow (15-02)
- Token functions ready for forgot password and reset password routes
- Same patterns applicable for email verification (Phase 16)

---
*Phase: 15-email-infrastructure-password-reset*
*Completed: 2026-01-29*
