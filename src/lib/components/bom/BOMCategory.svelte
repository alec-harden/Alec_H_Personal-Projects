<script lang="ts">
	// BOM Category display component
	// Collapsible section showing items in a single category

	import type { BOMCategory, BOMItem as BOMItemType } from '$lib/types/bom';
	import BOMItem from './BOMItem.svelte';

	interface Props {
		category: BOMCategory;
		items: BOMItemType[];
		defaultExpanded?: boolean;
		onQuantityChange?: (id: string, quantity: number) => void;
	}

	const { category, items, defaultExpanded = true, onQuantityChange }: Props = $props();

	// Initialize state (captured once at mount)
	const initExpanded = defaultExpanded;

	let expanded = $state(initExpanded);

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
			{items.length} {items.length === 1 ? 'item' : 'items'}
		</span>
	</button>

	{#if expanded}
		<div class="border-t border-gray-200">
			{#each items as item (item.id)}
				<BOMItem {item} {onQuantityChange} />
			{/each}
		</div>
	{/if}
</div>
