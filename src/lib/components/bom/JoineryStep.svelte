<script lang="ts">
	// Joinery selection step
	// Allows multi-select of joinery methods with difficulty indicators

	import type { ProjectTemplate, JoineryOption } from '$lib/data/templates';

	interface Props {
		template: ProjectTemplate;
		initialValues?: string[];
		onSubmit: (selectedIds: string[]) => void;
		onBack: () => void;
	}

	const { template, initialValues = [], onSubmit, onBack }: Props = $props();

	// Initialize state (captured once at mount)
	const initSelectedIds = [...initialValues];

	let selectedIds = $state<string[]>(initSelectedIds);
	let error = $state('');

	function toggleOption(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((s) => s !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
		error = '';
	}

	function getDifficultyColor(difficulty: JoineryOption['difficulty']): string {
		switch (difficulty) {
			case 'beginner':
				return 'bg-green-100 text-green-800';
			case 'intermediate':
				return 'bg-yellow-100 text-yellow-800';
			case 'advanced':
				return 'bg-red-100 text-red-800';
		}
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (selectedIds.length === 0) {
			error = 'Please select at least one joinery method';
			return;
		}
		onSubmit(selectedIds);
	}
</script>

<div>
	<h2 class="mb-2 text-xl font-semibold text-gray-900">Joinery Methods</h2>
	<p class="mb-6 text-gray-600">
		Select one or more joinery techniques for your {template.name.toLowerCase()}.
	</p>

	<form onsubmit={handleSubmit} class="space-y-6">
		<div class="grid gap-3 sm:grid-cols-2">
			{#each template.joineryOptions as option}
				{@const isSelected = selectedIds.includes(option.id)}
				<button
					type="button"
					onclick={() => toggleOption(option.id)}
					class="flex flex-col rounded-lg border-2 p-4 text-left transition-all
						{isSelected
						? 'border-amber-500 bg-amber-50'
						: 'border-gray-200 bg-white hover:border-gray-300'}"
				>
					<div class="flex items-start justify-between gap-2">
						<h3 class="font-medium text-gray-900">{option.name}</h3>
						<span
							class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize {getDifficultyColor(
								option.difficulty
							)}"
						>
							{option.difficulty}
						</span>
					</div>
					<p class="mt-1 text-sm text-gray-600">{option.description}</p>
					{#if isSelected}
						<div class="mt-2 text-amber-600">
							<span>&#10003; Selected</span>
						</div>
					{/if}
				</button>
			{/each}
		</div>

		{#if error}
			<p class="text-sm text-red-600">{error}</p>
		{/if}

		<!-- Navigation Buttons -->
		<div class="flex justify-between pt-4">
			<button
				type="button"
				onclick={onBack}
				class="rounded-lg border border-gray-300 bg-white px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
			>
				Back
			</button>
			<button
				type="submit"
				class="rounded-lg bg-amber-700 px-6 py-2 font-medium text-white transition-colors hover:bg-amber-800"
			>
				Next
			</button>
		</div>
	</form>
</div>
