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

	function handleStartOver() {
		goto(`/projects/${data.projectId}`);
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
		<BOMDisplay bom={data.bom} onStartOver={handleStartOver} />
	</div>
</div>
