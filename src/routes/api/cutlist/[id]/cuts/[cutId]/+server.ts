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
import { cutLists, cutListCuts, cutListStock } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

interface PatchRequest {
	completed?: boolean;
	assignedStockId?: string | null;
	overridePosition?: number | null;
}

export const PATCH: RequestHandler = async (event) => {
	// Require authentication
	const user = requireAuth(event);

	try {
		const { id: cutListId, cutId } = event.params;
		const body = (await event.request.json()) as PatchRequest;

		// Validate completed field if provided
		if ('completed' in body && typeof body.completed !== 'boolean') {
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

		// Build update object conditionally
		const updates: Record<string, unknown> = {};

		if (typeof body.completed === 'boolean') {
			updates.completed = body.completed;
			updates.completedAt = body.completed ? new Date() : null;
		}

		if ('assignedStockId' in body) {
			// Validate stock exists and belongs to same cutList if not null
			if (body.assignedStockId !== null) {
				const stock = await db.query.cutListStock.findFirst({
					where: and(
						eq(cutListStock.id, body.assignedStockId),
						eq(cutListStock.cutListId, cutListId)
					)
				});
				if (!stock) {
					return json({ error: 'Stock not found' }, { status: 404 });
				}
			}
			updates.assignedStockId = body.assignedStockId;
		}

		if ('overridePosition' in body) {
			// Validate position is non-negative if provided
			if (body.overridePosition !== null && body.overridePosition < 0) {
				return json({ error: 'Position must be non-negative' }, { status: 400 });
			}
			updates.overridePosition = body.overridePosition;
		}

		// Only update if there are changes
		if (Object.keys(updates).length === 0) {
			return json({ error: 'No valid fields to update' }, { status: 400 });
		}

		// Update the cut
		await db.update(cutListCuts).set(updates).where(eq(cutListCuts.id, cutId));

		return json({ success: true, updates });
	} catch (error) {
		console.error('Update cut error:', error);
		return json({ error: 'Failed to update cut' }, { status: 500 });
	}
};
