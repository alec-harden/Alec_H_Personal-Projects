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
import { db } from '$lib/server/db';
import { templates } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import type { ProjectDetails } from '$lib/types/bom';
import type { ProjectTemplate } from '$lib/data/templates';
import type { RequestHandler } from './$types';

/**
 * Build a detailed prompt for BOM generation
 * Includes project context, dimensions, materials, and woodworking-specific guidance
 * v4.0: Updated for 6 categories, dimension requirements, and consumables toggle
 */
function buildBOMPrompt(details: ProjectDetails, template: ProjectTemplate | null): string {
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

	// Consumables section (conditional based on user toggle)
	const includeConsumables = details.includeConsumables ?? true;
	const consumablesSection = includeConsumables
		? `
CONSUMABLES (category: "consumables")
- Sandpaper in multiple grits (80, 120, 180, 220 minimum)
- Wood glue (estimate based on joint surface area)
- Rags, tack cloths, applicators for finishing
- Masking tape if needed`
		: `
CONSUMABLES: Do NOT include any consumable items (sandpaper, glue, tape, rags, etc.) - the user has opted out.`;

	return `You are an expert woodworker creating a Bill of Materials for a woodworking project.

PROJECT DETAILS:
- Project Name: ${details.projectName}
- Project Type: ${templateName}
- Dimensions: ${dimStr}
- Joinery Methods: ${joineryStr}
- Wood Species: ${details.woodSpecies}
- Finish: ${details.finish}
${details.additionalNotes ? `- Additional Notes: ${details.additionalNotes}` : ''}

CATEGORY ASSIGNMENT RULES:
The user specified "${details.woodSpecies}" as the wood species. Use this to determine lumber categories:
- HARDWOOD species (Oak, Maple, Walnut, Cherry, Ash, Mahogany, Hickory, Birch): use category "hardwood"
- SOFTWOOD/construction lumber (Pine, Fir, SPF, Cedar, Poplar, Douglas Fir): use category "common"
- SHEET materials (Plywood, MDF, Particle board, Hardboard, Melamine, OSB): use category "sheet"
- When species is ambiguous or mixed, default to "hardwood" for primary wood parts

DIMENSION REQUIREMENTS:
For ALL lumber items (hardwood, common, sheet), you MUST include these fields:
- length: actual length in inches (e.g., 48, 72, 96)
- width: actual width in inches (e.g., 4, 6, 8, 11.25)
- thickness: actual thickness in inches as decimal (e.g., 0.75, 1, 1.5)

Use ACTUAL measurements, not nominal:
- "3/4 stock" = thickness: 0.75
- "4/4 rough lumber" = thickness: 1
- "2x4 Pine" = width: 3.5, thickness: 1.5
- "3/4 Plywood" = thickness: 0.75

INSTRUCTIONS:
Generate a complete Bill of Materials with items in the following categories:

HARDWOOD LUMBER (category: "hardwood")
- Premium hardwoods: Oak, Maple, Walnut, Cherry, Ash, Mahogany, etc.
- Include length, width, thickness in inches (REQUIRED)
- Use fractional thickness (0.75 for 3/4", 1 for 4/4, 1.5 for 6/4, etc.)
- Unit: always "pcs" (pieces)

COMMON BOARDS (category: "common")
- Construction lumber: Pine, Fir, SPF, Poplar, Cedar, etc.
- Include length, width, thickness in inches (REQUIRED)
- Use actual dimensions (2x4 = width 3.5, thickness 1.5)
- Unit: always "pcs" (pieces)

SHEET GOODS (category: "sheet")
- Plywood, MDF, Particle board, Hardboard, Melamine
- Include length, width, thickness in inches (REQUIRED)
- Common sizes: 48x96, 24x48, etc.
- Unit: always "pcs" (pieces)

HARDWARE (category: "hardware")
- Specific screw sizes (e.g., #8 x 1-1/4" wood screws)
- Exact quantities (round up to standard box sizes)
${templateHardware.length > 0 ? `- Consider typical hardware for ${templateName.toLowerCase()}: ${templateHardware.join(', ')}` : ''}
- Include any specialty fasteners for the joinery methods selected

FINISHES (category: "finishes")
- Base the quantities on project surface area
- Include all stages (sealer/primer if needed, topcoat)
- Specify finish type matching "${details.finish}"
${consumablesSection}

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

		// Look up template from database for prompt context
		const template = await db.query.templates.findFirst({
			where: eq(templates.id, projectDetails.templateId)
		});

		// Build the prompt with template context
		const prompt = buildBOMPrompt(projectDetails, template as ProjectTemplate | null);

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
