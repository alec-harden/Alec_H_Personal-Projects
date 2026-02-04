/**
 * Seed Default Dimension Values
 *
 * Seeds the dimension_values table with default values on first run.
 * Based on the constants from dimension-validation.ts.
 */

import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { dimensionValues } from './schema';

type DB = LibSQLDatabase<Record<string, never>>;

/**
 * Standard hardwood thickness values (surfaced and rough)
 * Based on NHLA quarter-sawn system
 * 12 values
 */
const HARDWOOD_THICKNESS_VALUES = [
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
];

/**
 * Standard common board thickness values
 * Based on dimensional lumber standards (actual sizes)
 * 2 values
 */
const COMMON_THICKNESS_VALUES = [
	0.75, // 3/4" (actual 1x nominal)
	1.5 // 1-1/2" (actual 2x nominal)
];

/**
 * Standard common board widths (actual sizes)
 * 7 values
 */
const COMMON_WIDTH_VALUES = [
	1.5, // 2x2
	2.5, // 1x3
	3.5, // 1x4, 2x4
	5.5, // 1x6, 2x6
	7.25, // 1x8, 2x8
	9.25, // 1x10, 2x10
	11.25 // 1x12, 2x12
];

/**
 * Standard sheet goods thickness values
 * Based on plywood industry standards
 * 14 values
 */
const SHEET_THICKNESS_VALUES = [
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
];

/**
 * Standard sheet widths (inches)
 * 3 values
 */
const SHEET_WIDTH_VALUES = [
	24, // 2'
	48, // 4' (standard)
	60 // 5' (utility)
];

/**
 * Standard sheet lengths (inches)
 * 3 values
 */
const SHEET_LENGTH_VALUES = [
	48, // 4'
	96, // 8' (standard)
	120 // 10' (utility)
];

/**
 * Seed default dimension values into the database.
 * Creates 41 default values:
 * - 12 hardwood thickness
 * - 2 common thickness
 * - 7 common width
 * - 14 sheet thickness
 * - 3 sheet width
 * - 3 sheet length
 */
export async function seedDefaultDimensions(db: DB): Promise<void> {
	const now = new Date();
	const values: (typeof dimensionValues.$inferInsert)[] = [];

	// Helper to add dimension values
	const addValues = (
		category: 'hardwood' | 'common' | 'sheet',
		dimensionType: 'thickness' | 'width' | 'length',
		vals: number[]
	) => {
		for (const value of vals) {
			values.push({
				id: crypto.randomUUID(),
				category,
				dimensionType,
				value,
				isDefault: true,
				createdAt: now,
				updatedAt: now
			});
		}
	};

	// Hardwood: thickness only (12 values)
	addValues('hardwood', 'thickness', HARDWOOD_THICKNESS_VALUES);

	// Common: thickness (2) + width (7) = 9 values
	addValues('common', 'thickness', COMMON_THICKNESS_VALUES);
	addValues('common', 'width', COMMON_WIDTH_VALUES);

	// Sheet: thickness (14) + width (3) + length (3) = 20 values
	addValues('sheet', 'thickness', SHEET_THICKNESS_VALUES);
	addValues('sheet', 'width', SHEET_WIDTH_VALUES);
	addValues('sheet', 'length', SHEET_LENGTH_VALUES);

	// Total: 12 + 9 + 20 = 41 values

	// Insert all values in a single batch
	if (values.length > 0) {
		await db.insert(dimensionValues).values(values);
	}
}
