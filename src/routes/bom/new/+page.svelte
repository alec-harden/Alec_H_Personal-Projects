<script lang="ts">
	// New BOM page - integrates wizard and display components
	// Modern Artisan aesthetic with warm wood-toned styling

	import BOMWizard from '$lib/components/bom/BOMWizard.svelte';
	import BOMDisplay from '$lib/components/bom/BOMDisplay.svelte';
	import SaveToProjectModal from '$lib/components/bom/SaveToProjectModal.svelte';
	import type { BOM, ProjectDetails, BOMItem } from '$lib/types/bom';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// View state
	type ViewState = 'wizard' | 'loading' | 'result';
	let currentView = $state<ViewState>('wizard');
	let generatedBOM = $state<BOM | null>(null);
	let error = $state<string | null>(null);

	// Retry capability
	let lastProjectDetails = $state<ProjectDetails | null>(null);

	// Extended loading feedback
	let showExtendedWait = $state(false);
	let loadingTimeout: ReturnType<typeof setTimeout> | null = null;

	// Save modal state
	let showSaveModal = $state(false);
	let saving = $state(false);
	let saveError = $state<string | null>(null);
	let saveSuccess = $state(false);

	// Handle wizard completion - trigger BOM generation
	async function handleWizardComplete(details: ProjectDetails) {
		lastProjectDetails = details; // Store for retry
		currentView = 'loading';
		error = null;
		showExtendedWait = false;

		// Start extended wait timer (10 seconds)
		loadingTimeout = setTimeout(() => {
			showExtendedWait = true;
		}, 10000);

		try {
			const response = await fetch('/api/bom/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(details)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to generate BOM');
			}

			const bom: BOM = await response.json();
			generatedBOM = bom;
			currentView = 'result';
		} catch (e) {
			console.error('BOM generation failed:', e);
			error = e instanceof Error ? e.message : 'An unexpected error occurred';
			currentView = 'wizard';
		} finally {
			if (loadingTimeout) {
				clearTimeout(loadingTimeout);
				loadingTimeout = null;
			}
			showExtendedWait = false;
		}
	}

	// Reset to start over
	function handleStartOver() {
		generatedBOM = null;
		error = null;
		currentView = 'wizard';
	}

	// Retry generation with last project details
	function handleRetry() {
		if (lastProjectDetails) {
			handleWizardComplete(lastProjectDetails);
		}
	}

	// Handle quantity change
	function handleQuantityChange(id: string, quantity: number) {
		if (!generatedBOM) return;
		generatedBOM = {
			...generatedBOM,
			items: generatedBOM.items.map((item) => (item.id === id ? { ...item, quantity } : item))
		};
	}

	// Handle visibility toggle
	function handleToggleVisibility(id: string) {
		if (!generatedBOM) return;
		generatedBOM = {
			...generatedBOM,
			items: generatedBOM.items.map((item) =>
				item.id === id ? { ...item, hidden: !item.hidden } : item
			)
		};
	}

	// Handle add item
	function handleAddItem(item: BOMItem) {
		if (!generatedBOM) return;
		generatedBOM = {
			...generatedBOM,
			items: [...generatedBOM.items, item]
		};
	}

	// Handle save button click - open modal
	function handleSaveClick() {
		saveError = null;
		saveSuccess = false;
		showSaveModal = true;
	}

	// Handle save confirmation from modal
	async function handleSaveConfirm(projectId: string) {
		if (!generatedBOM) return;

		saving = true;
		saveError = null;

		try {
			const response = await fetch('/api/bom/save', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					projectId,
					bom: generatedBOM
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to save BOM');
			}

			const result = await response.json();

			// Success! Close modal and show success state
			showSaveModal = false;
			saveSuccess = true;
			saving = false;

			// Optional: Navigate to the saved BOM or project
			// For now, just show success feedback
			console.log('BOM saved successfully:', result.bomId);
		} catch (e) {
			console.error('Failed to save BOM:', e);
			saveError = e instanceof Error ? e.message : 'An unexpected error occurred';
			saving = false;
		}
	}

	// Close save modal
	function handleCloseSaveModal() {
		if (!saving) {
			showSaveModal = false;
			saveError = null;
		}
	}
</script>

<svelte:head>
	<title>New BOM | WoodShop Toolbox</title>
</svelte:head>

<div class="bom-new-page animate-fade-in">
	{#if currentView === 'wizard'}
		<header class="page-header">
			<a href="/" class="back-link">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="back-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Dashboard
			</a>
			<h1 class="page-title">Create New BOM</h1>
			<p class="page-description">
				Follow the guided steps to generate your bill of materials.
			</p>
		</header>

		{#if error}
			<div class="error-banner">
				<div class="error-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
					</svg>
				</div>
				<div class="error-content">
					<p class="error-title">Generation Failed</p>
					<p class="error-detail">{error}</p>
				</div>
				<div class="error-actions">
					{#if lastProjectDetails}
						<button type="button" onclick={handleRetry} class="btn-primary btn-sm">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
								<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
							</svg>
							Retry
						</button>
					{/if}
					<button type="button" onclick={() => (error = null)} class="btn-ghost btn-sm">
						Dismiss
					</button>
				</div>
			</div>
		{/if}

		<BOMWizard onComplete={handleWizardComplete} />

	{:else if currentView === 'loading'}
		<div class="loading-state">
			<div class="loading-spinner">
				<svg viewBox="0 0 50 50" class="spinner-svg">
					<circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="spinner-track" />
					<circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="spinner-fill" />
				</svg>
			</div>
			<p class="loading-title">Generating your bill of materials...</p>
			<p class="loading-hint">This may take a few moments.</p>
			{#if showExtendedWait}
				<p class="loading-extended">Taking longer than usual - still working...</p>
			{/if}
		</div>

	{:else if currentView === 'result' && generatedBOM}
		<header class="page-header">
			<a href="/" class="back-link">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="back-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Dashboard
			</a>
		</header>

		{#if saveSuccess}
			<div class="success-banner">
				<div class="success-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div class="success-content">
					<p class="success-title">BOM Saved!</p>
					<p class="success-detail">Your bill of materials has been saved to the project.</p>
				</div>
				<button type="button" onclick={() => (saveSuccess = false)} class="btn-ghost btn-sm">
					Dismiss
				</button>
			</div>
		{/if}

		<BOMDisplay
			bom={generatedBOM}
			onStartOver={handleStartOver}
			onQuantityChange={handleQuantityChange}
			onToggleVisibility={handleToggleVisibility}
			onAddItem={handleAddItem}
			onSave={handleSaveClick}
			showSaveButton={data.projects.length > 0}
		/>

		<SaveToProjectModal
			open={showSaveModal}
			projects={data.projects}
			onSave={handleSaveConfirm}
			onClose={handleCloseSaveModal}
			saving={saving}
		/>
	{/if}
</div>

<style>
	.bom-new-page {
		max-width: 800px;
		margin: 0 auto;
	}

	/* Header */
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
		margin-bottom: var(--space-sm);
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
		margin: 0;
	}

	/* Error Banner */
	.error-banner {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: var(--color-error-soft);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-xl);
	}

	.error-icon {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		color: var(--color-error);
	}

	.error-icon svg {
		width: 100%;
		height: 100%;
	}

	.error-content {
		flex: 1;
		min-width: 200px;
	}

	.error-title {
		font-weight: 600;
		color: var(--color-error);
		margin: 0 0 var(--space-xs) 0;
	}

	.error-detail {
		font-size: 0.875rem;
		color: var(--color-ink-soft);
		margin: 0;
	}

	.error-actions {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.btn-sm {
		padding: var(--space-xs) var(--space-md);
		font-size: 0.8125rem;
	}

	.btn-icon {
		width: 14px;
		height: 14px;
	}

	/* Loading State */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		text-align: center;
	}

	.loading-spinner {
		width: 56px;
		height: 56px;
		margin-bottom: var(--space-lg);
	}

	.spinner-svg {
		width: 100%;
		height: 100%;
		animation: rotate 2s linear infinite;
	}

	.spinner-track {
		stroke: var(--color-paper-dark);
	}

	.spinner-fill {
		stroke: var(--color-walnut);
		stroke-dasharray: 80, 200;
		stroke-dashoffset: 0;
		animation: dash 1.5s ease-in-out infinite;
	}

	@keyframes rotate {
		100% {
			transform: rotate(360deg);
		}
	}

	@keyframes dash {
		0% {
			stroke-dasharray: 1, 200;
			stroke-dashoffset: 0;
		}
		50% {
			stroke-dasharray: 80, 200;
			stroke-dashoffset: -35;
		}
		100% {
			stroke-dasharray: 80, 200;
			stroke-dashoffset: -125;
		}
	}

	.loading-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--color-ink);
		margin: 0 0 var(--space-xs) 0;
	}

	.loading-hint {
		font-size: 0.9375rem;
		color: var(--color-ink-muted);
		margin: 0;
	}

	.loading-extended {
		margin-top: var(--space-lg);
		font-size: 0.875rem;
		color: var(--color-walnut);
	}

	/* Success Banner */
	.success-banner {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: #f0fdf4;
		border: 1px solid #86efac;
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-xl);
	}

	.success-icon {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		color: #16a34a;
	}

	.success-icon svg {
		width: 100%;
		height: 100%;
	}

	.success-content {
		flex: 1;
		min-width: 200px;
	}

	.success-title {
		font-weight: 600;
		color: #16a34a;
		margin: 0 0 var(--space-xs) 0;
	}

	.success-detail {
		font-size: 0.875rem;
		color: var(--color-ink-soft);
		margin: 0;
	}
</style>
