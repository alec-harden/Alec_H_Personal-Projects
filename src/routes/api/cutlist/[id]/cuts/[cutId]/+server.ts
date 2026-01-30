/**
 * Cut Completion Toggle API Endpoint
 *
 * PATCH /api/cutlist/[id]/cuts/[cutId]
 * Toggles completion status for a specific cut in a cut list
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { cutLists, cutListCuts } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

interface PatchRequest {
	completed: boolean;
}

export const PATCH: RequestHandler = async (event) => {
	// Require authentication
	const user = requireAuth(event);

	try {
		const { id: cutListId, cutId } = event.params;
		const body = (await event.request.json()) as PatchRequest;

		// Validate request body
		if (typeof body.completed !== 'boolean') {
			return json({ error: 'completed must be a boolean' }, { status: 400 });
		}

		// First, verify the cut exists and belongs to the cut list
		const cut = await db.query.cutListCuts.findFirst({
			where: eq(cutListCuts.id, cutId),
			columns: { id: true, cutListId: true }
		});

		if (!cut) {
			return json({ error: 'Cut not found' }, { status: 404 });
		}

		// Verify the cut belongs to the requested cut list
		if (cut.cutListId !== cutListId) {
			return json({ error: 'Cut does not belong to this cut list' }, { status: 404 });
		}

		// Verify user owns the cut list
		const cutList = await db.query.cutLists.findFirst({
			where: eq(cutLists.id, cutListId),
			columns: { id: true, userId: true }
		});

		if (!cutList) {
			return json({ error: 'Cut list not found' }, { status: 404 });
		}

		if (cutList.userId !== user.id) {
			return json({ error: 'You do not have permission to modify this cut list' }, { status: 403 });
		}

		// Update the cut completion status
		await db
			.update(cutListCuts)
			.set({
				completed: body.completed,
				completedAt: body.completed ? new Date() : null
			})
			.where(eq(cutListCuts.id, cutId));

		return json({ success: true });
	} catch (error) {
		console.error('Update cut completion error:', error);
		return json({ error: 'Failed to update cut completion' }, { status: 500 });
	}
};
