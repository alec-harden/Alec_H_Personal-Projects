---
type: quick
plan: 001
description: Add admin route link in user dropdown for admin users
files_modified:
  - src/lib/components/UserMenu.svelte
  - src/lib/components/Header.svelte
autonomous: true
---

<objective>
Add an "Admin" link to the user dropdown menu that only appears for users with admin role.

Purpose: Allow admin users quick access to admin features (template management) from any page.
Output: UserMenu component conditionally displays Admin link based on user role.
</objective>

<context>
@src/lib/components/UserMenu.svelte (currently only shows email + logout)
@src/lib/components/Header.svelte (passes user to UserMenu - needs to pass role)
@src/app.d.ts (Locals.user includes role: 'user' | 'admin')
@src/routes/+layout.server.ts (returns locals.user to client)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Pass role through Header to UserMenu</name>
  <files>src/lib/components/Header.svelte, src/lib/components/UserMenu.svelte</files>
  <action>
1. In Header.svelte:
   - Update the User interface to include `role: 'user' | 'admin'`
   - Pass role to UserMenu: `<UserMenu email={user.email} role={user.role} />`

2. In UserMenu.svelte:
   - Add `role: 'user' | 'admin'` to the Props interface
   - Accept role prop: `let { email, role }: Props = $props();`
  </action>
  <verify>TypeScript check passes: `npm run check`</verify>
  <done>Header passes role to UserMenu, UserMenu accepts role prop</done>
</task>

<task type="auto">
  <name>Task 2: Conditionally render Admin link in dropdown</name>
  <files>src/lib/components/UserMenu.svelte</files>
  <action>
Add Admin link to UserMenu dropdown that only renders when `role === 'admin'`.

Position: Between the email display div and the logout form.

Add this block after the email div (line ~39) and before the logout form:

```svelte
{#if role === 'admin'}
  <a
    href="/admin/templates"
    class="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
    onclick={() => (open = false)}
  >
    Admin
  </a>
{/if}
```

Use same styling as logout button (px-4 py-2 text-sm text-stone-700 hover:bg-stone-100).
Add onclick to close dropdown when clicked.
  </action>
  <verify>
1. Run `npm run check` - no TypeScript errors
2. Run `npm run dev` and log in as admin user
3. Click user dropdown - should see "Admin" link
4. Click Admin link - should navigate to /admin/templates
5. Log in as regular user - should NOT see "Admin" link
  </verify>
  <done>Admin link appears in dropdown only for admin users, navigates to /admin/templates</done>
</task>

</tasks>

<verification>
- `npm run check` passes
- Admin user sees "Admin" link in dropdown
- Regular user does NOT see "Admin" link
- Clicking "Admin" navigates to /admin/templates
</verification>

<success_criteria>
- Admin link conditionally rendered based on role
- No TypeScript errors
- Link styled consistently with existing dropdown items
</success_criteria>
