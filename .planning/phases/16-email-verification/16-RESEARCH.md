# Phase 16: Email Verification - Research

**Researched:** 2026-01-29
**Domain:** Email verification, token-based authentication, transactional email UX
**Confidence:** HIGH

## Summary

Email verification is a security control that confirms user ownership of an email address through a time-limited, single-use token sent via email. The standard approach uses cryptographically random tokens (32+ characters), SHA-256 hashing before database storage (identical to password reset pattern), and 24-hour expiration windows to balance security and user convenience.

The existing Phase 15 infrastructure (Resend client, token hashing utilities, passwordResetTokens table pattern) provides a proven foundation. Email verification follows nearly identical security patterns but with a longer expiration window (24 hours vs 1 hour for password reset) and different UX considerations (non-blocking verification with resend capability vs blocking password reset flow).

Key implementation decisions:
- Extend existing token pattern from Phase 15 (SHA-256 hashing, single active token per user)
- 24-hour token expiration (industry standard for verification vs 1-hour for password reset)
- Send verification email immediately after signup (within 60 seconds requirement)
- Display verification status badge on profile page (verified/unverified)
- Provide resend verification option with rate limiting
- No account restrictions for unverified users (soft verification approach)

**Primary recommendation:** Replicate Phase 15's password reset token architecture with modified expiration time and new email template. Add `emailVerified` boolean to users table and create parallel `emailVerificationTokens` table.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Resend | Latest | Transactional email delivery | Already integrated in Phase 15, proven reliable, developer-friendly API |
| Node.js crypto | Built-in | Token generation and hashing | Same as Phase 15 password reset, no external dependencies |
| Drizzle ORM | Current | Database schema and queries | Project standard, type-safe token storage |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React Email | Optional | Email template components | If advanced email design needed beyond inline HTML |
| @node-rs/argon2 | Current | Password hashing | Already in use for passwords, NOT for tokens (use SHA-256) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Resend | SendGrid, Mailgun, AWS SES | Resend already integrated, changing adds complexity with no benefit |
| SHA-256 token hashing | Argon2 | Argon2 is for passwords (slow by design), SHA-256 is appropriate for one-time tokens |
| Database tokens | JWT | JWTs can't be revoked, database tokens provide single-use guarantee |
| 24-hour expiration | 1-hour or 48-hour | 24 hours is industry standard, balances security with user convenience |

**Installation:**
```bash
# No new dependencies required
# All required libraries already installed from Phase 15
```

## Architecture Patterns

### Recommended Database Schema
```typescript
// Add to src/lib/server/schema.ts

// Email verification tokens table (parallel to passwordResetTokens)
export const emailVerificationTokens = sqliteTable('email_verification_tokens', {
  tokenHash: text('token_hash').primaryKey(), // SHA-256 hash of token
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// Add emailVerified column to existing users table
export const users = sqliteTable('users', {
  // ... existing columns ...
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp' }) // Optional: timestamp when verified
});
```

### Pattern 1: Token Generation and Storage
**What:** Generate cryptographically random token, hash with SHA-256, store hash in database
**When to use:** Immediately after signup, or when user requests resend
**Example:**
```typescript
// Source: Existing Phase 15 implementation (src/lib/server/auth.ts)
// Adapted for email verification with 24-hour expiration

export async function generateEmailVerificationToken(userId: string): Promise<string> {
  // Delete any existing tokens for this user (single active token pattern)
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));

  // Generate 32 random bytes (64 hex characters)
  const tokenBytes = crypto.randomBytes(32);
  const token = tokenBytes.toString('hex');

  // Hash token with SHA-256 before storage (NEVER store plaintext)
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Token expires in 24 hours (verification vs 1 hour for password reset)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Store hashed token
  await db.insert(emailVerificationTokens).values({
    tokenHash,
    userId,
    expiresAt,
    createdAt: new Date()
  });

  // Return plaintext token (for email link, shown only once)
  return token;
}
```

### Pattern 2: Token Validation and Consumption
**What:** Validate token, mark email as verified, delete token (single-use)
**When to use:** When user clicks verification link in email
**Example:**
```typescript
// Source: Adapted from Phase 15 password reset pattern

export async function verifyEmailToken(token: string): Promise<string | null> {
  // Hash the submitted token
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find token in database
  const verificationToken = await db.query.emailVerificationTokens.findFirst({
    where: eq(emailVerificationTokens.tokenHash, tokenHash)
  });

  if (!verificationToken) {
    return null; // Token not found
  }

  // Check expiry (24 hours)
  if (verificationToken.expiresAt < new Date()) {
    // Delete expired token
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.tokenHash, tokenHash));
    return null;
  }

  return verificationToken.userId;
}

export async function markEmailAsVerified(userId: string, token: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Mark email as verified
  await db.update(users)
    .set({
      emailVerified: true,
      emailVerifiedAt: new Date()
    })
    .where(eq(users.id, userId));

  // Delete token (single use)
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.tokenHash, tokenHash));
}
```

### Pattern 3: Signup Flow Integration
**What:** Send verification email immediately after user account creation
**When to use:** In signup action, after user record created but before session created
**Example:**
```typescript
// Source: Adapted from existing signup flow (src/routes/auth/signup/+page.server.ts)

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    // ... existing validation and user creation ...

    // Create user
    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    await db.insert(users).values({
      id,
      email,
      passwordHash,
      role,
      emailVerified: false, // NEW: Default to unverified
      createdAt: new Date()
    });

    // NEW: Send verification email (non-blocking, errors logged but don't prevent signup)
    try {
      const token = await generateEmailVerificationToken(id);
      await sendVerificationEmail(email, token);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Continue with signup - user can request resend later
    }

    // Create session and redirect (existing flow)
    await createSession(id, cookies);
    throw redirect(302, '/');
  }
};
```

### Pattern 4: Resend Verification with Rate Limiting
**What:** Allow users to request new verification email with abuse prevention
**When to use:** User didn't receive email or token expired
**Example:**
```typescript
// Source: Industry best practices for rate limiting verification emails

// Simple in-memory rate limiter (upgrade to Redis for production multi-server)
const resendAttempts = new Map<string, { count: number; resetAt: Date }>();

export async function canResendVerification(userId: string): Promise<boolean> {
  const now = new Date();
  const userAttempts = resendAttempts.get(userId);

  if (!userAttempts || userAttempts.resetAt < now) {
    // Reset window (15 minutes)
    resendAttempts.set(userId, {
      count: 1,
      resetAt: new Date(now.getTime() + 15 * 60 * 1000)
    });
    return true;
  }

  // Limit: 3 resends per 15 minutes
  if (userAttempts.count >= 3) {
    return false;
  }

  userAttempts.count++;
  return true;
}
```

### Pattern 5: Email Template Structure
**What:** Verification email with clear call-to-action and security messaging
**When to use:** When sending verification email (signup or resend)
**Example:**
```typescript
// Source: Adapted from Phase 15 password reset email template

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const resend = getResendClient();
  const verifyUrl = `${getBaseUrl()}/auth/verify-email?token=${token}`;

  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL || 'WoodShop Toolbox <onboarding@resend.dev>',
    to: email,
    subject: 'Verify your email - WoodShop Toolbox',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafaf9;">
          <div style="background-color: white; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #292524; margin: 0 0 16px 0; font-size: 24px;">Verify your email</h1>
            <p style="color: #57534e; line-height: 1.6; margin: 0 0 24px 0;">
              Thanks for signing up for WoodShop Toolbox!
              Click the button below to verify your email address. This link expires in 24 hours.
            </p>
            <p style="margin: 0 0 24px 0;">
              <a href="${verifyUrl}"
                 style="display: inline-block; background-color: #b45309; color: white; padding: 12px 24px;
                        text-decoration: none; border-radius: 6px; font-weight: 500;">
                Verify Email
              </a>
            </p>
            <p style="color: #78716c; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">
              Or copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; color: #b45309; font-size: 14px; margin: 0 0 24px 0;">
              ${verifyUrl}
            </p>
            <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;">
            <p style="color: #a8a29e; font-size: 13px; margin: 0;">
              If you didn't create an account with WoodShop Toolbox, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `
  });

  if (error) {
    console.error('Failed to send verification email:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
```

### Pattern 6: Verification Status Badge UI
**What:** Visual indicator of email verification status on user profile
**When to use:** Admin user detail page, future user profile page
**Example:**
```svelte
<!-- Source: Adapted from existing badge pattern (admin/users/[id]/+page.svelte) -->

{#if user.emailVerified}
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
  >
    &#x2713; Verified
  </span>
{:else}
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
  >
    &#x26A0; Unverified
  </span>
{/if}
```

### Anti-Patterns to Avoid

- **Don't use JWT for verification tokens:** JWTs cannot be revoked, making single-use guarantee impossible. Use database tokens.
- **Don't store plaintext tokens:** Always hash with SHA-256 before storage (Phase 15 established this pattern).
- **Don't block account functionality for unverified users:** Soft verification approach (display badge, allow resend) provides better UX than hard blocking.
- **Don't use Argon2 for tokens:** Argon2 is intentionally slow for passwords. SHA-256 is appropriate for one-time tokens.
- **Don't send verification emails without rate limiting:** Prevents abuse (spam victim's inbox, overload email service).
- **Don't reuse expired tokens:** Delete expired tokens immediately on validation attempt.
- **Don't email-scan-proof by requiring button click:** Modern approach, but adds complexity. Consider only if email client auto-scanning becomes issue.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email delivery infrastructure | Custom SMTP server | Resend API | Deliverability, reputation management, bounce handling, spam compliance (SPF/DKIM) |
| Token generation | `Math.random()` or timestamp-based tokens | `crypto.randomBytes(32)` | Cryptographically secure randomness prevents token guessing |
| Token storage | Plaintext in database | SHA-256 hash | Database breach doesn't expose valid tokens |
| Rate limiting | Custom timestamp tracking | Map-based cache or Redis | Edge cases (concurrent requests, distributed systems) already solved |
| Email templates | Plain text emails | HTML with inline CSS | Mobile compatibility, accessibility, professional appearance |

**Key insight:** Email delivery is complex (SPF, DKIM, DMARC, IP reputation, bounce handling, spam filtering). Phase 15 already integrated Resend—reuse this proven infrastructure rather than building custom solutions.

## Common Pitfalls

### Pitfall 1: Blocking Account Access for Unverified Users
**What goes wrong:** Forcing users to verify email before accessing any functionality creates frustration and abandonment.
**Why it happens:** Security-first mindset without considering UX impact.
**How to avoid:**
- Allow full account functionality for unverified users (soft verification approach)
- Display verification status badge prominently
- Provide easy resend option
- Only enforce verification for sensitive operations (if needed, consider in future phases)
**Warning signs:** User complaints about not receiving email, high signup abandonment rate

### Pitfall 2: No Rate Limiting on Resend
**What goes wrong:** Users can spam resend button, flooding email inbox or abusing email service quota.
**Why it happens:** Focusing on happy path without considering abuse scenarios.
**How to avoid:**
- Implement rate limiting: 3 resends per 15-minute window (industry standard)
- Show "Please wait X minutes" message when limit hit
- Log excessive resend attempts (potential abuse indicator)
**Warning signs:** Email service quota exceeded, user reports of email spam

### Pitfall 3: Expiration Too Short or Too Long
**What goes wrong:**
- Too short (1 hour): Users miss window, request resends, create support burden
- Too long (7+ days): Security window extends unnecessarily
**Why it happens:** Copying password reset expiration without considering different use case.
**How to avoid:**
- Use 24-hour expiration (industry standard for verification)
- Password reset: 1 hour (security-critical, time-sensitive)
- Email verification: 24 hours (convenience-focused, lower risk)
**Warning signs:** High resend request rate or old tokens in database

### Pitfall 4: Email Client Auto-Scanning Consuming Tokens
**What goes wrong:** Some email clients pre-fetch links in emails, consuming one-time tokens before user clicks.
**Why it happens:** Email clients scan for security threats, inadvertently triggering verification.
**How to avoid:**
- **Phase 16 approach:** Simple link (matches Phase 15 pattern, proven reliable)
- **If issues arise:** Add intermediate page with "Click to verify" button (email clients won't click buttons)
- Check user session before verifying (if no session, likely scanner)
**Warning signs:** Users report "link already used" immediately after receiving email

### Pitfall 5: No Feedback After Verification
**What goes wrong:** User clicks link, email verified, but no confirmation—user unsure if it worked.
**Why it happens:** Backend-focused development without UX consideration.
**How to avoid:**
- Redirect to success page with clear "Email verified!" message
- Update badge immediately (if viewing profile)
- Provide "Continue to dashboard" link
**Warning signs:** Support requests asking "Did my verification work?"

### Pitfall 6: Forgetting to Clean Up Expired Tokens
**What goes wrong:** Database accumulates expired tokens, wasting storage and slowing queries.
**Why it happens:** No cleanup strategy in initial implementation.
**How to avoid:**
- Delete expired tokens on validation attempt (immediate cleanup, Phase 15 pattern)
- Optional: Scheduled cleanup job for old tokens (not required for Phase 16 scope)
- Database index on expiresAt for efficient cleanup queries
**Warning signs:** emailVerificationTokens table grows continuously

### Pitfall 7: Sending Verification Email Blocks Signup
**What goes wrong:** Email sending fails (API down, network issue), signup fails completely, user can't create account.
**Why it happens:** Not handling email sending as non-critical operation.
**How to avoid:**
- Wrap email sending in try-catch
- Log errors but don't fail signup
- User can request resend after signup succeeds
- Phase 15 pattern: fail signup if email fails (password reset is security-critical)
- Phase 16 pattern: continue signup if email fails (verification is convenience feature)
**Warning signs:** Spike in failed signups during email service outage

## Code Examples

Verified patterns from official sources:

### Verification Route Handler
```typescript
// File: src/routes/auth/verify-email/+page.server.ts
// Source: Adapted from Phase 15 reset-password route

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { verifyEmailToken, markEmailAsVerified } from '$lib/server/auth';

export const load: PageServerLoad = async ({ url, locals }) => {
  const token = url.searchParams.get('token');

  if (!token) {
    return { success: false, error: 'Missing verification token' };
  }

  // Validate token
  const userId = await verifyEmailToken(token);

  if (!userId) {
    return { success: false, error: 'Invalid or expired verification link. Please request a new one.' };
  }

  // Mark email as verified and consume token
  await markEmailAsVerified(userId, token);

  // Redirect to success page or dashboard
  return { success: true };
};
```

### Resend Verification Action
```typescript
// File: src/routes/auth/resend-verification/+page.server.ts
// Source: Industry best practices with Phase 15 patterns

import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { generateEmailVerificationToken, canResendVerification } from '$lib/server/auth';
import { sendVerificationEmail } from '$lib/server/email';

export const load: PageServerLoad = async (event) => {
  const user = requireAuth(event);

  return {
    email: user.email,
    emailVerified: user.emailVerified
  };
};

export const actions: Actions = {
  default: async (event) => {
    const user = requireAuth(event);

    // Already verified
    if (user.emailVerified) {
      return { success: true, message: 'Email already verified!' };
    }

    // Check rate limiting
    if (!await canResendVerification(user.id)) {
      return fail(429, {
        error: 'Too many requests. Please wait 15 minutes before requesting another verification email.'
      });
    }

    try {
      const token = await generateEmailVerificationToken(user.id);
      await sendVerificationEmail(user.email, token);

      return {
        success: true,
        message: 'Verification email sent! Check your inbox.'
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      return fail(500, {
        error: 'Failed to send verification email. Please try again later.'
      });
    }
  }
};
```

### Admin User Detail with Verification Badge
```svelte
<!-- File: src/routes/admin/users/[id]/+page.svelte (enhancement) -->
<!-- Source: Existing admin user detail page pattern -->

<div class="flex items-center gap-2">
  <!-- Existing role badge -->
  {#if data.user.role === 'admin'}
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
      Admin
    </span>
  {/if}

  <!-- Existing status badge -->
  {#if data.user.disabled}
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
      Disabled
    </span>
  {/if}

  <!-- NEW: Email verification badge -->
  {#if data.user.emailVerified}
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      &#x2713; Verified
    </span>
  {:else}
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
      &#x26A0; Unverified
    </span>
  {/if}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Email verification via 6-digit OTP codes | Token-based verification links | 2020s | Better UX (one-click vs manual typing), better security (longer tokens) |
| Blocking account access until verified | Soft verification with badges | 2020s | Reduced abandonment, better conversion rates |
| Plain text emails | HTML emails with inline CSS | 2010s | Mobile-friendly, professional appearance, accessibility |
| 1-hour expiration for all tokens | Context-specific expiration (1hr password reset, 24hr verification) | 2020s | Balances security and convenience per use case |
| Separate verification systems per provider | Unified transactional email APIs (Resend, SendGrid) | 2020s | Simplified integration, better deliverability |

**Deprecated/outdated:**
- **SMS-based verification for email addresses:** Use email-based verification for email, SMS only for phone numbers
- **Verification via username/password test:** Replaced by token-based verification (more secure, better UX)
- **MD5 token hashing:** Use SHA-256 minimum (MD5 is cryptographically broken)
- **Email verification as hard requirement before any access:** Modern apps use soft verification with gradual trust building

## Open Questions

Things that couldn't be fully resolved:

1. **Should we require email verification for certain features?**
   - What we know: Industry trend toward soft verification (no blocking)
   - What's unclear: WoodShop Toolbox specific needs (are there sensitive operations requiring verified email?)
   - Recommendation: Start with no restrictions (Phase 16 scope), add restrictions in future phases if needed

2. **Should we implement email change verification?**
   - What we know: OWASP recommends dual confirmation (old email + new email)
   - What's unclear: Phase 16 scope doesn't include email change functionality
   - Recommendation: Defer to future phase (email change is separate feature from signup verification)

3. **Should we use React Email for templates?**
   - What we know: React Email integrates with Resend, provides component-based templates
   - What's unclear: Phase 15 uses inline HTML successfully, unclear if complexity justified
   - Recommendation: Start with inline HTML (matches Phase 15 pattern), upgrade to React Email if template complexity increases

4. **Should we send reminder emails for unverified accounts?**
   - What we know: Some services send "You haven't verified yet" reminders after 24-48 hours
   - What's unclear: Phase 16 requirements don't mention reminders, unclear if users want them
   - Recommendation: Not in Phase 16 scope, consider in future based on user feedback

5. **Should we implement distributed rate limiting (Redis)?**
   - What we know: Map-based rate limiting works for single server, Redis needed for multi-server
   - What's unclear: Deployment architecture (single server or load-balanced?)
   - Recommendation: Use Map-based rate limiting initially (simple, no dependencies), migrate to Redis if scaling to multiple servers

## Sources

### Primary (HIGH confidence)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) - Authentication best practices, token requirements (32+ characters, secure randomness)
- [OWASP Changing Email Address Control](https://owasp.org/www-community/pages/controls/Changing_Registered_Email_Address_For_An_Account) - Time-limited nonces, expiration handling
- [Implementing the Right Email Verification Flow | SuperTokens](https://supertokens.com/blog/implementing-the-right-email-verification-flow) - Token reuse strategy, email client scanning edge cases
- [Email Verification Link Expiration](https://emaillistvalidation.com/blog/email-verification-link-expiration-ensuring-security-and-user-experience-2/) - 24-hour expiration standard
- [Resend API Documentation](https://resend.com/docs/api-reference/emails/send-email) - Transactional email best practices

### Secondary (MEDIUM confidence)
- [Better Email Verification Workflows](https://aryaniyaps.medium.com/better-email-verification-workflows-13500ce042c7) - Token management patterns, already verified edge cases
- [Preventing Abuse of Resend Verification Emails](https://aznj.medium.com/preventing-abuse-of-resend-verification-emails-in-go-rate-limiting-example-2554f66b1048) - Rate limiting implementation (3 resends per 15 minutes)
- [Email Verification UX Best Practices](https://emaillistvalidation.com/blog/email-verification-ux-elevating-user-experience-in-user-sign-up-journeys/) - Resend options, user guidance
- [Guide to Verification Emails - Best Designs](https://designmodo.com/verification-emails/) - Email template design patterns
- [Badge UI Design Best Practices | Mobbin](https://mobbin.com/glossary/badge) - Verification badge positioning and design

### Tertiary (LOW confidence)
- [Best Practices for User Authentication Module | Vertabelo](https://vertabelo.com/blog/user-authentication-module/) - Database schema patterns (confirmation token field allows null)
- WebSearch results on SvelteKit email verification - General implementation patterns (no specific SvelteKit-unique requirements found)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Phase 15 infrastructure proven, Resend integrated, patterns established
- Architecture: HIGH - Direct adaptation of Phase 15 password reset patterns (validated in production)
- Pitfalls: HIGH - OWASP guidelines, industry best practices, existing Phase 15 learnings
- Email template: MEDIUM - Inline HTML proven in Phase 15, React Email integration not yet tested
- Rate limiting: MEDIUM - Map-based approach standard for single-server, Redis consideration for scale
- UI patterns: MEDIUM - Badge design adapted from existing admin pages, profile page not yet created

**Research date:** 2026-01-29
**Valid until:** ~30 days (email verification patterns are stable, but Resend API may add features)

**Key validation performed:**
- OWASP Authentication Cheat Sheet verified (WebFetch)
- OWASP Email Change Control verified (WebFetch)
- Multiple WebSearch queries cross-referenced (token expiration, rate limiting, UX patterns)
- Existing Phase 15 code reviewed (email.ts, auth.ts, schema.ts, password reset routes)
- Current admin UI patterns analyzed (badge styling, user detail page structure)

**Dependencies on Phase 15:**
- Resend client initialization pattern (`getResendClient()` in email.ts)
- Token hashing utilities (SHA-256 pattern in auth.ts)
- Email template styling (matches password reset email design)
- Database table pattern (similar to passwordResetTokens table)
- Environment variables (RESEND_API_KEY, RESEND_FROM_EMAIL, PUBLIC_BASE_URL)
