/**
 * Dimension Validation Constants
 *
 * Standard values for woodworking dimensions.
 * Used for validation warnings (not blocking).
 */

import type { LumberCategory } from '$lib/types/bom';

// Tolerance for floating point comparison (1/64")
export const DIMENSION_TOLERANCE = 0.015625;

/**
 * Standard hardwood thickness values (surfaced and rough)
 * Based on NHLA quarter-sawn system
 */
export const HARDWOOD_THICKNESS_VALUES = [
	0.75, // 3/4" (thin)
	0.8125, // 13/16" (surfaced 4/4)
	1.0, // 1" (rough 4/4)
	1.0625, // 1-1/16" (surfaced 5/4)
	1.25, // 1-1/4" (surfaced 6/4 / rough 5/4)
	1.5, // 1-1/2" (rough 6/4)
	1.75, // 1-3/4" (surfaced 8/4)
	2.0, // 2" (rough 8/4)
	2.75, // 2-3/4" (surfaced 12/4)
	3.0, // 3" (rough 12/4)
	3.75, // 3-3/4" (surfaced 16/4)
	4.0 // 4" (rough 16/4)
] as const;

/**
 * Standard common board thickness values
 * Based on dimensional lumber standards (actual sizes)
 */
export const COMMON_THICKNESS_VALUES = [
	0.75, // 3/4" (actual 1x nominal)
	1.5 // 1-1/2" (actual 2x nominal)
] as const;

/**
 * Standard sheet goods thickness values
 * Based on plywood industry standards
 */
export const SHEET_THICKNESS_VALUES = [
	0.125, // 1/8"
	0.1875, // 3/16"
	0.25, // 1/4"
	0.3125, // 5/16"
	0.34375, // 11/32" (actual 3/8")
	0.375, // 3/8"
	0.46875, // 15/32" (actual 1/2")
	0.5, // 1/2"
	0.59375, // 19/32" (actual 5/8")
	0.625, // 5/8"
	0.71875, // 23/32" (actual 3/4")
	0.75, // 3/4"
	1.0, // 1"
	1.125 // 1-1/8"
] as const;

/**
 * Standard common board widths (actual sizes)
 */
export const COMMON_WIDTH_VALUES = [
	1.5, // 2x2
	2.5, // 1x3
	3.5, // 1x4, 2x4
	5.5, // 1x6, 2x6
	7.25, // 1x8, 2x8
	9.25, // 1x10, 2x10
	11.25 // 1x12, 2x12
] as const;

/**
 * Standard sheet widths (inches)
 */
export const SHEET_WIDTH_VALUES = [
	24, // 2'
	48, // 4' (standard)
	60 // 5' (utility)
] as const;

/**
 * Standard sheet lengths (inches)
 */
export const SHEET_LENGTH_VALUES = [
	48, // 4'
	96, // 8' (standard)
	120 // 10' (utility)
] as const;

/**
 * Get allowed thickness values for a lumber category
 */
export function getThicknessValues(category: LumberCategory): readonly number[] {
	switch (category) {
		case 'hardwood':
			return HARDWOOD_THICKNESS_VALUES;
		case 'common':
			return COMMON_THICKNESS_VALUES;
		case 'sheet':
			return SHEET_THICKNESS_VALUES;
	}
}

/**
 * Check if a value is within tolerance of any standard value
 */
export function isStandardValue(value: number, standards: readonly number[]): boolean {
	return standards.some((std) => Math.abs(value - std) <= DIMENSION_TOLERANCE);
}

/**
 * Validate a thickness value against category standards
 * Returns null if valid, or a warning message if non-standard
 */
export function validateThickness(value: number, category: LumberCategory): string | null {
	const standards = getThicknessValues(category);
	if (isStandardValue(value, standards)) {
		return null;
	}
	return `Non-standard thickness: ${value}" is not a common ${category} thickness`;
}
