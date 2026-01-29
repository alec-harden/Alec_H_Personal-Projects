<script lang="ts">
	// New BOM page - integrates wizard and display components
	// Modern Artisan aesthetic with warm wood-toned styling

	import BOMWizard from '$lib/components/bom/BOMWizard.svelte';
	import BOMDisplay from '$lib/components/bom/BOMDisplay.svelte';
	import SaveToProjectModal from '$lib/components/bom/SaveToProjectModal.svelte';
	import CSVUpload from '$lib/components/bom/CSVUpload.svelte';
	import type { BOM, ProjectDetails, BOMItem } from '$lib/types/bom';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// View state
	type ViewState = 'choose' | 'wizard' | 'csv-upload' | 'loading' | 'result';
	let currentView = $state<ViewState>('choose');
	let generatedBOM = $state<BOM | null>(null);
	let error = $state<string | null>(null);

	// Track creation source for BOM metadata
	type CreationMethod = 'wizard' | 'csv';
	let creationMethod = $state<CreationMethod>('wizard');

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
		creationMethod = 'wizard';
		currentView = 'choose';
	}

	// Handle CSV import
	function handleCSVImport(items: BOMItem[]) {
		// Create a BOM object from imported items (same shape as AI-generated BOM)
		generatedBOM = {
			projectName: 'CSV Import',
			projectType: 'csv-import',
			generatedAt: new Date().toISOString(),
			items: items
		};
		creationMethod = 'csv';
		currentView = 'result';
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
	{#if currentView === 'choose'}
		<header class="page-header">
			<a href="/" class="back-link">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="back-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Dashboard
			</a>
			<h1 class="page-title">Create New BOM</h1>
			<p class="page-description">
				Choose how you'd like to create your bill of materials.
			</p>
		</header>

		<div class="method-cards">
			<!-- AI Wizard Card -->
			<div
				class="method-card"
				role="button"
				tabindex="0"
				onclick={() => { currentView = 'wizard'; creationMethod = 'wizard'; }}
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); currentView = 'wizard'; creationMethod = 'wizard'; } }}
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="method-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 22l-.394-1.433a2.25 2.25 0 00-1.423-1.423L13.25 18.75l1.433-.394a2.25 2.25 0 001.423-1.423l.394-1.433.394 1.433a2.25 2.25 0 001.423 1.423l1.433.394-1.433.394a2.25 2.25 0 00-1.423 1.423z" />
				</svg>
				<h3 class="method-title">AI-Powered Generation</h3>
				<p class="method-description">
					Answer guided questions and let AI generate your complete bill of materials.
				</p>
				<button type="button" class="btn-primary method-btn">
					Start Wizard
				</button>
			</div>

			<!-- CSV Import Card -->
			<div
				class="method-card"
				role="button"
				tabindex="0"
				onclick={() => currentView = 'csv-upload'}
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); currentView = 'csv-upload'; } }}
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="method-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
				</svg>
				<h3 class="method-title">Import from CSV</h3>
				<p class="method-description">
					Upload an existing CSV file to create a bill of materials.
				</p>
				<p class="method-subtext">
					Supports the standard BOM export format.
				</p>
				<button type="button" class="btn-secondary method-btn">
					Upload CSV
				</button>
			</div>
		</div>

	{:else if currentView === 'wizard'}
		<header class="page-header">
			<button type="button" onclick={() => currentView = 'choose'} class="back-link">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="back-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
				Back
			</button>
			<h1 class="page-title">AI-Powered BOM Generation</h1>
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

	{:else if currentView === 'csv-upload'}
		<header class="page-header">
			<button type="button" onclick={() => currentView = 'choose'} class="back-link">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="back-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
				Back
			</button>
			<h1 class="page-title">Import BOM from CSV</h1>
			<p class="page-description">
				Upload a CSV file with your bill of materials.
			</p>
		</header>

		<CSVUpload onImport={handleCSVImport} onCancel={() => currentView = 'choose'} />

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

	/* Method Selection Cards */
	.method-cards {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-lg);
		margin-top: var(--space-xl);
	}

	@media (max-width: 640px) {
		.method-cards {
			grid-template-columns: 1fr;
		}
	}

	.method-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-2xl);
		background: var(--color-white);
		border: 1px solid rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all var(--transition-base);
		text-align: center;
	}

	.method-card:hover {
		border-color: var(--color-walnut);
		box-shadow: var(--shadow-medium);
		transform: translateY(-2px);
	}

	.method-card:focus {
		outline: 2px solid var(--color-walnut);
		outline-offset: 2px;
	}

	.method-icon {
		width: 48px;
		height: 48px;
		color: var(--color-walnut);
		margin-bottom: var(--space-sm);
	}

	.method-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--color-ink);
		margin: 0;
	}

	.method-description {
		font-size: 0.9375rem;
		color: var(--color-ink-soft);
		line-height: 1.5;
		margin: 0;
	}

	.method-subtext {
		font-size: 0.8125rem;
		color: var(--color-ink-muted);
		margin: 0;
	}

	.method-btn {
		margin-top: var(--space-sm);
		pointer-events: none;
	}
</style>
