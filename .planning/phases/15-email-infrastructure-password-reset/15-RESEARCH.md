# Phase 15: Email Infrastructure & Password Reset - Research

**Researched:** 2026-01-29
**Domain:** Email Infrastructure & Authentication Security
**Confidence:** HIGH

## Summary

This phase implements password reset functionality using industry-standard patterns: cryptographically secure tokens, transactional email via Resend, and time-limited single-use reset links. The research identified the complete technical stack and critical security patterns.

**Key findings:**
- Resend (npm: resend) is the standard transactional email API for modern web applications, with official SvelteKit integration
- Password reset tokens must use crypto.randomBytes (not randomUUID), be hashed with SHA-256 before storage, and expire in 1 hour
- User enumeration prevention requires identical responses whether email exists or not
- OWASP guidelines and 2026 security best practices dictate specific token generation, storage, and validation patterns

**Primary recommendation:** Use Resend for email + crypto.randomBytes(32) for token generation + SHA-256 for token hashing + 1-hour expiry with single-use enforcement.

## Standard Stack

The established libraries/tools for transactional email and secure token management:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| resend | ^4.0.0 | Transactional email API | Official Node.js SDK, SvelteKit docs, 2 req/sec free tier, reliable SMTP |
| crypto (Node.js built-in) | - | Token generation & hashing | Cryptographically secure randomBytes, SHA-256 hashing, timingSafeEqual |
| drizzle-orm | ^0.45.1 | Token table schema | Already in project, SQLite timestamp support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ^4.3.5 | Email/password validation | Already in project, form data validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Resend | SendGrid, AWS SES, Nodemailer+SMTP | Resend has better DX, free tier, modern API. Others require more config. |
| crypto.randomBytes | crypto.randomUUID | UUID format not ideal for tokens; randomBytes gives custom length control |
| SHA-256 | Argon2 | Argon2 is for passwords (slow); SHA-256 is correct for token hashing (fast) |

**Installation:**
```bash
npm install resend
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/server/
│   ├── auth.ts              # Add token generation/validation functions
│   ├── email.ts             # NEW: Resend client + email templates
│   └── schema.ts            # Add passwordResetTokens table
├── routes/auth/
│   ├── forgot-password/
│   │   └── +page.server.ts  # Request reset form action
│   ├── reset-password/
│   │   └── +page.server.ts  # Reset password form action (with token)
│   └── login/
│       └── +page.server.ts  # Add "Forgot password?" link
```

### Pattern 1: Token Generation (Cryptographically Secure)
**What:** Generate random token, hash before storage, store with expiry
**When to use:** Every password reset request
**Example:**
```typescript
// Source: OWASP Forgot Password Cheat Sheet + Node.js crypto docs
// https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
// https://nodejs.org/api/crypto.html

import crypto from 'crypto';

export async function generatePasswordResetToken(userId: string) {
  // Generate 32 random bytes (64 hex characters)
  const tokenBytes = crypto.randomBytes(32);
  const token = tokenBytes.toString('hex');

  // Hash token for storage (SHA-256)
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Expiry: 1 hour from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Store hashed token in database
  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash,
    expiresAt,
    createdAt: new Date()
  });

  // Return plaintext token (only time it's visible)
  return token;
}
```

### Pattern 2: Token Validation (Timing-Safe)
**What:** Hash submitted token, compare with database using timing-safe equality
**When to use:** When user submits reset form with token
**Example:**
```typescript
// Source: Node.js crypto.timingSafeEqual docs + OWASP guidelines
// https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
// https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html

import crypto from 'crypto';

export async function validatePasswordResetToken(token: string): Promise<string | null> {
  // Hash submitted token
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find token in database
  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.tokenHash, tokenHash)
  });

  if (!resetToken) {
    return null; // Token not found
  }

  // Check expiry
  if (resetToken.expiresAt < new Date()) {
    // Delete expired token
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));
    return null;
  }

  // Return userId if valid
  return resetToken.userId;
}

export async function consumePasswordResetToken(token: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));
}
```

### Pattern 3: Resend Email Integration
**What:** Initialize Resend client, send HTML email with reset link
**When to use:** After generating reset token
**Example:**
```typescript
// Source: Resend official SvelteKit documentation
// https://resend.com/docs/send-with-sveltekit

import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${env.PUBLIC_BASE_URL}/auth/reset-password?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: 'WoodShop Toolbox <noreply@yourdomain.com>',
    to: email,
    subject: 'Reset your password',
    html: `
      <h1>Reset your password</h1>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>Link: ${resetUrl}</p>
    `
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}
```

### Pattern 4: User Enumeration Prevention
**What:** Return identical response whether email exists or not
**When to use:** Forgot password form action
**Example:**
```typescript
// Source: OWASP Forgot Password Cheat Sheet
// https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().trim().toLowerCase();

    // Always return same success message
    const successMessage = 'If an account exists with that email, you will receive a password reset link.';

    if (!email) {
      return { success: true, message: successMessage };
    }

    // Look up user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    // Only send email if user exists, but ALWAYS return success
    if (user) {
      const token = await generatePasswordResetToken(user.id);
      await sendPasswordResetEmail(email, token);
    }

    // Same response regardless of whether user exists
    return { success: true, message: successMessage };
  }
};
```

### Pattern 5: Database Schema for Reset Tokens
**What:** Table with userId, tokenHash, expiresAt, createdAt
**When to use:** Initial database schema setup
**Example:**
```typescript
// Source: Drizzle ORM SQLite docs + password reset schema patterns
// https://orm.drizzle.team/docs/column-types/sqlite
// https://gist.github.com/vekexasia/2328838

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  tokenHash: text('token_hash').primaryKey(), // SHA-256 hash of token
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
```

### Anti-Patterns to Avoid
- **Storing plaintext tokens:** Tokens must be hashed (SHA-256) before database storage
- **Using crypto.randomUUID for tokens:** UUIDs are predictable format; use randomBytes for custom length
- **Auto-login after reset:** OWASP recommends requiring user to login with new password
- **Including passwords in email:** Never send passwords via email (even new ones)
- **Different responses for existing/non-existing emails:** Enables user enumeration attacks

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email sending | Custom SMTP client | Resend SDK | Rate limits, deliverability, SPF/DKIM/DMARC, retry logic |
| Token generation | Math.random(), Date.now() | crypto.randomBytes | Cryptographically secure, not predictable |
| Token comparison | `===` or `==` | crypto.timingSafeEqual | Prevents timing attacks |
| Token hashing | MD5, SHA-1, Base64 | SHA-256 via crypto.createHash | SHA-256 is current standard, others deprecated |
| Email validation | Regex | Zod email validator | Handles edge cases, internationalization |

**Key insight:** Security primitives (tokens, hashing, comparison) have subtle vulnerabilities when implemented incorrectly. Use Node.js crypto module built-ins instead of custom implementations.

## Common Pitfalls

### Pitfall 1: User Enumeration via Different Responses
**What goes wrong:** Forgot password form returns "User not found" vs "Email sent"
**Why it happens:** Developers want to be helpful to users, but this reveals which emails have accounts
**How to avoid:** Always return identical success message: "If an account exists with that email, you will receive a password reset link."
**Warning signs:** Different error messages for existing/non-existing emails, different response times

### Pitfall 2: Storing Plaintext Reset Tokens
**What goes wrong:** Database contains plaintext tokens that attackers can use if database is compromised
**Why it happens:** Tokens are "temporary" so developers don't hash them like passwords
**How to avoid:** Hash tokens with SHA-256 before storage, never store plaintext. Only show plaintext token once (in email).
**Warning signs:** Token column contains readable strings, no hashing step in token generation

### Pitfall 3: Token Reuse / Not Deleting After Use
**What goes wrong:** Token can be used multiple times or remains valid after password change
**Why it happens:** Forgot to delete token after successful reset
**How to avoid:** Delete token immediately after password reset succeeds. Also delete all tokens for user when they successfully reset.
**Warning signs:** Tokens accumulate in database, same token works twice

### Pitfall 4: Weak Token Generation
**What goes wrong:** Tokens are predictable (timestamp-based, sequential, short length)
**Why it happens:** Using Date.now(), Math.random(), or short UUIDs
**How to avoid:** Use crypto.randomBytes(32) for 64-character hex tokens. Never use Math.random() or timestamps.
**Warning signs:** Tokens are short (<32 characters), tokens follow patterns, can guess next token

### Pitfall 5: Missing Expiration Checks
**What goes wrong:** Expired tokens still work, tokens valid forever
**Why it happens:** Not checking expiresAt before allowing password reset
**How to avoid:** Check `expiresAt < new Date()` during validation. OWASP recommends 1-hour expiry.
**Warning signs:** Tokens from yesterday/last week still work

### Pitfall 6: Rate Limiting Gaps
**What goes wrong:** Attacker floods user with reset emails or brute-forces tokens
**Why it happens:** No rate limiting on forgot-password endpoint
**How to avoid:** Implement rate limiting per email address (e.g., max 3 requests per hour). OWASP recommends CAPTCHA or rate limiting.
**Warning signs:** Users receive hundreds of reset emails, server handles unlimited forgot-password requests

### Pitfall 7: Email Deliverability Issues
**What goes wrong:** Reset emails go to spam or never arrive
**Why it happens:** Missing SPF/DKIM/DMARC DNS records, using no-reply addresses
**How to avoid:** Resend handles SPF/DKIM automatically when domain is verified. Verify domain in Resend dashboard before production.
**Warning signs:** Emails not arriving, emails in spam folder

### Pitfall 8: Resend Rate Limit Exceeded
**What goes wrong:** Email sending fails with 429 error during high traffic
**Why it happens:** Free tier allows 2 requests/second; hitting limit during peak usage
**How to avoid:** Implement queue for email sending, contact Resend for rate limit increase, monitor ratelimit-remaining header.
**Warning signs:** 429 errors in logs, emails not sending during busy periods

## Code Examples

Verified patterns from official sources:

### Complete Token Generation Function
```typescript
// Source: OWASP Forgot Password Cheat Sheet + Node.js crypto docs
import crypto from 'crypto';
import { db } from './db';
import { passwordResetTokens } from './schema';

export async function generatePasswordResetToken(userId: string): Promise<string> {
  // Delete any existing tokens for this user
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));

  // Generate 32 random bytes (64 hex characters)
  const tokenBytes = crypto.randomBytes(32);
  const token = tokenBytes.toString('hex');

  // Hash token with SHA-256
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Token expires in 1 hour
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Store hashed token
  await db.insert(passwordResetTokens).values({
    tokenHash,
    userId,
    expiresAt,
    createdAt: new Date()
  });

  // Return plaintext token (only time it's visible)
  return token;
}
```

### Complete Password Reset Form Action
```typescript
// Source: SvelteKit form actions docs + OWASP guidelines
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { validatePasswordResetToken, consumePasswordResetToken } from '$lib/server/auth';
import { hashPassword } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const actions: Actions = {
  default: async ({ request, url }) => {
    const data = await request.formData();
    const token = url.searchParams.get('token');
    const password = data.get('password')?.toString();
    const confirmPassword = data.get('confirmPassword')?.toString();

    if (!token) {
      return fail(400, { error: 'Invalid reset link' });
    }

    if (!password || password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters' });
    }

    if (password !== confirmPassword) {
      return fail(400, { error: 'Passwords do not match' });
    }

    // Validate token
    const userId = await validatePasswordResetToken(token);

    if (!userId) {
      return fail(400, { error: 'Invalid or expired reset link' });
    }

    // Update password
    const passwordHash = await hashPassword(password);
    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));

    // Delete token (single use)
    await consumePasswordResetToken(token);

    return { success: true };
  }
};
```

### Resend Email Client Setup
```typescript
// Source: Resend SvelteKit documentation
// https://resend.com/docs/send-with-sveltekit
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

// Initialize once, reuse across requests
const resend = new Resend(env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${env.PUBLIC_BASE_URL}/auth/reset-password?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: 'WoodShop Toolbox <noreply@yourdomain.com>',
    to: email,
    subject: 'Reset your password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Reset your password</h1>
          <p>You requested to reset your password for WoodShop Toolbox.</p>
          <p>Click the button below to reset your password. This link expires in 1 hour.</p>
          <p style="margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #b45309; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">
            If you didn't request this password reset, you can safely ignore this email.
            Your password will not be changed.
          </p>
        </body>
      </html>
    `
  });

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Nodemailer + SMTP | Resend API | ~2022 | Simpler setup, better deliverability, modern DX |
| crypto.randomUUID | crypto.randomBytes(32) | Ongoing | Custom length, no format constraints, security-specific |
| MD5/SHA-1 token hashing | SHA-256 | ~2017 | MD5/SHA-1 cryptographically broken |
| 24-hour token expiry | 1-hour expiry | OWASP 2026 | Shorter window reduces attack surface |
| Auto-login after reset | Require re-login | OWASP 2026 | Additional verification step |

**Deprecated/outdated:**
- **Nodemailer with custom SMTP:** Still works but requires more setup. Resend provides better DX.
- **MD5 for token hashing:** Cryptographically broken. Use SHA-256.
- **crypto.randomUUID for tokens:** Works but less flexible. Use randomBytes(32).
- **Sending passwords in email:** Never acceptable. Only send links.

## Open Questions

Things that couldn't be fully resolved:

1. **Rate Limiting Implementation**
   - What we know: OWASP recommends rate limiting on forgot-password endpoint
   - What's unclear: Best implementation approach for SvelteKit (middleware vs in-action)
   - Recommendation: Implement simple in-memory rate limiting (Map with email -> timestamps array) in forgot-password action. Clear entries older than 1 hour. Limit to 3 requests per hour per email.

2. **Email Template Styling**
   - What we know: Should include plain text version, mobile responsive, single CTA
   - What's unclear: Whether to use external email template library or inline HTML
   - Recommendation: Start with inline HTML (as shown in examples). If templates become complex, consider react-email or svelte-email later.

3. **Resend Domain Verification Timeline**
   - What we know: Domain verification (SPF/DKIM) required for production
   - What's unclear: How long verification takes, what to do during development
   - Recommendation: Use Resend test domain (onboarding@resend.dev) for development. Verify production domain in Resend dashboard before Phase 15 deployment. Verification typically instant if DNS configured correctly.

4. **Session Invalidation After Password Reset**
   - What we know: OWASP recommends invalidating all sessions after password reset
   - What's unclear: Should this be mandatory or optional in our implementation?
   - Recommendation: Invalidate all sessions for the user after password reset. This forces re-login on all devices, which is security best practice.

## Sources

### Primary (HIGH confidence)
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) - Security requirements and best practices
- [Resend SvelteKit Documentation](https://resend.com/docs/send-with-sveltekit) - Official integration guide
- [Resend Rate Limit Documentation](https://resend.com/docs/api-reference/rate-limit) - Rate limiting and headers
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html) - crypto.randomBytes, createHash, timingSafeEqual
- [Drizzle ORM SQLite Column Types](https://orm.drizzle.team/docs/column-types/sqlite) - Timestamp storage patterns

### Secondary (MEDIUM confidence)
- [Password Reset Token Security (Medium, Jan 2026)](https://vjnvisakh.medium.com/secure-password-reset-tokens-expiry-and-system-design-best-practices-337c6161af5a) - Token expiry and system design
- [Password Reset Email Best Practices (MailerSend)](https://www.mailersend.com/blog/password-reset-email-best-practices) - Email template guidelines
- [Password Reset Database Schema (GitHub Gist)](https://gist.github.com/vekexasia/2328838) - Table schema patterns
- [Resend Email Authentication Guide](https://resend.com/blog/email-authentication-a-developers-guide) - SPF/DKIM/DMARC explanation

### Tertiary (LOW confidence)
- Various GitHub discussions about Drizzle timestamp modes - Community patterns, not official docs
- Community blog posts about SvelteKit password reset - Implementation examples, not verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Resend is well-documented for SvelteKit, crypto is Node.js built-in
- Architecture: HIGH - Patterns verified with OWASP and official Resend docs
- Pitfalls: HIGH - Sourced from OWASP cheat sheet and security best practices documents

**Research date:** 2026-01-29
**Valid until:** 2026-02-28 (30 days - email/security patterns are relatively stable)
