/**
 * Save Cut List API Endpoint
 *
 * POST /api/cutlist/save
 * Saves a cut list with its cuts and stock to the database
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { cutLists, cutListCuts, cutListStock, projects } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import type { CutListMode, Cut, Stock } from '$lib/types/cutlist';

interface SaveRequest {
	projectId: string;
	name: string;
	mode: CutListMode;
	cuts: Cut[];
	stock: Stock[];
	kerf: number;
}

export const POST: RequestHandler = async (event) => {
	// Require authentication
	const user = requireAuth(event);

	try {
		const body = (await event.request.json()) as SaveRequest;

		// Validate required fields
		if (!body.projectId) {
			return json({ error: 'Project ID is required' }, { status: 400 });
		}

		if (!body.name || body.name.trim() === '') {
			return json({ error: 'Cut list name is required' }, { status: 400 });
		}

		if (!body.mode) {
			return json({ error: 'Mode is required' }, { status: 400 });
		}

		if (!body.cuts || !Array.isArray(body.cuts)) {
			return json({ error: 'Cuts array is required' }, { status: 400 });
		}

		if (!body.stock || !Array.isArray(body.stock)) {
			return json({ error: 'Stock array is required' }, { status: 400 });
		}

		if (typeof body.kerf !== 'number') {
			return json({ error: 'Kerf must be a number' }, { status: 400 });
		}

		// Verify user owns the project
		const project = await db.query.projects.findFirst({
			where: eq(projects.id, body.projectId),
			columns: { id: true, userId: true }
		});

		if (!project) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		if (project.userId !== user.id) {
			return json({ error: 'You do not have permission to save to this project' }, { status: 403 });
		}

		// Create cut list with related cuts and stock in a transaction
		const cutListId = crypto.randomUUID();
		const now = new Date();

		await db.transaction(async (tx) => {
			// Insert cut list
			await tx.insert(cutLists).values({
				id: cutListId,
				userId: user.id,
				projectId: body.projectId,
				name: body.name.trim(),
				mode: body.mode,
				kerf: body.kerf,
				createdAt: now,
				updatedAt: now
			});

			// Insert cuts
			if (body.cuts.length > 0) {
				await tx.insert(cutListCuts).values(
					body.cuts.map((cut, index) => ({
						id: crypto.randomUUID(),
						cutListId,
						length: cut.length,
						width: cut.width,
						quantity: cut.quantity,
						label: cut.label || null,
						position: index
					}))
				);
			}

			// Insert stock
			if (body.stock.length > 0) {
				await tx.insert(cutListStock).values(
					body.stock.map((stockItem, index) => ({
						id: crypto.randomUUID(),
						cutListId,
						length: stockItem.length,
						width: stockItem.width,
						quantity: stockItem.quantity,
						label: stockItem.label || null,
						position: index
					}))
				);
			}
		});

		return json({ success: true, cutListId });
	} catch (error) {
		console.error('Save cut list error:', error);
		return json({ error: 'Failed to save cut list' }, { status: 500 });
	}
};
