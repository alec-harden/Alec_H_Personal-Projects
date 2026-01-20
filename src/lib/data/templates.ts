/**
 * Project Templates for BOM Generation
 *
 * Provides domain knowledge for the wizard UI and AI prompt construction.
 * Each template defines reasonable defaults and options for common woodworking projects.
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
interface DimensionRange {
	min: number;
	max: number;
	default: number;
}

/**
 * Project template defining defaults and options for a project type
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
 * Available project templates
 */
export const templates: ProjectTemplate[] = [
	{
		id: 'table',
		name: 'Table',
		icon: '&#128437;', // Table emoji
		description: 'Dining tables, coffee tables, end tables, desks',
		defaultDimensions: {
			length: { min: 18, max: 120, default: 60 },
			width: { min: 12, max: 48, default: 36 },
			height: { min: 16, max: 36, default: 30 },
			unit: 'inches'
		},
		joineryOptions: [
			{
				id: 'mortise-tenon',
				name: 'Mortise and Tenon',
				description: 'Traditional strong joint for table legs and aprons',
				difficulty: 'intermediate'
			},
			{
				id: 'pocket-screws',
				name: 'Pocket Screws',
				description: 'Quick and strong using pocket hole jig',
				difficulty: 'beginner'
			},
			{
				id: 'dowels',
				name: 'Dowel Joints',
				description: 'Hidden dowels for clean appearance',
				difficulty: 'beginner'
			},
			{
				id: 'breadboard-ends',
				name: 'Breadboard Ends',
				description: 'Controls wood movement on wide panels',
				difficulty: 'advanced'
			}
		],
		suggestedWoods: ['oak', 'walnut', 'maple', 'pine'],
		suggestedFinishes: ['polyurethane', 'danish oil', 'lacquer', 'wax'],
		typicalHardware: ['tabletop fasteners', 'leveling feet', 'apron bolts']
	},
	{
		id: 'cabinet',
		name: 'Cabinet',
		icon: '&#128452;', // File cabinet emoji
		description: 'Kitchen cabinets, bathroom vanities, storage cabinets',
		defaultDimensions: {
			length: { min: 12, max: 48, default: 30 },
			width: { min: 12, max: 30, default: 24 },
			height: { min: 12, max: 96, default: 34 },
			unit: 'inches'
		},
		joineryOptions: [
			{
				id: 'dado-joints',
				name: 'Dado Joints',
				description: 'Grooves for shelves and partitions',
				difficulty: 'intermediate'
			},
			{
				id: 'rabbet-joints',
				name: 'Rabbet Joints',
				description: 'L-shaped cuts for back panels and corners',
				difficulty: 'beginner'
			},
			{
				id: 'pocket-screws',
				name: 'Pocket Screws',
				description: 'Quick assembly for face frames and boxes',
				difficulty: 'beginner'
			},
			{
				id: 'dowels',
				name: 'Dowel Joints',
				description: 'Alignment and strength for panel connections',
				difficulty: 'beginner'
			}
		],
		suggestedWoods: ['maple', 'birch plywood', 'oak', 'cherry'],
		suggestedFinishes: ['paint', 'lacquer', 'polyurethane'],
		typicalHardware: ['hinges', 'drawer slides', 'pulls/knobs', 'shelf pins']
	},
	{
		id: 'shelf',
		name: 'Shelf / Bookcase',
		icon: '&#128218;', // Books emoji
		description: 'Wall shelves, bookcases, display shelving',
		defaultDimensions: {
			length: { min: 12, max: 72, default: 36 },
			width: { min: 6, max: 18, default: 12 },
			height: { min: 12, max: 96, default: 48 },
			unit: 'inches'
		},
		joineryOptions: [
			{
				id: 'dado-joints',
				name: 'Dado Joints',
				description: 'Strong shelf support in side panels',
				difficulty: 'intermediate'
			},
			{
				id: 'floating-brackets',
				name: 'Floating Shelf Brackets',
				description: 'Hidden support for wall-mounted shelves',
				difficulty: 'beginner'
			},
			{
				id: 'pocket-screws',
				name: 'Pocket Screws',
				description: 'Quick assembly for bookcase construction',
				difficulty: 'beginner'
			}
		],
		suggestedWoods: ['pine', 'oak', 'plywood', 'walnut'],
		suggestedFinishes: ['stain + poly', 'paint', 'natural oil'],
		typicalHardware: ['shelf brackets', 'wall anchors', 'shelf pins']
	},
	{
		id: 'workbench',
		name: 'Workbench',
		icon: '&#128736;', // Hammer and wrench emoji
		description: 'Shop workbenches, assembly tables, tool stands',
		defaultDimensions: {
			length: { min: 48, max: 120, default: 72 },
			width: { min: 18, max: 36, default: 24 },
			height: { min: 30, max: 42, default: 34 },
			unit: 'inches'
		},
		joineryOptions: [
			{
				id: 'mortise-tenon',
				name: 'Mortise and Tenon',
				description: 'Traditional strong joint for heavy-duty construction',
				difficulty: 'intermediate'
			},
			{
				id: 'through-tenons',
				name: 'Through Tenons',
				description: 'Visible joinery with wedged tenons for maximum strength',
				difficulty: 'advanced'
			},
			{
				id: 'lag-bolts',
				name: 'Lag Bolts',
				description: 'Heavy-duty fasteners for thick stock',
				difficulty: 'beginner'
			},
			{
				id: 'half-lap',
				name: 'Half Lap Joints',
				description: 'Interlocking joints for stretchers and frames',
				difficulty: 'intermediate'
			}
		],
		suggestedWoods: ['maple', 'beech', 'southern yellow pine', 'Douglas fir'],
		suggestedFinishes: ['boiled linseed oil', 'wax', 'none'],
		typicalHardware: ['bench dogs', 'vises', 'casters', 'hold-down clamps']
	},
	{
		id: 'box',
		name: 'Box / Chest',
		icon: '&#128230;', // Package emoji
		description: 'Storage boxes, blanket chests, jewelry boxes, toolboxes',
		defaultDimensions: {
			length: { min: 6, max: 48, default: 24 },
			width: { min: 4, max: 24, default: 12 },
			height: { min: 4, max: 24, default: 12 },
			unit: 'inches'
		},
		joineryOptions: [
			{
				id: 'box-joints',
				name: 'Box Joints',
				description: 'Interlocking fingers for decorative corners',
				difficulty: 'intermediate'
			},
			{
				id: 'dovetails',
				name: 'Dovetails',
				description: 'Classic hand-cut or router-cut corner joints',
				difficulty: 'advanced'
			},
			{
				id: 'rabbet-joints',
				name: 'Rabbet Joints',
				description: 'Simple L-shaped joints for box construction',
				difficulty: 'beginner'
			},
			{
				id: 'miter-joints',
				name: 'Miter Joints',
				description: '45-degree corners for seamless grain wrap',
				difficulty: 'intermediate'
			}
		],
		suggestedWoods: ['cedar', 'walnut', 'cherry', 'pine'],
		suggestedFinishes: ['danish oil', 'shellac', 'lacquer'],
		typicalHardware: ['hinges', 'lid support', 'latches', 'handles']
	}
];

/**
 * Get a template by its ID
 */
export function getTemplateById(id: string): ProjectTemplate | undefined {
	return templates.find((t) => t.id === id);
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
