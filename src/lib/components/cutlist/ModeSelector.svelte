<script lang="ts">
	import type { CutListMode } from '$lib/types/cutlist';

	interface Props {
		mode: CutListMode;
		onModeChange?: (mode: CutListMode) => void;
	}

	let { mode = $bindable(), onModeChange }: Props = $props();

	function selectMode(newMode: CutListMode) {
		mode = newMode;
		onModeChange?.(newMode);
	}
</script>

<div class="mode-selector">
	<button
		type="button"
		class="mode-button"
		class:active={mode === 'linear'}
		onclick={() => selectMode('linear')}
	>
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			class="mode-icon"
		>
			<!-- Ruler icon -->
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M3 6h18M3 18h18M6 6v12M12 6v6M18 6v12M9 6v3"
			/>
		</svg>
		<div class="mode-content">
			<span class="mode-title">Linear (1D)</span>
			<span class="mode-subtitle">Boards, trim, lumber</span>
		</div>
	</button>

	<button
		type="button"
		class="mode-button"
		class:active={mode === 'sheet'}
		onclick={() => selectMode('sheet')}
	>
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			class="mode-icon"
		>
			<!-- Grid/Square icon -->
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
			/>
		</svg>
		<div class="mode-content">
			<span class="mode-title">Sheet (2D)</span>
			<span class="mode-subtitle">Plywood, panels</span>
		</div>
	</button>
</div>

<style>
	.mode-selector {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
		margin-bottom: var(--space-xl);
	}

	@media (max-width: 640px) {
		.mode-selector {
			grid-template-columns: 1fr;
		}
	}

	.mode-button {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: var(--color-white);
		border: 2px solid rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all var(--transition-base);
		text-align: left;
	}

	.mode-button:hover {
		border-color: var(--color-walnut);
		box-shadow: var(--shadow-small);
	}

	.mode-button.active {
		background: rgb(180, 83, 9); /* amber-700 */
		border-color: rgb(180, 83, 9);
		color: white;
	}

	.mode-icon {
		width: 32px;
		height: 32px;
		flex-shrink: 0;
	}

	.mode-button.active .mode-icon {
		color: white;
	}

	.mode-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.mode-title {
		font-family: var(--font-display);
		font-size: 1.0625rem;
		font-weight: 600;
	}

	.mode-subtitle {
		font-size: 0.8125rem;
		opacity: 0.8;
	}

	.mode-button:not(.active) .mode-title {
		color: var(--color-ink);
	}

	.mode-button:not(.active) .mode-subtitle {
		color: var(--color-ink-muted);
	}
</style>
