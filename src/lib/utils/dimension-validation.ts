/**
 * Dimension Validation
 *
 * Standard values for woodworking dimensions.
 * Reads from database with caching. Used for validation warnings (not blocking).
 */

import type { LumberCategory } from '$lib/types/bom';
import { db } from '$lib/server/db';
import { dimensionValues } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

// Tolerance for floating point comparison (1/64")
export const DIMENSION_TOLERANCE = 0.015625;

// Cache for dimension values
let dimensionCache: Map<string, number[]> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Generate cache key for a dimension lookup
 */
function getCacheKey(category: LumberCategory, dimensionType: 'thickness' | 'width' | 'length'): string {
	return `${category}:${dimensionType}`;
}

/**
 * Check if cache is valid
 */
function isCacheValid(): boolean {
	return dimensionCache !== null && Date.now() - cacheTimestamp < CACHE_TTL;
}

/**
 * Invalidate the dimension cache (call after admin updates)
 */
export function invalidateDimensionCache(): void {
	dimensionCache = null;
	cacheTimestamp = 0;
}

/**
 * Load all dimension values into cache
 */
async function loadCache(): Promise<void> {
	const values = await db.select().from(dimensionValues);

	dimensionCache = new Map();
	for (const row of values) {
		const key = getCacheKey(row.category as LumberCategory, row.dimensionType as 'thickness' | 'width' | 'length');
		if (!dimensionCache.has(key)) {
			dimensionCache.set(key, []);
		}
		dimensionCache.get(key)!.push(row.value);
	}
	cacheTimestamp = Date.now();
}

/**
 * Get dimension values from cache or database
 */
async function getDimensionValues(
	category: LumberCategory,
	dimensionType: 'thickness' | 'width' | 'length'
): Promise<number[]> {
	if (!isCacheValid()) {
		await loadCache();
	}

	const key = getCacheKey(category, dimensionType);
	return dimensionCache?.get(key) || [];
}

/**
 * Get allowed thickness values for a lumber category
 */
export async function getThicknessValues(category: LumberCategory): Promise<number[]> {
	return getDimensionValues(category, 'thickness');
}

/**
 * Get allowed width values for a lumber category
 */
export async function getWidthValues(category: LumberCategory): Promise<number[]> {
	return getDimensionValues(category, 'width');
}

/**
 * Get allowed length values for a lumber category
 */
export async function getLengthValues(category: LumberCategory): Promise<number[]> {
	return getDimensionValues(category, 'length');
}

/**
 * Check if a value is within tolerance of any standard value
 */
export function isStandardValue(value: number, standards: readonly number[] | number[]): boolean {
	return standards.some((std) => Math.abs(value - std) <= DIMENSION_TOLERANCE);
}

/**
 * Validate a thickness value against category standards
 * Returns null if valid, or a warning message if non-standard
 */
export async function validateThickness(value: number, category: LumberCategory): Promise<string | null> {
	const standards = await getThicknessValues(category);
	if (isStandardValue(value, standards)) {
		return null;
	}
	return `Non-standard thickness: ${value}" is not a common ${category} thickness`;
}

/**
 * Validate a width value against category standards
 * Returns null if valid, or a warning message if non-standard
 */
export async function validateWidth(value: number, category: LumberCategory): Promise<string | null> {
	const standards = await getWidthValues(category);
	// Only validate if there are width standards for this category
	if (standards.length === 0) {
		return null;
	}
	if (isStandardValue(value, standards)) {
		return null;
	}
	return `Non-standard width: ${value}" is not a common ${category} width`;
}

/**
 * Validate a length value against category standards
 * Returns null if valid, or a warning message if non-standard
 */
export async function validateLength(value: number, category: LumberCategory): Promise<string | null> {
	const standards = await getLengthValues(category);
	// Only validate if there are length standards for this category
	if (standards.length === 0) {
		return null;
	}
	if (isStandardValue(value, standards)) {
		return null;
	}
	return `Non-standard length: ${value}" is not a common ${category} length`;
}
