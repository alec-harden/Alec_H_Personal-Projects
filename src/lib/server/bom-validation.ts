/**
 * BOM Validation Utilities
 *
 * Server-side validation for BOM items.
 * Returns warnings (does not block save).
 */

import { isLumberCategory, type BOMCategory, type LumberCategory } from '$lib/types/bom';
import {
	validateThickness,
	validateWidth,
	validateLength
} from '$lib/utils/dimension-validation';

/**
 * Validation warning for a BOM item
 */
export interface ValidationWarning {
	itemId: string;
	itemName: string;
	field: string;
	message: string;
}

/**
 * Validate a BOM item's dimensions
 * Returns warnings (does not block save)
 */
export async function validateBOMItemDimensions(
	itemId: string,
	itemName: string,
	category: BOMCategory,
	length?: number | null,
	width?: number | null,
	thickness?: number | null
): Promise<ValidationWarning[]> {
	const warnings: ValidationWarning[] = [];

	// Only validate lumber categories
	if (!isLumberCategory(category)) {
		return warnings;
	}

	const lumberCategory = category as LumberCategory;

	// VAL-01/DIM-03: Warn if dimensions missing for lumber items
	if (length === undefined || length === null) {
		warnings.push({
			itemId,
			itemName,
			field: 'length',
			message: 'Length dimension is missing'
		});
	}

	if (width === undefined || width === null) {
		warnings.push({
			itemId,
			itemName,
			field: 'width',
			message: 'Width dimension is missing'
		});
	}

	if (thickness === undefined || thickness === null) {
		warnings.push({
			itemId,
			itemName,
			field: 'thickness',
			message: 'Thickness dimension is missing'
		});
	}

	// VAL-02/DIM-04: Warn for non-standard dimension values
	if (thickness !== undefined && thickness !== null) {
		const thicknessWarning = await validateThickness(thickness, lumberCategory);
		if (thicknessWarning) {
			warnings.push({
				itemId,
				itemName,
				field: 'thickness',
				message: thicknessWarning
			});
		}
	}

	// Width validation for common boards and sheet goods
	if (width !== undefined && width !== null) {
		const widthWarning = await validateWidth(width, lumberCategory);
		if (widthWarning) {
			warnings.push({
				itemId,
				itemName,
				field: 'width',
				message: widthWarning
			});
		}
	}

	// Length validation for sheet goods
	if (length !== undefined && length !== null) {
		const lengthWarning = await validateLength(length, lumberCategory);
		if (lengthWarning) {
			warnings.push({
				itemId,
				itemName,
				field: 'length',
				message: lengthWarning
			});
		}
	}

	return warnings;
}

/**
 * Determine if an item should be marked as cutItem based on category
 */
export function shouldBeCutItem(category: BOMCategory): boolean {
	return isLumberCategory(category);
}
