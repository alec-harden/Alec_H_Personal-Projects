import { requireAdmin } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { dimensionValues } from '$lib/server/schema';
import { eq, and, asc } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { invalidateDimensionCache, DIMENSION_TOLERANCE } from '$lib/utils/dimension-validation';
import { seedDefaultDimensions } from '$lib/server/seed-dimensions';
import type { PageServerLoad, Actions } from './$types';

// Types for grouped dimensions
interface DimensionValue {
	id: string;
	value: number;
	isDefault: boolean;
}

interface DimensionTypeGroup {
	thickness: DimensionValue[];
	width: DimensionValue[];
	length: DimensionValue[];
}

interface GroupedDimensions {
	hardwood: DimensionTypeGroup;
	common: DimensionTypeGroup;
	sheet: DimensionTypeGroup;
}

export const load: PageServerLoad = async (event) => {
	// Require admin role - throws 403 if not admin
	requireAdmin(event);

	// Query all dimensions ordered by category, dimensionType, value
	const allDimensions = await db.query.dimensionValues.findMany({
		orderBy: [asc(dimensionValues.category), asc(dimensionValues.dimensionType), asc(dimensionValues.value)]
	});

	// Group by category and type for UI display
	const grouped: GroupedDimensions = {
		hardwood: { thickness: [], width: [], length: [] },
		common: { thickness: [], width: [], length: [] },
		sheet: { thickness: [], width: [], length: [] }
	};

	for (const dim of allDimensions) {
		const category = dim.category as keyof GroupedDimensions;
		const dimType = dim.dimensionType as keyof DimensionTypeGroup;
		grouped[category][dimType].push({
			id: dim.id,
			value: dim.value,
			isDefault: dim.isDefault
		});
	}

	return { dimensions: grouped };
};

export const actions: Actions = {
	add: async (event) => {
		// Admin check in action too (load check doesn't protect actions)
		requireAdmin(event);

		const data = await event.request.formData();
		const category = data.get('category')?.toString() as 'hardwood' | 'common' | 'sheet';
		const dimensionType = data.get('dimensionType')?.toString() as 'thickness' | 'width' | 'length';
		const valueStr = data.get('value')?.toString();

		// Validation
		if (!category || !['hardwood', 'common', 'sheet'].includes(category)) {
			return fail(400, { error: 'Invalid category' });
		}

		if (!dimensionType || !['thickness', 'width', 'length'].includes(dimensionType)) {
			return fail(400, { error: 'Invalid dimension type' });
		}

		if (!valueStr || isNaN(Number(valueStr))) {
			return fail(400, { error: 'Value must be a valid number' });
		}

		const value = Number(valueStr);

		if (value <= 0) {
			return fail(400, { error: 'Value must be greater than 0' });
		}

		if (value > 1000) {
			return fail(400, { error: 'Value seems too large. Maximum is 1000 inches.' });
		}

		// Check for duplicate (with tolerance)
		const existingValues = await db.select()
			.from(dimensionValues)
			.where(
				and(
					eq(dimensionValues.category, category),
					eq(dimensionValues.dimensionType, dimensionType)
				)
			);

		const isDuplicate = existingValues.some(
			(existing) => Math.abs(existing.value - value) <= DIMENSION_TOLERANCE
		);

		if (isDuplicate) {
			return fail(400, { error: `A similar value already exists for ${category} ${dimensionType}` });
		}

		// Insert new value
		const now = new Date();
		await db.insert(dimensionValues).values({
			id: crypto.randomUUID(),
			category,
			dimensionType,
			value,
			isDefault: false,
			createdAt: now,
			updatedAt: now
		});

		// Invalidate cache so validation uses new value immediately
		invalidateDimensionCache();

		return { success: true };
	},

	remove: async (event) => {
		requireAdmin(event);

		const data = await event.request.formData();
		const id = data.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'Missing dimension ID' });
		}

		// Delete by id
		await db.delete(dimensionValues).where(eq(dimensionValues.id, id));

		// Invalidate cache
		invalidateDimensionCache();

		return { success: true };
	},

	reset: async (event) => {
		requireAdmin(event);

		// Delete all existing values
		await db.delete(dimensionValues);

		// Reseed with defaults
		await seedDefaultDimensions(db);

		// Invalidate cache
		invalidateDimensionCache();

		// PRG pattern - redirect to refresh the page
		throw redirect(302, '/admin/dimensions');
	}
};
