<script lang="ts">
	import ModeSelector from '$lib/components/cutlist/ModeSelector.svelte';
	import type { CutListMode } from '$lib/types/cutlist';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Mode state - default to linear
	let mode = $state<CutListMode>('linear');

	function handleModeChange(newMode: CutListMode) {
		console.log('Mode changed to:', newMode);
	}
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

	<!-- Placeholder Content Area -->
	<div class="content-area sanded-surface">
		<div class="placeholder-content">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="placeholder-icon">
				{#if mode === 'linear'}
					<!-- Ruler icon -->
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3 6h18M3 18h18M6 6v12M12 6v6M18 6v12M9 6v3"
					/>
				{:else}
					<!-- Grid icon -->
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
					/>
				{/if}
			</svg>
			<p class="placeholder-title">{mode === 'linear' ? 'Linear (1D)' : 'Sheet (2D)'} Mode Selected</p>
			<p class="placeholder-subtitle">
				{#if mode === 'linear'}
					Optimize cuts for dimensional lumber, boards, and trim pieces.
				{:else}
					Optimize cuts for plywood sheets, panels, and other 2D materials.
				{/if}
			</p>
		</div>
	</div>
</div>

<style>
	.cutlist-page {
		max-width: 800px;
		margin: 0 auto;
	}

	/* Page Header */
	.page-header {
		margin-bottom: var(--space-xl);
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
		max-width: 600px;
	}

	/* Content Area */
	.content-area {
		padding: var(--space-2xl);
		border-radius: var(--radius-lg);
		min-height: 400px;
	}

	.placeholder-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: var(--space-2xl);
		gap: var(--space-md);
	}

	.placeholder-icon {
		width: 64px;
		height: 64px;
		color: var(--color-walnut);
		opacity: 0.5;
	}

	.placeholder-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--color-ink);
		margin: 0;
	}

	.placeholder-subtitle {
		font-size: 0.9375rem;
		color: var(--color-ink-muted);
		margin: 0;
		max-width: 400px;
	}
</style>
