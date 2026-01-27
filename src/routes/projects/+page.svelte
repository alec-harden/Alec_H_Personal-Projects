<script lang="ts">
	import { enhance } from '$app/forms';

	interface Project {
		id: string;
		name: string;
		description: string | null;
		updatedAt: Date;
	}

	interface Props {
		data: { projects: Project[] };
		form: { error?: string; name?: string; description?: string } | null;
	}

	let { data, form }: Props = $props();
	let loading = $state(false);

	function formatDate(date: Date): string {
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>My Projects - WoodShop Toolbox</title>
</svelte:head>

<div class="min-h-screen bg-stone-100 py-8 px-4">
	<div class="max-w-4xl mx-auto">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-stone-800">My Projects</h1>
			<p class="mt-2 text-stone-600">Manage your woodworking projects</p>
		</div>

		<!-- Create Project Form -->
		<div class="bg-white shadow-lg rounded-lg p-6 mb-8">
			<h2 class="text-lg font-semibold text-stone-800 mb-4">Create New Project</h2>

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
			>
				{#if form?.error}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
						{form.error}
					</div>
				{/if}

				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label for="name" class="block text-sm font-medium text-stone-700 mb-1">
							Project Name <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="name"
							name="name"
							value={form?.name ?? ''}
							required
							maxlength="100"
							class="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
							placeholder="e.g., Walnut Coffee Table"
						/>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-stone-700 mb-1">
							Description <span class="text-stone-400">(optional)</span>
						</label>
						<input
							type="text"
							id="description"
							name="description"
							value={form?.description ?? ''}
							class="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
							placeholder="Brief description of the project"
						/>
					</div>
				</div>

				<div class="mt-4">
					<button
						type="submit"
						disabled={loading}
						class="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium rounded-md transition-colors"
					>
						{loading ? 'Creating...' : 'Create Project'}
					</button>
				</div>
			</form>
		</div>

		<!-- Projects List -->
		{#if data.projects.length === 0}
			<div class="bg-white shadow-lg rounded-lg p-8 text-center">
				<div class="text-5xl mb-4">&#128203;</div>
				<h3 class="text-lg font-semibold text-stone-800 mb-2">No projects yet</h3>
				<p class="text-stone-600">Create your first project above to get started!</p>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.projects as project}
					<a
						href="/projects/{project.id}"
						class="bg-white shadow-lg rounded-lg p-5 hover:shadow-xl transition-shadow block"
					>
						<h3 class="text-lg font-semibold text-stone-800 mb-1 truncate">{project.name}</h3>
						{#if project.description}
							<p class="text-sm text-stone-600 line-clamp-2 mb-3">{project.description}</p>
						{:else}
							<p class="text-sm text-stone-400 italic mb-3">No description</p>
						{/if}
						<p class="text-xs text-stone-500">Last updated: {formatDate(project.updatedAt)}</p>
					</a>
				{/each}
			</div>
		{/if}

		<!-- Back to Dashboard -->
		<div class="mt-8 text-center">
			<a href="/" class="text-amber-600 hover:text-amber-700 font-medium"> &larr; Back to Dashboard </a>
		</div>
	</div>
</div>
