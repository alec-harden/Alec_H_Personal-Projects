import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { boms } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import type { BOM, BOMCategory } from '$lib/types/bom';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(302, '/auth/login?redirect=/projects/' + params.id);
	}

	// Query BOM with its items and project relation for ownership check
	const bomRecord = await db.query.boms.findFirst({
		where: eq(boms.id, params.bomId),
		with: {
			items: true,
			project: true
		}
	});

	// Verify BOM exists and user owns the parent project
	if (!bomRecord || bomRecord.project.userId !== locals.user.id) {
		throw error(404, 'BOM not found');
	}

	// Transform database records to BOM type for BOMDisplay component
	const bom: BOM = {
		projectName: bomRecord.name,
		projectType: bomRecord.projectType,
		generatedAt: bomRecord.generatedAt.toISOString(),
		items: bomRecord.items
			.sort((a, b) => a.position - b.position)
			.map((item) => ({
				id: item.id,
				name: item.name,
				description: item.description ?? undefined,
				quantity: item.quantity,
				unit: item.unit,
				category: item.category as BOMCategory,
				notes: item.notes ?? undefined,
				hidden: item.hidden
			}))
	};

	return {
		bom,
		bomId: params.bomId,
		projectId: params.id,
		projectName: bomRecord.project.name
	};
};
