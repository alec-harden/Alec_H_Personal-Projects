/**
 * BOM Generation API Endpoint
 *
 * POST /api/bom/generate
 *
 * Accepts project details and returns a structured Bill of Materials
 * using Vercel AI SDK's generateObject() with Zod schema validation.
 */

import { generateObject } from 'ai';
import { getModel } from '$lib/server/ai';
import { bomSchema } from '$lib/server/schemas/bom-schema';
import { getTemplateById } from '$lib/data/templates';
import type { ProjectDetails } from '$lib/types/bom';
import type { RequestHandler } from './$types';

/**
 * Build a detailed prompt for BOM generation
 * Includes project context, dimensions, materials, and woodworking-specific guidance
 */
function buildBOMPrompt(details: ProjectDetails): string {
	const template = getTemplateById(details.templateId);
	const templateName = template?.name ?? details.templateId;
	const templateHardware = template?.typicalHardware ?? [];

	// Format dimensions
	const dimStr = details.dimensions.height
		? `${details.dimensions.length}" L x ${details.dimensions.width}" W x ${details.dimensions.height}" H`
		: `${details.dimensions.length}" L x ${details.dimensions.width}" W`;

	// Format joinery methods
	const joineryStr =
		details.joinery.length > 0
			? details.joinery
					.map((id) => {
						const opt = template?.joineryOptions.find((j) => j.id === id);
						return opt ? opt.name : id;
					})
					.join(', ')
			: 'basic joinery';

	return `You are an expert woodworker creating a Bill of Materials for a woodworking project.

PROJECT DETAILS:
- Project Name: ${details.projectName}
- Project Type: ${templateName}
- Dimensions: ${dimStr}
- Joinery Methods: ${joineryStr}
- Wood Species: ${details.woodSpecies}
- Finish: ${details.finish}
${details.additionalNotes ? `- Additional Notes: ${details.additionalNotes}` : ''}

INSTRUCTIONS:
Generate a complete Bill of Materials with items in ALL FOUR categories:

1. LUMBER - All wood components needed:
   - Use standard lumber yard dimensions (1x4, 2x4, 4/4, 8/4, etc.)
   - Add 1/4" extra length for milling/squaring on dimensional lumber
   - Specify board feet (bf) for rough lumber, linear feet or pieces for dimensional
   - Consider wood movement and grain orientation

2. HARDWARE - Fasteners and mechanical components:
   - Specific screw sizes (e.g., #8 x 1-1/4" wood screws)
   - Exact quantities (round up to standard box sizes)
   ${templateHardware.length > 0 ? `- Consider typical hardware for ${templateName.toLowerCase()}: ${templateHardware.join(', ')}` : ''}
   - Include any specialty fasteners for the joinery methods selected

3. FINISHES - Surface treatments:
   - Base the quantities on project surface area
   - Include all stages (sealer/primer if needed, topcoat)
   - Specify finish type matching "${details.finish}"

4. CONSUMABLES - Expendable supplies:
   - Sandpaper in multiple grits (80, 120, 180, 220 minimum)
   - Wood glue (estimate based on joint surface area)
   - Rags, tack cloths, applicators for finishing
   - Masking tape if needed

Be specific and practical. A woodworker should be able to take this list directly to the lumber yard and hardware store.

Generate the BOM now with today's date as the generatedAt timestamp.`;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const projectDetails: ProjectDetails = await request.json();

		// Validate required fields
		if (!projectDetails.projectName || !projectDetails.templateId) {
			return new Response(
				JSON.stringify({
					error: 'Missing required fields: projectName and templateId are required'
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		// Build the prompt with template context
		const prompt = buildBOMPrompt(projectDetails);

		// Generate structured BOM using AI
		const result = await generateObject({
			model: getModel(),
			schema: bomSchema,
			prompt
		});

		// Add unique IDs to each item if not already present
		const bom = result.object;
		bom.items = bom.items.map((item, index) => ({
			...item,
			id: item.id || `item-${Date.now()}-${index}`
		}));

		return new Response(JSON.stringify(bom), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('BOM generation error:', error);

		const message = error instanceof Error ? error.message.toLowerCase() : '';

		// Timeout
		if (message.includes('timeout') || message.includes('etimedout') || message.includes('econnaborted')) {
			return new Response(JSON.stringify({ error: 'Generation timed out. The AI service is slow - please try again.' }), {
				status: 504,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Rate limit
		if (message.includes('rate limit') || message.includes('429') || message.includes('too many')) {
			return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }), {
				status: 429,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// API key (existing)
		if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
			return new Response(JSON.stringify({ error: 'AI service configuration error. Check API keys.' }), {
				status: 503,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Network
		if (message.includes('enotfound') || message.includes('econnrefused') || message.includes('network')) {
			return new Response(JSON.stringify({ error: 'Cannot reach AI service. Check your connection.' }), {
				status: 503,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Default
		return new Response(JSON.stringify({ error: 'Failed to generate BOM. Please try again.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
