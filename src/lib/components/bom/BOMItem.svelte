<script lang="ts">
	// BOM Item display component
	// Modern Artisan aesthetic with refined item rows

	import type { BOMItem } from '$lib/types/bom';
	import { parseFractionalInches, formatDimension } from '$lib/utils/board-feet';

	interface Props {
		item: BOMItem;
		onQuantityChange?: (id: string, quantity: number) => void;
		onToggleVisibility?: (id: string) => void;
		onDimensionChange?: (id: string, dimensions: { length?: number; width?: number; height?: number }) => void;
		editable?: boolean;
	}

	let { item, onQuantityChange, onToggleVisibility, onDimensionChange, editable = true }: Props = $props();

	// Quantity edit mode state
	let editing = $state(false);
	let inputValue = $state('');
	let inputRef: HTMLInputElement | null = $state(null);

	// Dimension edit mode state
	let editingDimension = $state<'length' | 'width' | 'height' | null>(null);
	let dimensionInputValue = $state('');
	let dimensionInputRef: HTMLInputElement | null = $state(null);

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

	// Dimension edit functions
	function startDimensionEdit(dim: 'length' | 'width' | 'height') {
		if (!editable || !onDimensionChange) return;
		const currentValue = item[dim];
		dimensionInputValue = currentValue !== undefined ? formatDimension(currentValue) : '';
		editingDimension = dim;
		requestAnimationFrame(() => {
			dimensionInputRef?.focus();
			dimensionInputRef?.select();
		});
	}

	function commitDimensionEdit() {
		if (!editingDimension || !onDimensionChange) {
			editingDimension = null;
			return;
		}

		const parsed = parseFractionalInches(dimensionInputValue);
		const currentDim = editingDimension;

		if (parsed === null || parsed <= 0) {
			// Invalid or empty: clear the dimension
			const newDimensions = {
				length: item.length,
				width: item.width,
				height: item.height,
				[currentDim]: undefined
			};
			onDimensionChange(item.id, newDimensions);
		} else if (parsed !== item[currentDim]) {
			// Valid and different: update
			const newDimensions = {
				length: item.length,
				width: item.width,
				height: item.height,
				[currentDim]: parsed
			};
			onDimensionChange(item.id, newDimensions);
		}

		editingDimension = null;
	}

	function cancelDimensionEdit() {
		editingDimension = null;
	}

	function handleDimensionKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			commitDimensionEdit();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			cancelDimensionEdit();
		}
	}

	// Board feet calculation removed in v4.0 - will be replaced with piece counts in Phase 24
</script>

<div class="item-row" class:item-hidden={item.hidden}>
	<div class="item-left">
		{#if onToggleVisibility}
			<button
				type="button"
				onclick={() => onToggleVisibility(item.id)}
				class="visibility-toggle"
				aria-label={item.hidden ? 'Show item' : 'Hide item'}
				title={item.hidden ? 'Show item' : 'Hide item'}
			>
				{#if item.hidden}
					<!-- Eye off icon (closed/hidden) -->
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="eye-icon">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
					</svg>
				{:else}
					<!-- Eye open icon (visible) -->
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="eye-icon">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				{/if}
			</button>
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

		{#if item.category === 'lumber'}
			<div class="dimension-section">
				<!-- Length input -->
				<div class="dimension-field">
					<span class="dimension-label">L</span>
					{#if editingDimension === 'length'}
						<input
							bind:this={dimensionInputRef}
							type="text"
							bind:value={dimensionInputValue}
							onblur={commitDimensionEdit}
							onkeydown={handleDimensionKeydown}
							class="dimension-input"
							placeholder="0"
						/>
					{:else}
						<button
							type="button"
							onclick={() => startDimensionEdit('length')}
							disabled={!editable || !onDimensionChange}
							class="dimension-value"
							class:dimension-editable={editable && onDimensionChange}
						>
							{item.length !== undefined ? formatDimension(item.length) : '-'}"
						</button>
					{/if}
				</div>

				<span class="dimension-separator">x</span>

				<!-- Width input -->
				<div class="dimension-field">
					<span class="dimension-label">W</span>
					{#if editingDimension === 'width'}
						<input
							bind:this={dimensionInputRef}
							type="text"
							bind:value={dimensionInputValue}
							onblur={commitDimensionEdit}
							onkeydown={handleDimensionKeydown}
							class="dimension-input"
							placeholder="0"
						/>
					{:else}
						<button
							type="button"
							onclick={() => startDimensionEdit('width')}
							disabled={!editable || !onDimensionChange}
							class="dimension-value"
							class:dimension-editable={editable && onDimensionChange}
						>
							{item.width !== undefined ? formatDimension(item.width) : '-'}"
						</button>
					{/if}
				</div>

				<span class="dimension-separator">x</span>

				<!-- Height/Thickness input -->
				<div class="dimension-field">
					<span class="dimension-label">T</span>
					{#if editingDimension === 'height'}
						<input
							bind:this={dimensionInputRef}
							type="text"
							bind:value={dimensionInputValue}
							onblur={commitDimensionEdit}
							onkeydown={handleDimensionKeydown}
							class="dimension-input"
							placeholder="0"
						/>
					{:else}
						<button
							type="button"
							onclick={() => startDimensionEdit('height')}
							disabled={!editable || !onDimensionChange}
							class="dimension-value"
							class:dimension-editable={editable && onDimensionChange}
						>
							{item.height !== undefined ? formatDimension(item.height) : '-'}"
						</button>
					{/if}
				</div>
			</div>
		{/if}
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

	/* Visibility Toggle - Eye Icon */
	.visibility-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
		color: var(--color-ink-muted);
	}

	.visibility-toggle:hover {
		background: rgba(93, 64, 55, 0.08);
		color: var(--color-walnut);
	}

	.visibility-toggle:focus {
		outline: none;
		box-shadow: 0 0 0 2px rgba(93, 64, 55, 0.2);
	}

	.eye-icon {
		width: 18px;
		height: 18px;
	}

	.item-hidden .visibility-toggle {
		color: var(--color-ink-muted);
		opacity: 0.6;
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

	/* Dimension Section (lumber items only) */
	.dimension-section {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		margin-left: var(--space-md);
		font-size: 0.8125rem;
	}

	.dimension-field {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.dimension-label {
		font-size: 0.6875rem;
		color: var(--color-ink-muted);
		text-transform: uppercase;
	}

	.dimension-value {
		padding: 2px 6px;
		min-width: 36px;
		text-align: center;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		cursor: default;
		color: var(--color-ink);
		font-size: 0.8125rem;
		font-family: var(--font-display);
	}

	.dimension-editable {
		cursor: pointer;
	}

	.dimension-editable:hover {
		background: rgba(93, 64, 55, 0.08);
	}

	.dimension-separator {
		color: var(--color-ink-muted);
	}

	.dimension-input {
		width: 48px;
		padding: 2px 4px;
		border: 1px solid var(--color-walnut);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-family: var(--font-display);
		text-align: center;
		background: var(--color-white);
		color: var(--color-ink);
		outline: none;
		box-shadow: 0 0 0 2px rgba(93, 64, 55, 0.1);
	}

	.board-feet {
		margin-left: var(--space-sm);
		padding: 2px 8px;
		background: rgba(93, 64, 55, 0.06);
		border-radius: var(--radius-sm);
		color: var(--color-walnut);
		font-weight: 500;
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
			padding-left: calc(28px + var(--space-md) + 80px + var(--space-md));
		}

		.dimension-section {
			flex-wrap: wrap;
			margin-left: calc(28px + var(--space-md));
			margin-top: var(--space-xs);
		}
	}
</style>
