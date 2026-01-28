import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/schema';
import { asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// Require authentication
	if (!locals.user) {
		throw redirect(302, '/auth/login?redirect=/admin/templates');
	}

	const allTemplates = await db.query.templates.findMany({
		orderBy: [asc(templates.name)]
	});

	return { templates: allTemplates };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		// Auth check in action too (load check doesn't protect actions)
		if (!locals.user) {
			throw redirect(302, '/auth/login');
		}

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const icon = data.get('icon')?.toString().trim();
		const description = data.get('description')?.toString().trim();

		// Validation
		if (!name || name.length < 1) {
			return fail(400, { error: 'Template name is required', name: '' });
		}

		if (!icon) {
			return fail(400, { error: 'Icon is required (HTML entity like &#128736;)', name });
		}

		// Parse dimensions
		const defaultDimensions = {
			length: {
				min: Number(data.get('length_min')) || 12,
				max: Number(data.get('length_max')) || 72,
				default: Number(data.get('length_default')) || 36
			},
			width: {
				min: Number(data.get('width_min')) || 12,
				max: Number(data.get('width_max')) || 48,
				default: Number(data.get('width_default')) || 24
			},
			height: data.get('has_height') === 'on'
				? {
						min: Number(data.get('height_min')) || 12,
						max: Number(data.get('height_max')) || 48,
						default: Number(data.get('height_default')) || 30
					}
				: undefined,
			unit: 'inches' as const
		};

		// Parse comma-separated string arrays
		const parseList = (input: string | null | undefined) =>
			input?.split(',').map((s) => s.trim()).filter(Boolean) || [];

		const suggestedWoods = parseList(data.get('suggested_woods')?.toString());
		const suggestedFinishes = parseList(data.get('suggested_finishes')?.toString());
		const typicalHardware = parseList(data.get('typical_hardware')?.toString());

		// Parse joinery options (indexed form fields)
		const joineryOptions: Array<{
			id: string;
			name: string;
			description: string;
			difficulty: 'beginner' | 'intermediate' | 'advanced';
		}> = [];

		let i = 0;
		while (data.get(`joinery_${i}_id`) !== null) {
			const joineryId = data.get(`joinery_${i}_id`)?.toString().trim();
			const joineryName = data.get(`joinery_${i}_name`)?.toString().trim();

			if (joineryId && joineryName) {
				joineryOptions.push({
					id: joineryId,
					name: joineryName,
					description: data.get(`joinery_${i}_description`)?.toString().trim() || '',
					difficulty:
						(data.get(`joinery_${i}_difficulty`)?.toString() as
							| 'beginner'
							| 'intermediate'
							| 'advanced') || 'beginner'
				});
			}
			i++;
		}

		const id = crypto.randomUUID();
		const now = new Date();

		await db.insert(templates).values({
			id,
			name,
			icon,
			description: description || '',
			defaultDimensions,
			joineryOptions,
			suggestedWoods,
			suggestedFinishes,
			typicalHardware,
			createdAt: now,
			updatedAt: now
		});

		// PRG pattern - redirect after create
		throw redirect(302, `/admin/templates/${id}`);
	}
};
