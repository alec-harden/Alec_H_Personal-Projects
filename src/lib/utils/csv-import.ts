/**
 * CSV Import Utilities
 *
 * Provides CSV parsing, validation, and BOMItem conversion for CSV import feature.
 * Handles RFC 4180 CSVs with UTF-8 BOM, Excel exports, and various encoding issues.
 */

import Papa from 'papaparse';
import type { BOMItem, BOMCategory } from '$lib/types/bom';
import { isLumberCategory } from '$lib/types/bom';

/**
 * CSV validation error with row, field, message, and error code
 */
export interface CSVValidationError {
	row: number;
	field: string;
	message: string;
	code: string;
}

/**
 * Result of CSV parsing - items and validation errors
 */
export interface CSVParseResult {
	items: BOMItem[];
	errors: CSVValidationError[];
}

/**
 * Pre-parse file validation
 * Checks extension, MIME type, size, and empty file
 * @returns Error message or null if valid
 */
export function validateFile(file: File): string | null {
	// Check extension
	const fileName = file.name.toLowerCase();
	if (!fileName.endsWith('.csv')) {
		return 'File must have .csv extension';
	}

	// Check MIME type (browsers vary on CSV MIME type)
	const validMimeTypes = ['text/csv', 'text/plain', 'application/csv', ''];
	if (!validMimeTypes.includes(file.type)) {
		return `Invalid file type: ${file.type}. Expected CSV file.`;
	}

	// Check file size <= 10MB
	const maxSize = 10 * 1024 * 1024;
	if (file.size > maxSize) {
		return `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum 10MB.`;
	}

	// Check not empty
	if (file.size === 0) {
		return 'File is empty';
	}

	return null;
}

/**
 * Validate CSV headers
 * Required headers: Category, Name, Quantity, Unit (case-insensitive)
 * @returns Array of validation errors (empty if valid)
 */
export function validateHeaders(headers: string[]): CSVValidationError[] {
	const errors: CSVValidationError[] = [];
	const requiredHeaders = ['Category', 'Name', 'Quantity', 'Unit'];

	// Normalize headers for comparison (lowercase, trim)
	const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

	for (const required of requiredHeaders) {
		const requiredNormalized = required.toLowerCase();
		if (!normalizedHeaders.includes(requiredNormalized)) {
			errors.push({
				row: 0,
				field: required,
				message: `Missing required header: ${required}`,
				code: 'MISSING_HEADER'
			});
		}
	}

	return errors;
}

/**
 * Validate a single CSV row
 * Checks required fields and data types
 * @returns Array of validation errors for this row
 */
export function validateRow(
	row: Record<string, string>,
	rowNumber: number
): CSVValidationError[] {
	const errors: CSVValidationError[] = [];

	// Name required
	const name = row.Name?.trim() || '';
	if (!name) {
		errors.push({
			row: rowNumber,
			field: 'Name',
			message: 'Name is required',
			code: 'REQUIRED_FIELD'
		});
	}

	// Category required and must be valid
	const category = row.Category?.trim().toLowerCase() || '';
	if (!category) {
		errors.push({
			row: rowNumber,
			field: 'Category',
			message: 'Category is required',
			code: 'REQUIRED_FIELD'
		});
	} else {
		// v4.0: Support all 6 categories (hardwood/common/sheet replaced lumber)
		const validCategories = ['hardwood', 'common', 'sheet', 'hardware', 'finishes', 'consumables'];
		if (!validCategories.includes(category)) {
			errors.push({
				row: rowNumber,
				field: 'Category',
				message: `Invalid category: ${category}. Must be one of: hardwood, common, sheet, hardware, finishes, consumables`,
				code: 'INVALID_CATEGORY'
			});
		}
	}

	// Quantity required and must be positive number
	const quantityStr = row.Quantity?.trim() || '';
	if (!quantityStr) {
		errors.push({
			row: rowNumber,
			field: 'Quantity',
			message: 'Quantity is required',
			code: 'REQUIRED_FIELD'
		});
	} else {
		const quantity = parseFloat(quantityStr);
		if (isNaN(quantity) || quantity <= 0) {
			errors.push({
				row: rowNumber,
				field: 'Quantity',
				message: `Invalid quantity: ${quantityStr}. Must be a positive number`,
				code: 'INVALID_NUMBER'
			});
		}
	}

	// Unit required
	const unit = row.Unit?.trim() || '';
	if (!unit) {
		errors.push({
			row: rowNumber,
			field: 'Unit',
			message: 'Unit is required',
			code: 'REQUIRED_FIELD'
		});
	}

	// Dimensions are optional - only validate if present
	const length = row.Length?.trim() || '';
	const width = row.Width?.trim() || '';
	// Support both Height and Thickness columns for backward compatibility
	const thickness = row.Thickness?.trim() || row.Height?.trim() || '';

	// If any dimension is provided, validate it's a valid positive number
	if (length) {
		const parsed = parseFloat(length);
		if (isNaN(parsed) || parsed <= 0) {
			errors.push({
				row: rowNumber,
				field: 'Length',
				message: `Invalid length: ${length}. Must be a positive number`,
				code: 'INVALID_NUMBER'
			});
		}
	}
	if (width) {
		const parsed = parseFloat(width);
		if (isNaN(parsed) || parsed <= 0) {
			errors.push({
				row: rowNumber,
				field: 'Width',
				message: `Invalid width: ${width}. Must be a positive number`,
				code: 'INVALID_NUMBER'
			});
		}
	}
	if (thickness) {
		const parsed = parseFloat(thickness);
		if (isNaN(parsed) || parsed <= 0) {
			errors.push({
				row: rowNumber,
				field: 'Thickness',
				message: `Invalid thickness: ${thickness}. Must be a positive number`,
				code: 'INVALID_NUMBER'
			});
		}
	}

	// CutItem validation - optional, must be Yes/No/True/False if provided
	const cutItem = row.CutItem?.trim().toLowerCase() || '';
	if (cutItem && !['yes', 'no', 'true', 'false', '1', '0'].includes(cutItem)) {
		errors.push({
			row: rowNumber,
			field: 'CutItem',
			message: `Invalid CutItem value: ${row.CutItem}. Must be Yes, No, True, or False`,
			code: 'INVALID_VALUE'
		});
	}

	return errors;
}

/**
 * Convert a valid CSV row to a BOMItem
 * Assumes row has been validated - use validateRow first
 */
export function rowToBOMItem(row: Record<string, string>, position: number): BOMItem {
	const description = row.Description?.trim() || undefined;
	const notes = row.Notes?.trim() || undefined;

	// Parse optional dimension fields - support both Thickness and Height
	const length = row.Length?.trim() ? parseFloat(row.Length.trim()) : undefined;
	const width = row.Width?.trim() ? parseFloat(row.Width.trim()) : undefined;
	const thickness = row.Thickness?.trim()
		? parseFloat(row.Thickness.trim())
		: row.Height?.trim()
			? parseFloat(row.Height.trim())
			: undefined;

	// Parse CutItem - defaults based on category if not provided
	const cutItemRaw = row.CutItem?.trim().toLowerCase() || '';
	const category = row.Category.trim().toLowerCase() as BOMCategory;
	let cutItem: boolean;

	if (cutItemRaw === 'yes' || cutItemRaw === 'true' || cutItemRaw === '1') {
		cutItem = true;
	} else if (cutItemRaw === 'no' || cutItemRaw === 'false' || cutItemRaw === '0') {
		cutItem = false;
	} else {
		// Default based on category
		cutItem = isLumberCategory(category);
	}

	return {
		id: `csv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		name: row.Name.trim(),
		category,
		quantity: parseFloat(row.Quantity.trim()),
		unit: row.Unit.trim(),
		description: description && description.length > 0 ? description : undefined,
		notes: notes && notes.length > 0 ? notes : undefined,
		hidden: false,
		cutItem,
		// Include dimensions if provided and valid
		...(length && !isNaN(length) && length > 0 ? { length } : {}),
		...(width && !isNaN(width) && width > 0 ? { width } : {}),
		...(thickness && !isNaN(thickness) && thickness > 0 ? { thickness } : {})
	};
}

/**
 * Parse a CSV file into BOMItems with validation
 * Main entry point for CSV import
 */
export function parseCSVFile(file: File): Promise<CSVParseResult> {
	return new Promise((resolve) => {
		Papa.parse(file, {
			header: true,
			skipEmptyLines: 'greedy',
			transformHeader: (h) => h.replace(/^\uFEFF/, '').trim(),
			complete: (results) => {
				const items: BOMItem[] = [];
				const errors: CSVValidationError[] = [];

				// Validate headers
				const headers = results.meta.fields || [];
				const headerErrors = validateHeaders(headers);
				if (headerErrors.length > 0) {
					// Return early if headers are invalid
					resolve({ items: [], errors: headerErrors });
					return;
				}

				// Collect PapaParse errors
				if (results.errors.length > 0) {
					for (const error of results.errors) {
						errors.push({
							row: error.row ? error.row + 2 : 0, // +2 for header row and 0-indexed
							field: '',
							message: error.message,
							code: error.code || 'PARSE_ERROR'
						});
					}
				}

				// Validate and convert each row
				const rows = results.data as Record<string, string>[];
				for (let i = 0; i < rows.length; i++) {
					const row = rows[i];
					const rowNumber = i + 2; // +2 for header row and 0-indexed

					// Validate row
					const rowErrors = validateRow(row, rowNumber);
					if (rowErrors.length > 0) {
						errors.push(...rowErrors);
					} else {
						// Convert to BOMItem
						items.push(rowToBOMItem(row, i));
					}
				}

				resolve({ items, errors });
			}
		});
	});
}
