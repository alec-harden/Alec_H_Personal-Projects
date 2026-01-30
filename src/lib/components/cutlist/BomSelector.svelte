<script lang="ts">
	/**
	 * Component for multi-selecting BOMs from a project
	 * Shows lumber item count for each BOM to help user understand what will be imported
	 */

	interface BOM {
		id: string;
		name: string;
		items: Array<{
			id: string;
			category: string;
			length: number | null;
			width: number | null;
		}>;
	}

	interface Props {
		boms: BOM[];
		selectedBomIds: Set<string>;
		onToggle: (bomId: string) => void;
		disabled?: boolean;
	}

	let { boms, selectedBomIds, onToggle, disabled = false }: Props = $props();

	// Calculate lumber count for each BOM
	function getLumberCount(bom: BOM): number {
		return bom.items.filter((item) => item.category === 'lumber' && item.length !== null)
			.length;
	}
</script>

<div class="bom-list">
	{#each boms as bom (bom.id)}
		{@const lumberCount = getLumberCount(bom)}
		<button
			type="button"
			class="bom-card"
			class:selected={selectedBomIds.has(bom.id)}
			onclick={() => onToggle(bom.id)}
			{disabled}
		>
			<div class="bom-checkbox">
				{#if selectedBomIds.has(bom.id)}
					<svg viewBox="0 0 16 16" fill="currentColor">
						<path
							d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z"
						/>
					</svg>
				{/if}
			</div>
			<div class="bom-content">
				<span class="bom-name">{bom.name}</span>
				<span class="bom-count">
					{lumberCount}
					{lumberCount === 1 ? 'lumber item' : 'lumber items'}
				</span>
			</div>
			<!-- Hidden input for form submission -->
			<input
				type="checkbox"
				name="selectedBoms"
				value={bom.id}
				checked={selectedBomIds.has(bom.id)}
				class="hidden-checkbox"
				tabindex="-1"
			/>
		</button>
	{/each}
</div>

{#if boms.length === 0}
	<div class="empty-state">
		<p class="empty-text">No BOMs in this project</p>
	</div>
{/if}

<style>
	/* BOM List */
	.bom-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-height: 400px;
		overflow-y: auto;
	}

	/* BOM Card */
	.bom-card {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md);
		background: var(--color-white);
		border: 1px solid rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: left;
		width: 100%;
	}

	.bom-card:hover:not(:disabled) {
		border-color: var(--color-walnut);
		background: var(--color-walnut-soft);
	}

	.bom-card.selected {
		border-color: var(--color-walnut);
		background: var(--color-walnut-soft);
		box-shadow: 0 0 0 1px var(--color-walnut);
	}

	.bom-card:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Checkbox */
	.bom-checkbox {
		flex-shrink: 0;
		width: 20px;
		height: 20px;
		border: 2px solid var(--color-ink-muted);
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
		color: var(--color-white);
	}

	.bom-card.selected .bom-checkbox {
		border-color: var(--color-walnut);
		background: var(--color-walnut);
	}

	.bom-checkbox svg {
		width: 12px;
		height: 12px;
	}

	/* BOM Content */
	.bom-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.bom-name {
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--color-ink);
	}

	.bom-count {
		font-size: 0.8125rem;
		color: var(--color-ink-muted);
	}

	/* Hidden Checkbox */
	.hidden-checkbox {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	/* Empty State */
	.empty-state {
		padding: var(--space-2xl) var(--space-lg);
		text-align: center;
	}

	.empty-text {
		font-size: 0.9375rem;
		color: var(--color-ink-muted);
		margin: 0;
	}
</style>
