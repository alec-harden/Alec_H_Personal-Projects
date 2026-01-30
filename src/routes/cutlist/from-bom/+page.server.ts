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

		// Query lumber items from selected BOMs
		const lumberItems = await db.query.bomItems.findMany({
			where: inArray(bomItems.bomId, selectedBomIds)
		});

		// Filter to lumber items with valid length dimension
		const validLumberItems = lumberItems.filter(
			(item) => item.category === 'lumber' && item.length !== null
		);

		if (validLumberItems.length === 0) {
			return fail(400, {
				error: 'No lumber items with valid dimensions found in selected BOMs'
			});
		}

		// Detect mode based on width presence
		const hasWidth = validLumberItems.some((item) => item.width !== null);
		const mode = hasWidth ? 'sheet' : 'linear';

		// Transform lumber items to Cut format
		const cuts = validLumberItems.map((item) => ({
			id: crypto.randomUUID(),
			length: item.length!,
			width: item.width,
			quantity: item.quantity,
			label: item.name,
			grainMatters: false
		}));

		return { success: true, cuts, mode };
	}
} satisfies Actions;
