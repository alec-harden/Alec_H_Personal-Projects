import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth, generateEmailVerificationToken } from '$lib/server/auth';
import { sendVerificationEmail } from '$lib/server/email';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

// Simple in-memory rate limiter (3 resends per 15-minute window)
const resendAttempts = new Map<string, { count: number; resetAt: Date }>();

function canResendVerification(userId: string): boolean {
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

export const load: PageServerLoad = async (event) => {
	const user = requireAuth(event);

	// Get fresh user data to check emailVerified status
	const freshUser = await db.query.users.findFirst({
		where: eq(users.id, user.id),
		columns: { email: true, emailVerified: true }
	});

	return {
		email: freshUser?.email ?? user.email,
		emailVerified: freshUser?.emailVerified ?? false
	};
};

export const actions: Actions = {
	default: async (event) => {
		const user = requireAuth(event);

		// Get fresh user data
		const freshUser = await db.query.users.findFirst({
			where: eq(users.id, user.id),
			columns: { email: true, emailVerified: true }
		});

		if (!freshUser) {
			return fail(404, { error: 'User not found' });
		}

		// Already verified
		if (freshUser.emailVerified) {
			return { success: true, message: 'Your email is already verified!' };
		}

		// Check rate limiting
		if (!canResendVerification(user.id)) {
			return fail(429, {
				error: 'Too many requests. Please wait 15 minutes before requesting another verification email.'
			});
		}

		try {
			const token = await generateEmailVerificationToken(user.id);
			await sendVerificationEmail(freshUser.email, token);

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
