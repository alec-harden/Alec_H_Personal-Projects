import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, createSession } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Redirect if already logged in
	if (locals.user) {
		const redirectTo = url.searchParams.get('redirect') || '/';
		throw redirect(302, redirectTo);
	}

	return {
		redirect: url.searchParams.get('redirect')
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim().toLowerCase();
		const password = data.get('password')?.toString();

		// Validation
		if (!email || !password) {
			return fail(400, {
				error: 'Email and password are required',
				email
			});
		}

		// Find user
		const user = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (!user) {
			// Use generic message to prevent email enumeration
			return fail(400, {
				error: 'Invalid email or password',
				email
			});
		}

		// Verify password
		const valid = await verifyPassword(user.passwordHash, password);

		if (!valid) {
			return fail(400, {
				error: 'Invalid email or password',
				email
			});
		}

		// Create session and set cookie
		await createSession(user.id, cookies);

		// Redirect to original destination or dashboard
		const redirectTo = url.searchParams.get('redirect') || '/';
		throw redirect(302, redirectTo);
	}
};
