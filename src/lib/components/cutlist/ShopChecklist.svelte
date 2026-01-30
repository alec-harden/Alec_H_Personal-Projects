<script lang="ts">
	interface ChecklistCut {
		id: string;
		length: number;
		width: number | null;
		quantity: number;
		label: string | null;
		completed: boolean;
	}

	interface Props {
		cuts: ChecklistCut[];
		cutListId: string;
		mode: 'linear' | 'sheet';
	}

	let { cuts: initialCuts, cutListId, mode }: Props = $props();

	// Local state for optimistic updates
	let localCuts = $state<ChecklistCut[]>(structuredClone(initialCuts));

	// Derive progress stats
	const progress = $derived.by(() => {
		const total = localCuts.length;
		const completed = localCuts.filter((c) => c.completed).length;
		const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
		return { total, completed, percentage };
	});

	// Toggle completion with optimistic update
	async function toggleComplete(cutId: string) {
		// Find the cut
		const cutIndex = localCuts.findIndex((c) => c.id === cutId);
		if (cutIndex === -1) return;

		// Store previous state for rollback
		const previousState = structuredClone(localCuts);

		// Optimistically update local state
		localCuts[cutIndex].completed = !localCuts[cutIndex].completed;

		try {
			// Fire PATCH request (no await for snappier UI)
			const response = await fetch(`/api/cutlist/${cutListId}/cuts/${cutId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ completed: localCuts[cutIndex].completed })
			});

			if (!response.ok) {
				throw new Error('Failed to update cut completion');
			}
		} catch (error) {
			console.error('Error updating cut completion:', error);
			// Revert to previous state on error
			localCuts = previousState;
		}
	}

	// Format dimensions for display
	function formatDimensions(cut: ChecklistCut): string {
		if (cut.width === null) {
			return `${cut.length}"`;
		}
		return `${cut.length}" × ${cut.width}"`;
	}

	// Get display label
	function getDisplayLabel(cut: ChecklistCut): string {
		return cut.label || 'Unlabeled cut';
	}
</script>

<section class="shop-checklist">
	<!-- Header -->
	<div class="checklist-header">
		<h2 class="checklist-title">Shop Checklist</h2>
		<div class="progress-text">
			{progress.completed} of {progress.total} cuts complete ({progress.percentage}%)
		</div>
	</div>

	<!-- Progress Bar -->
	<div class="progress-bar-container">
		<div class="progress-bar-track">
			<div class="progress-bar-fill" style="width: {progress.percentage}%"></div>
		</div>
	</div>

	<!-- Cut List -->
	<div class="cuts-container">
		{#if localCuts.length === 0}
			<div class="empty-state">
				<p class="empty-message">No cuts in this list.</p>
			</div>
		{:else}
			<div class="cuts-list">
				{#each localCuts as cut (cut.id)}
					<div class="cut-row" class:completed={cut.completed}>
						<label class="cut-checkbox-label">
							<input
								type="checkbox"
								class="cut-checkbox"
								checked={cut.completed}
								onchange={() => toggleComplete(cut.id)}
							/>
							<span class="checkbox-visual">
								{#if cut.completed}
									<svg
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										class="check-icon"
									>
										<polyline points="3,8 6,11 13,4" />
									</svg>
								{/if}
							</span>
						</label>

						<div class="cut-info">
							<div class="cut-label">{getDisplayLabel(cut)}</div>
							<div class="cut-meta">
								<span class="cut-dimensions">{formatDimensions(cut)}</span>
								{#if cut.quantity > 1}
									<span class="cut-quantity">× {cut.quantity}</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	.shop-checklist {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	/* Header */
	.checklist-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.checklist-title {
		font-family: var(--font-display);
		font-size: 1.5rem;
		color: var(--color-ink);
		margin: 0;
	}

	.progress-text {
		font-size: 0.875rem;
		color: var(--color-ink-muted);
		font-weight: 500;
	}

	/* Progress Bar */
	.progress-bar-container {
		width: 100%;
	}

	.progress-bar-track {
		height: 8px;
		background: rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		background: var(--color-walnut);
		border-radius: var(--radius-full);
		transition: width 0.3s ease;
	}

	/* Cuts Container */
	.cuts-container {
		background: var(--color-white);
		border: 1px solid rgba(17, 17, 17, 0.1);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.empty-state {
		padding: var(--space-2xl);
		text-align: center;
	}

	.empty-message {
		color: var(--color-ink-muted);
		font-size: 0.9375rem;
		margin: 0;
	}

	.cuts-list {
		display: flex;
		flex-direction: column;
	}

	/* Cut Row */
	.cut-row {
		display: flex;
		align-items: flex-start;
		gap: var(--space-md);
		padding: var(--space-md);
		border-bottom: 1px solid rgba(17, 17, 17, 0.08);
		transition: opacity 0.2s ease;
	}

	.cut-row:last-child {
		border-bottom: none;
	}

	.cut-row.completed {
		opacity: 0.6;
	}

	.cut-row.completed .cut-label,
	.cut-row.completed .cut-meta {
		text-decoration: line-through;
	}

	/* Checkbox */
	.cut-checkbox-label {
		display: flex;
		align-items: center;
		cursor: pointer;
		flex-shrink: 0;
	}

	.cut-checkbox {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.checkbox-visual {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: 2px solid rgba(17, 17, 17, 0.2);
		border-radius: var(--radius-md);
		background: var(--color-white);
		transition: all 0.2s ease;
	}

	.cut-checkbox:checked + .checkbox-visual {
		background: var(--color-walnut);
		border-color: var(--color-walnut);
	}

	.cut-checkbox:focus + .checkbox-visual {
		outline: 2px solid var(--color-walnut);
		outline-offset: 2px;
	}

	.check-icon {
		width: 14px;
		height: 14px;
		color: var(--color-white);
	}

	/* Cut Info */
	.cut-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.cut-label {
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--color-ink);
	}

	.cut-meta {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: 0.8125rem;
		color: var(--color-ink-muted);
	}

	.cut-dimensions {
		font-family: var(--font-mono, monospace);
	}

	.cut-quantity {
		font-weight: 600;
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.checklist-title {
			font-size: 1.25rem;
		}

		.cut-row {
			padding: var(--space-sm);
		}
	}
</style>
