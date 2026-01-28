<script lang="ts">
	import { enhance } from '$app/forms';

	interface Template {
		id: string;
		name: string;
		icon: string;
		description: string;
		joineryOptions: Array<{
			id: string;
			name: string;
			description: string;
			difficulty: string;
		}>;
		suggestedWoods: string[];
		suggestedFinishes: string[];
		typicalHardware: string[];
	}

	interface Props {
		data: { templates: Template[] };
		form: { error?: string; name?: string } | null;
	}

	let { data, form }: Props = $props();

	let showCreateForm = $state(false);
	let loading = $state(false);

	// Dynamic joinery options for create form
	let joineryOptions = $state<
		Array<{
			id: string;
			name: string;
			description: string;
			difficulty: string;
		}>
	>([]);

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
</script>

<svelte:head>
	<title>Templates | Admin | WoodShop Toolbox</title>
</svelte:head>

<div class="min-h-screen bg-stone-100 py-8 px-4">
	<div class="max-w-4xl mx-auto">
		<div class="flex justify-between items-center mb-6">
			<div>
				<h1 class="text-3xl font-bold text-stone-800">Project Templates</h1>
				<p class="mt-1 text-stone-600">Manage woodworking project templates</p>
			</div>
			<button
				onclick={() => (showCreateForm = !showCreateForm)}
				class="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
			>
				{showCreateForm ? 'Cancel' : 'New Template'}
			</button>
		</div>

		{#if form?.error}
			<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
				{form.error}
			</div>
		{/if}

		{#if showCreateForm}
			<div class="mb-8 p-6 bg-white shadow-lg border border-amber-200 rounded-lg">
				<h2 class="text-lg font-semibold text-stone-800 mb-4">Create New Template</h2>

				<form
					method="POST"
					action="?/create"
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
									value={form?.name ?? ''}
									class="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
									placeholder="e.g., Table"
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
									class="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
									placeholder="e.g., &#128437;"
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
								placeholder="Brief description of this project type"
							></textarea>
						</div>
					</fieldset>

					<!-- Dimensions -->
					<fieldset class="border border-stone-200 p-4 rounded-lg">
						<legend class="font-medium text-stone-700 px-2">Dimensions (inches)</legend>

						<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div>
								<label class="block text-xs font-medium text-stone-600 mb-2">Length</label>
								<div class="flex gap-2">
									<div class="flex-1">
										<input
											type="number"
											name="length_min"
											placeholder="Min"
											class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
										/>
										<span class="text-xs text-stone-400">Min</span>
									</div>
									<div class="flex-1">
										<input
											type="number"
											name="length_default"
											placeholder="Default"
											class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
										/>
										<span class="text-xs text-stone-400">Default</span>
									</div>
									<div class="flex-1">
										<input
											type="number"
											name="length_max"
											placeholder="Max"
											class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
										/>
										<span class="text-xs text-stone-400">Max</span>
									</div>
								</div>
							</div>
							<div>
								<label class="block text-xs font-medium text-stone-600 mb-2">Width</label>
								<div class="flex gap-2">
									<div class="flex-1">
										<input
											type="number"
											name="width_min"
											placeholder="Min"
											class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
										/>
										<span class="text-xs text-stone-400">Min</span>
									</div>
									<div class="flex-1">
										<input
											type="number"
											name="width_default"
											placeholder="Default"
											class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
										/>
										<span class="text-xs text-stone-400">Default</span>
									</div>
									<div class="flex-1">
										<input
											type="number"
											name="width_max"
											placeholder="Max"
											class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
										/>
										<span class="text-xs text-stone-400">Max</span>
									</div>
								</div>
							</div>
							<div>
								<label class="flex items-center gap-2 text-xs font-medium text-stone-600 mb-2">
									<input type="checkbox" name="has_height" class="rounded" />
									Height (optional)
								</label>
								<div class="flex gap-2">
									<div class="flex-1">
										<input
											type="number"
											name="height_min"
											placeholder="Min"
											class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
										/>
										<span class="text-xs text-stone-400">Min</span>
									</div>
									<div class="flex-1">
										<input
											type="number"
											name="height_default"
											placeholder="Default"
											class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
										/>
										<span class="text-xs text-stone-400">Default</span>
									</div>
									<div class="flex-1">
										<input
											type="number"
											name="height_max"
											placeholder="Max"
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
									<label class="block text-xs text-stone-500 mb-1">ID</label>
									<input
										type="text"
										name="joinery_{i}_id"
										bind:value={option.id}
										placeholder="e.g., mortise-tenon"
										class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
									/>
								</div>
								<div class="flex-1 min-w-[120px]">
									<label class="block text-xs text-stone-500 mb-1">Name</label>
									<input
										type="text"
										name="joinery_{i}_name"
										bind:value={option.name}
										placeholder="Mortise & Tenon"
										class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
									/>
								</div>
								<div class="flex-[2] min-w-[160px]">
									<label class="block text-xs text-stone-500 mb-1">Description</label>
									<input
										type="text"
										name="joinery_{i}_description"
										bind:value={option.description}
										placeholder="Strong traditional joint"
										class="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
									/>
								</div>
								<div class="min-w-[120px]">
									<label class="block text-xs text-stone-500 mb-1">Difficulty</label>
									<select
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
								<label for="suggested_woods" class="block text-sm font-medium text-stone-700 mb-1"
									>Suggested Woods</label
								>
								<input
									type="text"
									id="suggested_woods"
									name="suggested_woods"
									class="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
									placeholder="oak, walnut, maple"
								/>
								<p class="text-xs text-stone-400 mt-1">Comma-separated</p>
							</div>
							<div>
								<label
									for="suggested_finishes"
									class="block text-sm font-medium text-stone-700 mb-1">Suggested Finishes</label
								>
								<input
									type="text"
									id="suggested_finishes"
									name="suggested_finishes"
									class="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
									placeholder="polyurethane, danish oil"
								/>
								<p class="text-xs text-stone-400 mt-1">Comma-separated</p>
							</div>
							<div>
								<label for="typical_hardware" class="block text-sm font-medium text-stone-700 mb-1"
									>Typical Hardware</label
								>
								<input
									type="text"
									id="typical_hardware"
									name="typical_hardware"
									class="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
									placeholder="hinges, drawer slides"
								/>
								<p class="text-xs text-stone-400 mt-1">Comma-separated</p>
							</div>
						</div>
					</fieldset>

					<div class="flex justify-end gap-3 pt-4 border-t border-stone-200">
						<button
							type="button"
							onclick={() => (showCreateForm = false)}
							class="px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							class="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 transition-colors"
						>
							{loading ? 'Creating...' : 'Create Template'}
						</button>
					</div>
				</form>
			</div>
		{/if}

		<!-- Template List -->
		{#if data.templates.length === 0}
			<div class="bg-white shadow-lg rounded-lg p-8 text-center">
				<div class="text-5xl mb-4">&#128203;</div>
				<h3 class="text-lg font-semibold text-stone-800 mb-2">No templates yet</h3>
				<p class="text-stone-600 mb-4">Create your first project template to get started.</p>
				<button
					onclick={() => (showCreateForm = true)}
					class="text-amber-700 hover:text-amber-800 font-medium"
				>
					Create your first template
				</button>
			</div>
		{:else}
			<div class="space-y-3">
				{#each data.templates as template}
					<a
						href="/admin/templates/{template.id}"
						class="block bg-white shadow-sm border border-stone-200 rounded-lg p-4 hover:shadow-md hover:border-amber-300 transition-all"
					>
						<div class="flex items-center gap-4">
							<span class="text-3xl" aria-hidden="true">{@html template.icon}</span>
							<div class="flex-1 min-w-0">
								<h3 class="font-semibold text-lg text-stone-800">{template.name}</h3>
								<p class="text-stone-600 text-sm truncate">{template.description}</p>
							</div>
							<div class="text-right text-sm text-stone-500 shrink-0">
								<div>{template.joineryOptions.length} joinery options</div>
								<div>{template.suggestedWoods.length} wood types</div>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}

		<!-- Back to Dashboard -->
		<div class="mt-8 text-center">
			<a href="/" class="text-amber-700 hover:text-amber-800 font-medium">
				&larr; Back to Dashboard
			</a>
		</div>
	</div>
</div>
