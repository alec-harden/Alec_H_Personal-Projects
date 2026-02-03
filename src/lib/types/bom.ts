/**
 * BOM (Bill of Materials) Type Definitions
 *
 * Core types for the BOM generation workflow:
 * - BOMCategory: Classification for materials
 * - BOMItem: Individual line items in a BOM
 * - BOM: Complete bill of materials output
 * - ProjectDetails: Wizard input for BOM generation
 */

/**
 * Categories for organizing BOM items
 * v4.0: lumber split into hardwood/common/sheet for better material organization
 */
export type BOMCategory =
	| 'hardwood' // Premium hardwoods: Oak, Maple, Walnut, Cherry, etc.
	| 'common' // Dimensional lumber: Pine, Fir, SPF, etc.
	| 'sheet' // Sheet goods: Plywood, MDF, Particle board, etc.
	| 'hardware'
	| 'finishes'
	| 'consumables';

/**
 * Lumber categories (items with dimensions, eligible for cut list)
 */
export type LumberCategory = 'hardwood' | 'common' | 'sheet';

/**
 * Category display order for UI
 */
export const CATEGORY_ORDER: BOMCategory[] = [
	'hardwood',
	'common',
	'sheet',
	'hardware',
	'finishes',
	'consumables'
];

/**
 * Check if a category is a lumber category (has dimensions)
 */
export function isLumberCategory(category: BOMCategory): category is LumberCategory {
	return category === 'hardwood' || category === 'common' || category === 'sheet';
}

/**
 * Individual item in a Bill of Materials
 */
export interface BOMItem {
	id: string;
	name: string;
	description?: string;
	quantity: number;
	unit: string; // e.g., 'pcs', 'bf', 'oz', 'each'
	category: BOMCategory;
	notes?: string;
	hidden?: boolean; // Phase 4: visibility toggle support (EDIT-03)
	/** Whether this item goes to cut list optimizer */
	cutItem?: boolean;
	// Lumber dimensions (for lumber category items only)
	length?: number; // inches
	width?: number; // inches
	/** Thickness in inches (v4.0: renamed from height for clarity) */
	thickness?: number; // inches
	/** @deprecated Use thickness instead. Kept for migration compatibility. */
	height?: number; // inches
}

/**
 * Complete Bill of Materials for a project
 */
export interface BOM {
	projectName: string;
	projectType: string; // template id
	generatedAt: string; // ISO date
	items: BOMItem[];
}

/**
 * User input collected through the project wizard
 */
export interface ProjectDetails {
	templateId: string;
	projectName: string;
	dimensions: {
		length: number;
		width: number;
		height?: number;
		unit: 'inches' | 'cm';
	};
	joinery: string[]; // selected joinery method ids
	woodSpecies: string;
	finish: string;
	additionalNotes?: string;
}
