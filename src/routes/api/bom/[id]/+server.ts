import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { boms } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	// Fetch BOM with project relation to verify ownership
	const bom = await db.query.boms.findFirst({
		where: eq(boms.id, params.id),
		with: { project: { columns: { userId: true } } }
	});

	// Verify BOM exists and user owns the parent project
	if (!bom || bom.project.userId !== locals.user.id) {
		throw error(403, 'Forbidden');
	}

	// Delete BOM (cascade deletes items automatically)
	await db.delete(boms).where(eq(boms.id, params.id));

	return json({ success: true });
};
