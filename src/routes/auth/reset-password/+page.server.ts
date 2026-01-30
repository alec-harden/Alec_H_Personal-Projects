import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import {
	validatePasswordResetToken,
	consumePasswordResetToken,
	hashPassword
} from '$lib/server/auth';

export const load: PageServerLoad = async ({ url, locals }) => {
	// Redirect if already logged in
	if (locals.user) {
		throw redirect(302, '/');
	}

	const token = url.searchParams.get('token');

	if (!token) {
		return { valid: false, error: 'Missing reset token' };
	}

	// Validate token (don't consume yet)
	const userId = await validatePasswordResetToken(token);

	if (!userId) {
		return { valid: false, error: 'Invalid or expired reset link' };
	}

	return { valid: true, token };
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const data = await request.formData();
		const token = url.searchParams.get('token') || data.get('token')?.toString();
		const password = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();

		if (!token) {
			return fail(400, { error: 'Missing reset token' });
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
			return fail(400, { error: 'Invalid or expired reset link. Please request a new one.' });
		}

		try {
			// Hash new password
			const passwordHash = await hashPassword(password);

			// Update user's password
			await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

			// Consume token and invalidate all sessions
			await consumePasswordResetToken(token, userId);

			// Return success - redirect handled by page
			return { success: true };
		} catch (error) {
			console.error('Password reset error:', error);
			return fail(500, { error: 'Failed to reset password. Please try again.' });
		}
	}
};
