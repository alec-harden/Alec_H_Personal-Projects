<script lang="ts">
	// AddItemForm component
	// Modern Artisan aesthetic with inline form styling

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

	// Unit options based on category (v4.0: 6 categories, lumber uses 'pcs' only)
	const unitOptions: Record<BOMCategory, string[]> = {
		hardwood: ['pcs'],
		common: ['pcs'],
		sheet: ['pcs'],
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

<form onsubmit={handleSubmit} class="add-form">
	<div class="form-row">
		<div class="form-field form-field-name">
			<label for="add-item-name" class="field-label">Name</label>
			<input
				id="add-item-name"
				type="text"
				bind:value={name}
				required
				class="input-field"
				placeholder="Material name"
			/>
		</div>

		<div class="form-field form-field-qty">
			<label for="add-item-qty" class="field-label">Qty</label>
			<input
				id="add-item-qty"
				type="number"
				bind:value={quantity}
				min="1"
				required
				class="input-field"
			/>
		</div>

		<div class="form-field form-field-unit">
			<label for="add-item-unit" class="field-label">Unit</label>
			<select id="add-item-unit" bind:value={unit} class="input-field select-field">
				{#each unitOptions[category] as opt}
					<option value={opt}>{opt}</option>
				{/each}
			</select>
		</div>

		<div class="form-field form-field-notes">
			<label for="add-item-notes" class="field-label">Notes</label>
			<input
				id="add-item-notes"
				type="text"
				bind:value={notes}
				class="input-field"
				placeholder="Optional"
			/>
		</div>
	</div>

	<div class="form-actions">
		<button type="submit" class="btn-primary btn-sm">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
			Add
		</button>
		<button type="button" onclick={onCancel} class="btn-secondary btn-sm">
			Cancel
		</button>
	</div>
</form>

<style>
	.add-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		background: var(--color-paper);
		border-top: 1px solid rgba(17, 17, 17, 0.08);
	}

	.form-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.form-field-name {
		flex: 1;
		min-width: 150px;
	}

	.form-field-qty {
		width: 70px;
	}

	.form-field-unit {
		width: 90px;
	}

	.form-field-notes {
		flex: 1;
		min-width: 100px;
	}

	.field-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-ink-muted);
	}

	.form-actions {
		display: flex;
		gap: var(--space-sm);
		justify-content: flex-end;
	}

	.btn-sm {
		padding: var(--space-xs) var(--space-md);
		font-size: 0.8125rem;
	}

	.btn-icon {
		width: 14px;
		height: 14px;
	}

	/* Mobile stacking */
	@media (max-width: 640px) {
		.add-form {
			padding: var(--space-md);
		}

		.form-row {
			flex-direction: column;
		}

		.form-field-name,
		.form-field-qty,
		.form-field-unit,
		.form-field-notes {
			width: 100%;
			min-width: unset;
		}

		.form-actions {
			flex-direction: column;
		}

		.form-actions button {
			width: 100%;
			justify-content: center;
		}
	}
</style>
