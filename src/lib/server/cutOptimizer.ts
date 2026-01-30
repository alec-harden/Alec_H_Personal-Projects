/**
 * Cut Optimizer Algorithms
 *
 * Placeholder optimization algorithms for Phase 18.
 * These implement simple greedy first-fit-decreasing (FFD) to validate data flow.
 * Will be replaced with proper algorithms in Phases 19 (1D FFD) and 20 (2D Guillotine).
 */

import type { Cut, Stock } from '$lib/types/cutlist';

export interface CutAssignment {
	cutId: string;
	cutLabel: string;
	length: number;
	width: number | null;
}

export interface StockPlan {
	stockId: string;
	stockLabel: string;
	stockLength: number;
	stockWidth: number | null;
	cuts: CutAssignment[];
	wasteLength: number; // linear inches wasted
	wasteArea: number | null; // square inches wasted (sheet mode)
}

export interface OptimizationResult {
	success: boolean;
	error?: string;
	plans: StockPlan[];
	summary: {
		totalCuts: number;
		totalStockUsed: number;
		totalWaste: number; // linear inches or square inches
		wastePercentage: number; // 0-100
		unplacedCuts: string[]; // cut IDs that couldn't fit
		totalLinearFeetUsed: number; // feet (not inches) - for linear mode
		totalLinearFeetAvailable: number; // feet (not inches) - for linear mode
	};
}

/**
 * 1D Linear optimization using First Fit Decreasing (FFD) algorithm
 * Phase 19 enhancement: Sorts both cuts and stock descending, adds linear feet tracking
 */
export function optimizeCuts1D(cuts: Cut[], stock: Stock[], kerf: number): OptimizationResult {
	// Validation
	if (cuts.length === 0) {
		return {
			success: false,
			error: 'No cuts provided',
			plans: [],
			summary: {
				totalCuts: 0,
				totalStockUsed: 0,
				totalWaste: 0,
				wastePercentage: 0,
				unplacedCuts: [],
				totalLinearFeetUsed: 0,
				totalLinearFeetAvailable: 0
			}
		};
	}

	if (stock.length === 0) {
		return {
			success: false,
			error: 'No stock provided',
			plans: [],
			summary: {
				totalCuts: 0,
				totalStockUsed: 0,
				totalWaste: 0,
				wastePercentage: 0,
				unplacedCuts: [],
				totalLinearFeetUsed: 0,
				totalLinearFeetAvailable: 0
			}
		};
	}

	// Expand cuts by quantity
	const expandedCuts: Array<{ id: string; label: string; length: number; originalId: string }> =
		[];
	cuts.forEach((cut) => {
		for (let i = 0; i < cut.quantity; i++) {
			expandedCuts.push({
				id: `${cut.id}-${i}`,
				label: cut.label || `Cut ${cut.length}"`,
				length: cut.length,
				originalId: cut.id
			});
		}
	});

	// Sort cuts descending by length (First Fit Decreasing)
	expandedCuts.sort((a, b) => b.length - a.length);

	// Check if largest cut fits in largest stock
	const maxCutLength = Math.max(...cuts.map((c) => c.length));
	const maxStockLength = Math.max(...stock.map((s) => s.length));
	if (maxCutLength > maxStockLength) {
		return {
			success: false,
			error: `Largest cut (${maxCutLength}") is larger than largest stock (${maxStockLength}")`,
			plans: [],
			summary: {
				totalCuts: expandedCuts.length,
				totalStockUsed: 0,
				totalWaste: 0,
				wastePercentage: 0,
				unplacedCuts: cuts.map((c) => c.id),
				totalLinearFeetUsed: 0,
				totalLinearFeetAvailable: 0
			}
		};
	}

	// Expand stock by quantity
	const expandedStock: Array<{
		id: string;
		label: string;
		length: number;
		originalId: string;
	}> = [];
	stock.forEach((stockItem) => {
		for (let i = 0; i < stockItem.quantity; i++) {
			expandedStock.push({
				id: `${stockItem.id}-${i}`,
				label: stockItem.label || `Stock ${stockItem.length}"`,
				length: stockItem.length,
				originalId: stockItem.id
			});
		}
	});

	// Sort stock descending by length (try longest pieces first for efficiency)
	expandedStock.sort((a, b) => b.length - a.length);

	// First-fit algorithm
	const plans: StockPlan[] = [];
	const unplacedCuts: string[] = [];
	let totalCutsPlaced = 0;
	let totalWaste = 0;

	for (const cut of expandedCuts) {
		let placed = false;

		// Try to fit into existing plans
		for (const plan of plans) {
			const usedLength =
				plan.cuts.reduce((sum, c) => sum + c.length, 0) +
				(plan.cuts.length > 0 ? plan.cuts.length * kerf : 0);
			const remainingLength = plan.stockLength - usedLength;

			// Check if cut fits (including kerf before this cut)
			const requiredLength = cut.length + (plan.cuts.length > 0 ? kerf : 0);
			if (requiredLength <= remainingLength) {
				plan.cuts.push({
					cutId: cut.id,
					cutLabel: cut.label,
					length: cut.length,
					width: null
				});
				placed = true;
				totalCutsPlaced++;
				break;
			}
		}

		// If not placed, try a new stock piece
		if (!placed) {
			const availableStock = expandedStock[plans.length];
			if (availableStock && cut.length <= availableStock.length) {
				plans.push({
					stockId: availableStock.id,
					stockLabel: availableStock.label,
					stockLength: availableStock.length,
					stockWidth: null,
					cuts: [
						{
							cutId: cut.id,
							cutLabel: cut.label,
							length: cut.length,
							width: null
						}
					],
					wasteLength: 0, // Will be calculated below
					wasteArea: null
				});
				placed = true;
				totalCutsPlaced++;
			}
		}

		// If still not placed, add to unplaced list
		if (!placed) {
			if (!unplacedCuts.includes(cut.originalId)) {
				unplacedCuts.push(cut.originalId);
			}
		}
	}

	// Calculate waste for each plan
	for (const plan of plans) {
		const usedLength =
			plan.cuts.reduce((sum, c) => sum + c.length, 0) +
			(plan.cuts.length > 0 ? (plan.cuts.length - 1) * kerf : 0);
		plan.wasteLength = plan.stockLength - usedLength;
		totalWaste += plan.wasteLength;
	}

	// Calculate total stock material
	const totalStockMaterial = plans.reduce((sum, plan) => sum + plan.stockLength, 0);

	// Calculate waste percentage
	const wastePercentage = totalStockMaterial > 0 ? (totalWaste / totalStockMaterial) * 100 : 0;

	// Linear feet summary (convert from inches to feet)
	const totalLinearFeetUsed = totalStockMaterial / 12;
	const totalLinearFeetAvailable = expandedStock.reduce((sum, s) => sum + s.length, 0) / 12;

	return {
		success: true,
		plans,
		summary: {
			totalCuts: expandedCuts.length,
			totalStockUsed: plans.length,
			totalWaste,
			wastePercentage,
			unplacedCuts,
			totalLinearFeetUsed,
			totalLinearFeetAvailable
		}
	};
}

/**
 * 2D Sheet optimization - placeholder implementation
 * TODO: Replace with guillotine algorithm in Phase 20
 */
export function optimizeCuts2D(cuts: Cut[], stock: Stock[], kerf: number): OptimizationResult {
	// For now, treat as 1D optimization on length only
	// This is a simplified placeholder - proper 2D nesting comes in Phase 20

	// Validation
	if (cuts.length === 0) {
		return {
			success: false,
			error: 'No cuts provided',
			plans: [],
			summary: {
				totalCuts: 0,
				totalStockUsed: 0,
				totalWaste: 0,
				wastePercentage: 0,
				unplacedCuts: [],
				totalLinearFeetUsed: 0,
				totalLinearFeetAvailable: 0
			}
		};
	}

	if (stock.length === 0) {
		return {
			success: false,
			error: 'No stock provided',
			plans: [],
			summary: {
				totalCuts: 0,
				totalStockUsed: 0,
				totalWaste: 0,
				wastePercentage: 0,
				unplacedCuts: [],
				totalLinearFeetUsed: 0,
				totalLinearFeetAvailable: 0
			}
		};
	}

	// Expand cuts by quantity
	const expandedCuts: Array<{
		id: string;
		label: string;
		length: number;
		width: number;
		originalId: string;
	}> = [];
	cuts.forEach((cut) => {
		for (let i = 0; i < cut.quantity; i++) {
			expandedCuts.push({
				id: `${cut.id}-${i}`,
				label: cut.label || `Cut ${cut.length}"x${cut.width}"`,
				length: cut.length,
				width: cut.width ?? 0,
				originalId: cut.id
			});
		}
	});

	// Sort cuts descending by area (placeholder heuristic)
	expandedCuts.sort((a, b) => b.length * b.width - a.length * a.width);

	// Check if largest cut fits in largest stock
	const maxCutLength = Math.max(...cuts.map((c) => c.length));
	const maxCutWidth = Math.max(...cuts.map((c) => c.width ?? 0));
	const maxStockLength = Math.max(...stock.map((s) => s.length));
	const maxStockWidth = Math.max(...stock.map((s) => s.width ?? 0));

	if (maxCutLength > maxStockLength || maxCutWidth > maxStockWidth) {
		return {
			success: false,
			error: `Largest cut (${maxCutLength}"x${maxCutWidth}") exceeds largest stock (${maxStockLength}"x${maxStockWidth}")`,
			plans: [],
			summary: {
				totalCuts: expandedCuts.length,
				totalStockUsed: 0,
				totalWaste: 0,
				wastePercentage: 0,
				unplacedCuts: cuts.map((c) => c.id),
				totalLinearFeetUsed: 0,
				totalLinearFeetAvailable: 0
			}
		};
	}

	// Expand stock by quantity
	const expandedStock: Array<{
		id: string;
		label: string;
		length: number;
		width: number;
		originalId: string;
	}> = [];
	stock.forEach((stockItem) => {
		for (let i = 0; i < stockItem.quantity; i++) {
			expandedStock.push({
				id: `${stockItem.id}-${i}`,
				label: stockItem.label || `Sheet ${stockItem.length}"x${stockItem.width}"`,
				length: stockItem.length,
				width: stockItem.width ?? 0,
				originalId: stockItem.id
			});
		}
	});

	// Very simple placeholder: one cut per stock (will be replaced in Phase 20)
	const plans: StockPlan[] = [];
	const unplacedCuts: string[] = [];
	let totalCutsPlaced = 0;
	let totalWasteArea = 0;

	for (const cut of expandedCuts) {
		const availableStock = expandedStock[plans.length];
		if (
			availableStock &&
			cut.length <= availableStock.length &&
			cut.width <= availableStock.width
		) {
			const stockArea = availableStock.length * availableStock.width;
			const cutArea = cut.length * cut.width;
			const wasteArea = stockArea - cutArea;

			plans.push({
				stockId: availableStock.id,
				stockLabel: availableStock.label,
				stockLength: availableStock.length,
				stockWidth: availableStock.width,
				cuts: [
					{
						cutId: cut.id,
						cutLabel: cut.label,
						length: cut.length,
						width: cut.width
					}
				],
				wasteLength: 0, // Not meaningful for 2D
				wasteArea
			});
			totalCutsPlaced++;
			totalWasteArea += wasteArea;
		} else {
			if (!unplacedCuts.includes(cut.originalId)) {
				unplacedCuts.push(cut.originalId);
			}
		}
	}

	// Calculate total stock material area
	const totalStockArea = plans.reduce(
		(sum, plan) => sum + (plan.stockLength * (plan.stockWidth ?? 0)),
		0
	);

	// Calculate waste percentage
	const wastePercentage = totalStockArea > 0 ? (totalWasteArea / totalStockArea) * 100 : 0;

	return {
		success: true,
		plans,
		summary: {
			totalCuts: expandedCuts.length,
			totalStockUsed: plans.length,
			totalWaste: totalWasteArea,
			wastePercentage,
			unplacedCuts,
			totalLinearFeetUsed: 0, // Not applicable for sheet mode
			totalLinearFeetAvailable: 0 // Not applicable for sheet mode
		}
	};
}
