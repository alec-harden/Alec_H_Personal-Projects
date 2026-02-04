import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { boms, bomItems, projects } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import type { BOM } from '$lib/types/bom';
import { isLumberCategory } from '$lib/types/bom';
import {
	validateBOMItemDimensions,
	type ValidationWarning
} from '$lib/server/bom-validation';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Validate user is authenticated
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { projectId, bom } = body as { projectId: string; bom: BOM };

		// Validate request body
		if (!projectId || !bom) {
			return json({ error: 'Missing projectId or bom in request body' }, { status: 400 });
		}

		if (!bom.projectName || !bom.projectType || !bom.generatedAt || !Array.isArray(bom.items)) {
			return json({ error: 'Invalid BOM structure' }, { status: 400 });
		}

		// Validate projectId belongs to this user (security check)
		const project = await db.query.projects.findFirst({
			where: eq(projects.id, projectId),
			columns: { id: true, userId: true }
		});

		if (!project) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		if (project.userId !== locals.user.id) {
			return json({ error: 'Project not owned by user' }, { status: 403 });
		}

		// Collect validation warnings (VAL-01, VAL-02, DIM-03, DIM-04)
		const warnings: ValidationWarning[] = [];
		for (const item of bom.items) {
			const itemWarnings = await validateBOMItemDimensions(
				item.id,
				item.name,
				item.category,
				item.length,
				item.width,
				item.thickness ?? item.height // Support both for migration compatibility
			);
			warnings.push(...itemWarnings);
		}

		// Use Drizzle transaction to atomically save BOM and items
		const bomId = await db.transaction(async (tx) => {
			// Generate UUID for bom
			const newBomId = crypto.randomUUID();
			const now = new Date();

			// Parse generatedAt from ISO string
			const generatedAt = new Date(bom.generatedAt);
			if (isNaN(generatedAt.getTime())) {
				throw new Error('Invalid generatedAt date format');
			}

			// Insert into boms table
			await tx.insert(boms).values({
				id: newBomId,
				projectId,
				name: bom.projectName,
				projectType: bom.projectType,
				generatedAt,
				createdAt: now,
				updatedAt: now
			});

			// Insert each item into bomItems table
			if (bom.items.length > 0) {
				await tx.insert(bomItems).values(
					bom.items.map((item, index) => ({
						id: crypto.randomUUID(),
						bomId: newBomId,
						name: item.name,
						description: item.description || null,
						quantity: item.quantity,
						unit: item.unit,
						category: item.category,
						notes: item.notes || null,
						hidden: item.hidden || false,
						position: index,
						// VAL-03: Auto-set cutItem based on category
						cutItem: isLumberCategory(item.category),
						// Save dimensions (support both thickness and height for migration)
						length: item.length ?? null,
						width: item.width ?? null,
						thickness: item.thickness ?? item.height ?? null,
						height: item.height ?? item.thickness ?? null
					}))
				);
			}

			return newBomId;
		});

		// Return success with optional warnings
		return json({
			success: true,
			bomId,
			warnings: warnings.length > 0 ? warnings : undefined
		});
	} catch (error) {
		console.error('Error saving BOM:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to save BOM' },
			{ status: 500 }
		);
	}
};
