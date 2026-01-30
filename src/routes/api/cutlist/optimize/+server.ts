/**
 * Cut List Optimization API Endpoint
 *
 * POST /api/cutlist/optimize
 * Accepts cut list inputs and returns optimization results
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { optimizeCuts1D, optimizeCuts2D } from '$lib/server/cutOptimizer';
import type { Cut, Stock, CutListMode } from '$lib/types/cutlist';

interface OptimizeRequest {
	mode: CutListMode;
	cuts: Cut[];
	stock: Stock[];
	kerf: number;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as OptimizeRequest;

		// Validate required fields
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

		// Call appropriate optimization algorithm
		const result =
			body.mode === 'linear'
				? optimizeCuts1D(body.cuts, body.stock, body.kerf)
				: optimizeCuts2D(body.cuts, body.stock, body.kerf);

		// Return result (error or success)
		if (!result.success) {
			return json({ error: result.error }, { status: 400 });
		}

		return json(result);
	} catch (error) {
		console.error('Optimization error:', error);
		return json({ error: 'Optimization failed' }, { status: 500 });
	}
};
