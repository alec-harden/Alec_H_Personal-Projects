<script lang="ts">
	import type { StockPlan } from '$lib/server/cutOptimizer';

	interface Props {
		plan: StockPlan;
		kerf: number;
		index: number;
	}

	let { plan, kerf, index }: Props = $props();

	// SVG dimensions
	const svgWidth = 600;
	const svgHeight = 400;
	const padding = 20;

	// Scale calculation: maintain aspect ratio using same scale for both dimensions
	const scale = $derived(
		Math.min(
			(svgWidth - 2 * padding) / (plan.stockLength || 1),
			(svgHeight - 2 * padding) / (plan.stockWidth || 1)
		)
	);

	// Scaled stock dimensions
	const scaledStockWidth = $derived((plan.stockLength || 0) * scale);
	const scaledStockHeight = $derived((plan.stockWidth || 0) * scale);

	// Calculate waste percentage for color coding
	const stockArea = $derived((plan.stockLength || 0) * (plan.stockWidth || 0));
	const wasteArea = $derived(plan.wasteArea || 0);
	const wastePercent = $derived(stockArea > 0 ? (wasteArea / stockArea) * 100 : 0);

	// Waste color based on percentage (match existing color coding)
	const wasteColor = $derived(() => {
		if (wastePercent < 10) return '#10b981'; // green
		if (wastePercent < 25) return '#fbbf24'; // amber
		return '#ef4444'; // red
	});

	// Transform cuts to SVG coordinates
	interface CutRect {
		x: number;
		y: number;
		width: number;
		height: number;
		label: string;
		id: string;
		showLabel: boolean;
		rotated: boolean;
	}

	const cutRects: CutRect[] = $derived.by(() => {
		const rects: CutRect[] = [];

		plan.cuts.forEach((cut) => {
			const svgX = padding + (cut.x || 0) * scale;
			const svgY = padding + (cut.y || 0) * scale;
			const svgWidth = (cut.length || 0) * scale;
			const svgHeight = (cut.width || 0) * scale;

			rects.push({
				x: svgX,
				y: svgY,
				width: svgWidth,
				height: svgHeight,
				label: `${cut.length}" x ${cut.width}"`,
				id: cut.cutId,
				showLabel: svgWidth > 40 && svgHeight > 20,
				rotated: cut.rotated
			});
		});

		return rects;
	});
</script>

<div class="diagram-container">
	<div class="diagram-header">
		<span class="stock-label">Sheet #{index + 1}: {plan.stockLabel || 'Stock'}</span>
		<span class="stock-dimensions">{plan.stockLength}" x {plan.stockWidth}"</span>
	</div>

	<svg viewBox="0 0 {svgWidth} {svgHeight}" class="diagram-svg">
		<!-- Stock outline -->
		<rect
			x="{padding}"
			y="{padding}"
			width="{scaledStockWidth}"
			height="{scaledStockHeight}"
			fill="#f9fafb"
			stroke="#d1d5db"
			stroke-width="2"
			rx="4"
		/>

		<!-- Placed cuts -->
		{#each cutRects as cutRect (cutRect.id)}
			<rect
				x="{cutRect.x}"
				y="{cutRect.y}"
				width="{cutRect.width}"
				height="{cutRect.height}"
				fill="#10b981"
				stroke="#059669"
				stroke-width="1.5"
			/>
			{#if cutRect.showLabel}
				<text
					x="{cutRect.x + cutRect.width / 2}"
					y="{cutRect.y + cutRect.height / 2}"
					text-anchor="middle"
					dominant-baseline="middle"
					font-size="11"
					font-weight="600"
					fill="white"
				>
					{cutRect.label}
				</text>
			{/if}
			{#if cutRect.rotated && cutRect.width > 30}
				<!-- Rotation indicator: small circle with rotation symbol -->
				<circle
					cx="{cutRect.x + cutRect.width - 8}"
					cy="{cutRect.y + 8}"
					r="6"
					fill="white"
					opacity="0.9"
				/>
				<text
					x="{cutRect.x + cutRect.width - 8}"
					y="{cutRect.y + 8}"
					text-anchor="middle"
					dominant-baseline="middle"
					font-size="9"
					font-weight="700"
					fill="#059669"
				>
					⟳
				</text>
			{/if}
		{/each}
	</svg>

	<div class="diagram-footer">
		<span class="cuts-count">{plan.cuts.length} cut{plan.cuts.length !== 1 ? 's' : ''}</span>
		<span class="waste-amount" style="color: {wasteColor()}"
			>{wasteArea.toFixed(2)} sq in waste ({wastePercent.toFixed(1)}%)</span
		>
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
		font-family: var(--font-mono, monospace);
		font-weight: 600;
	}
</style>
