/**
 * Cut List Optimizer Type Definitions
 *
 * Core types for the cut list optimizer workflow:
 * - CutListMode: Linear (1D) or sheet (2D) optimization
 * - Cut: Individual cut requirements
 * - Stock: Available stock materials
 * - KerfPreset: Common blade width presets
 */

/**
 * Optimization modes
 */
export type CutListMode = 'linear' | 'sheet';

/**
 * Individual cut entry (what user needs to cut)
 */
export interface Cut {
	id: string;
	length: number; // inches
	width: number | null; // inches, null for linear mode
	quantity: number;
	label: string; // optional name
}

/**
 * Stock material entry (what's available to cut from)
 */
export interface Stock {
	id: string;
	length: number; // inches
	width: number | null; // inches, null for linear mode
	quantity: number;
	label: string; // optional name
}

/**
 * Kerf presets for common blade widths
 */
export interface KerfPreset {
	label: string;
	value: number;
}

export const KERF_PRESETS: KerfPreset[] = [
	{ label: 'Standard (1/8")', value: 0.125 },
	{ label: 'Thin Kerf (3/32")', value: 0.09375 },
	{ label: 'Thick Blade (5/32")', value: 0.15625 },
	{ label: 'No Kerf', value: 0 }
];

/**
 * Helper to create a new cut with defaults
 */
export function createCut(mode: CutListMode): Cut {
	return {
		id: crypto.randomUUID(),
		length: 0,
		width: mode === 'sheet' ? 0 : null,
		quantity: 1,
		label: ''
	};
}

/**
 * Helper to create a new stock with defaults
 */
export function createStock(mode: CutListMode): Stock {
	return {
		id: crypto.randomUUID(),
		length: 0,
		width: mode === 'sheet' ? 0 : null,
		quantity: 1,
		label: ''
	};
}

/**
 * Validation helpers
 */
export function isValidCut(cut: Cut, mode: CutListMode): boolean {
	if (cut.length <= 0) return false;
	if (cut.quantity < 1) return false;
	if (mode === 'sheet' && (cut.width === null || cut.width <= 0)) return false;
	return true;
}

export function isValidStock(stock: Stock, mode: CutListMode): boolean {
	if (stock.length <= 0) return false;
	if (stock.quantity < 1) return false;
	if (mode === 'sheet' && (stock.width === null || stock.width <= 0)) return false;
	return true;
}
