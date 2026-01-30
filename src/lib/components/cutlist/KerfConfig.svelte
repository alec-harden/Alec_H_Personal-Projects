<script lang="ts">
	import { KERF_PRESETS } from '$lib/types/cutlist';

	interface Props {
		kerf: number;
	}

	let { kerf = $bindable() }: Props = $props();

	function setPreset(value: number) {
		kerf = value;
	}

	function isActivePreset(value: number): boolean {
		return Math.abs(kerf - value) < 0.0001; // Float comparison tolerance
	}
</script>

<section class="kerf-config">
	<div class="config-header">
		<label for="kerf-input" class="config-label">Blade Width (Kerf)</label>
		<p class="config-help">Material removed by the saw blade. Standard table saw: 1/8"</p>
	</div>

	<div class="config-controls">
		<div class="input-wrapper">
			<input
				id="kerf-input"
				type="number"
				bind:value={kerf}
				step="0.0625"
				min="0"
				max="0.5"
				class="input-field kerf-input"
			/>
			<span class="input-suffix">inches</span>
		</div>

		<div class="preset-buttons">
			{#each KERF_PRESETS as preset}
				<button
					type="button"
					onclick={() => setPreset(preset.value)}
					class="preset-btn"
					class:active={isActivePreset(preset.value)}
				>
					{preset.label}
				</button>
			{/each}
		</div>
	</div>
</section>

<style>
	.kerf-config {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: var(--color-white);
		border: 1px solid rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-md);
	}

	.config-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.config-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-ink);
	}

	.config-help {
		font-size: 0.8125rem;
		color: var(--color-ink-muted);
		line-height: 1.5;
	}

	.config-controls {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		align-items: center;
	}

	.input-wrapper {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		min-width: 140px;
	}

	.kerf-input {
		width: 100px;
		padding: var(--space-xs) var(--space-sm);
		font-size: 0.875rem;
	}

	.input-suffix {
		font-size: 0.8125rem;
		color: var(--color-ink-muted);
		white-space: nowrap;
	}

	.preset-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.preset-btn {
		padding: var(--space-xs) var(--space-md);
		font-size: 0.8125rem;
		font-weight: 500;
		border: 1px solid rgba(17, 17, 17, 0.15);
		border-radius: var(--radius-full);
		background: var(--color-paper-dark);
		color: var(--color-ink-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
	}

	.preset-btn:hover {
		background: var(--color-paper);
		border-color: var(--color-walnut-light);
		color: var(--color-ink);
	}

	.preset-btn.active {
		background: var(--color-walnut);
		border-color: var(--color-walnut);
		color: var(--color-white);
	}

	.preset-btn.active:hover {
		background: var(--color-walnut-dark);
		border-color: var(--color-walnut-dark);
	}

	/* Mobile stacking */
	@media (max-width: 640px) {
		.config-controls {
			flex-direction: column;
			align-items: stretch;
		}

		.input-wrapper {
			width: 100%;
			min-width: unset;
		}

		.kerf-input {
			flex: 1;
		}

		.preset-buttons {
			width: 100%;
		}

		.preset-btn {
			flex: 1 1 auto;
		}
	}
</style>
