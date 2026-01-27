import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// Require authentication
	if (!locals.user) {
		throw redirect(302, '/auth/login?redirect=/projects');
	}

	const userProjects = await db.query.projects.findMany({
		where: eq(projects.userId, locals.user.id),
		orderBy: [desc(projects.updatedAt)]
	});

	return { projects: userProjects };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		// Auth check in action (important!)
		if (!locals.user) {
			throw redirect(302, '/auth/login');
		}

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const description = data.get('description')?.toString().trim() || null;

		// Validation
		if (!name || name.length < 1) {
			return fail(400, {
				error: 'Project name is required',
				name: '',
				description: description || ''
			});
		}

		if (name.length > 100) {
			return fail(400, {
				error: 'Project name must be 100 characters or less',
				name,
				description: description || ''
			});
		}

		const id = crypto.randomUUID();
		const now = new Date();

		await db.insert(projects).values({
			id,
			userId: locals.user.id,
			name,
			description,
			notes: null,
			createdAt: now,
			updatedAt: now
		});

		// PRG pattern - redirect after create
		throw redirect(302, `/projects/${id}`);
	}
};
