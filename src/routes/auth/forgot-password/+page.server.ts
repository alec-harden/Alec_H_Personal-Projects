import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { generatePasswordResetToken } from '$lib/server/auth';
import { sendPasswordResetEmail } from '$lib/server/email';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if already logged in
	if (locals.user) {
		throw redirect(302, '/');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim().toLowerCase();

		// Always return same success message (prevents user enumeration)
		const successMessage =
			'If an account exists with that email, you will receive a password reset link shortly.';

		if (!email) {
			// Still return success to prevent enumeration
			return { success: true, message: successMessage };
		}

		// Basic email validation
		if (!email.includes('@') || email.length < 5) {
			return { success: true, message: successMessage };
		}

		try {
			// Look up user
			const user = await db.query.users.findFirst({
				where: eq(users.email, email)
			});

			// Only send email if user exists, but ALWAYS return success
			if (user && !user.disabled) {
				const token = await generatePasswordResetToken(user.id);
				await sendPasswordResetEmail(email, token);
			}

			// Same response regardless of whether user exists
			return { success: true, message: successMessage };
		} catch (error) {
			// Log error but don't expose to user
			console.error('Password reset error:', error);
			return { success: true, message: successMessage };
		}
	}
};
