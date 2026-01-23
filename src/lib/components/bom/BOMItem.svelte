<script lang="ts">
	// BOM Item display component
	// Renders a single line item from the Bill of Materials
	// Supports inline quantity editing

	import type { BOMItem } from '$lib/types/bom';

	interface Props {
		item: BOMItem;
		onQuantityChange?: (id: string, quantity: number) => void;
		onToggleVisibility?: (id: string) => void;
		editable?: boolean;
	}

	let { item, onQuantityChange, onToggleVisibility, editable = true }: Props = $props();

	// Edit mode state
	let editing = $state(false);
	let inputValue = $state('');
	let inputRef: HTMLInputElement | null = $state(null);

	// Sync inputValue with item.quantity when not actively editing
	$effect(() => {
		if (!editing) {
			inputValue = item.quantity.toString();
		}
	});

	function startEditing() {
		if (!editable || !onQuantityChange) return;
		inputValue = item.quantity.toString();
		editing = true;
		// Focus input after DOM update
		requestAnimationFrame(() => {
			inputRef?.focus();
			inputRef?.select();
		});
	}

	function commitEdit() {
		const parsed = parseInt(inputValue, 10);
		if (isNaN(parsed) || parsed <= 0) {
			// Invalid: revert to original
			inputValue = item.quantity.toString();
		} else if (parsed !== item.quantity && onQuantityChange) {
			// Valid and different: call callback
			onQuantityChange(item.id, parsed);
		}
		editing = false;
	}

	function cancelEdit() {
		inputValue = item.quantity.toString();
		editing = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			commitEdit();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			cancelEdit();
		}
	}
</script>

<div
	class="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50/50 {item.hidden ? 'opacity-50' : ''}"
>
	<div class="flex items-center gap-3">
		{#if onToggleVisibility}
			<input
				type="checkbox"
				checked={!item.hidden}
				onchange={() => onToggleVisibility(item.id)}
				class="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
				aria-label="Include in BOM"
			/>
		{/if}
		{#if editing}
			<span class="min-w-[80px] text-sm font-medium text-gray-700">
				<input
					bind:this={inputRef}
					type="number"
					min="1"
					bind:value={inputValue}
					onblur={commitEdit}
					onkeydown={handleKeydown}
					class="w-14 rounded border border-gray-300 px-2 py-0.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
				/>
				{item.unit}
			</span>
		{:else}
			<button
				type="button"
				onclick={startEditing}
				disabled={!editable || !onQuantityChange}
				class="min-w-[80px] text-left text-sm font-medium text-gray-700
					{editable && onQuantityChange ? 'cursor-pointer rounded px-1 -ml-1 hover:bg-amber-100/50 transition-colors' : ''}"
			>
				{item.quantity}
				{item.unit}
			</button>
		{/if}
		<span class={item.hidden ? 'line-through text-gray-400' : 'text-gray-900'}>{item.name}</span>
	</div>
	{#if item.notes}
		<span class="text-sm text-gray-500 italic">{item.notes}</span>
	{/if}
</div>
