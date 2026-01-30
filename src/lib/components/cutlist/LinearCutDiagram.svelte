<script lang="ts">
	import type { StockPlan } from '$lib/server/cutOptimizer';

	interface Props {
		plan: StockPlan;
		kerf: number;
		index: number;
	}

	let { plan, kerf, index }: Props = $props();

	// SVG dimensions
	const svgWidth = 800;
	const svgHeight = 120;
	const barY = 40;
	const barHeight = 40;

	// Scale calculation: map stock length to SVG width
	const scale = $derived(svgWidth / plan.stockLength);

	// Calculate waste percentage for color coding
	const wastePercent = $derived((plan.wasteLength / plan.stockLength) * 100);

	// Waste color based on percentage (match existing color coding)
	const wasteColor = $derived(() => {
		if (wastePercent < 10) return '#10b981'; // green
		if (wastePercent < 25) return '#fbbf24'; // amber
		return '#ef4444'; // red
	});

	// Generate cut positions and kerf positions
	interface CutPosition {
		x: number;
		width: number;
		label: string;
		showLabel: boolean;
	}

	interface KerfPosition {
		x: number;
		width: number;
	}

	interface WastePosition {
		x: number;
		width: number;
	}

	const cutPositions: CutPosition[] = $derived.by(() => {
		const positions: CutPosition[] = [];
		let x = 0;

		plan.cuts.forEach((cut) => {
			const cutWidth = cut.length * scale;
			positions.push({
				x,
				width: cutWidth,
				label: `${cut.length}"`,
				showLabel: cutWidth > 30 // Only show label if cut is wide enough
			});
			x += cutWidth;

			// Add kerf width after each cut (except last)
			x += kerf * scale;
		});

		return positions;
	});

	const kerfPositions: KerfPosition[] = $derived.by(() => {
		const positions: KerfPosition[] = [];
		let x = 0;

		plan.cuts.forEach((cut, i) => {
			x += cut.length * scale;

			// Add kerf gap after each cut except the last
			if (i < plan.cuts.length - 1) {
				const kerfWidth = kerf * scale;
				positions.push({
					x,
					width: kerfWidth
				});
				x += kerfWidth;
			}
		});

		return positions;
	});

	const wastePosition: WastePosition | null = $derived.by(() => {
		// Calculate where waste starts
		let x = 0;
		plan.cuts.forEach((cut, i) => {
			x += cut.length * scale;
			if (i < plan.cuts.length - 1) {
				x += kerf * scale;
			}
		});

		const wasteWidth = plan.wasteLength * scale;
		if (wasteWidth <= 0) return null;

		return {
			x,
			width: wasteWidth
		};
	});
</script>

<div class="diagram-container">
	<div class="diagram-header">
		<span class="stock-label">#{index + 1} {plan.stockLabel || 'Stock'}</span>
		<span class="stock-dimensions">{plan.stockLength}"</span>
	</div>

	<svg viewBox="0 0 {svgWidth} {svgHeight}" class="diagram-svg">
		<!-- Stock outline -->
		<rect
			x="0"
			y="{barY}"
			width="{svgWidth}"
			height="{barHeight}"
			fill="#f9fafb"
			stroke="#d1d5db"
			stroke-width="2"
			rx="4"
		/>

		<!-- Cuts -->
		{#each cutPositions as cutPos (cutPos.x)}
			<rect
				x="{cutPos.x}"
				y="{barY}"
				width="{cutPos.width}"
				height="{barHeight}"
				fill="#10b981"
				stroke="#059669"
				stroke-width="1.5"
			/>
			{#if cutPos.showLabel}
				<text
					x="{cutPos.x + cutPos.width / 2}"
					y="{barY + barHeight / 2}"
					text-anchor="middle"
					dominant-baseline="middle"
					font-size="11"
					font-weight="600"
					fill="white"
				>
					{cutPos.label}
				</text>
			{/if}
		{/each}

		<!-- Kerf gaps -->
		{#each kerfPositions as kerfPos (kerfPos.x)}
			<rect
				x="{kerfPos.x}"
				y="{barY}"
				width="{kerfPos.width}"
				height="{barHeight}"
				fill="#dc2626"
				opacity="0.6"
			/>
		{/each}

		<!-- Waste -->
		{#if wastePosition}
			<rect
				x="{wastePosition.x}"
				y="{barY}"
				width="{wastePosition.width}"
				height="{barHeight}"
				fill="{wasteColor()}"
				opacity="0.3"
				stroke="{wasteColor()}"
				stroke-width="1"
				stroke-dasharray="4 2"
			/>
			{#if wastePosition.width > 40}
				<text
					x="{wastePosition.x + wastePosition.width / 2}"
					y="{barY + barHeight / 2}"
					text-anchor="middle"
					dominant-baseline="middle"
					font-size="10"
					font-weight="500"
					fill="{wasteColor()}"
				>
					waste
				</text>
			{/if}
		{/if}
	</svg>

	<div class="diagram-footer">
		<span class="cuts-count">{plan.cuts.length} cut{plan.cuts.length !== 1 ? 's' : ''}</span>
		<span class="waste-amount">{plan.wasteLength.toFixed(2)}" waste ({wastePercent.toFixed(1)}%)</span>
	</div>
</div>

<style>
	.diagram-container {
		background: white;
		border: 1px solid rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-lg);
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.diagram-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: var(--space-xs);
		border-bottom: 1px solid rgba(17, 17, 17, 0.08);
	}

	.stock-label {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-ink);
	}

	.stock-dimensions {
		font-size: 0.875rem;
		color: var(--color-ink-muted);
		font-family: var(--font-mono, monospace);
	}

	.diagram-svg {
		width: 100%;
		height: auto;
	}

	.diagram-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--space-xs);
		border-top: 1px solid rgba(17, 17, 17, 0.08);
		font-size: 0.8125rem;
	}

	.cuts-count {
		color: var(--color-ink-muted);
	}

	.waste-amount {
		color: var(--color-ink-muted);
		font-family: var(--font-mono, monospace);
	}
</style>
