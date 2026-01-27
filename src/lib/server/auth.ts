import { hash, verify } from '@node-rs/argon2';
import { db } from './db';
import { sessions } from './schema';
import { eq } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';

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
