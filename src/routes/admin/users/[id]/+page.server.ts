import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin, hashPassword } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	// Require admin role - throws 403 if not admin
	requireAdmin(event);

	const user = await db.query.users.findFirst({
		where: eq(users.id, event.params.id),
		columns: {
			id: true,
			email: true,
			role: true,
			disabled: true,
			emailVerified: true,
			createdAt: true
			// Explicitly exclude passwordHash
		}
	});

	if (!user) {
		throw error(404, 'User not found');
	}

	return { user };
};

export const actions: Actions = {
	resetPassword: async (event) => {
		// Admin check in action too (load check doesn't protect actions)
		requireAdmin(event);

		const data = await event.request.formData();
		const newPassword = data.get('newPassword')?.toString();

		// Validation
		if (!newPassword) {
			return fail(400, { error: 'New password is required' });
		}

		if (newPassword.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters' });
		}

		// Hash the new password
		const passwordHash = await hashPassword(newPassword);

		// Update user password
		await db
			.update(users)
			.set({ passwordHash })
			.where(eq(users.id, event.params.id));

		return { success: true, message: 'Password reset successfully' };
	},

	toggleDisabled: async (event) => {
		// Admin check in action too (load check doesn't protect actions)
		const adminUser = requireAdmin(event);

		// SECURITY: Prevent admins from disabling their own account
		if (event.params.id === adminUser.id) {
			return fail(400, { error: 'Cannot disable your own account' });
		}

		// Get current user to check disabled status
		const currentUser = await db.query.users.findFirst({
			where: eq(users.id, event.params.id),
			columns: {
				id: true,
				disabled: true
			}
		});

		if (!currentUser) {
			return fail(404, { error: 'User not found' });
		}

		// Toggle disabled status
		const newDisabledStatus = !currentUser.disabled;
		await db
			.update(users)
			.set({ disabled: newDisabledStatus })
			.where(eq(users.id, event.params.id));

		return {
			success: true,
			message: currentUser.disabled ? 'User enabled' : 'User disabled'
		};
	}
};
