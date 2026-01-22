<script lang="ts">
	// AddItemForm component
	// Inline form for adding custom materials to the BOM

	import type { BOMCategory, BOMItem } from '$lib/types/bom';

	interface Props {
		category: BOMCategory;
		onAdd: (item: BOMItem) => void;
		onCancel: () => void;
	}

	let { category, onAdd, onCancel }: Props = $props();

	// Form state
	let name = $state('');
	let quantity = $state(1);
	let unit = $state('pcs');
	let notes = $state('');

	// Unit options based on category
	const unitOptions: Record<BOMCategory, string[]> = {
		lumber: ['bf', 'pcs', 'lf', 'sq ft'],
		hardware: ['pcs', 'each', 'set', 'box'],
		finishes: ['qt', 'gal', 'oz', 'can'],
		consumables: ['pcs', 'sheet', 'roll', 'box']
	};

	// Set default unit for category
	$effect(() => {
		unit = unitOptions[category][0];
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		const newItem: BOMItem = {
			id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			name: name.trim(),
			quantity,
			unit,
			category,
			notes: notes.trim() || undefined,
			hidden: false
		};
		onAdd(newItem);
		// Reset form
		name = '';
		quantity = 1;
		notes = '';
	}
</script>

<form
	onsubmit={handleSubmit}
	class="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-2"
>
	<div class="w-full sm:min-w-[150px] sm:flex-1">
		<label for="add-item-name" class="mb-1 block text-xs font-medium text-gray-600">Name</label>
		<input
			id="add-item-name"
			type="text"
			bind:value={name}
			required
			class="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
			placeholder="Material name"
		/>
	</div>
	<div class="w-full sm:w-20">
		<label for="add-item-qty" class="mb-1 block text-xs font-medium text-gray-600">Qty</label>
		<input
			id="add-item-qty"
			type="number"
			bind:value={quantity}
			min="1"
			required
			class="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
		/>
	</div>
	<div class="w-full sm:w-24">
		<label for="add-item-unit" class="mb-1 block text-xs font-medium text-gray-600">Unit</label>
		<select
			id="add-item-unit"
			bind:value={unit}
			class="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
		>
			{#each unitOptions[category] as opt}
				<option value={opt}>{opt}</option>
			{/each}
		</select>
	</div>
	<div class="w-full sm:min-w-[100px] sm:flex-1">
		<label for="add-item-notes" class="mb-1 block text-xs font-medium text-gray-600">Notes</label>
		<input
			id="add-item-notes"
			type="text"
			bind:value={notes}
			class="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
			placeholder="Optional"
		/>
	</div>
	<div class="flex gap-2 sm:flex-none">
		<button
			type="submit"
			class="rounded px-3 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
		>
			Add
		</button>
		<button
			type="button"
			onclick={onCancel}
			class="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
		>
			Cancel
		</button>
	</div>
</form>
