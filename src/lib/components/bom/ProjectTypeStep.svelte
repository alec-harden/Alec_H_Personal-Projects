<script lang="ts">
	// Project type selection step
	// Displays template cards for user to select a project type

	import type { ProjectTemplate } from '$lib/data/templates';

	interface Props {
		templates: ProjectTemplate[];
		onSelect: (template: ProjectTemplate) => void;
	}

	let { templates, onSelect }: Props = $props();
</script>

<div>
	<h2 class="mb-2 text-xl font-semibold text-gray-900">What are you building?</h2>
	<p class="mb-6 text-gray-600">Select a project type to get started with customized options.</p>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each templates as template}
			<button
				type="button"
				onclick={() => onSelect(template)}
				class="block rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
			>
				<div class="mb-3 text-4xl">{@html template.icon}</div>
				<h3 class="text-lg font-semibold text-gray-900">{template.name}</h3>
				<p class="mt-1 text-sm text-gray-600">{template.description}</p>
			</button>
		{/each}
	</div>
</div>
