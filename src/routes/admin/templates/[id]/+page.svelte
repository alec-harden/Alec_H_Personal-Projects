<script lang="ts">
	import { enhance } from '$app/forms';
	import type { TemplateDimensions, JoineryOption } from '$lib/server/schema';

	interface Template {
		id: string;
		name: string;
		icon: string;
		description: string;
		defaultDimensions: TemplateDimensions;
		joineryOptions: JoineryOption[];
		suggestedWoods: string[];
		suggestedFinishes: string[];
		typicalHardware: string[];
		createdAt: Date;
		updatedAt: Date;
	}

	interface Props {
		data: { template: Template };
		form: { error?: string; success?: boolean } | null;
	}

	let { data, form }: Props = $props();

	let loading = $state(false);
	let showSuccess = $state(false);

	// Reactive copy of joinery options for editing
	let joineryOptions = $state<
		Array<{
			id: string;
			name: string;
			description: string;
			difficulty: string;
		}>
	>(data.template.joineryOptions.map((j) => ({ ...j })));

	// Show success message when form returns success
	$effect(() => {
		if (form?.success) {
			showSuccess = true;
			const timer = setTimeout(() => {
				showSuccess = false;
			}, 3000);
			return () => clearTimeout(timer);
		}
	});

	function addJoineryOption() {
		joineryOptions = [
			...joineryOptions,
			{
				id: '',
				name: '',
				description: '',
				difficulty: 'beginner'
			}
		];
	}

	function removeJoineryOption(index: number) {
		joineryOptions = joineryOptions.filter((_, i) => i !== index);
	}

	function confirmDelete(event: SubmitEvent) {
		if (!confirm('Are you sure you want to delete this template? This cannot be undone.')) {
			event.preventDefault();
		}
	}
</script>

<svelte:head>
	<title>{data.template.name} | Templates | Admin | WoodShop Toolbox</title>
</svelte:head>

<div class="min-h-screen bg-stone-100 py-8 px-4">
	<div class="max-w-4xl mx-auto">
		<!-- Back link -->
		<div class="mb-4">
			<a
				href="/admin/templates"
				class="text-amber-700 hover:text-amber-800 font-medium text-sm"
			>
				&larr; Back to Templates
			</a>
		</div>

		<!-- Header -->
		<div class="flex justify-between items-center mb-6">
			<div class="flex items-center gap-3">
				<span class="text-4xl" aria-hidden="true">{@html data.template.icon}</span>
				<div>
					<h1 class="text-3xl font-bold text-stone-800">{data.template.name}</h1>
					<p class="text-stone-600 text-sm">Edit template details</p>
				</div>
			</div>
			<form
				method="POST"
				action="?/delete"
				use:enhance
				onsubmit={confirmDelete}
			>
				<button
					type="submit"
					class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
				>
					Delete Template
				</button>
			</form>
		</div>

		<!-- Error message -->
		{#if form?.error}
			<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
				{form.error}
			</div>
		{/if}

		<!-- Success message -->
		{#if showSuccess}
			<div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
				Template updated successfully.
			</div>
		{/if}

		<!-- Edit Form -->
		<div class="bg-white shadow-lg border border-stone-200 rounded-lg p-6">
			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
				class="space-y-6"
			>
				<!-- Basic Info -->
				<fieldset class="space-y-4">
					<legend class="text-sm font-medium text-stone-700 mb-2">Basic Information</legend>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label for="name" class="block text-sm font-medium text-stone-700 mb-1">
								Name <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="name"
								name="name"
								required
								value={data.template.name}
								class="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
							/>
						</div>
						<div>
							<label for="icon" class="block text-sm font-medium text-stone-700 mb-1">
								Icon (HTML entity) <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="icon"
								name="icon"
								required
								value={data.template.icon}
								class="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
							/>
						</div>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-stone-700 mb-1">
							Description
						</label>
						<textarea
							id="description"
							name="description"
							rows="2"
							class="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
						>{data.template.description}</textarea>
					</div>
				</fieldset>

				<!-- Dimensions -->
				<fieldset class="border border-stone-200 p-4 rounded-lg">
					<legend class="font-medium text-stone-700 px-2">Dimensions (inches)</legend>

					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div>
							<span class="block text-xs font-medium text-stone-600 mb-2">Length</span>
							<div class="flex gap-2">
								<div class="flex-1">
									<input
										type="number"
										name="length_min"
										value={data.template.defaultDimensions.length.min}
										class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
									/>
									<span class="text-xs text-stone-400">Min</span>
								</div>
								<div class="flex-1">
									<input
										type="number"
										name="length_default"
										value={data.template.defaultDimensions.length.default}
										class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
									/>
									<span class="text-xs text-stone-400">Default</span>
								</div>
								<div class="flex-1">
									<input
										type="number"
										name="length_max"
										value={data.template.defaultDimensions.length.max}
										class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
									/>
									<span class="text-xs text-stone-400">Max</span>
								</div>
							</div>
						</div>
						<div>
							<span class="block text-xs font-medium text-stone-600 mb-2">Width</span>
							<div class="flex gap-2">
								<div class="flex-1">
									<input
										type="number"
										name="width_min"
										value={data.template.defaultDimensions.width.min}
										class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
									/>
									<span class="text-xs text-stone-400">Min</span>
								</div>
								<div class="flex-1">
									<input
										type="number"
										name="width_default"
										value={data.template.defaultDimensions.width.default}
										class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
									/>
									<span class="text-xs text-stone-400">Default</span>
								</div>
								<div class="flex-1">
									<input
										type="number"
										name="width_max"
										value={data.template.defaultDimensions.width.max}
										class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
									/>
									<span class="text-xs text-stone-400">Max</span>
								</div>
							</div>
						</div>
						<div>
							<label class="flex items-center gap-2 text-xs font-medium text-stone-600 mb-2">
								<input
									type="checkbox"
									name="has_height"
									class="rounded"
									checked={!!data.template.defaultDimensions.height}
								/>
								Height (optional)
							</label>
							<div class="flex gap-2">
								<div class="flex-1">
									<input
										type="number"
										name="height_min"
										value={data.template.defaultDimensions.height?.min ?? ''}
										class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
									/>
									<span class="text-xs text-stone-400">Min</span>
								</div>
								<div class="flex-1">
									<input
										type="number"
										name="height_default"
										value={data.template.defaultDimensions.height?.default ?? ''}
										class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
									/>
									<span class="text-xs text-stone-400">Default</span>
								</div>
								<div class="flex-1">
									<input
										type="number"
										name="height_max"
										value={data.template.defaultDimensions.height?.max ?? ''}
										class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
									/>
									<span class="text-xs text-stone-400">Max</span>
								</div>
							</div>
						</div>
					</div>
				</fieldset>

				<!-- Joinery Options -->
				<fieldset class="border border-stone-200 p-4 rounded-lg">
					<legend class="font-medium text-stone-700 px-2">Joinery Options</legend>

					{#each joineryOptions as option, i}
						<div class="flex flex-wrap gap-2 mb-3 items-start p-3 bg-stone-50 rounded-lg">
							<div class="flex-1 min-w-[120px]">
								<label for="joinery_{i}_id" class="block text-xs text-stone-500 mb-1">ID</label>
								<input
									type="text"
									id="joinery_{i}_id"
									name="joinery_{i}_id"
									bind:value={option.id}
									placeholder="e.g., mortise-tenon"
									class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
								/>
							</div>
							<div class="flex-1 min-w-[120px]">
								<label for="joinery_{i}_name" class="block text-xs text-stone-500 mb-1"
									>Name</label
								>
								<input
									type="text"
									id="joinery_{i}_name"
									name="joinery_{i}_name"
									bind:value={option.name}
									placeholder="Mortise & Tenon"
									class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
								/>
							</div>
							<div class="flex-[2] min-w-[160px]">
								<label for="joinery_{i}_description" class="block text-xs text-stone-500 mb-1"
									>Description</label
								>
								<input
									type="text"
									id="joinery_{i}_description"
									name="joinery_{i}_description"
									bind:value={option.description}
									placeholder="Strong traditional joint"
									class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
								/>
							</div>
							<div class="min-w-[120px]">
								<label for="joinery_{i}_difficulty" class="block text-xs text-stone-500 mb-1"
									>Difficulty</label
								>
								<select
									id="joinery_{i}_difficulty"
									name="joinery_{i}_difficulty"
									bind:value={option.difficulty}
									class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
								>
									<option value="beginner">Beginner</option>
									<option value="intermediate">Intermediate</option>
									<option value="advanced">Advanced</option>
								</select>
							</div>
							<div class="self-end">
								<button
									type="button"
									onclick={() => removeJoineryOption(i)}
									class="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-sm transition-colors"
								>
									Remove
								</button>
							</div>
						</div>
					{/each}

					{#if joineryOptions.length === 0}
						<p class="text-sm text-stone-400 italic mb-3">No joinery options defined.</p>
					{/if}

					<button
						type="button"
						onclick={addJoineryOption}
						class="text-sm text-amber-700 hover:text-amber-800 font-medium mt-2"
					>
						+ Add Joinery Option
					</button>
				</fieldset>

				<!-- Suggestions -->
				<fieldset class="border border-stone-200 p-4 rounded-lg">
					<legend class="font-medium text-stone-700 px-2">Suggestions</legend>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div>
							<label
								for="suggested_woods"
								class="block text-sm font-medium text-stone-700 mb-1"
								>Suggested Woods</label
							>
							<input
								type="text"
								id="suggested_woods"
								name="suggested_woods"
								value={data.template.suggestedWoods.join(', ')}
								class="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
								placeholder="oak, walnut, maple"
							/>
							<p class="text-xs text-stone-400 mt-1">Comma-separated</p>
						</div>
						<div>
							<label
								for="suggested_finishes"
								class="block text-sm font-medium text-stone-700 mb-1"
								>Suggested Finishes</label
							>
							<input
								type="text"
								id="suggested_finishes"
								name="suggested_finishes"
								value={data.template.suggestedFinishes.join(', ')}
								class="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
								placeholder="polyurethane, danish oil"
							/>
							<p class="text-xs text-stone-400 mt-1">Comma-separated</p>
						</div>
						<div>
							<label
								for="typical_hardware"
								class="block text-sm font-medium text-stone-700 mb-1"
								>Typical Hardware</label
							>
							<input
								type="text"
								id="typical_hardware"
								name="typical_hardware"
								value={data.template.typicalHardware.join(', ')}
								class="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
								placeholder="hinges, drawer slides"
							/>
							<p class="text-xs text-stone-400 mt-1">Comma-separated</p>
						</div>
					</div>
				</fieldset>

				<!-- Submit -->
				<div class="flex justify-end pt-4 border-t border-stone-200">
					<button
						type="submit"
						disabled={loading}
						class="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 transition-colors"
					>
						{loading ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</form>
		</div>

		<!-- Back to Templates -->
		<div class="mt-8 text-center">
			<a href="/admin/templates" class="text-amber-700 hover:text-amber-800 font-medium">
				&larr; Back to Templates
			</a>
		</div>
	</div>
</div>
