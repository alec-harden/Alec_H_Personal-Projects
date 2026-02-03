<script lang="ts">
	// BOM Category display component
	// Modern Artisan aesthetic with wood-toned category accents

	import type { BOMCategory, BOMItem as BOMItemType } from '$lib/types/bom';
	import BOMItem from './BOMItem.svelte';
	import AddItemForm from './AddItemForm.svelte';

	interface Props {
		category: BOMCategory;
		items: BOMItemType[];
		defaultExpanded?: boolean;
		onQuantityChange?: (id: string, quantity: number) => void;
		onToggleVisibility?: (id: string) => void;
		onDimensionChange?: (id: string, dimensions: { length?: number; width?: number; height?: number }) => void;
		onAddItem?: (item: BOMItemType) => void;
	}

	const { category, items, defaultExpanded = true, onQuantityChange, onToggleVisibility, onDimensionChange, onAddItem }: Props = $props();

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

	// Board feet calculation removed in v4.0 - will be replaced with piece counts in Phase 24

	// Category display configuration with artisan colors
	const categoryConfig: Record<BOMCategory, { label: string; color: string; bgColor: string }> = {
		lumber: { label: 'Lumber', color: 'var(--color-walnut)', bgColor: 'rgba(93, 64, 55, 0.08)' },
		hardware: { label: 'Hardware', color: 'var(--color-ink-muted)', bgColor: 'rgba(92, 92, 92, 0.08)' },
		finishes: { label: 'Finishes', color: 'var(--color-success)', bgColor: 'var(--color-success-soft)' },
		consumables: { label: 'Consumables', color: 'var(--color-oak-dark)', bgColor: 'rgba(184, 149, 106, 0.12)' }
	};

	const config = $derived(categoryConfig[category]);
</script>

<div class="category-card">
	<button
		type="button"
		onclick={() => (expanded = !expanded)}
		class="category-header"
		style="--accent-color: {config.color}; --accent-bg: {config.bgColor}"
	>
		<div class="header-left">
			<div class="expand-icon" class:expanded>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
				</svg>
			</div>
			<h3 class="category-name">{config.label}</h3>
		</div>
		<span class="item-count">
			{#if hasHidden}
				{visibleCount} of {totalCount}
			{:else}
				{totalCount}
			{/if}
			{totalCount === 1 ? 'item' : 'items'}
		</span>
	</button>

	{#if expanded}
		<div class="category-content">
			{#each items as item (item.id)}
				<BOMItem {item} {onQuantityChange} {onToggleVisibility} {onDimensionChange} />
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
					class="add-item-button"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="add-icon">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
					</svg>
					Add Item
				</button>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.category-card {
		background: var(--color-white);
		border: 1px solid rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	/* Header */
	.category-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: var(--space-md) var(--space-lg);
		background: var(--accent-bg);
		border: none;
		border-left: 4px solid var(--accent-color);
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: left;
	}

	.category-header:hover {
		background: var(--accent-bg);
		filter: brightness(0.98);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.expand-icon {
		width: 20px;
		height: 20px;
		color: var(--color-ink-muted);
		transition: transform var(--transition-fast);
	}

	.expand-icon.expanded {
		transform: rotate(90deg);
	}

	.category-name {
		font-family: var(--font-display);
		font-size: 1.125rem;
		color: var(--color-ink);
		margin: 0;
	}

	.item-count {
		font-size: 0.8125rem;
		color: var(--color-ink-muted);
		padding: var(--space-xs) var(--space-sm);
		background: var(--color-white);
		border-radius: var(--radius-full);
	}

	.board-feet-total {
		margin-left: var(--space-xs);
		color: var(--color-walnut);
		font-weight: 500;
	}

	/* Content */
	.category-content {
		border-top: 1px solid rgba(17, 17, 17, 0.06);
	}

	/* Add Item Button */
	.add-item-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		background: none;
		border: none;
		border-top: 1px solid rgba(17, 17, 17, 0.06);
		color: var(--color-walnut);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.add-item-button:hover {
		background: rgba(93, 64, 55, 0.04);
	}

	.add-icon {
		width: 16px;
		height: 16px;
	}
</style>
