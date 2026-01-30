/**
 * Cut List View Page - Server
 *
 * Loads saved cut list with cuts for shop checklist view
 */

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { cutLists, cutListCuts } from '$lib/server/schema';
import { eq, and, asc } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	// Require authentication
	const user = requireAuth(event);

	const { id } = event.params;

	// Query cut list with nested cuts
	const cutList = await db.query.cutLists.findFirst({
		where: and(eq(cutLists.id, id), eq(cutLists.userId, user.id)),
		with: {
			cuts: {
				orderBy: asc(cutListCuts.position)
			}
		}
	});

	if (!cutList) {
		throw error(404, 'Cut list not found');
	}

	return {
		cutList
	};
};
