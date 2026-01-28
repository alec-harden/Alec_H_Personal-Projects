/**
 * Templates API Endpoint
 *
 * GET /api/templates
 *
 * Returns all project templates from the database, ordered by name.
 * Public endpoint - templates are shared data needed for BOM generation.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/schema';
import { asc } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	const allTemplates = await db.query.templates.findMany({
		orderBy: [asc(templates.name)]
	});

	return json(allTemplates);
};
