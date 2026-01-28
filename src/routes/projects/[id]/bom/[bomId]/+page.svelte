<script lang="ts">
	import { goto } from '$app/navigation';
	import BOMDisplay from '$lib/components/bom/BOMDisplay.svelte';
	import type { BOM } from '$lib/types/bom';

	interface Props {
		data: {
			bom: BOM;
			bomId: string;
			projectId: string;
			projectName: string;
		};
	}

	let { data }: Props = $props();

	// Local state for optimistic updates
	let bom = $state(data.bom);
	let deleteLoading = $state(false);

	function handleStartOver() {
		goto(`/projects/${data.projectId}`);
	}

	async function handleQuantityChange(id: string, quantity: number) {
		// Optimistic update
		bom = {
			...bom,
			items: bom.items.map((item) => (item.id === id ? { ...item, quantity } : item))
		};

		// Persist to server
		await fetch(`/api/bom/${data.bomId}/items/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ quantity })
		});
	}

	async function handleToggleVisibility(id: string) {
		const item = bom.items.find((i) => i.id === id);
		if (!item) return;

		const newHidden = !item.hidden;

		// Optimistic update
		bom = {
			...bom,
			items: bom.items.map((i) => (i.id === id ? { ...i, hidden: newHidden } : i))
		};

		// Persist to server
		await fetch(`/api/bom/${data.bomId}/items/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ hidden: newHidden })
		});
	}

	async function handleDelete() {
		if (!confirm('Delete this BOM? This cannot be undone.')) return;

		deleteLoading = true;
		const response = await fetch(`/api/bom/${data.bomId}`, { method: 'DELETE' });
		if (response.ok) {
			goto(`/projects/${data.projectId}`);
		} else {
			deleteLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{data.bom.projectName} - {data.projectName} - WoodShop Toolbox</title>
</svelte:head>

<div class="min-h-screen bg-stone-100 py-8 px-4">
	<div class="max-w-2xl mx-auto">
		<!-- Back Link -->
		<div class="mb-6">
			<a
				href="/projects/{data.projectId}"
				class="text-amber-600 hover:text-amber-700 font-medium"
			>
				&larr; Back to {data.projectName}
			</a>
		</div>

		<!-- BOM Display -->
		<BOMDisplay
			{bom}
			onStartOver={handleStartOver}
			onQuantityChange={handleQuantityChange}
			onToggleVisibility={handleToggleVisibility}
		/>

		<!-- Delete Section -->
		<div class="mt-8 bg-white shadow-lg rounded-lg p-6 border border-red-100">
			<h2 class="text-lg font-semibold text-red-800 mb-2">Danger Zone</h2>
			<p class="text-sm text-stone-600 mb-4">
				Deleting this BOM is permanent and cannot be undone. All items will be lost.
			</p>

			<button
				type="button"
				disabled={deleteLoading}
				onclick={handleDelete}
				class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-md transition-colors"
			>
				{deleteLoading ? 'Deleting...' : 'Delete BOM'}
			</button>
		</div>
	</div>
</div>
