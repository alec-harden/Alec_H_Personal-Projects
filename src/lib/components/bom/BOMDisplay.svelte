<script lang="ts">
	// BOM Display container component
	// Modern Artisan aesthetic with warm card styling

	import type { BOM, BOMCategory as BOMCategoryType, BOMItem } from '$lib/types/bom';
	import BOMCategory from './BOMCategory.svelte';
	import { generateBOMCSV, downloadCSV, generateBOMFilename } from '$lib/utils/csv';

	interface Props {
		bom: BOM;
		onStartOver: () => void;
		onQuantityChange?: (id: string, quantity: number) => void;
		onToggleVisibility?: (id: string) => void;
		onAddItem?: (item: BOMItem) => void;
		onSave?: () => void;
		showSaveButton?: boolean;
	}

	let { bom, onStartOver, onQuantityChange, onToggleVisibility, onAddItem, onSave, showSaveButton }: Props = $props();

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

<div class="bom-display animate-fade-in">
	<!-- Header Section -->
	<header class="bom-header">
		<div class="header-content">
			<h1 class="bom-title">{bom.projectName}</h1>
			<p class="bom-meta">
				<span class="project-type">{bom.projectType}</span>
				<span class="meta-dot">&middot;</span>
				<span class="generated-date">Generated {formatDate(bom.generatedAt)}</span>
			</p>
		</div>
		<div class="header-actions">
			{#if showSaveButton && onSave}
				<button type="button" onclick={onSave} class="btn-primary">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="btn-icon">
						<path stroke-linecap="round" stroke-linejoin="round" d="M17 3v10M21 7l-4-4-4 4M5 12v9a2 2 0 002 2h10a2 2 0 002-2v-2" />
					</svg>
					Save to Project
				</button>
			{/if}
			<button type="button" onclick={handleExport} class="btn-primary">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="btn-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
				</svg>
				Export CSV
			</button>
			<button type="button" onclick={onStartOver} class="btn-secondary">
				Start Over
			</button>
		</div>
	</header>

	<!-- Categories -->
	{#if bom.items.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
					<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</div>
			<p class="empty-text">No items in this bill of materials.</p>
		</div>
	{:else}
		<div class="categories-list stagger-children">
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
	<footer class="bom-footer">
		<div class="summary-stat">
			<span class="stat-value">
				{#if hasHiddenItems}
					{visibleItems} <span class="stat-label">visible of</span> {totalItems}
				{:else}
					{totalItems}
				{/if}
			</span>
			<span class="stat-label">total items</span>
		</div>
		<div class="summary-divider"></div>
		<div class="summary-stat">
			<span class="stat-value">{categoriesWithItems}</span>
			<span class="stat-label">categories</span>
		</div>
	</footer>
</div>

<style>
	.bom-display {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	/* Header */
	.bom-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	@media (min-width: 640px) {
		.bom-header {
			flex-direction: row;
			align-items: flex-start;
			justify-content: space-between;
		}
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.bom-title {
		font-family: var(--font-display);
		font-size: 1.75rem;
		color: var(--color-ink);
		margin: 0;
	}

	.bom-meta {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: 0.875rem;
		color: var(--color-ink-muted);
		margin: 0;
	}

	.project-type {
		text-transform: capitalize;
	}

	.meta-dot {
		opacity: 0.5;
	}

	.header-actions {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	/* Categories */
	.categories-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
		padding: var(--space-3xl);
		background: var(--color-white);
		border: 1px solid rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-lg);
		text-align: center;
	}

	.empty-icon {
		width: 48px;
		height: 48px;
		color: var(--color-ink-muted);
		opacity: 0.5;
	}

	.empty-text {
		font-size: 0.9375rem;
		color: var(--color-ink-muted);
		margin: 0;
	}

	/* Footer */
	.bom-footer {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-lg);
		padding: var(--space-md) var(--space-lg);
		background: var(--color-white);
		border: 1px solid rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-lg);
	}

	.summary-stat {
		display: flex;
		align-items: baseline;
		gap: var(--space-xs);
	}

	.stat-value {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--color-ink);
	}

	.stat-label {
		font-size: 0.8125rem;
		color: var(--color-ink-muted);
	}

	.summary-divider {
		width: 1px;
		height: 24px;
		background: rgba(17, 17, 17, 0.1);
	}

	.btn-icon {
		width: 18px;
		height: 18px;
	}
</style>
