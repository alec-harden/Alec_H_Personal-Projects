<script lang="ts">
	// BOM Item display component
	// Modern Artisan aesthetic with refined item rows

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

<div class="item-row" class:item-hidden={item.hidden}>
	<div class="item-left">
		{#if onToggleVisibility}
			<label class="checkbox-wrapper">
				<input
					type="checkbox"
					checked={!item.hidden}
					onchange={() => onToggleVisibility(item.id)}
					class="checkbox-input"
					aria-label="Include in BOM"
				/>
				<span class="checkbox-custom">
					{#if !item.hidden}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
							<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
						</svg>
					{/if}
				</span>
			</label>
		{/if}

		{#if editing}
			<span class="quantity-edit">
				<input
					bind:this={inputRef}
					type="number"
					min="1"
					bind:value={inputValue}
					onblur={commitEdit}
					onkeydown={handleKeydown}
					class="quantity-input"
				/>
				<span class="unit-label">{item.unit}</span>
			</span>
		{:else}
			<button
				type="button"
				onclick={startEditing}
				disabled={!editable || !onQuantityChange}
				class="quantity-display"
				class:quantity-editable={editable && onQuantityChange}
			>
				<span class="quantity-value">{item.quantity}</span>
				<span class="unit-label">{item.unit}</span>
			</button>
		{/if}

		<span class="item-name" class:item-name-hidden={item.hidden}>{item.name}</span>
	</div>

	{#if item.notes}
		<span class="item-notes">{item.notes}</span>
	{/if}
</div>

<style>
	.item-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-sm) var(--space-lg);
		border-bottom: 1px solid rgba(17, 17, 17, 0.06);
		transition: background-color var(--transition-fast);
	}

	.item-row:last-child {
		border-bottom: none;
	}

	.item-row:hover {
		background: rgba(17, 17, 17, 0.02);
	}

	.item-hidden {
		opacity: 0.5;
	}

	.item-left {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	/* Custom Checkbox */
	.checkbox-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		cursor: pointer;
	}

	.checkbox-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.checkbox-custom {
		width: 18px;
		height: 18px;
		border: 2px solid var(--color-paper-dark);
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
		background: var(--color-white);
	}

	.checkbox-input:checked + .checkbox-custom {
		background: var(--color-walnut);
		border-color: var(--color-walnut);
	}

	.checkbox-custom svg {
		width: 12px;
		height: 12px;
		color: var(--color-white);
	}

	.checkbox-input:focus + .checkbox-custom {
		box-shadow: 0 0 0 3px rgba(93, 64, 55, 0.15);
	}

	/* Quantity Display */
	.quantity-display {
		display: flex;
		align-items: baseline;
		gap: var(--space-xs);
		min-width: 80px;
		padding: var(--space-xs) var(--space-sm);
		margin-left: calc(var(--space-sm) * -1);
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		text-align: left;
		cursor: default;
		transition: background-color var(--transition-fast);
	}

	.quantity-editable {
		cursor: pointer;
	}

	.quantity-editable:hover {
		background: rgba(93, 64, 55, 0.08);
	}

	.quantity-value {
		font-family: var(--font-display);
		font-weight: 500;
		color: var(--color-ink);
	}

	.unit-label {
		font-size: 0.75rem;
		color: var(--color-ink-muted);
	}

	/* Quantity Edit Mode */
	.quantity-edit {
		display: flex;
		align-items: baseline;
		gap: var(--space-xs);
		min-width: 80px;
	}

	.quantity-input {
		width: 56px;
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--color-walnut);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		font-family: var(--font-display);
		background: var(--color-white);
		color: var(--color-ink);
		outline: none;
		box-shadow: 0 0 0 3px rgba(93, 64, 55, 0.1);
	}

	.quantity-input::-webkit-inner-spin-button,
	.quantity-input::-webkit-outer-spin-button {
		opacity: 1;
	}

	/* Item Name */
	.item-name {
		font-size: 0.9375rem;
		color: var(--color-ink);
	}

	.item-name-hidden {
		text-decoration: line-through;
		color: var(--color-ink-muted);
	}

	/* Item Notes */
	.item-notes {
		font-size: 0.8125rem;
		font-style: italic;
		color: var(--color-ink-muted);
		max-width: 200px;
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.item-row {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-xs);
			padding: var(--space-md) var(--space-md);
		}

		.item-notes {
			max-width: 100%;
			text-align: left;
			padding-left: calc(18px + var(--space-md) + 80px + var(--space-md));
		}
	}
</style>
