import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { bomItems, boms } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import type { BOMCategory } from '$lib/types/bom';
import {
	validateBOMItemDimensions,
	type ValidationWarning
} from '$lib/server/bom-validation';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	// Fetch item with bom -> project relation to verify ownership chain
	const item = await db.query.bomItems.findFirst({
		where: eq(bomItems.id, params.itemId),
		with: { bom: { with: { project: { columns: { userId: true } } } } }
	});

	// Verify item exists and user owns the parent project
	if (!item || item.bom.project.userId !== locals.user.id) {
		throw error(403, 'Forbidden');
	}

	// Parse request body
	const body = await request.json();
	const updates: Partial<typeof bomItems.$inferInsert> = {};

	// Validate and collect updates
	if (typeof body.quantity === 'number' && body.quantity >= 0) {
		updates.quantity = body.quantity;
	}
	if (typeof body.hidden === 'boolean') {
		updates.hidden = body.hidden;
	}
	// cutItem update support
	if (typeof body.cutItem === 'boolean') {
		updates.cutItem = body.cutItem;
	}
	// Dimension updates (lumber items)
	if ('length' in body) {
		updates.length = typeof body.length === 'number' && body.length > 0 ? body.length : null;
	}
	if ('width' in body) {
		updates.width = typeof body.width === 'number' && body.width > 0 ? body.width : null;
	}
	// Support both height and thickness (sync both fields)
	if ('height' in body) {
		const val = typeof body.height === 'number' && body.height > 0 ? body.height : null;
		updates.height = val;
		updates.thickness = val;
	}
	if ('thickness' in body) {
		const val = typeof body.thickness === 'number' && body.thickness > 0 ? body.thickness : null;
		updates.thickness = val;
		updates.height = val;
	}

	// Apply updates if any
	let warnings: ValidationWarning[] = [];
	if (Object.keys(updates).length > 0) {
		await db.update(bomItems).set(updates).where(eq(bomItems.id, params.itemId));
		// Update BOM's updatedAt timestamp
		await db.update(boms).set({ updatedAt: new Date() }).where(eq(boms.id, params.id));

		// Validate updated dimensions
		const updatedItem = await db.query.bomItems.findFirst({
			where: eq(bomItems.id, params.itemId)
		});

		if (updatedItem) {
			warnings = await validateBOMItemDimensions(
				updatedItem.id,
				updatedItem.name,
				updatedItem.category as BOMCategory,
				updatedItem.length ?? undefined,
				updatedItem.width ?? undefined,
				updatedItem.thickness ?? updatedItem.height ?? undefined
			);
		}
	}

	return json({
		success: true,
		warnings: warnings.length > 0 ? warnings : undefined
	});
};
