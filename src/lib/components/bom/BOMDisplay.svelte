<script lang="ts">
	// BOM Display container component
	// Main container for showing a complete Bill of Materials

	import type { BOM, BOMCategory as BOMCategoryType, BOMItem } from '$lib/types/bom';
	import BOMCategory from './BOMCategory.svelte';

	interface Props {
		bom: BOM;
		onStartOver: () => void;
	}

	let { bom, onStartOver }: Props = $props();

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
		<button
			type="button"
			onclick={onStartOver}
			class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
		>
			Start Over
		</button>
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
					<BOMCategory {category} {items} />
				{/if}
			{/each}
		</div>
	{/if}

	<!-- Summary Footer -->
	<div class="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
		<p class="text-sm text-gray-600">
			<span class="font-medium">{bom.items.length} total items</span>
			across {categoryOrder.filter((c) => (groupedItems.get(c)?.length ?? 0) > 0).length} categories
		</p>
	</div>
</div>
