/**
 * Board Feet Calculation Utilities
 *
 * Utilities for calculating board feet from lumber dimensions
 * and parsing fractional inch inputs commonly used in woodworking.
 *
 * Board feet formula: (L x W x H) / 144 where all dimensions are in inches
 * 1 board foot = 144 cubic inches (12" x 12" x 1")
 */

/**
 * Parse user input that may contain fractions into a decimal number.
 *
 * Supports:
 * - Pure integers: "12" -> 12
 * - Pure decimals: "6.5" -> 6.5
 * - Pure fractions: "3/4" -> 0.75
 * - Mixed numbers: "1-1/2" or "1 1/2" -> 1.5
 *
 * @param input - User input string
 * @returns Parsed number or null if invalid
 */
export function parseFractionalInches(input: string): number | null {
	const trimmed = input.trim();

	if (!trimmed) {
		return null;
	}

	// Check for mixed number format: "1-1/2" or "1 1/2"
	const mixedMatch = trimmed.match(/^(\d+)[-\s]+(\d+)\/(\d+)$/);
	if (mixedMatch) {
		const whole = parseInt(mixedMatch[1], 10);
		const numerator = parseInt(mixedMatch[2], 10);
		const denominator = parseInt(mixedMatch[3], 10);
		if (denominator === 0) {
			return null;
		}
		return whole + numerator / denominator;
	}

	// Check for pure fraction: "3/4"
	const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
	if (fractionMatch) {
		const numerator = parseInt(fractionMatch[1], 10);
		const denominator = parseInt(fractionMatch[2], 10);
		if (denominator === 0) {
			return null;
		}
		return numerator / denominator;
	}

	// Try parsing as a plain number (integer or decimal)
	const num = parseFloat(trimmed);
	if (isNaN(num)) {
		return null;
	}

	return num;
}

/**
 * Calculate board feet from lumber dimensions.
 *
 * Formula: (L x W x H) / 144
 * All dimensions must be in inches.
 *
 * @param length - Length in inches
 * @param width - Width in inches
 * @param height - Height/thickness in inches
 * @returns Board feet as a decimal, or 0 for invalid inputs
 */
export function calculateBoardFeet(length: number, width: number, height: number): number {
	// Handle zero, negative, or invalid inputs gracefully
	if (length <= 0 || width <= 0 || height <= 0) {
		return 0;
	}

	if (!isFinite(length) || !isFinite(width) || !isFinite(height)) {
		return 0;
	}

	return (length * width * height) / 144;
}

/**
 * Format board feet for display.
 *
 * @param bf - Board feet value
 * @returns Formatted string like "1.5 bf" or "12.33 bf"
 */
export function formatBoardFeet(bf: number): string {
	if (bf === 0 || !isFinite(bf)) {
		return '0 bf';
	}

	// Round to 2 decimal places, then remove trailing zeros
	const rounded = Math.round(bf * 100) / 100;
	const formatted = rounded.toFixed(2).replace(/\.?0+$/, '');

	return `${formatted} bf`;
}

/**
 * Common decimal-to-fraction mappings for woodworking dimensions.
 * These are the most frequently used fractions in lumber measurements.
 */
const COMMON_FRACTIONS: Map<number, string> = new Map([
	[0.125, '1/8'],
	[0.25, '1/4'],
	[0.375, '3/8'],
	[0.5, '1/2'],
	[0.625, '5/8'],
	[0.75, '3/4'],
	[0.875, '7/8']
]);

/**
 * Format a dimension value for display, converting common decimals to fractions.
 *
 * @param value - Dimension value in inches
 * @returns Formatted string (e.g., "12", "3/4", "1-1/2")
 */
export function formatDimension(value: number | undefined): string {
	if (value === undefined || value === null || !isFinite(value)) {
		return '';
	}

	// Handle whole numbers
	if (Number.isInteger(value)) {
		return value.toString();
	}

	// Extract whole and fractional parts
	const whole = Math.floor(value);
	const fractional = value - whole;

	// Round fractional part to avoid floating point issues
	const roundedFractional = Math.round(fractional * 1000) / 1000;

	// Look up the fractional part in common fractions
	const fractionString = COMMON_FRACTIONS.get(roundedFractional);

	if (fractionString) {
		if (whole === 0) {
			return fractionString;
		}
		return `${whole}-${fractionString}`;
	}

	// If not a common fraction, return as decimal
	// Round to 3 decimal places and remove trailing zeros
	const rounded = Math.round(value * 1000) / 1000;
	return rounded.toString();
}
