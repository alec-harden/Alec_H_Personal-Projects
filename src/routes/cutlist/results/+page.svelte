<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import OptimizationResults from '$lib/components/cutlist/OptimizationResults.svelte';
	import SaveCutListModal from '$lib/components/cutlist/SaveCutListModal.svelte';
	import type { CutListMode, Cut, Stock } from '$lib/types/cutlist';
	import type { OptimizationResult } from '$lib/server/cutOptimizer';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// State loaded from navigation
	let result = $state<OptimizationResult | null>(null);
	let mode = $state<CutListMode>('linear');
	let kerf = $state<number>(0.125);
	let cuts = $state<Cut[]>([]);
	let stock = $state<Stock[]>([]);

	// Save state
	let showSaveModal = $state(false);
	let saving = $state(false);
	let saveError = $state<string | null>(null);
	let savedCutListId = $state<string | null>(null);

	// Load state from navigation on mount
	onMount(() => {
		const state = $page.state as {
			result?: OptimizationResult;
			mode?: CutListMode;
			kerf?: number;
			cuts?: Cut[];
			stock?: Stock[];
		} | undefined;

		if (state?.result) {
			result = state.result;
			mode = state.mode || 'linear';
			kerf = state.kerf || 0.125;
			cuts = state.cuts || [];
			stock = state.stock || [];
		} else {
			// No state - redirect to optimizer
			goto('/cutlist');
		}
	});

	function handleGoBack() {
		// Navigate back to optimizer with data preserved
		goto('/cutlist', {
			state: {
				mode,
				cuts,
				stock,
				kerf
			}
		});
	}

	async function handleSave(projectId: string, name: string) {
		saving = true;
		saveError = null;

		try {
			const response = await fetch('/api/cutlist/save', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					projectId,
					name,
					mode,
					cuts,
					stock,
					kerf
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to save');
			}

			const responseData = await response.json();
			savedCutListId = responseData.cutListId;
			showSaveModal = false;
		} catch (e) {
			saveError = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			saving = false;
		}
	}

	// Validation
	const canSave = $derived(data.projects && data.projects.length > 0);
</script>

<svelte:head>
	<title>Optimization Results | WoodShop Toolbox</title>
</svelte:head>

<div class="results-page animate-fade-in">
	<!-- Page Header -->
	<header class="page-header">
		<h1 class="page-title">Optimization Results</h1>
		<p class="page-description">
			Your cutting pattern has been optimized to minimize waste. Review the results below and save to a project if needed.
		</p>
	</header>

	<!-- Action Buttons -->
	<div class="action-section">
		<button
			type="button"
			class="btn-ghost"
			onclick={handleGoBack}
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			Go Back
		</button>
		{#if canSave}
			<button
				type="button"
				class="btn-primary"
				onclick={() => (showSaveModal = true)}
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
				</svg>
				Save to Project
			</button>
		{/if}
	</div>

	<!-- Save Success Banner -->
	{#if savedCutListId}
		<div class="alert-box alert-success">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<div>
				<div class="alert-title">Cut List Saved</div>
				<div class="alert-message">
					Your cut list has been saved successfully.
					<a href="/cutlist/{savedCutListId}" class="alert-link">View saved cut list</a>
				</div>
			</div>
		</div>
	{/if}

	<!-- Results Display -->
	{#if result}
		<OptimizationResults {result} {mode} {kerf} />
	{/if}
</div>

<!-- Save Modal -->
<SaveCutListModal
	open={showSaveModal}
	projects={data.projects}
	onSave={handleSave}
	onClose={() => (showSaveModal = false)}
	{saving}
/>

<style>
	.results-page {
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

	/* Action Section */
	.action-section {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg) 0;
	}

	.btn-icon {
		width: 20px;
		height: 20px;
	}

	/* Alert Box */
	.alert-box {
		display: flex;
		gap: var(--space-md);
		padding: var(--space-md);
		border-radius: var(--radius-md);
	}

	.alert-success {
		background: #d1fae5;
		border: 1px solid #a7f3d0;
	}

	.alert-success .alert-icon {
		color: #059669;
	}

	.alert-success .alert-title {
		color: #065f46;
	}

	.alert-success .alert-message {
		color: #047857;
	}

	.alert-icon {
		width: 24px;
		height: 24px;
		flex-shrink: 0;
	}

	.alert-title {
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: var(--space-xs);
	}

	.alert-message {
		font-size: 0.875rem;
	}

	.alert-link {
		color: #065f46;
		text-decoration: underline;
		font-weight: 600;
		margin-left: var(--space-xs);
	}

	.alert-link:hover {
		color: #047857;
	}
</style>
