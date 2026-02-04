import type { PageServerLoad, Actions } from './$types';
import { requireAuth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { projects, boms, bomItems } from '$lib/server/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import crypto from 'crypto';

export const load: PageServerLoad = async (event) => {
	// Require authentication for BOM import flow
	const user = requireAuth(event);

	// Fetch user's projects with nested BOMs and items
	const userProjects = await db.query.projects.findMany({
		where: eq(projects.userId, user.id),
		with: {
			boms: {
				with: {
					items: true // Load all items, filter client-side for count display
				}
			}
		},
		orderBy: desc(projects.updatedAt)
	});

	return { projects: userProjects };
};

export const actions = {
	loadFromBoms: async ({ request, locals }) => {
		// Require authentication
		if (!locals.user) {
			return fail(401, { error: 'Authentication required' });
		}

		const formData = await request.formData();
		const projectId = formData.get('projectId') as string;
		const selectedBomIds = formData.getAll('selectedBoms') as string[];

		// Validate required fields
		if (!projectId || selectedBomIds.length === 0) {
			return fail(400, { error: 'Project and at least one BOM must be selected' });
		}

		// Verify project ownership
		const project = await db.query.projects.findFirst({
			where: eq(projects.id, projectId),
			with: {
				boms: {
					columns: { id: true }
				}
			}
		});

		if (!project || project.userId !== locals.user.id) {
			return fail(403, { error: 'Project not found or access denied' });
		}

		// Verify all selected BOMs belong to this project
		const projectBomIds = project.boms.map((b) => b.id);
		const invalidBoms = selectedBomIds.filter((id) => !projectBomIds.includes(id));
		if (invalidBoms.length > 0) {
			return fail(400, { error: 'Invalid BOM selection' });
		}

		// Query all items from selected BOMs
		const allItems = await db.query.bomItems.findMany({
			where: inArray(bomItems.bomId, selectedBomIds)
		});

		// Filter to cut items with valid length dimension
		const validCutItems = allItems.filter(
			(item) => item.cutItem === true && item.length !== null
		);

		if (validCutItems.length === 0) {
			return fail(400, {
				error: 'No cut items with valid dimensions found in selected BOMs'
			});
		}

		// Detect mode based on sheet category presence
		const hasSheetItems = validCutItems.some((item) => item.category === 'sheet');
		const mode = hasSheetItems ? 'sheet' : 'linear';

		// Transform cut items to Stock format (what you have available)
		const stock = validCutItems.map((item) => ({
			id: crypto.randomUUID(),
			length: item.length!,
			width: item.width,
			quantity: item.quantity,
			label: item.thickness ? `${item.thickness}" ${item.name}` : item.name,
			grainMatters: false
		}));

		return { success: true, stock, mode };
	}
} satisfies Actions;
