# Coding Conventions

**Analysis Date:** 2026-02-03

## Naming Patterns

**Files:**
- Svelte components: PascalCase (e.g., `AddItemForm.svelte`, `Header.svelte`, `BOMDisplay.svelte`)
- Server utilities/modules: camelCase (e.g., `auth.ts`, `db.ts`, `cutOptimizer.ts`)
- Interfaces/Types: PascalCase in separate files (e.g., `BOMItem`, `ProjectDetails` in `src/lib/types/bom.ts`)
- Routes: kebab-case (e.g., `+page.server.ts`, `+server.ts` in `src/routes/`)

**Functions:**
- camelCase for all functions (e.g., `hashPassword()`, `createSession()`, `generateBOMCSV()`)
- Async functions declared with `async` keyword explicitly
- Verb-first naming for actions: `generatePasswordResetToken()`, `validatePasswordResetToken()`, `markEmailAsVerified()`

**Variables:**
- camelCase for all local and module-level variables
- State variables in Svelte 5 using `$state()` rune (e.g., `let name = $state('')`)
- Derived values using `$derived()` rune for computed properties (e.g., `const totalItems = $derived(bom.items.length)`)
- Reactive effects using `$effect()` rune for side effects (e.g., updating default unit when category changes)

**Types:**
- Interfaces: PascalCase (e.g., `interface Props`, `interface BOMItem`, `interface User`)
- Type unions: PascalCase discriminators (e.g., `type AIProvider = 'anthropic' | 'openai'`)
- Enums-like unions for categories: lowercase literal strings (e.g., `type BOMCategory = 'lumber' | 'hardware' | 'finishes' | 'consumables'`)

**Constants:**
- Module-level constants: UPPER_CASE (e.g., `ARGON2_OPTIONS`, `categoryOrder` when it's a static array)
- Configuration objects: camelCase (e.g., `unitOptions`, `templateDimensions`)

## Code Style

**Formatting:**
- No configured formatter (Prettier) - rely on TypeScript strict mode for quality
- Indentation: tabs preferred (seen in svelte.config.js, tsconfig.json)
- Line length: no strict limit observed
- Spacing: consistent single blank lines between logical sections

**Linting:**
- Tool: TypeScript strict mode (`strict: true` in tsconfig.json)
- Additional checks: `checkJs: true`, `forceConsistentCasingInFileNames: true`
- No ESLint or Biome configuration found
- svelte-check used for Svelte 5 type checking (run via `npm run check`)

**Svelte 5 Syntax:**
- Props: Use `$props()` rune (e.g., `let { onMenuClick, user = null }: Props = $props()`)
- State: Use `$state()` rune for reactive variables (e.g., `let name = $state('')`)
- Derived: Use `$derived()` for computed values (e.g., `const visibleItems = $derived(bom.items.filter(...))`)
- Effects: Use `$effect()` for side effects (e.g., updating state when props change)
- No destructuring in component props - use named parameter in `$props()`

## Import Organization

**Order:**
1. SvelteKit utilities (`@sveltejs/kit`, `@sveltejs/vite-plugin-svelte`)
2. Third-party libraries (ai, drizzle-orm, oslo, zod, papaparse, resend)
3. Type imports (`type` keyword used explicitly)
4. Local lib imports (from `$lib/`, using path alias)
5. Relative imports (avoided when possible, prefer `$lib/`)

**Path Aliases:**
- `$lib` - mapped to `src/lib/` (configured in SvelteKit)
- Components: import from `$lib/components/` (e.g., `import UserMenu from './UserMenu.svelte'`)
- Server utilities: import from `$lib/server/` (e.g., `import { db } from '$lib/server/db'`)
- Types: import from `$lib/types/` (e.g., `import type { BOM } from '$lib/types/bom'`)

**Type imports:**
- Always use explicit `type` keyword for imports that are types only:
  ```typescript
  import type { BOM, BOMCategory, BOMItem } from '$lib/types/bom';
  import type { RequestHandler } from './$types';
  import type { Actions, PageServerLoad } from './$types';
  ```

## Component Props Pattern

**TypeScript interfaces required:**
All Svelte components define a `Props` interface at the top of the `<script>` block:

```typescript
interface Props {
  categoryName: string;
  items: BOMItem[];
  onAdd?: (item: BOMItem) => void;
  onCancel?: () => void;
}

let { categoryName, items, onAdd, onCancel }: Props = $props();
```

**Callback naming:**
- Callbacks passed as props: `on[EventName]` (e.g., `onAdd`, `onCancel`, `onQuantityChange`)
- Event parameter passed by position, not destructured (e.g., `onSubmit(e: Event)`)

## Error Handling

**Patterns:**
- API routes: Return JSON error responses with appropriate status codes
  ```typescript
  if (!locals.user) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }
  ```
- Form actions: Use `fail()` from SvelteKit with status and error object
  ```typescript
  return fail(400, {
    error: 'Email and password are required',
    email
  });
  ```
- Async operations: Try-catch wrapping with error logging
  ```typescript
  try {
    // operation
  } catch (error) {
    console.error('Error description:', error);
    return json({ error: error instanceof Error ? error.message : 'Failed operation' }, { status: 500 });
  }
  ```

**Security patterns:**
- Generic error messages for auth failures (prevent email enumeration): "Invalid email or password"
- User validation before data operations: Check `project.userId !== locals.user.id`
- Transactions for atomic multi-step operations: `await db.transaction(async (tx) => { ... })`

## Logging

**Framework:** `console` (native browser/Node.js)

**Patterns:**
- Errors only: `console.error('Operation failed:', error)`
- No info/debug logging in production code paths
- Error logging occurs in catch blocks and error responses
- Context included in message: `console.error('Error saving BOM:', error)`

## Comments

**When to Comment:**
- Complex algorithms or business logic (e.g., cut optimization, CSV RFC 4180 compliance)
- Security patterns and rationale (OWASP recommendations, token handling)
- Data flow explanations (ownership chains in RBAC)
- JSDoc for public function signatures

**JSDoc/TSDoc:**
- File-level documentation at top of module:
  ```typescript
  /**
   * CSV Generation and Download Utilities
   *
   * RFC 4180 compliant CSV generation for BOM export functionality.
   * Provides escaping, generation, filename sanitization, and download.
   */
  ```
- Function documentation for exported utilities:
  ```typescript
  /**
   * Generate a password reset token for a user.
   * Deletes any existing tokens for this user first.
   * Returns the plaintext token (only shown once, in email).
   */
  export async function generatePasswordResetToken(userId: string): Promise<string> { ... }
  ```
- Inline comments for logic flow (step-by-step numbered comments):
  ```typescript
  // 1. Extract session token from cookie
  const sessionToken = event.cookies.get('session_token');

  // 2. Validate session if token exists
  if (sessionToken) {
    // ...
  }
  ```

## Function Design

**Size:** Functions typically 20-50 lines; longer functions (100+) broken into smaller pieces

**Parameters:**
- Explicit typed parameters (no `any`)
- Destructuring in signatures only for Props interfaces
- Optional parameters using `?:` syntax in interfaces
- Return type annotations required on exported functions

**Return Values:**
- Async functions: Explicit return type (e.g., `Promise<string>`, `Promise<void>`)
- JSON responses: Structured objects with consistent keys (`{ success: boolean, ... }` or `{ error: string }`)
- Multiple values: Tuple types or structured interface rather than array
- Error cases: Return error object or throw Error

**Database Operations:**
- Queries use Drizzle relational API: `db.query.users.findFirst({ where: eq(...) })`
- Mutations: `db.insert()`, `db.update()`, `db.delete()`
- Transactions: `db.transaction(async (tx) => { ... })` for multi-step operations
- Column selection: Explicit `columns: { id: true, userId: true }` for security-sensitive queries

## Module Design

**Exports:**
- Named exports preferred (e.g., `export function generateBOMCSV(bom: BOM): string`)
- Type exports use `export type` keyword
- No default exports
- Server-side utilities in `src/lib/server/` are never imported on client

**Barrel Files:**
- Not used; components imported directly with relative paths
- Server modules imported with full path from `$lib/server/`

**Svelte Component Structure:**
1. Script tag with TypeScript
2. JSDoc comment describing component purpose
3. Props interface definition
4. Props destructuring with `$props()`
5. Reactive state (`$state()`)
6. Derived values (`$derived()`)
7. Event handlers and utility functions
8. Template (HTML)
9. Styles

## Database Conventions

**Schema file location:** `src/lib/server/schema.ts`

**Table naming:** snake_case (e.g., `password_reset_tokens`, `email_verification_tokens`)

**Column naming:** snake_case (e.g., `created_at`, `user_id`, `token_hash`)

**Relationships:** Use Drizzle relations pattern:
```typescript
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  projects: many(projects)
}));
```

**Foreign keys:** Use Drizzle references with cascade deletes:
```typescript
userId: text('user_id')
  .notNull()
  .references(() => users.id, { onDelete: 'cascade' })
```

## Authentication & Security Patterns

**Password hashing:** Argon2id with OWASP settings (19456 memory, 2 time cost)

**Token storage:** SHA-256 hash stored in database, plaintext returned once for email delivery

**Sessions:** Random UUIDs, httpOnly cookies, 30-day expiry

**RBAC:** Binary roles (`'user' | 'admin'`), first registered user becomes admin

**Data isolation:** User ownership checked at route level:
```typescript
if (project.userId !== locals.user.id) {
  return json({ error: 'Project not owned by user' }, { status: 403 });
}
```

---

*Convention analysis: 2026-02-03*
