<script lang="ts">
	// Project type selection step
	// Modern Artisan aesthetic with schematic-style project icons

	import type { ProjectTemplate } from '$lib/data/templates';

	interface Props {
		templates: ProjectTemplate[];
		includeConsumables?: boolean;
		onSelect: (template: ProjectTemplate, includeConsumables: boolean) => void;
	}

	let { templates, includeConsumables = true, onSelect }: Props = $props();

	// Local state for consumables toggle
	let consumablesEnabled = $state(includeConsumables);
</script>

<div class="step-container animate-fade-in">
	<div class="step-header">
		<h2 class="step-title">What are you building?</h2>
		<p class="step-description">Select a project type to get started with customized options.</p>
	</div>

	<label class="consumables-toggle">
		<input type="checkbox" bind:checked={consumablesEnabled} class="toggle-checkbox" />
		<span class="toggle-label">Include Consumable Items</span>
		<span class="toggle-description">Sandpaper, glue, tape, and other shop supplies</span>
	</label>

	<div class="template-grid stagger-children">
		{#each templates as template}
			<button
				type="button"
				onclick={() => onSelect(template, consumablesEnabled)}
				class="template-card artisan-card sanded-surface"
			>
				<!-- Schematic-style icon placeholder -->
				<div class="template-icon illustration-placeholder">
					<span class="icon-text">{@html template.icon}</span>
				</div>

				<div class="template-content">
					<h3 class="template-name">{template.name}</h3>
					<p class="template-description">{template.description}</p>
				</div>

				<div class="template-arrow">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</button>
		{/each}
	</div>
</div>

<style>
	.step-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	.step-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.step-title {
		font-family: var(--font-display);
		font-size: 1.5rem;
		color: var(--color-ink);
		margin: 0;
	}

	.step-description {
		font-size: 0.9375rem;
		color: var(--color-ink-muted);
		margin: 0;
	}

	/* Template Grid */
	.template-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-md);
	}

	@media (min-width: 640px) {
		.template-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.template-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	/* Template Card */
	.template-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-lg);
		text-align: left;
		cursor: pointer;
		position: relative;
		border: none;
	}

	.template-card:focus-visible {
		outline: 2px solid var(--color-walnut);
		outline-offset: 2px;
	}

	/* Icon */
	.template-icon {
		width: 64px;
		height: 64px;
		font-size: 2rem;
	}

	.icon-text {
		filter: grayscale(20%);
	}

	/* Content */
	.template-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		flex: 1;
	}

	.template-name {
		font-family: var(--font-display);
		font-size: 1.125rem;
		color: var(--color-ink);
		margin: 0;
	}

	.template-description {
		font-size: 0.8125rem;
		color: var(--color-ink-muted);
		margin: 0;
		line-height: 1.5;
	}

	/* Arrow */
	.template-arrow {
		position: absolute;
		bottom: var(--space-lg);
		right: var(--space-lg);
		width: 20px;
		height: 20px;
		color: var(--color-walnut-light);
		opacity: 0;
		transform: translateX(-4px);
		transition: all var(--transition-fast);
	}

	.template-card:hover .template-arrow {
		opacity: 1;
		transform: translateX(0);
	}

	/* Consumables Toggle */
	.consumables-toggle {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: var(--color-paper);
		border: 1px solid var(--color-walnut-light);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: border-color var(--transition-fast);
	}

	.consumables-toggle:hover {
		border-color: var(--color-walnut);
	}

	.toggle-checkbox {
		width: 18px;
		height: 18px;
		accent-color: var(--color-walnut);
		cursor: pointer;
	}

	.toggle-label {
		font-family: var(--font-display);
		font-size: 0.9375rem;
		color: var(--color-ink);
	}

	.toggle-description {
		flex-basis: 100%;
		padding-left: calc(18px + var(--space-sm));
		font-size: 0.8125rem;
		color: var(--color-ink-muted);
	}
</style>
