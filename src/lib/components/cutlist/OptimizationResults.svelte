<script lang="ts">
	import type { OptimizationResult } from '$lib/server/cutOptimizer';
	import type { CutListMode } from '$lib/types/cutlist';
	import LinearCutDiagram from './LinearCutDiagram.svelte';
	import SheetCutDiagram from './SheetCutDiagram.svelte';

	interface Props {
		result: OptimizationResult;
		mode: CutListMode;
		kerf: number;
	}

	let { result, mode, kerf }: Props = $props();

	// Derive waste color based on percentage
	const wasteColor = $derived(() => {
		if (result.summary.wastePercentage < 10) return 'green';
		if (result.summary.wastePercentage < 25) return 'yellow';
		return 'red';
	});

	// Format dimensions for display
	function formatDimensions(length: number, width: number | null): string {
		if (width === null) {
			return `${length}"`;
		}
		return `${length}" × ${width}"`;
	}

	// Format waste display
	function formatWaste(plan: (typeof result.plans)[0]): string {
		if (mode === 'linear') {
			return `${plan.wasteLength.toFixed(2)}" waste`;
		} else {
			return `${plan.wasteArea?.toFixed(2)} sq in waste`;
		}
	}
</script>

<section class="optimization-results">
	<h2 class="results-title">Optimization Results</h2>

	<!-- Summary Section -->
	<div class="summary-section sanded-surface">
		<div class="summary-grid">
			<div class="summary-card">
				<div class="summary-label">Waste</div>
				<div class="summary-value waste-{wasteColor()}">
					{result.summary.wastePercentage.toFixed(1)}%
				</div>
				<!-- Visual waste bar -->
				<div class="waste-bar">
					<div
						class="waste-bar-fill waste-fill-{wasteColor()}"
						style="width: {Math.min(result.summary.wastePercentage, 100)}%"
					></div>
				</div>
			</div>

			<div class="summary-card">
				<div class="summary-label">Cuts Placed</div>
				<div class="summary-value">
					{result.summary.totalCuts - result.summary.unplacedCuts.length} / {result.summary
						.totalCuts}
				</div>
			</div>

			<div class="summary-card">
				<div class="summary-label">Stock Used</div>
				<div class="summary-value">{result.summary.totalStockUsed}</div>
			</div>

			<div class="summary-card">
				<div class="summary-label">Total Waste</div>
				<div class="summary-value">
					{#if mode === 'linear'}
						{result.summary.totalWaste.toFixed(2)}"
					{:else}
						{result.summary.totalWaste.toFixed(2)} sq in
					{/if}
				</div>
			</div>

			{#if mode === 'linear'}
				<div class="summary-card">
					<div class="summary-label">Stock Used</div>
					<div class="summary-value">
						{result.summary.totalLinearFeetUsed.toFixed(1)} ft
					</div>
				</div>
				<div class="summary-card">
					<div class="summary-label">Stock Available</div>
					<div class="summary-value">
						{result.summary.totalLinearFeetAvailable.toFixed(1)} ft
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Unplaced Cuts Warning -->
	{#if result.summary.unplacedCuts.length > 0}
		<div class="alert-box alert-error">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
			<div>
				<div class="alert-title">Unable to Place All Cuts</div>
				<div class="alert-message">
					{result.summary.unplacedCuts.length} cut(s) could not fit in available stock. Add more
					stock or adjust cut dimensions.
				</div>
			</div>
		</div>
	{/if}

	<!-- Cut Diagrams Section -->
	{#if mode === 'linear' && result.plans.length > 0}
		<div class="diagrams-section">
			<h3 class="diagrams-title">Cut Diagrams</h3>
			<div class="diagrams-list">
				{#each result.plans as plan, index (plan.stockId)}
					<LinearCutDiagram {plan} {kerf} {index} />
				{/each}
			</div>
		</div>
	{:else if mode === 'sheet' && result.plans.length > 0}
		<div class="diagrams-section">
			<h3 class="diagrams-title">Cut Diagrams</h3>
			<div class="diagrams-list">
				{#each result.plans as plan, index (plan.stockId)}
					<SheetCutDiagram {plan} {kerf} {index} />
				{/each}
			</div>
		</div>
	{/if}

	<!-- Plans Section -->
	{#if result.plans.length === 0}
		<div class="empty-state">
			<p class="empty-message">No cutting plans generated.</p>
		</div>
	{:else}
		<div class="plans-section">
			<h3 class="plans-title">Cutting Plans</h3>
			<div class="plans-grid">
				{#each result.plans as plan, index (plan.stockId)}
					<div class="plan-card sanded-surface">
						<div class="plan-header">
							<div class="plan-title">
								<span class="plan-number">#{index + 1}</span>
								{plan.stockLabel || 'Stock'}
							</div>
							<div class="plan-dimensions">
								{formatDimensions(plan.stockLength, plan.stockWidth)}
							</div>
						</div>

						<div class="plan-cuts">
							<div class="cuts-header">
								<span class="cuts-count">{plan.cuts.length} cut(s)</span>
							</div>
							<div class="cuts-list">
								{#each plan.cuts as cut (cut.cutId)}
									<div class="cut-item">
										<div class="cut-icon">✓</div>
										<div class="cut-info">
											<div class="cut-label">{cut.cutLabel || 'Unlabeled cut'}</div>
											<div class="cut-dimensions">
												{formatDimensions(cut.length, cut.width)}
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<div class="plan-waste">
							<div class="waste-label">Remaining waste:</div>
							<div class="waste-value waste-{wasteColor()}">{formatWaste(plan)}</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</section>

<style>
	.optimization-results {
		margin-top: var(--space-xl);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.results-title {
		font-family: var(--font-display);
		font-size: 1.5rem;
		color: var(--color-ink);
		margin: 0;
	}

	/* Summary Section */
	.summary-section {
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-lg);
	}

	.summary-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.summary-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-ink-muted);
	}

	.summary-value {
		font-family: var(--font-display);
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-ink);
	}

	.summary-value.waste-green {
		color: #059669;
	}

	.summary-value.waste-yellow {
		color: #d97706;
	}

	.summary-value.waste-red {
		color: #dc2626;
	}

	/* Waste Bar */
	.waste-bar {
		height: 6px;
		background: rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.waste-bar-fill {
		height: 100%;
		transition: width 0.3s ease;
		border-radius: var(--radius-full);
	}

	.waste-fill-green {
		background: #059669;
	}

	.waste-fill-yellow {
		background: #d97706;
	}

	.waste-fill-red {
		background: #dc2626;
	}

	/* Diagrams Section */
	.diagrams-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.diagrams-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--color-ink);
		margin: 0;
	}

	.diagrams-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	/* Alert Box */
	.alert-box {
		display: flex;
		gap: var(--space-md);
		padding: var(--space-md);
		border-radius: var(--radius-md);
	}

	.alert-error {
		background: #fee2e2;
		border: 1px solid #fecaca;
	}

	.alert-icon {
		width: 24px;
		height: 24px;
		color: #dc2626;
		flex-shrink: 0;
	}

	.alert-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #991b1b;
		margin-bottom: var(--space-xs);
	}

	.alert-message {
		font-size: 0.875rem;
		color: #7f1d1d;
	}

	/* Empty State */
	.empty-state {
		padding: var(--space-2xl);
		text-align: center;
		background: var(--color-paper);
		border: 1px dashed rgba(17, 17, 17, 0.15);
		border-radius: var(--radius-lg);
	}

	.empty-message {
		color: var(--color-ink-muted);
		font-size: 0.9375rem;
	}

	/* Plans Section */
	.plans-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.plans-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--color-ink);
		margin: 0;
	}

	.plans-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: var(--space-md);
	}

	.plan-card {
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.plan-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding-bottom: var(--space-md);
		border-bottom: 1px solid rgba(17, 17, 17, 0.08);
	}

	.plan-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-ink);
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.plan-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: var(--color-walnut);
		color: var(--color-white);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 700;
	}

	.plan-dimensions {
		font-size: 0.875rem;
		color: var(--color-ink-muted);
		font-family: var(--font-mono, monospace);
	}

	/* Plan Cuts */
	.plan-cuts {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.cuts-header {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-ink-muted);
	}

	.cuts-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.cut-item {
		display: flex;
		gap: var(--space-sm);
		padding: var(--space-sm);
		background: var(--color-white);
		border: 1px solid rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-md);
	}

	.cut-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		background: #d1fae5;
		color: #059669;
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.cut-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.cut-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-ink);
	}

	.cut-dimensions {
		font-size: 0.75rem;
		color: var(--color-ink-muted);
		font-family: var(--font-mono, monospace);
	}

	/* Plan Waste */
	.plan-waste {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--space-md);
		border-top: 1px solid rgba(17, 17, 17, 0.08);
	}

	.waste-label {
		font-size: 0.8125rem;
		color: var(--color-ink-muted);
	}

	.waste-value {
		font-size: 0.875rem;
		font-weight: 600;
		font-family: var(--font-mono, monospace);
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.summary-grid {
			grid-template-columns: 1fr;
		}

		.plans-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
