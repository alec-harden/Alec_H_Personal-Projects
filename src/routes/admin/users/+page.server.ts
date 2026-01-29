import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { requireAdmin, hashPassword } from '$lib/server/auth';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	// Require admin role - throws 403 if not admin
	requireAdmin(event);

	const allUsers = await db.query.users.findMany({
		orderBy: [desc(users.createdAt)],
		columns: {
			id: true,
			email: true,
			role: true,
			disabled: true,
			createdAt: true
			// Explicitly exclude passwordHash for security
		}
	});

	return { users: allUsers };
};

export const actions: Actions = {
	create: async (event) => {
		// Admin check in action too (load check doesn't protect actions)
		requireAdmin(event);

		const data = await event.request.formData();
		const email = data.get('email')?.toString().trim().toLowerCase();
		const password = data.get('password')?.toString();
		const role = data.get('role')?.toString() || 'user';

		// Validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!email) {
			return fail(400, { error: 'Email is required', email: '' });
		}

		if (!emailRegex.test(email)) {
			return fail(400, { error: 'Please enter a valid email address', email });
		}

		if (!password) {
			return fail(400, { error: 'Password is required', email });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters', email });
		}

		if (role !== 'user' && role !== 'admin') {
			return fail(400, { error: 'Invalid role specified', email });
		}

		// Check if email already exists
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (existingUser) {
			return fail(400, { error: 'A user with this email already exists', email });
		}

		// Hash password and create user
		const passwordHash = await hashPassword(password);
		const id = crypto.randomUUID();
		const now = new Date();

		await db.insert(users).values({
			id,
			email,
			passwordHash,
			role: role as 'user' | 'admin',
			disabled: false,
			createdAt: now
		});

		// PRG pattern - redirect to new user's detail page
		throw redirect(302, `/admin/users/${id}`);
	}
};
