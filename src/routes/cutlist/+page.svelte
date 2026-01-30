<script lang="ts">
	import ModeSelector from '$lib/components/cutlist/ModeSelector.svelte';
	import CutInputForm from '$lib/components/cutlist/CutInputForm.svelte';
	import StockInputForm from '$lib/components/cutlist/StockInputForm.svelte';
	import KerfConfig from '$lib/components/cutlist/KerfConfig.svelte';
	import OptimizationResults from '$lib/components/cutlist/OptimizationResults.svelte';
	import type { CutListMode, Cut, Stock } from '$lib/types/cutlist';
	import { createCut, createStock } from '$lib/types/cutlist';
	import type { OptimizationResult } from '$lib/server/cutOptimizer';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Mode state - default to linear
	let mode = $state<CutListMode>('linear');

	// Input state
	let cuts = $state<Cut[]>([createCut(mode)]);
	let stock = $state<Stock[]>([createStock(mode)]);
	let kerf = $state<number>(0.125);

	// Optimization state
	let result = $state<OptimizationResult | null>(null);
	let isOptimizing = $state<boolean>(false);
	let error = $state<string | null>(null);

	function handleModeChange(newMode: CutListMode) {
		// Reset inputs to match new mode
		mode = newMode;
		cuts = [createCut(mode)];
		stock = [createStock(mode)];
		result = null;
		error = null;
	}

	function handleClearAll() {
		// Confirmation if user has entered multiple entries
		if (cuts.length > 1 || stock.length > 1) {
			const confirmed = confirm('Clear all cuts and stock? This cannot be undone.');
			if (!confirmed) return;
		}

		// Reset to initial state
		cuts = [createCut(mode)];
		stock = [createStock(mode)];
		kerf = 0.125;
		result = null;
		error = null;
	}

	async function handleOptimize() {
		isOptimizing = true;
		error = null;
		result = null;

		try {
			const response = await fetch('/api/cutlist/optimize', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ mode, cuts, stock, kerf })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Optimization failed');
			}

			result = await response.json();
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			isOptimizing = false;
		}
	}

	// Validation
	const canOptimize = $derived(cuts.length > 0 && stock.length > 0 && !isOptimizing);
</script>

<svelte:head>
	<title>Cut List Optimizer | WoodShop Toolbox</title>
</svelte:head>

<div class="cutlist-page animate-fade-in">
	<!-- Page Header -->
	<header class="page-header">
		<a href="/" class="back-link">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="back-icon">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			Back to Dashboard
		</a>
		<h1 class="page-title">Cut List Optimizer</h1>
		<p class="page-description">
			Optimize your cutting patterns to minimize waste and maximize material efficiency. Choose between
			linear cuts for dimensional lumber or sheet cuts for plywood and panels.
		</p>
	</header>

	<!-- Mode Selection -->
	<ModeSelector bind:mode onModeChange={handleModeChange} />

	<!-- Input Forms -->
	<div class="input-section">
		<div class="input-grid">
			<!-- Cuts Form -->
			<div class="input-column">
				<CutInputForm bind:cuts {mode} />
			</div>

			<!-- Stock Form -->
			<div class="input-column">
				<StockInputForm bind:stock {mode} />
			</div>
		</div>

		<!-- Kerf Configuration -->
		<div class="kerf-section">
			<KerfConfig bind:kerf />
		</div>
	</div>

	<!-- Optimize Button -->
	<div class="action-section">
		<button
			type="button"
			class="btn-primary btn-optimize"
			onclick={handleOptimize}
			disabled={!canOptimize}
		>
			{#if isOptimizing}
				<svg viewBox="0 0 24 24" class="btn-spinner">
					<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" opacity="0.25" />
					<path d="M12 2a10 10 0 0110 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
				</svg>
				Optimizing...
			{:else}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				Optimize Cuts
			{/if}
		</button>
	</div>

	<!-- Error Display -->
	{#if error}
		<div class="alert-box alert-error">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
			<div>
				<div class="alert-title">Optimization Error</div>
				<div class="alert-message">{error}</div>
			</div>
		</div>
	{/if}

	<!-- Results Display -->
	{#if result}
		<OptimizationResults {result} {mode} />
	{/if}
</div>

<style>
	.cutlist-page {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	/* Page Header */
	.page-header {
		margin-bottom: var(--space-lg);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: 0.875rem;
		color: var(--color-walnut);
		text-decoration: none;
		background: none;
		border: none;
		padding: 0;
		margin-bottom: var(--space-sm);
		cursor: pointer;
		transition: color var(--transition-fast);
	}

	.back-link:hover {
		color: var(--color-walnut-dark);
	}

	.back-icon {
		width: 16px;
		height: 16px;
	}

	.page-title {
		font-family: var(--font-display);
		font-size: 1.75rem;
		color: var(--color-ink);
		margin: 0 0 var(--space-xs) 0;
	}

	.page-description {
		font-size: 0.9375rem;
		color: var(--color-ink-muted);
		line-height: 1.6;
		margin: 0;
		max-width: 800px;
	}

	/* Input Section */
	.input-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.input-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-lg);
	}

	@media (min-width: 1024px) {
		.input-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.input-column {
		display: flex;
		flex-direction: column;
	}

	.kerf-section {
		max-width: 600px;
	}

	/* Action Section */
	.action-section {
		display: flex;
		justify-content: center;
		padding: var(--space-lg) 0;
	}

	.btn-optimize {
		min-width: 200px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
	}

	.btn-icon {
		width: 20px;
		height: 20px;
	}

	.btn-spinner {
		width: 16px;
		height: 16px;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
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
</style>
