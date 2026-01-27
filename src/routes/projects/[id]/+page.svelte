<script lang="ts">
	import { enhance } from '$app/forms';

	interface Project {
		id: string;
		name: string;
		description: string | null;
		notes: string | null;
		createdAt: Date;
		updatedAt: Date;
	}

	interface Props {
		data: { project: Project };
		form: { error?: string; success?: boolean } | null;
	}

	let { data, form }: Props = $props();
	let loading = $state(false);
	let deleteLoading = $state(false);

	function formatDate(date: Date): string {
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function handleDelete(event: Event) {
		if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
			event.preventDefault();
		}
	}
</script>

<svelte:head>
	<title>{data.project.name} - WoodShop Toolbox</title>
</svelte:head>

<div class="min-h-screen bg-stone-100 py-8 px-4">
	<div class="max-w-2xl mx-auto">
		<!-- Back Link -->
		<div class="mb-6">
			<a href="/projects" class="text-amber-600 hover:text-amber-700 font-medium">
				&larr; Back to Projects
			</a>
		</div>

		<!-- Project Header -->
		<div class="mb-6">
			<h1 class="text-3xl font-bold text-stone-800">{data.project.name}</h1>
			<p class="mt-1 text-sm text-stone-500">
				Created {formatDate(data.project.createdAt)} &bull; Last updated {formatDate(
					data.project.updatedAt
				)}
			</p>
		</div>

		<!-- Edit Form -->
		<div class="bg-white shadow-lg rounded-lg p-6 mb-6">
			<h2 class="text-lg font-semibold text-stone-800 mb-4">Project Details</h2>

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
			>
				{#if form?.error}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
						{form.error}
					</div>
				{/if}

				{#if form?.success}
					<div
						class="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm"
					>
						Project saved successfully!
					</div>
				{/if}

				<div class="mb-4">
					<label for="name" class="block text-sm font-medium text-stone-700 mb-1">
						Project Name <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						id="name"
						name="name"
						value={data.project.name}
						required
						maxlength="100"
						class="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
						placeholder="e.g., Walnut Coffee Table"
					/>
				</div>

				<div class="mb-4">
					<label for="description" class="block text-sm font-medium text-stone-700 mb-1">
						Description <span class="text-stone-400">(optional)</span>
					</label>
					<input
						type="text"
						id="description"
						name="description"
						value={data.project.description ?? ''}
						class="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
						placeholder="Brief description of the project"
					/>
				</div>

				<div class="mb-6">
					<label for="notes" class="block text-sm font-medium text-stone-700 mb-1">
						Notes <span class="text-stone-400">(optional)</span>
					</label>
					<textarea
						id="notes"
						name="notes"
						rows="5"
						class="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-y"
						placeholder="Additional notes, measurements, ideas...">{data.project.notes ?? ''}</textarea
					>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium rounded-md transition-colors"
				>
					{loading ? 'Saving...' : 'Save Changes'}
				</button>
			</form>
		</div>

		<!-- Delete Section -->
		<div class="bg-white shadow-lg rounded-lg p-6 border border-red-100">
			<h2 class="text-lg font-semibold text-red-800 mb-2">Danger Zone</h2>
			<p class="text-sm text-stone-600 mb-4">
				Deleting this project is permanent and cannot be undone. All associated data will be lost.
			</p>

			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					deleteLoading = true;
					return async ({ update }) => {
						await update();
						deleteLoading = false;
					};
				}}
			>
				<button
					type="submit"
					disabled={deleteLoading}
					onclick={handleDelete}
					class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-md transition-colors"
				>
					{deleteLoading ? 'Deleting...' : 'Delete Project'}
				</button>
			</form>
		</div>
	</div>
</div>
