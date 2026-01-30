/**
 * CSV Generation and Download Utilities
 *
 * RFC 4180 compliant CSV generation for BOM export functionality.
 * Provides escaping, generation, filename sanitization, and download.
 */

import type { BOM, BOMCategory } from '$lib/types/bom';

/**
 * Escape a field for CSV according to RFC 4180
 * - Fields containing commas, double quotes, or newlines must be enclosed in double quotes
 * - Double quotes within fields must be escaped by doubling them
 */
export function escapeCSVField(field: string): string {
	if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
		// Escape double quotes by doubling them, then wrap in quotes
		return `"${field.replace(/"/g, '""')}"`;
	}
	return field;
}

/**
 * Generate a CSV string from a BOM
 * - Filters out hidden items
 * - Sorts by category order: lumber, hardware, finishes, consumables
 * - Includes headers: Category, Name, Quantity, Unit, Description, Notes, Length, Width, Height
 */
export function generateBOMCSV(bom: BOM): string {
	const headers = ['Category', 'Name', 'Quantity', 'Unit', 'Description', 'Notes', 'Length', 'Width', 'Height'];
	const categoryOrder: BOMCategory[] = ['lumber', 'hardware', 'finishes', 'consumables'];

	// Filter visible items and sort by category
	const visibleItems = bom.items
		.filter((item) => !item.hidden)
		.sort((a, b) => {
			const aIndex = categoryOrder.indexOf(a.category);
			const bIndex = categoryOrder.indexOf(b.category);
			return aIndex - bIndex;
		});

	// Generate rows
	const rows = visibleItems.map((item) => {
		// Capitalize category for display
		const categoryDisplay = item.category.charAt(0).toUpperCase() + item.category.slice(1);

		return [
			escapeCSVField(categoryDisplay),
			escapeCSVField(item.name),
			escapeCSVField(String(item.quantity)),
			escapeCSVField(item.unit),
			escapeCSVField(item.description ?? ''),
			escapeCSVField(item.notes ?? ''),
			// Dimension columns - only for lumber, empty string otherwise
			escapeCSVField(item.length != null ? String(item.length) : ''),
			escapeCSVField(item.width != null ? String(item.width) : ''),
			escapeCSVField(item.height != null ? String(item.height) : '')
		].join(',');
	});

	// Combine header and rows
	return [headers.join(','), ...rows].join('\n');
}

/**
 * Generate a sanitized filename for BOM CSV export
 * Format: {sanitized-project-name}-bom-{YYYY-MM-DD}.csv
 */
export function generateBOMFilename(bom: BOM): string {
	// Sanitize project name: lowercase, replace non-alphanumeric with hyphens, trim hyphens
	const sanitizedName = bom.projectName
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	// Parse date from generatedAt or use current date
	let dateStr: string;
	try {
		const date = new Date(bom.generatedAt);
		if (isNaN(date.getTime())) {
			throw new Error('Invalid date');
		}
		dateStr = date.toISOString().split('T')[0];
	} catch {
		dateStr = new Date().toISOString().split('T')[0];
	}

	return `${sanitizedName}-bom-${dateStr}.csv`;
}

/**
 * Trigger a CSV file download in the browser
 * Creates a Blob, generates an object URL, and simulates a click to download
 */
export function downloadCSV(content: string, filename: string): void {
	// Create Blob with CSV content
	const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });

	// Create object URL
	const url = URL.createObjectURL(blob);

	// Create anchor element and trigger download
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.style.display = 'none';
	document.body.appendChild(link);
	link.click();

	// Cleanup
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
