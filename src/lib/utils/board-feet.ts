/**
 * Dimension Utilities for Woodworking
 *
 * Utilities for parsing fractional inch inputs and formatting dimensions
 * commonly used in woodworking measurements.
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
