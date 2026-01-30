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
	x: number | null; // position on sheet (null for 1D)
	y: number | null; // position on sheet (null for 1D)
	rotated: boolean; // true if 90-degree rotated from original
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
					width: null,
					x: null, // Not used in 1D mode
					y: null, // Not used in 1D mode
					rotated: false // Not used in 1D mode
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
							width: null,
							x: null, // Not used in 1D mode
							y: null, // Not used in 1D mode
							rotated: false // Not used in 1D mode
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
 * Helper interfaces for 2D guillotine bin packing
 */
interface FreeRectangle {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface ExpandedCut2D {
	id: string;
	label: string;
	length: number;
	width: number;
	originalId: string;
	grainMatters: boolean;
}

interface PlacedCut2D {
	cut: ExpandedCut2D;
	x: number;
	y: number;
	rotated: boolean;
}

/**
 * Best Short Side Fit (BSSF) scoring function
 * Returns the minimum leftover space in either dimension
 */
function scoreBSSF(
	freeWidth: number,
	freeHeight: number,
	itemWidth: number,
	itemHeight: number
): number {
	const leftoverHoriz = freeWidth - itemWidth;
	const leftoverVert = freeHeight - itemHeight;
	return Math.min(leftoverHoriz, leftoverVert);
}

/**
 * Shorter Axis Split (SAS) - splits free rectangle after placement
 * Applies kerf to the used dimensions
 */
function splitSAS(
	freeRect: FreeRectangle,
	placedWidth: number,
	placedHeight: number,
	kerf: number
): FreeRectangle[] {
	// Account for kerf in split calculations
	const usedWidth = placedWidth + kerf;
	const usedHeight = placedHeight + kerf;

	const leftoverWidth = freeRect.width - usedWidth;
	const leftoverHeight = freeRect.height - usedHeight;

	const newRects: FreeRectangle[] = [];

	// Split on shorter leftover axis
	if (leftoverWidth < leftoverHeight) {
		// Horizontal split
		// Rectangle above the placed item
		if (leftoverHeight > 0) {
			newRects.push({
				x: freeRect.x,
				y: freeRect.y + usedHeight,
				width: freeRect.width,
				height: leftoverHeight
			});
		}
		// Rectangle to the right of the placed item
		if (leftoverWidth > 0) {
			newRects.push({
				x: freeRect.x + usedWidth,
				y: freeRect.y,
				width: leftoverWidth,
				height: placedHeight
			});
		}
	} else {
		// Vertical split
		// Rectangle to the right of the placed item
		if (leftoverWidth > 0) {
			newRects.push({
				x: freeRect.x + usedWidth,
				y: freeRect.y,
				width: leftoverWidth,
				height: freeRect.height
			});
		}
		// Rectangle above the placed item
		if (leftoverHeight > 0) {
			newRects.push({
				x: freeRect.x,
				y: freeRect.y + usedHeight,
				width: placedWidth,
				height: leftoverHeight
			});
		}
	}

	return newRects;
}

/**
 * Guillotine bin packing algorithm with BSSF+SAS
 * Returns placed cuts and remaining free rectangles
 */
function guillotinePack(
	cuts: ExpandedCut2D[],
	stockWidth: number,
	stockHeight: number,
	kerf: number,
	existingFreeRects?: FreeRectangle[]
): { placed: PlacedCut2D[]; freeRectangles: FreeRectangle[] } {
	// Initialize with existing free rectangles or entire stock
	const freeRectangles: FreeRectangle[] = existingFreeRects || [
		{ x: 0, y: 0, width: stockWidth, height: stockHeight }
	];

	const placed: PlacedCut2D[] = [];

	for (const cut of cuts) {
		let bestScore = Infinity;
		let bestFreeRect: FreeRectangle | null = null;
		let bestRotated = false;

		// Try each free rectangle
		for (const freeRect of freeRectangles) {
			// Try upright orientation
			if (cut.length <= freeRect.width && cut.width <= freeRect.height) {
				const score = scoreBSSF(freeRect.width, freeRect.height, cut.length, cut.width);
				if (score < bestScore) {
					bestScore = score;
					bestFreeRect = freeRect;
					bestRotated = false;
				}
			}

			// Try rotated orientation (if allowed)
			if (
				!cut.grainMatters &&
				cut.width <= freeRect.width &&
				cut.length <= freeRect.height
			) {
				const score = scoreBSSF(freeRect.width, freeRect.height, cut.width, cut.length);
				if (score < bestScore) {
					bestScore = score;
					bestFreeRect = freeRect;
					bestRotated = true;
				}
			}
		}

		if (!bestFreeRect) {
			// Cut doesn't fit - leave it unplaced
			continue;
		}

		// Place the cut
		const placedWidth = bestRotated ? cut.width : cut.length;
		const placedHeight = bestRotated ? cut.length : cut.width;

		placed.push({
			cut,
			x: bestFreeRect.x,
			y: bestFreeRect.y,
			rotated: bestRotated
		});

		// Remove used rectangle and add new free rectangles
		const index = freeRectangles.indexOf(bestFreeRect);
		freeRectangles.splice(index, 1);

		const newRects = splitSAS(bestFreeRect, placedWidth, placedHeight, kerf);
		freeRectangles.push(...newRects);
	}

	return { placed, freeRectangles };
}

/**
 * 2D Sheet optimization using Guillotine BSSF+SAS algorithm
 */
export function optimizeCuts2D(cuts: Cut[], stock: Stock[], kerf: number): OptimizationResult {
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
	const expandedCuts: ExpandedCut2D[] = [];
	cuts.forEach((cut) => {
		for (let i = 0; i < cut.quantity; i++) {
			expandedCuts.push({
				id: `${cut.id}-${i}`,
				label: cut.label || `Cut ${cut.length}"x${cut.width}"`,
				length: cut.length,
				width: cut.width ?? 0,
				originalId: cut.id,
				grainMatters: cut.grainMatters ?? false
			});
		}
	});

	// Sort cuts descending by area (heuristic: place larger first)
	expandedCuts.sort((a, b) => b.length * b.width - a.length * a.width);

	// Check if largest cut fits in largest stock (both orientations)
	const maxCutLength = Math.max(...cuts.map((c) => c.length));
	const maxCutWidth = Math.max(...cuts.map((c) => c.width ?? 0));
	const maxStockLength = Math.max(...stock.map((s) => s.length));
	const maxStockWidth = Math.max(...stock.map((s) => s.width ?? 0));

	// Check both orientations
	const largestFits =
		(maxCutLength <= maxStockLength && maxCutWidth <= maxStockWidth) ||
		(maxCutWidth <= maxStockLength && maxCutLength <= maxStockWidth);

	if (!largestFits) {
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

	// Sort stock descending by area (use larger sheets first)
	expandedStock.sort((a, b) => b.length * b.width - a.length * a.width);

	// Guillotine packing algorithm
	interface PlanWithFreeRects extends StockPlan {
		freeRectangles: FreeRectangle[];
	}

	const plans: PlanWithFreeRects[] = [];
	const unplacedCuts: string[] = [];

	for (const cut of expandedCuts) {
		let placed = false;

		// Try to fit into existing plans (sheets already in use)
		for (const plan of plans) {
			const result = guillotinePack(
				[cut],
				plan.stockLength,
				plan.stockWidth ?? 0,
				kerf,
				plan.freeRectangles
			);

			if (result.placed.length > 0) {
				// Successfully placed in this plan
				const placedCut = result.placed[0];
				plan.cuts.push({
					cutId: placedCut.cut.id,
					cutLabel: placedCut.cut.label,
					length: placedCut.rotated ? placedCut.cut.width : placedCut.cut.length,
					width: placedCut.rotated ? placedCut.cut.length : placedCut.cut.width,
					x: placedCut.x,
					y: placedCut.y,
					rotated: placedCut.rotated
				});
				plan.freeRectangles = result.freeRectangles;
				placed = true;
				break;
			}
		}

		// If not placed, try a new stock sheet
		if (!placed) {
			const availableStock = expandedStock[plans.length];
			if (availableStock) {
				const result = guillotinePack(
					[cut],
					availableStock.length,
					availableStock.width,
					kerf
				);

				if (result.placed.length > 0) {
					const placedCut = result.placed[0];
					plans.push({
						stockId: availableStock.id,
						stockLabel: availableStock.label,
						stockLength: availableStock.length,
						stockWidth: availableStock.width,
						cuts: [
							{
								cutId: placedCut.cut.id,
								cutLabel: placedCut.cut.label,
								length: placedCut.rotated ? placedCut.cut.width : placedCut.cut.length,
								width: placedCut.rotated ? placedCut.cut.length : placedCut.cut.width,
								x: placedCut.x,
								y: placedCut.y,
								rotated: placedCut.rotated
							}
						],
						wasteLength: 0, // Not meaningful for 2D
						wasteArea: 0, // Calculated below
						freeRectangles: result.freeRectangles
					});
					placed = true;
				}
			}
		}

		// Track unplaced cuts
		if (!placed && !unplacedCuts.includes(cut.originalId)) {
			unplacedCuts.push(cut.originalId);
		}
	}

	// Calculate waste for each plan using 2D kerf formula
	for (const plan of plans) {
		const stockArea = plan.stockLength * (plan.stockWidth ?? 0);
		const totalCutArea = plan.cuts.reduce(
			(sum, c) => sum + (c.length ?? 0) * (c.width ?? 0),
			0
		);

		// Conservative kerf estimate: each cut loses kerf in both dimensions
		const kerfLossArea = plan.cuts.reduce((sum, cut) => {
			return sum + (cut.length ?? 0) * kerf + (cut.width ?? 0) * kerf;
		}, 0);

		plan.wasteArea = Math.max(0, stockArea - totalCutArea - kerfLossArea);
	}

	// Calculate summary
	const totalStockArea = plans.reduce(
		(sum, plan) => sum + plan.stockLength * (plan.stockWidth ?? 0),
		0
	);
	const totalWasteArea = plans.reduce((sum, plan) => sum + (plan.wasteArea ?? 0), 0);
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
