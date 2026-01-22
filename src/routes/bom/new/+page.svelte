<script lang="ts">
	// New BOM page - integrates wizard and display components
	// Manages the full flow: wizard -> loading -> result

	import BOMWizard from '$lib/components/bom/BOMWizard.svelte';
	import BOMDisplay from '$lib/components/bom/BOMDisplay.svelte';
	import type { BOM, ProjectDetails, BOMItem } from '$lib/types/bom';

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
</script>

<svelte:head>
	<title>New BOM | WoodShop Toolbox</title>
</svelte:head>

{#if currentView === 'wizard'}
	<div class="mb-6">
		<a href="/" class="text-amber-700 hover:text-amber-800 text-sm mb-2 inline-block">
			&larr; Back to Dashboard
		</a>
		<h1 class="text-2xl font-bold text-gray-900">Create New BOM</h1>
		<p class="text-gray-600 mt-1">
			Follow the guided steps to generate your bill of materials.
		</p>
	</div>

	{#if error}
		<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
			<p class="font-medium text-red-800">Generation Failed</p>
			<p class="mt-1 text-sm text-red-700">{error}</p>
			<div class="mt-3 flex gap-2">
				{#if lastProjectDetails}
					<button
						type="button"
						onclick={handleRetry}
						class="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
					>
						Retry
					</button>
				{/if}
				<button
					type="button"
					onclick={() => (error = null)}
					class="text-sm font-medium text-red-700 underline hover:no-underline"
				>
					Dismiss
				</button>
			</div>
		</div>
	{/if}

	<BOMWizard onComplete={handleWizardComplete} />
{:else if currentView === 'loading'}
	<div class="flex min-h-[400px] flex-col items-center justify-center">
		<div class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600"></div>
		<p class="text-lg font-medium text-gray-900">Generating your bill of materials...</p>
		<p class="mt-1 text-gray-600">This may take a few moments.</p>
		{#if showExtendedWait}
			<p class="mt-4 text-sm text-amber-700">Taking longer than usual - still working...</p>
		{/if}
	</div>
{:else if currentView === 'result' && generatedBOM}
	<div class="mb-6">
		<a href="/" class="text-amber-700 hover:text-amber-800 text-sm mb-2 inline-block">
			&larr; Back to Dashboard
		</a>
	</div>

	<BOMDisplay
		bom={generatedBOM}
		onStartOver={handleStartOver}
		onQuantityChange={handleQuantityChange}
		onToggleVisibility={handleToggleVisibility}
		onAddItem={handleAddItem}
	/>
{/if}
