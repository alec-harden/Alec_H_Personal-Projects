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
 */
export type BOMCategory = 'lumber' | 'hardware' | 'finishes' | 'consumables';

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
	// Lumber dimensions (for lumber category items only)
	length?: number; // inches
	width?: number; // inches
	height?: number; // inches (thickness)
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
