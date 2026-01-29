import { hash, verify } from '@node-rs/argon2';
import { db } from './db';
import { sessions } from './schema';
import { eq } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

/**
 * DATA ISOLATION PATTERN (RBAC-05)
 *
 * All user data (projects, BOMs, items) uses userId ownership:
 * - Queries filter by userId: eq(table.userId, locals.user.id)
 * - Relations verify ownership: record.project.userId !== locals.user.id
 *
 * This is enforced at the route level, not middleware level,
 * because each route knows its specific ownership chain.
 *
 * Ownership chains:
 * - projects.userId -> direct ownership
 * - boms.projectId -> project.userId -> indirect via project
 * - bomItems.bomId -> bom.projectId -> project.userId -> indirect via BOM
 *
 * Verified routes (as of Phase 13-02):
 * - src/routes/+page.server.ts (project list)
 * - src/routes/projects/+page.server.ts (project list with create)
 * - src/routes/projects/[id]/+page.server.ts (project CRUD)
 * - src/routes/api/bom/[id]/+server.ts (BOM delete)
 * - src/routes/api/bom/[id]/items/[itemId]/+server.ts (item PATCH)
 * - src/routes/api/bom/save/+server.ts (BOM save)
 * - src/routes/projects/[id]/bom/[bomId]/+page.server.ts (BOM view)
 *
 * Future: cutLists will follow same pattern via projectId.
 */

// Argon2id settings (OWASP recommended for password hashing)
const ARGON2_OPTIONS = {
	memoryCost: 19456, // 19 MiB
	timeCost: 2,
	outputLen: 32,
	parallelism: 1
};

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

export async function createSession(userId: string, cookies: Cookies): Promise<string> {
	// Generate cryptographically random session token
	const token = crypto.randomUUID();
	const id = crypto.randomUUID();

	// Session expires in 30 days
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 30);

	await db.insert(sessions).values({
		id,
		userId,
		token,
		expiresAt,
		createdAt: new Date()
	});

	// Set httpOnly cookie
	cookies.set('session_token', token, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 30 // 30 days in seconds
	});

	return id;
}

export async function deleteSession(sessionId: string, cookies: Cookies): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
	cookies.delete('session_token', { path: '/' });
}

/**
 * Requires authenticated user. Redirects to login if not authenticated.
 * Use in load() functions and actions that need auth.
 */
export function requireAuth(event: RequestEvent) {
	if (!event.locals.user) {
		const redirectUrl = event.url.pathname;
		throw redirect(302, `/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
	}
	return event.locals.user;
}

/**
 * Requires admin role. Throws 403 if user is not admin.
 * Always call after requireAuth() or use standalone (it calls requireAuth internally).
 */
export function requireAdmin(event: RequestEvent) {
	const user = requireAuth(event);
	if (user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}
	return user;
}
