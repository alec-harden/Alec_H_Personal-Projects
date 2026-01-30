/**
 * Cut Lists Listing Page - Server Load
 *
 * Loads all user's saved cut lists with project relations
 */

import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { cutLists } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	// Require authentication
	const user = requireAuth(event);

	// Load all user's cut lists with project relation
	const userCutLists = await db.query.cutLists.findMany({
		where: eq(cutLists.userId, user.id),
		orderBy: desc(cutLists.updatedAt),
		with: {
			project: {
				columns: {
					id: true,
					name: true
				}
			}
		}
	});

	return {
		cutLists: userCutLists
	};
};
