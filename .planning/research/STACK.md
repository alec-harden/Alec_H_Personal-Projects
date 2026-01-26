# Stack Research: v2.0 Additions

**Project:** WoodShop Toolbox
**Research Date:** 2026-01-26
**Focus:** Authentication, persistence, and admin features for existing SvelteKit app
**Confidence:** MEDIUM (based on training data, external verification blocked)

## Recommended Stack

### Authentication: Custom Implementation with Oslo

**Recommendation:** Build custom auth using `oslo` utilities (from Lucia auth creator)

| Package | Version | Purpose |
|---------|---------|---------|
| oslo | ^1.2.x | Auth utilities (password hashing, token generation) |
| - | - | No full auth framework needed |

**Rationale:**
- **Lucia auth is sunset** (as of late 2024) - creator deprecated it in favor of building custom auth with simpler utilities
- **Auth.js/NextAuth** is OAuth-focused and overly complex for email/password only
- **Custom auth is appropriate** for single-user app with simple requirements
- **Oslo provides** password hashing wrappers, secure token generation, and session utilities without framework lock-in
- **Perfect fit for Drizzle** - you define your own schema, no adapter needed

**What you'll build:**
- User table in Drizzle schema
- Session table in Drizzle schema
- Login/signup form actions in SvelteKit
- Session cookie management via `hooks.server.ts`

**Integration with existing stack:**
```typescript
// src/lib/server/schema.ts additions
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});
```

### Password Hashing: Argon2

**Recommendation:** `@node-rs/argon2` (native Rust bindings)

| Package | Version | Purpose |
|---------|---------|---------|
| @node-rs/argon2 | ^1.8.x | Password hashing |

**Rationale:**
- **Argon2 is current best practice** (winner of Password Hashing Competition, 2015)
- **Stronger than bcrypt** - memory-hard algorithm resistant to GPU attacks
- **@node-rs/argon2** uses native Rust bindings (faster than pure JS implementations)
- **No dependencies** - single package, works with serverless
- **Oslo-compatible** - works seamlessly with oslo utilities

**Why not bcrypt:**
- Bcrypt is still secure but older (1999)
- Not memory-hard - more vulnerable to specialized hardware attacks
- Argon2 is recommended by OWASP and security community as of 2020+

**Usage:**
```typescript
import { hash, verify } from '@node-rs/argon2';

// Hashing
const passwordHash = await hash(password, {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1
});

// Verification
const valid = await verify(passwordHash, password);
```

### Session Storage: Database Sessions (Turso)

**Recommendation:** Store sessions in Turso database (no separate session store needed)

**Rationale:**
- **Single-user app** - session volume is low, no need for Redis/separate cache
- **Turso is already there** - no additional infrastructure
- **LibSQL is fast** - sub-millisecond reads for session lookups
- **Simple architecture** - one database for everything
- **Serverless-compatible** - no stateful session store to manage

**Session strategy:**
- Store session ID in HTTP-only cookie
- Look up session in database on each request (via `hooks.server.ts`)
- Attach user info to `event.locals` for route access
- Session expiration handled by `expiresAt` column

**When to reconsider:**
- If app becomes multi-user with high traffic
- If session lookups become bottleneck (unlikely for woodworking tool)
- Migration path: Add Redis/Upstash for session cache layer

### File Upload: Native SvelteKit FormData

**Recommendation:** Use SvelteKit's built-in FormData handling (no library needed)

**Approach:**
- `<form enctype="multipart/form-data">` for file uploads
- FormData parsing in `+page.server.ts` actions
- File validation (size, type) before processing
- Stream directly to CSV parser (no disk write needed)

**Rationale:**
- **SvelteKit handles it natively** - FormData arrives as `File` objects in actions
- **No file storage needed** - CSV is parsed and data extracted immediately
- **Serverless-friendly** - no temp file writes to ephemeral disk
- **Simple and secure** - built-in multipart parsing

**Example:**
```typescript
// src/routes/bom/upload/+page.server.ts
import type { Actions } from './$types';

export const actions = {
  upload: async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('csv') as File;

    if (!file || file.type !== 'text/csv') {
      return { error: 'Invalid file type' };
    }

    const text = await file.text();
    // Pass to CSV parser...
  }
} satisfies Actions;
```

### CSV Parsing: PapaParse

**Recommendation:** `papaparse` (industry standard)

| Package | Version | Purpose |
|---------|---------|---------|
| papaparse | ^5.4.x | CSV parsing |
| @types/papaparse | ^5.3.x | TypeScript types |

**Rationale:**
- **Industry standard** - most popular CSV parser in JavaScript ecosystem
- **Works with strings** - no need to write file to disk, parse from `await file.text()`
- **Error handling** - robust parsing with error reporting
- **Header detection** - automatically parses first row as headers
- **Type inference** - can convert strings to numbers
- **Small bundle** - ~45KB minified

**Why not alternatives:**
- **csv-parse** (from csv project) - more complex API, streaming-focused (overkill for single file uploads)
- **fast-csv** - streaming-focused, unnecessary for small files
- **Built-in CSV parsing** - no native browser/Node API (as of 2025)

**Usage:**
```typescript
import Papa from 'papaparse';

const results = Papa.parse(csvText, {
  header: true,           // First row as headers
  dynamicTyping: true,    // Convert numbers
  skipEmptyLines: true,
  transformHeader: (h) => h.trim()
});

// results.data is array of objects
// results.errors for parsing issues
```

## Installation

```bash
# Authentication utilities
npm install oslo

# Password hashing
npm install @node-rs/argon2

# CSV parsing
npm install papaparse
npm install -D @types/papaparse
```

## Integration Notes

### With Existing Drizzle/Turso Setup

**Schema additions:**
- Add `users` and `sessions` tables to existing `schema.ts`
- Foreign key from `projects` to `users.id` (for future multi-user)
- Use existing Drizzle client from `src/lib/server/db.ts`

**Migration path:**
```typescript
// src/lib/server/schema.ts
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

// Update existing projects table
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id), // Add this
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});
```

**SvelteKit hooks:**
```typescript
// src/hooks.server.ts
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get('session');

  if (sessionId) {
    const session = await db
      .select()
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, sessionId))
      .get();

    if (session && session.sessions.expiresAt > new Date()) {
      event.locals.user = session.users;
    }
  }

  return resolve(event);
};
```

### With Existing Serverless Deployment

**No infrastructure changes needed:**
- All dependencies work in Vercel/Cloudflare Workers
- `@node-rs/argon2` has pre-built binaries for serverless
- PapaParse is pure JavaScript
- Database sessions use existing Turso connection

**Environment variables (add to `.env`):**
```bash
# No new env vars needed!
# Uses existing TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
```

### With Existing AI SDK Setup

**No conflicts:**
- Auth is orthogonal to AI functionality
- Session user ID can be passed to AI system prompts if needed
- CSV parsing happens before AI interaction

## Not Recommended

### Auth.js / SvelteKit Auth
**Why avoid:**
- Designed for OAuth (Google, GitHub, etc.) - overkill for email/password
- Complex adapter system not needed with Drizzle
- Heavy dependency (multiple packages)
- Over-engineered for single-user app

**When to reconsider:**
- If you add OAuth providers later
- If you need pre-built UI components

### Lucia Auth
**Why avoid:**
- **Project is sunset** (deprecated by creator in late 2024)
- Creator recommends building custom auth with oslo utilities instead
- No longer maintained

**What happened:**
- Creator realized full auth frameworks are too opinionated
- Extracted useful utilities into `oslo` package
- Encourages developers to build custom auth for their needs

### Passport.js
**Why avoid:**
- Express/Connect middleware pattern doesn't fit SvelteKit
- Requires adapter/wrapper code
- Session management is stateful (needs express-session)

### bcrypt / bcryptjs
**Why avoid:**
- Older algorithm (1999) superseded by Argon2
- Not memory-hard (vulnerable to GPU attacks)
- bcryptjs (pure JS) is much slower than native implementations

**When acceptable:**
- If deploying to environment without native module support (very rare)
- If you already have bcrypt hashes (can migrate gradually)

### Separate Session Store (Redis, Upstash, etc.)
**Why avoid now:**
- Unnecessary complexity for single-user app
- Additional infrastructure cost
- Database sessions are fast enough for low volume

**When to add:**
- Multi-user version with high traffic
- Session lookups become bottleneck (profile first)
- Geographic distribution needs edge caching

### CSV Libraries to Avoid
**csv-parse:** Streaming-focused API, more complex than needed for form uploads
**fast-csv:** Also streaming-focused, unnecessary for single files
**d3-dsv:** Designed for D3.js data viz, not general CSV parsing
**xlsx:** For Excel files, not CSV (wrong tool)

## Stack Summary

**Add to project:**
```json
{
  "dependencies": {
    "oslo": "^1.2.0",
    "@node-rs/argon2": "^1.8.0",
    "papaparse": "^5.4.0"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.0"
  }
}
```

**Total additions:** 3 runtime dependencies, 1 dev dependency
**Bundle impact:** ~50KB (papaparse) + ~5KB (oslo) + native binary (argon2, not in bundle)
**Infrastructure changes:** None (uses existing Turso database)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Auth approach | MEDIUM | Lucia sunset is known, custom auth is best practice, but couldn't verify oslo current version |
| Password hashing | HIGH | Argon2 recommendation is well-established (OWASP, security community) |
| Session storage | HIGH | Database sessions are standard for low-traffic apps |
| File upload | HIGH | SvelteKit FormData handling is documented and stable |
| CSV parsing | MEDIUM | PapaParse is industry standard, but couldn't verify latest version |

**Verification needed:**
- Current versions of oslo, @node-rs/argon2, papaparse (check npm)
- Lucia auth sunset status (verify on lucia-auth.com)
- SvelteKit 2.x FormData API (verify in SvelteKit docs)

## Sources

**Note:** External verification was blocked during research. Recommendations are based on:
- Training data through January 2025
- Established security community best practices (OWASP, Password Hashing Competition)
- SvelteKit documentation patterns
- Existing project stack (Drizzle ORM, Turso, SvelteKit 2.x)

**Critical to verify before implementation:**
- [ ] Check npm for latest versions of recommended packages
- [ ] Verify Lucia auth sunset status
- [ ] Review @node-rs/argon2 serverless compatibility with Vercel
- [ ] Check SvelteKit 2.x FormData API documentation
