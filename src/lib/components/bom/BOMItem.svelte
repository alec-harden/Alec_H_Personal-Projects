<script lang="ts">
	// BOM Item display component
	// Renders a single line item from the Bill of Materials

	import type { BOMItem } from '$lib/types/bom';

	interface Props {
		item: BOMItem;
	}

	let { item }: Props = $props();
</script>

<div
	class="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50/50"
>
	<div class="flex items-center gap-3">
		<span class="min-w-[80px] text-sm font-medium text-gray-700">
			{item.quantity}
			{item.unit}
		</span>
		<span class="text-gray-900">{item.name}</span>
	</div>
	{#if item.notes}
		<span class="text-sm text-gray-500 italic">{item.notes}</span>
	{/if}
</div>
