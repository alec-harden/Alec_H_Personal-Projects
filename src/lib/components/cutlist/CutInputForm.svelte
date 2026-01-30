<script lang="ts">
	import type { Cut, CutListMode } from '$lib/types/cutlist';
	import { createCut } from '$lib/types/cutlist';

	interface Props {
		cuts: Cut[];
		mode: CutListMode;
	}

	let { cuts = $bindable(), mode }: Props = $props();

	function addCut() {
		cuts = [...cuts, createCut(mode)];
	}

	function removeCut(id: string) {
		cuts = cuts.filter((c) => c.id !== id);
	}
</script>

<section class="input-section">
	<div class="section-header">
		<h3 class="section-title">Required Cuts</h3>
		<button type="button" onclick={addCut} class="btn-secondary btn-sm">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
			</svg>
			Add Cut
		</button>
	</div>

	{#if cuts.length === 0}
		<div class="empty-state">
			<p class="empty-message">No cuts added yet. Click "Add Cut" to begin.</p>
		</div>
	{:else}
		<div class="entries-container">
			<div class="entries-header">
				<div class="header-cell header-length">Length (in)</div>
				{#if mode === 'sheet'}
					<div class="header-cell header-width">Width (in)</div>
				{/if}
				<div class="header-cell header-qty">Qty</div>
				<div class="header-cell header-label">Label</div>
				<div class="header-cell header-actions"></div>
			</div>

			{#each cuts as cut (cut.id)}
				<div class="entry-row">
					<div class="entry-field entry-length">
						<input
							type="number"
							bind:value={cut.length}
							step="0.125"
							min="0"
							placeholder="Length"
							class="input-field"
						/>
					</div>

					{#if mode === 'sheet'}
						<div class="entry-field entry-width">
							<input
								type="number"
								bind:value={cut.width}
								step="0.125"
								min="0"
								placeholder="Width"
								class="input-field"
							/>
						</div>
					{/if}

					<div class="entry-field entry-qty">
						<input
							type="number"
							bind:value={cut.quantity}
							step="1"
							min="1"
							class="input-field"
						/>
					</div>

					<div class="entry-field entry-label">
						<input
							type="text"
							bind:value={cut.label}
							placeholder="Label (optional)"
							class="input-field"
						/>
					</div>

					<div class="entry-field entry-actions">
						<button
							type="button"
							onclick={() => removeCut(cut.id)}
							class="btn-ghost btn-icon-only"
							title="Remove cut"
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>

<style>
	.input-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.section-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--color-ink);
	}

	.btn-sm {
		padding: var(--space-xs) var(--space-md);
		font-size: 0.8125rem;
	}

	.btn-icon {
		width: 16px;
		height: 16px;
	}

	.empty-state {
		padding: var(--space-xl) var(--space-md);
		text-align: center;
		background: var(--color-paper);
		border: 1px dashed rgba(17, 17, 17, 0.15);
		border-radius: var(--radius-md);
	}

	.empty-message {
		color: var(--color-ink-muted);
		font-size: 0.9375rem;
	}

	.entries-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.entries-header {
		display: grid;
		grid-template-columns: 1fr 1fr 80px 1.5fr 50px;
		gap: var(--space-sm);
		padding: 0 var(--space-sm);
	}

	.header-cell {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-ink-muted);
	}

	.entry-row {
		display: grid;
		grid-template-columns: 1fr 1fr 80px 1.5fr 50px;
		gap: var(--space-sm);
		padding: var(--space-sm);
		background: var(--color-white);
		border: 1px solid rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-md);
		transition: border-color var(--transition-fast);
	}

	.entry-row:hover {
		border-color: rgba(93, 64, 55, 0.2);
	}

	.entry-field {
		display: flex;
		align-items: center;
	}

	.btn-icon-only {
		padding: var(--space-xs);
		min-width: 0;
	}

	.icon {
		width: 18px;
		height: 18px;
	}

	/* Mobile stacking */
	@media (max-width: 640px) {
		.section-header {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-sm);
		}

		.entries-header {
			display: none;
		}

		.entry-row {
			grid-template-columns: 1fr;
			gap: var(--space-xs);
		}

		.entry-field {
			flex-direction: column;
			align-items: stretch;
			position: relative;
		}

		.entry-field::before {
			content: attr(data-label);
			font-size: 0.6875rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--color-ink-muted);
			margin-bottom: var(--space-xs);
		}

		.entry-length::before {
			content: 'Length (in)';
		}

		.entry-width::before {
			content: 'Width (in)';
		}

		.entry-qty::before {
			content: 'Qty';
		}

		.entry-label::before {
			content: 'Label';
		}

		.entry-actions {
			justify-content: center;
		}

		.entry-actions::before {
			content: none;
		}
	}
</style>
