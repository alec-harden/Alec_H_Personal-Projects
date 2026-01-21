<script lang="ts">
	// BOM Display container component
	// Main container for showing a complete Bill of Materials

	import type { BOM, BOMCategory as BOMCategoryType, BOMItem } from '$lib/types/bom';
	import BOMCategory from './BOMCategory.svelte';
	import { generateBOMCSV, downloadCSV, generateBOMFilename } from '$lib/utils/csv';

	interface Props {
		bom: BOM;
		onStartOver: () => void;
		onQuantityChange?: (id: string, quantity: number) => void;
		onToggleVisibility?: (id: string) => void;
		onAddItem?: (item: BOMItem) => void;
	}

	let { bom, onStartOver, onQuantityChange, onToggleVisibility, onAddItem }: Props = $props();

	// Category order for consistent display
	const categoryOrder: BOMCategoryType[] = ['lumber', 'hardware', 'finishes', 'consumables'];

	// Group items by category
	function groupByCategory(items: BOMItem[]): Map<BOMCategoryType, BOMItem[]> {
		const groups = new Map<BOMCategoryType, BOMItem[]>();
		for (const category of categoryOrder) {
			groups.set(category, []);
		}
		for (const item of items) {
			const existing = groups.get(item.category) ?? [];
			existing.push(item);
			groups.set(item.category, existing);
		}
		return groups;
	}

	const groupedItems = $derived(groupByCategory(bom.items));

	// Summary calculations
	const totalItems = $derived(bom.items.length);
	const visibleItems = $derived(bom.items.filter((i) => !i.hidden).length);
	const hasHiddenItems = $derived(visibleItems < totalItems);
	const categoriesWithItems = $derived(
		categoryOrder.filter((c) => (groupedItems.get(c)?.length ?? 0) > 0).length
	);

	// Format date for display
	function formatDate(isoDate: string): string {
		try {
			return new Date(isoDate).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch {
			return isoDate;
		}
	}

	// Export BOM to CSV file download
	function handleExport() {
		const csv = generateBOMCSV(bom);
		const filename = generateBOMFilename(bom);
		downloadCSV(csv, filename);
	}
</script>

<div class="mx-auto max-w-3xl">
	<!-- Header Section -->
	<div class="mb-6 flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">{bom.projectName}</h1>
			<p class="mt-1 text-gray-600">
				<span class="capitalize">{bom.projectType}</span>
				&middot;
				Generated {formatDate(bom.generatedAt)}
			</p>
		</div>
		<div class="flex gap-2">
			<button
				type="button"
				onclick={handleExport}
				class="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
				</svg>
				Export CSV
			</button>
			<button
				type="button"
				onclick={onStartOver}
				class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
			>
				Start Over
			</button>
		</div>
	</div>

	<!-- Categories -->
	{#if bom.items.length === 0}
		<div class="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
			<p class="text-gray-600">No items in this bill of materials.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each categoryOrder as category}
				{@const items = groupedItems.get(category) ?? []}
				{#if items.length > 0}
					<BOMCategory
						{category}
						{items}
						{onQuantityChange}
						{onToggleVisibility}
						{onAddItem}
					/>
				{/if}
			{/each}
		</div>
	{/if}

	<!-- Summary Footer -->
	<div class="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
		<p class="text-sm text-gray-600">
			{#if hasHiddenItems}
				<span class="font-medium">{visibleItems} visible</span> of {totalItems} total items
			{:else}
				<span class="font-medium">{totalItems} total items</span>
			{/if}
			across {categoriesWithItems} categories
		</p>
	</div>
</div>
