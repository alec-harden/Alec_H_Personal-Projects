# Testing Patterns

**Analysis Date:** 2026-02-03

## Current Testing Status

**Testing Framework:** Not implemented

**No test files found** in `src/` directory. The codebase currently has:
- Zero unit tests
- Zero integration tests
- Zero E2E tests
- No test configuration files (jest.config.js, vitest.config.js, playwright.config.ts)
- No test dependencies in package.json

**Code quality relies on:**
- TypeScript strict mode (`strict: true` in tsconfig.json)
- svelte-check for Svelte 5 component type checking
- Manual testing during development

## Recommended Testing Framework Setup

**For new tests, use Vitest** (recommended for SvelteKit projects):

**Installation:**
```bash
npm install --save-dev vitest @vitest/ui happy-dom
```

**Configuration file location:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    globals: true,
    environment: 'happy-dom'
  }
});
```

**Package.json scripts to add:**
```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

## Testing Patterns Observed in Codebase

While no tests exist, the codebase exhibits testable patterns:

### Pattern 1: Utility Functions with Pure Logic

**Example:** `src/lib/utils/csv.ts`

Functions are isolated and pure, making them ideal for unit testing:

```typescript
// Purely functional - no side effects
export function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
```

**Testing approach:**
```typescript
import { describe, it, expect } from 'vitest';
import { escapeCSVField, generateBOMCSV, generateBOMFilename } from '$lib/utils/csv';
import type { BOM } from '$lib/types/bom';

describe('escapeCSVField', () => {
  it('should not escape fields without special characters', () => {
    expect(escapeCSVField('simple')).toBe('simple');
  });

  it('should escape fields containing commas', () => {
    expect(escapeCSVField('field,with,comma')).toBe('"field,with,comma"');
  });

  it('should escape double quotes by doubling them', () => {
    expect(escapeCSVField('field"with"quote')).toBe('"field""with""quote"');
  });

  it('should handle fields with newlines', () => {
    expect(escapeCSVField('field\nwith\nnewline')).toBe('"field\nwith\nnewline"');
  });
});

describe('generateBOMCSV', () => {
  const mockBOM: BOM = {
    projectName: 'Test Project',
    projectType: 'table',
    generatedAt: '2026-02-03T00:00:00Z',
    items: [
      {
        id: '1',
        name: 'Pine Board',
        quantity: 4,
        unit: 'pcs',
        category: 'lumber',
        hidden: false
      }
    ]
  };

  it('should generate valid CSV with headers', () => {
    const csv = generateBOMCSV(mockBOM);
    expect(csv).toContain('Category,Name,Quantity,Unit');
  });

  it('should filter out hidden items', () => {
    const bomWithHidden: BOM = {
      ...mockBOM,
      items: [
        ...mockBOM.items,
        { ...mockBOM.items[0], id: '2', hidden: true }
      ]
    };
    const csv = generateBOMCSV(bomWithHidden);
    const lines = csv.split('\n');
    expect(lines.length).toBe(2); // header + 1 visible item
  });

  it('should sort items by category order', () => {
    const bomMixed: BOM = {
      ...mockBOM,
      items: [
        { ...mockBOM.items[0], category: 'finishes' },
        { ...mockBOM.items[0], id: '2', category: 'lumber' },
        { ...mockBOM.items[0], id: '3', category: 'hardware' }
      ]
    };
    const csv = generateBOMCSV(bomMixed);
    const lines = csv.split('\n');
    // Lumber should appear before finishes
    expect(lines[1]).toContain('Lumber');
    expect(lines[lines.length - 1]).toContain('Finishes');
  });
});
```

### Pattern 2: Database Operations with Transactions

**Example:** `src/routes/api/bom/save/+server.ts`

Database operations use transactions for atomicity:

```typescript
const bomId = await db.transaction(async (tx) => {
  const newBomId = crypto.randomUUID();
  const now = new Date();

  await tx.insert(boms).values({
    id: newBomId,
    projectId,
    name: bom.projectName
  });

  if (bom.items.length > 0) {
    await tx.insert(bomItems).values(bom.items.map((item, index) => ({
      id: crypto.randomUUID(),
      bomId: newBomId,
      name: item.name
    })));
  }

  return newBomId;
});
```

**Testing approach:**

For database operations, use integration tests with a test database:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '$lib/server/db';
import { boms, bomItems, projects, users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

describe('BOM Save API', () => {
  let testUser: typeof users.$inferSelect;
  let testProject: typeof projects.$inferSelect;

  beforeEach(async () => {
    // Create test user
    testUser = await db.insert(users).values({
      id: 'test-user',
      email: 'test@example.com',
      passwordHash: 'hash',
      role: 'user',
      createdAt: new Date()
    }).returning().then(rows => rows[0]);

    // Create test project
    testProject = await db.insert(projects).values({
      id: 'test-project',
      userId: testUser.id,
      name: 'Test Project',
      createdAt: new Date()
    }).returning().then(rows => rows[0]);
  });

  afterEach(async () => {
    // Cleanup - cascade deletes handle related records
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  it('should save BOM with items atomically', async () => {
    const bomId = 'new-bom-id';
    const itemId = 'new-item-id';

    await db.transaction(async (tx) => {
      await tx.insert(boms).values({
        id: bomId,
        projectId: testProject.id,
        name: 'Test BOM',
        projectType: 'table',
        generatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await tx.insert(bomItems).values({
        id: itemId,
        bomId,
        name: 'Test Item',
        quantity: 1,
        unit: 'pcs',
        category: 'lumber',
        position: 0
      });
    });

    // Verify both were inserted
    const savedBOM = await db.query.boms.findFirst({
      where: eq(boms.id, bomId)
    });
    const savedItem = await db.query.bomItems.findFirst({
      where: eq(bomItems.id, itemId)
    });

    expect(savedBOM).toBeDefined();
    expect(savedItem).toBeDefined();
    expect(savedItem.bomId).toBe(bomId);
  });

  it('should verify user owns project before saving', async () => {
    // Create another user's project
    const otherUser = await db.insert(users).values({
      id: 'other-user',
      email: 'other@example.com',
      passwordHash: 'hash',
      role: 'user',
      createdAt: new Date()
    }).returning().then(rows => rows[0]);

    const otherProject = await db.insert(projects).values({
      id: 'other-project',
      userId: otherUser.id,
      name: 'Other Project',
      createdAt: new Date()
    }).returning().then(rows => rows[0]);

    // Attempt to save BOM to project not owned by testUser
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, otherProject.id),
      columns: { id: true, userId: true }
    });

    expect(project.userId).not.toBe(testUser.id);

    // Cleanup
    await db.delete(users).where(eq(users.id, otherUser.id));
  });
});
```

### Pattern 3: Server-Side Auth Functions

**Example:** `src/lib/server/auth.ts`

Auth functions use cryptographic operations and database:

```typescript
export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  try {
    return await verify(storedHash, password);
  } catch {
    return false;
  }
}
```

**Testing approach:**

```typescript
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '$lib/server/auth';

describe('Password Hashing', () => {
  it('should hash a password', async () => {
    const password = 'SecurePassword123!';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash.length).toBeGreaterThan(0);
    expect(hash).not.toBe(password); // Should not return plaintext
  });

  it('should verify correct password', async () => {
    const password = 'SecurePassword123!';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(hash, password);

    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'SecurePassword123!';
    const wrongPassword = 'WrongPassword456!';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(hash, wrongPassword);

    expect(isValid).toBe(false);
  });

  it('should reject invalid hash gracefully', async () => {
    const isValid = await verifyPassword('invalid-hash-format', 'any-password');
    expect(isValid).toBe(false); // Should not throw
  });
});
```

### Pattern 4: Component State & Reactivity

**Example:** `src/lib/components/bom/AddItemForm.svelte`

Components use Svelte 5 runes for state management:

```typescript
let { category, onAdd, onCancel }: Props = $props();

let name = $state('');
let quantity = $state(1);
let unit = $state('pcs');
let notes = $state('');

$effect(() => {
  unit = unitOptions[category][0]; // Update unit when category changes
});
```

**Testing approach:**

For component testing, use @testing-library/svelte:

```bash
npm install --save-dev @testing-library/svelte vitest-dom
```

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import AddItemForm from '$lib/components/bom/AddItemForm.svelte';

describe('AddItemForm', () => {
  it('should render form fields', () => {
    render(AddItemForm, {
      props: {
        category: 'lumber',
        onAdd: () => {},
        onCancel: () => {}
      }
    });

    expect(screen.getByLabelText('Name')).toBeDefined();
    expect(screen.getByLabelText('Qty')).toBeDefined();
    expect(screen.getByLabelText('Unit')).toBeDefined();
  });

  it('should call onAdd callback with correct item', async () => {
    const user = userEvent.setup();
    let addedItem;

    render(AddItemForm, {
      props: {
        category: 'lumber',
        onAdd: (item) => {
          addedItem = item;
        },
        onCancel: () => {}
      }
    });

    await user.type(screen.getByLabelText('Name'), 'Pine Board');
    await user.type(screen.getByLabelText('Qty'), '4');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(addedItem.name).toBe('Pine Board');
    expect(addedItem.quantity).toBe(4);
    expect(addedItem.category).toBe('lumber');
  });

  it('should update unit options when category changes', async () => {
    const { component } = render(AddItemForm, {
      props: {
        category: 'lumber',
        onAdd: () => {},
        onCancel: () => {}
      }
    });

    const unitSelect = screen.getByLabelText('Unit');
    expect(unitSelect.value).toBe('bf'); // lumber default

    await component.$set({ category: 'hardware' });
    expect(unitSelect.value).toBe('pcs'); // hardware default
  });
});
```

### Pattern 5: Server Routes and Actions

**Example:** `src/routes/auth/login/+page.server.ts`

Routes use SvelteKit form actions and load functions:

```typescript
export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user) {
    throw redirect(302, url.searchParams.get('redirect') || '/');
  }
  return { redirect: url.searchParams.get('redirect') };
};

export const actions: Actions = {
  default: async ({ request, cookies, url }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().trim().toLowerCase();
    const password = data.get('password')?.toString();

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required', email });
    }

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });

    if (!user) {
      return fail(400, { error: 'Invalid email or password', email });
    }

    const valid = await verifyPassword(user.passwordHash, password);

    if (!valid) {
      return fail(400, { error: 'Invalid email or password', email });
    }

    await createSession(user.id, cookies);
    throw redirect(302, url.searchParams.get('redirect') || '/');
  }
};
```

**Testing approach:**

For server routes, test using fetch or a test client:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { hashPassword } from '$lib/server/auth';
import { eq } from 'drizzle-orm';

describe('Login Action', () => {
  let testUser: typeof users.$inferSelect;
  const testPassword = 'TestPassword123!';

  beforeEach(async () => {
    const hash = await hashPassword(testPassword);
    testUser = await db.insert(users).values({
      id: 'test-user',
      email: 'test@example.com',
      passwordHash: hash,
      role: 'user',
      createdAt: new Date()
    }).returning().then(rows => rows[0]);
  });

  afterEach(async () => {
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  it('should fail with missing email/password', async () => {
    const response = await fetch('/auth/login', {
      method: 'POST',
      body: new FormData() // Empty
    });

    expect(response.status).toBe(400);
  });

  it('should fail with invalid credentials', async () => {
    const form = new FormData();
    form.append('email', 'test@example.com');
    form.append('password', 'WrongPassword');

    const response = await fetch('/auth/login', {
      method: 'POST',
      body: form
    });

    expect(response.status).toBe(400);
  });

  it('should succeed and set session cookie', async () => {
    const form = new FormData();
    form.append('email', 'test@example.com');
    form.append('password', testPassword);

    const response = await fetch('/auth/login', {
      method: 'POST',
      body: form,
      redirect: 'manual'
    });

    expect(response.status).toBe(302); // Redirect
    expect(response.headers.get('set-cookie')).toContain('session_token');
  });
});
```

## What NOT to Test

**Don't test:**
- Third-party libraries (ai, drizzle-orm, oslo, argon2)
- SvelteKit framework behavior (load functions, actions)
- Database library internals
- cryptographic algorithm correctness (trust the libraries)

**Focus on:**
- Application business logic (BOM generation, CSV export, cut optimization)
- Data validation and error handling
- Security boundaries (ownership checks, auth)
- Component interactions and state changes

## Test Data and Fixtures

**Fixtures location:** Create `src/__tests__/fixtures/` directory for shared test data

**Example fixture file:** `src/__tests__/fixtures/bom.ts`

```typescript
import type { BOM, BOMItem } from '$lib/types/bom';

export const sampleBOMItem: BOMItem = {
  id: 'item-1',
  name: 'Pine Board',
  description: '1x4x8',
  quantity: 4,
  unit: 'pcs',
  category: 'lumber',
  notes: 'Pre-milled',
  hidden: false,
  length: 96,
  width: 3.5,
  height: 0.75
};

export const sampleBOM: BOM = {
  projectName: 'Simple Table',
  projectType: 'table',
  generatedAt: new Date().toISOString(),
  items: [
    sampleBOMItem,
    {
      ...sampleBOMItem,
      id: 'item-2',
      name: 'Wood Screws',
      quantity: 32,
      unit: 'pcs',
      category: 'hardware',
      length: undefined,
      width: undefined,
      height: undefined
    }
  ]
};

export const emptyBOM: BOM = {
  projectName: 'Empty Project',
  projectType: 'template-id',
  generatedAt: new Date().toISOString(),
  items: []
};
```

## Coverage Goals

**Recommended targets** (if/when testing is implemented):

- **Utility functions** (`src/lib/utils/`): 100% coverage
- **Server logic** (`src/lib/server/`): 80%+ coverage
- **Database operations** (transaction patterns): 80%+ coverage
- **Components** (`src/lib/components/`): 50%+ (focus on user interactions)
- **Routes** (`src/routes/`): Test critical paths (login, save, delete)

**Do not prioritize:**
- Styling and layout code in components (harder to test, lower value)
- Third-party SDK wrappers (test via integration tests instead)

---

*Testing analysis: 2026-02-03*
