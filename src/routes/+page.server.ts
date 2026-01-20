import { db } from '$lib/server/db';
import { projects } from '$lib/server/schema';

export async function load() {
	// Query projects table to verify database connection
	const allProjects = await db.select().from(projects);

	console.log('[DB] Connection successful - projects query returned', allProjects.length, 'rows');

	return {
		projects: allProjects
	};
}
