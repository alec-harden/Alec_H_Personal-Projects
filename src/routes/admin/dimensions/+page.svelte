<script lang="ts">
	import { enhance } from '$app/forms';

	interface DimensionValue {
		id: string;
		value: number;
		isDefault: boolean;
	}

	interface DimensionTypeGroup {
		thickness: DimensionValue[];
		width: DimensionValue[];
		length: DimensionValue[];
	}

	interface GroupedDimensions {
		hardwood: DimensionTypeGroup;
		common: DimensionTypeGroup;
		sheet: DimensionTypeGroup;
	}

	interface Props {
		data: { dimensions: GroupedDimensions };
		form: { error?: string; success?: boolean } | null;
	}

	let { data, form }: Props = $props();

	// State for inline add forms
	let addingTo = $state<{ category: string; type: string } | null>(null);
	let newValue = $state('');
	let loading = $state(false);
	let showResetConfirm = $state(false);

	// Category display config
	const categoryConfig = {
		hardwood: {
			label: 'Hardwood Lumber',
			description: 'Standard thicknesses for hardwood boards (NHLA quarter system)',
			types: ['thickness'] as const
		},
		common: {
			label: 'Common Boards',
			description: 'Dimensional lumber (1x and 2x nominal sizes)',
			types: ['thickness', 'width'] as const
		},
		sheet: {
			label: 'Sheet Goods',
			description: 'Plywood, MDF, and other sheet materials',
			types: ['thickness', 'width', 'length'] as const
		}
	};

	// Dimension type labels
	const typeLabels: Record<string, string> = {
		thickness: 'Thickness',
		width: 'Width',
		length: 'Length'
	};

	/**
	 * Format dimension value as fraction or decimal
	 * Common fractions: 1/8, 3/16, 1/4, 5/16, 3/8, 7/16, 1/2, 9/16, 5/8, 11/16, 3/4, 13/16, 7/8, 15/16
	 */
	function formatDimension(value: number): string {
		// Check for common fractions (with tolerance)
		const fractions: [number, string][] = [
			[0.125, '1/8'],
			[0.1875, '3/16'],
			[0.25, '1/4'],
			[0.3125, '5/16'],
			[0.34375, '11/32'],
			[0.375, '3/8'],
			[0.4375, '7/16'],
			[0.46875, '15/32'],
			[0.5, '1/2'],
			[0.5625, '9/16'],
			[0.59375, '19/32'],
			[0.625, '5/8'],
			[0.6875, '11/16'],
			[0.71875, '23/32'],
			[0.75, '3/4'],
			[0.8125, '13/16'],
			[0.875, '7/8'],
			[0.9375, '15/16'],
			[1.0625, '1-1/16'],
			[1.125, '1-1/8'],
			[1.25, '1-1/4'],
			[1.5, '1-1/2'],
			[1.75, '1-3/4'],
			[2.5, '2-1/2'],
			[2.75, '2-3/4'],
			[3.5, '3-1/2'],
			[3.75, '3-3/4'],
			[5.5, '5-1/2'],
			[7.25, '7-1/4'],
			[9.25, '9-1/4'],
			[11.25, '11-1/4']
		];

		for (const [decimal, fraction] of fractions) {
			if (Math.abs(value - decimal) < 0.001) {
				return `${fraction}"`;
			}
		}

		// Whole numbers
		if (value === Math.floor(value)) {
			return `${value}"`;
		}

		// Default to decimal
		return `${value}"`;
	}

	function startAdding(category: string, type: string) {
		addingTo = { category, type };
		newValue = '';
	}

	function cancelAdding() {
		addingTo = null;
		newValue = '';
	}
</script>

<svelte:head>
	<title>Dimensions | Admin | WoodShop Toolbox</title>
</svelte:head>

<div class="min-h-screen bg-stone-100 py-8 px-4">
	<div class="max-w-4xl mx-auto">
		<div class="mb-6">
			<h1 class="text-3xl font-bold text-stone-800">Dimension Management</h1>
			<p class="mt-1 text-stone-600">Manage accepted dimension values for lumber categories</p>
		</div>

		{#if form?.error}
			<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
				{form.error}
			</div>
		{/if}

		{#if form?.success}
			<div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
				Dimension value updated successfully.
			</div>
		{/if}

		<!-- Category Sections -->
		{#each Object.entries(categoryConfig) as [category, config]}
			{@const categoryData = data.dimensions[category as keyof GroupedDimensions]}
			<div class="mb-8 bg-white shadow-lg rounded-lg overflow-hidden">
				<div class="p-4 bg-amber-50 border-b border-amber-100">
					<h2 class="text-xl font-semibold text-stone-800">{config.label}</h2>
					<p class="text-sm text-stone-600">{config.description}</p>
				</div>

				<div class="p-4 space-y-6">
					{#each config.types as dimType}
						{@const values = categoryData[dimType]}
						<div>
							<div class="flex items-center justify-between mb-2">
								<h3 class="text-sm font-medium text-stone-700">{typeLabels[dimType]}</h3>
								{#if addingTo?.category !== category || addingTo?.type !== dimType}
									<button
										onclick={() => startAdding(category, dimType)}
										class="text-sm text-amber-700 hover:text-amber-800 font-medium"
									>
										+ Add Value
									</button>
								{/if}
							</div>

							<!-- Inline Add Form -->
							{#if addingTo?.category === category && addingTo?.type === dimType}
								<form
									method="POST"
									action="?/add"
									use:enhance={() => {
										loading = true;
										return async ({ update }) => {
											await update();
											loading = false;
											addingTo = null;
											newValue = '';
										};
									}}
									class="mb-3 p-3 bg-stone-50 rounded-lg border border-stone-200"
								>
									<input type="hidden" name="category" value={category} />
									<input type="hidden" name="dimensionType" value={dimType} />
									<div class="flex items-center gap-2">
										<input
											type="number"
											name="value"
											step="0.0001"
											min="0.001"
											max="1000"
											required
											bind:value={newValue}
											placeholder="Enter value in inches"
											class="flex-1 px-3 py-1.5 text-sm border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
										/>
										<span class="text-stone-500">inches</span>
										<button
											type="submit"
											disabled={loading || !newValue}
											class="px-3 py-1.5 text-sm bg-amber-700 text-white rounded hover:bg-amber-800 disabled:opacity-50 transition-colors"
										>
											{loading ? 'Adding...' : 'Add'}
										</button>
										<button
											type="button"
											onclick={cancelAdding}
											class="px-3 py-1.5 text-sm border border-stone-300 rounded hover:bg-stone-100 transition-colors"
										>
											Cancel
										</button>
									</div>
								</form>
							{/if}

							<!-- Value Chips -->
							{#if values.length > 0}
								<div class="flex flex-wrap gap-2">
									{#each values as dim}
										<div
											class="group inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 rounded-full text-sm
												{dim.isDefault ? 'border border-stone-300' : 'border border-amber-400 bg-amber-50'}"
										>
											<span class="text-stone-700">{formatDimension(dim.value)}</span>
											{#if !dim.isDefault}
												<span class="text-xs text-amber-600">(custom)</span>
											{/if}
											<form
												method="POST"
												action="?/remove"
												use:enhance={() => {
													loading = true;
													return async ({ update }) => {
														await update();
														loading = false;
													};
												}}
												class="inline"
											>
												<input type="hidden" name="id" value={dim.id} />
												<button
													type="submit"
													disabled={loading}
													class="ml-0.5 w-4 h-4 flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
													title="Remove this value"
												>
													&times;
												</button>
											</form>
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-sm text-stone-500 italic">No values defined</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}

		<!-- Reset to Defaults Button -->
		<div class="mt-8 p-4 bg-white shadow-sm rounded-lg border border-stone-200">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="font-medium text-stone-800">Reset to Defaults</h3>
					<p class="text-sm text-stone-600">Remove all custom values and restore original dimension values.</p>
				</div>
				{#if showResetConfirm}
					<form
						method="POST"
						action="?/reset"
						use:enhance={() => {
							loading = true;
							return async ({ update }) => {
								await update();
								loading = false;
								showResetConfirm = false;
							};
						}}
					>
						<div class="flex items-center gap-2">
							<span class="text-sm text-red-600">Are you sure?</span>
							<button
								type="submit"
								disabled={loading}
								class="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
							>
								{loading ? 'Resetting...' : 'Yes, Reset'}
							</button>
							<button
								type="button"
								onclick={() => (showResetConfirm = false)}
								class="px-3 py-1.5 text-sm border border-stone-300 rounded hover:bg-stone-100 transition-colors"
							>
								Cancel
							</button>
						</div>
					</form>
				{:else}
					<button
						onclick={() => (showResetConfirm = true)}
						class="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
					>
						Reset to Defaults
					</button>
				{/if}
			</div>
		</div>

		<!-- Back to Dashboard -->
		<div class="mt-8 text-center">
			<a href="/" class="text-amber-700 hover:text-amber-800 font-medium">
				&larr; Back to Dashboard
			</a>
		</div>
	</div>
</div>
