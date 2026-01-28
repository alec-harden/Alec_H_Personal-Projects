import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// If user is not authenticated, return empty projects array
	if (!locals.user) {
		return { projects: [] };
	}

	// Fetch user's projects (id and name only)
	const userProjects = await db.query.projects.findMany({
		where: eq(projects.userId, locals.user.id),
		columns: { id: true, name: true },
		orderBy: desc(projects.updatedAt)
	});

	return { projects: userProjects };
};
