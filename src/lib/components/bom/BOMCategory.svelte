<script lang="ts">
	// BOM Category display component
	// Collapsible section showing items in a single category

	import type { BOMCategory, BOMItem as BOMItemType } from '$lib/types/bom';
	import BOMItem from './BOMItem.svelte';
	import AddItemForm from './AddItemForm.svelte';

	interface Props {
		category: BOMCategory;
		items: BOMItemType[];
		defaultExpanded?: boolean;
		onQuantityChange?: (id: string, quantity: number) => void;
		onToggleVisibility?: (id: string) => void;
		onAddItem?: (item: BOMItemType) => void;
	}

	const { category, items, defaultExpanded = true, onQuantityChange, onToggleVisibility, onAddItem }: Props = $props();

	let expanded = $state(true);
	let showAddForm = $state(false);

	// Sync expanded state when defaultExpanded prop changes
	$effect(() => {
		expanded = defaultExpanded;
	});

	// Calculate visible/hidden item counts
	const visibleCount = $derived(items.filter(i => !i.hidden).length);
	const totalCount = $derived(items.length);
	const hasHidden = $derived(visibleCount < totalCount);

	// Category display configuration
	const categoryConfig: Record<BOMCategory, { label: string; accentClass: string }> = {
		lumber: { label: 'Lumber', accentClass: 'border-l-amber-600 bg-amber-50' },
		hardware: { label: 'Hardware', accentClass: 'border-l-slate-600 bg-slate-50' },
		finishes: { label: 'Finishes', accentClass: 'border-l-emerald-600 bg-emerald-50' },
		consumables: { label: 'Consumables', accentClass: 'border-l-blue-600 bg-blue-50' }
	};

	const config = $derived(categoryConfig[category]);
</script>

<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
	<button
		type="button"
		onclick={() => (expanded = !expanded)}
		class="flex w-full items-center justify-between border-l-4 px-4 py-3 text-left transition-colors hover:bg-gray-50 {config.accentClass}"
	>
		<div class="flex items-center gap-3">
			<svg
				class="h-5 w-5 text-gray-500 transition-transform duration-200 {expanded
					? 'rotate-90'
					: ''}"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<h3 class="text-lg font-semibold text-gray-900">{config.label}</h3>
		</div>
		<span class="rounded-full bg-gray-200 px-2.5 py-0.5 text-sm font-medium text-gray-700">
			{#if hasHidden}
				{visibleCount} of {totalCount} items
			{:else}
				{totalCount} {totalCount === 1 ? 'item' : 'items'}
			{/if}
		</span>
	</button>

	{#if expanded}
		<div class="border-t border-gray-200">
			{#each items as item (item.id)}
				<BOMItem {item} {onQuantityChange} {onToggleVisibility} />
			{/each}
		</div>

		<!-- Add Item section -->
		{#if onAddItem}
			{#if showAddForm}
				<AddItemForm
					{category}
					onAdd={(item) => {
						onAddItem(item);
						showAddForm = false;
					}}
					onCancel={() => (showAddForm = false)}
				/>
			{:else}
				<button
					type="button"
					onclick={() => (showAddForm = true)}
					class="flex w-full items-center gap-2 border-t border-gray-200 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Add Item
				</button>
			{/if}
		{/if}
	{/if}
</div>
