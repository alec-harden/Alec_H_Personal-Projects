/**
 * Project Template Types
 *
 * NOTE: Template DATA now lives in database. Use /api/templates endpoint.
 * This file contains only type definitions and utility functions.
 */

import type { ProjectDetails } from '$lib/types/bom';

/**
 * Joinery method option with skill level indicator
 */
export interface JoineryOption {
	id: string;
	name: string;
	description: string;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Dimension range with min/max/default values
 */
export interface DimensionRange {
	min: number;
	max: number;
	default: number;
}

/**
 * Project template defining defaults and options for a project type.
 * Matches the shape returned by GET /api/templates.
 */
export interface ProjectTemplate {
	id: string;
	name: string;
	icon: string; // HTML entity for emoji
	description: string;
	defaultDimensions: {
		length: DimensionRange;
		width: DimensionRange;
		height?: DimensionRange;
		unit: 'inches';
	};
	joineryOptions: JoineryOption[];
	suggestedWoods: string[];
	suggestedFinishes: string[];
	typicalHardware: string[];
}

/**
 * Create default ProjectDetails from a template
 */
export function createDefaultDetails(template: ProjectTemplate): Partial<ProjectDetails> {
	return {
		templateId: template.id,
		dimensions: {
			length: template.defaultDimensions.length.default,
			width: template.defaultDimensions.width.default,
			height: template.defaultDimensions.height?.default,
			unit: 'inches'
		},
		joinery: [],
		woodSpecies: template.suggestedWoods[0] || '',
		finish: template.suggestedFinishes[0] || ''
	};
}
