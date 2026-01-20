<script lang="ts">
	import ToolCard from '$lib/components/ToolCard.svelte';
</script>

<svelte:head>
	<title>WoodShop Toolbox</title>
	<meta name="description" content="Personal woodworking tools platform - BOM Generator and more" />
</svelte:head>

<div>
	<h1 class="text-2xl font-bold text-gray-900 mb-6">Your Tools</h1>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		<ToolCard
			title="BOM Generator"
			description="Generate comprehensive bills of materials for your woodworking projects with AI assistance."
			href="/bom"
			icon="&#x1f4cb;"
		/>

		<ToolCard
			title="Cut List Optimizer"
			description="Optimize your cuts to minimize waste and save material."
			href="/cutlist"
			icon="&#x2702;&#xfe0f;"
			disabled={true}
		/>

		<ToolCard
			title="Wood Movement Calculator"
			description="Calculate seasonal wood movement for your designs."
			href="/calculator"
			icon="&#x1f4d0;"
			disabled={true}
		/>
	</div>
</div>
