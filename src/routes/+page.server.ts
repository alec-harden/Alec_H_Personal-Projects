import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// If user is authenticated, load their projects
	if (locals.user) {
		const userProjects = await db.query.projects.findMany({
			where: eq(projects.userId, locals.user.id),
			orderBy: [desc(projects.updatedAt)],
			limit: 6 // Limit to recent projects for dashboard
		});

		return {
			projects: userProjects,
			isAuthenticated: true
		};
	}

	// Not authenticated - return empty (page will show sample projects)
	return {
		projects: [],
		isAuthenticated: false
	};
};
