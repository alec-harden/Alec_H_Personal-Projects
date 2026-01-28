import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { projects, boms } from '$lib/server/schema';
import { eq, and, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(302, '/auth/login?redirect=/projects/' + params.id);
	}

	// IMPORTANT: Filter by BOTH id AND userId for security
	const project = await db.query.projects.findFirst({
		where: and(eq(projects.id, params.id), eq(projects.userId, locals.user.id))
	});

	if (!project) {
		throw error(404, 'Project not found');
	}

	// Fetch BOMs for this project
	const projectBoms = await db.query.boms.findMany({
		where: eq(boms.projectId, params.id),
		orderBy: desc(boms.updatedAt),
		columns: {
			id: true,
			name: true,
			projectType: true,
			generatedAt: true,
			updatedAt: true
		}
	});

	return { project, boms: projectBoms };
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		if (!locals.user) {
			throw redirect(302, '/auth/login');
		}

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const description = data.get('description')?.toString().trim() || null;
		const notes = data.get('notes')?.toString().trim() || null;

		if (!name || name.length < 1) {
			return fail(400, { error: 'Project name is required' });
		}

		if (name.length > 100) {
			return fail(400, { error: 'Project name must be 100 characters or less' });
		}

		// Update with userId check for security
		await db
			.update(projects)
			.set({
				name,
				description,
				notes,
				updatedAt: new Date()
			})
			.where(and(eq(projects.id, params.id), eq(projects.userId, locals.user.id)));

		return { success: true };
	},

	delete: async ({ locals, params }) => {
		if (!locals.user) {
			throw redirect(302, '/auth/login');
		}

		// Delete with userId check for security
		await db
			.delete(projects)
			.where(and(eq(projects.id, params.id), eq(projects.userId, locals.user.id)));

		// PRG pattern - redirect to list after delete
		throw redirect(302, '/projects');
	}
};
