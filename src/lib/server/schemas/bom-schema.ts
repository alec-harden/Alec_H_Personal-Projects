/**
 * Zod Schema for BOM Generation
 *
 * Defines the structure for AI-generated Bill of Materials output.
 * Used with Vercel AI SDK's generateObject() for structured responses.
 */

import { z } from 'zod';

/**
 * Schema for an individual BOM item
 */
export const bomItemSchema = z.object({
	id: z.string().describe('Unique identifier for the item'),
	name: z.string().describe('Name of the material or component'),
	description: z.string().optional().describe('Additional details about the item'),
	quantity: z.number().describe('Amount needed'),
	unit: z.string().describe('Unit of measurement (pcs, bf, oz, each, etc.)'),
	category: z
		.enum(['lumber', 'hardware', 'finishes', 'consumables'])
		.describe('Classification category'),
	notes: z.string().optional().describe('Special instructions or considerations')
});

/**
 * Schema for complete Bill of Materials output
 */
export const bomSchema = z.object({
	projectName: z.string().describe('Name of the project'),
	projectType: z.string().describe('Type/template of the project'),
	generatedAt: z.string().describe('ISO date string when BOM was generated'),
	items: z.array(bomItemSchema).describe('List of all materials and components')
});

/**
 * TypeScript type inferred from the Zod schema
 */
export type BOMSchema = z.infer<typeof bomSchema>;
export type BOMItemSchema = z.infer<typeof bomItemSchema>;
