import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { eq, sql } from 'drizzle-orm';
import { hashPassword, createSession, generateEmailVerificationToken } from '$lib/server/auth';
import { sendVerificationEmail } from '$lib/server/email';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if already logged in
	if (locals.user) {
		throw redirect(302, '/');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim().toLowerCase();
		const password = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();

		// Validation
		if (!email || !password || !confirmPassword) {
			return fail(400, {
				error: 'All fields are required',
				email
			});
		}

		if (!email.includes('@') || email.length < 5) {
			return fail(400, {
				error: 'Please enter a valid email address',
				email
			});
		}

		if (password.length < 8) {
			return fail(400, {
				error: 'Password must be at least 8 characters',
				email
			});
		}

		if (password !== confirmPassword) {
			return fail(400, {
				error: 'Passwords do not match',
				email
			});
		}

		// Check if email already exists
		const existing = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (existing) {
			return fail(400, {
				error: 'An account with this email already exists',
				email
			});
		}

		// Determine role - first user becomes admin (RBAC-06)
		const userCount = await db
			.select({ count: sql<number>`count(*)` })
			.from(users)
			.then((result) => result[0].count);

		const role = userCount === 0 ? 'admin' : 'user';

		// Create user with role
		const id = crypto.randomUUID();
		const passwordHash = await hashPassword(password);

		await db.insert(users).values({
			id,
			email,
			passwordHash,
			role,
			emailVerified: false,
			createdAt: new Date()
		});

		// Send verification email (non-blocking - errors logged but don't prevent signup)
		try {
			const verificationToken = await generateEmailVerificationToken(id);
			await sendVerificationEmail(email, verificationToken);
		} catch (error) {
			console.error('Failed to send verification email:', error);
			// Continue with signup - user can request resend later
		}

		// Create session and set cookie
		await createSession(id, cookies);

		// Redirect to dashboard
		throw redirect(302, '/');
	}
};
