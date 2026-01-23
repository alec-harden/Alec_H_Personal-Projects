<script lang="ts">
	// Joinery selection step
	// Modern Artisan aesthetic with schematic-style joinery illustrations

	import type { ProjectTemplate, JoineryOption } from '$lib/data/templates';

	interface Props {
		template: ProjectTemplate;
		initialValues?: string[];
		onSubmit: (selectedIds: string[]) => void;
		onBack: () => void;
	}

	const { template, initialValues = [], onSubmit, onBack }: Props = $props();

	let selectedIds = $state<string[]>([]);
	let error = $state('');

	// Track template to detect when user switches project type
	let lastTemplateId = $state('');

	// Sync state when props change (e.g., navigating back or switching template)
	$effect(() => {
		if (template.id !== lastTemplateId) {
			selectedIds = [...initialValues];
			lastTemplateId = template.id;
		}
	});

	function toggleOption(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((s) => s !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
		error = '';
	}

	function getDifficultyBadgeClass(difficulty: JoineryOption['difficulty']): string {
		switch (difficulty) {
			case 'beginner':
				return 'badge-success';
			case 'intermediate':
				return 'badge-warning';
			case 'advanced':
				return 'badge-error';
		}
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (selectedIds.length === 0) {
			error = 'Please select at least one joinery method';
			return;
		}
		onSubmit(selectedIds);
	}
</script>

<div class="step-container animate-fade-in">
	<div class="step-header">
		<h2 class="step-title">Joinery Methods</h2>
		<p class="step-description">
			Select one or more joinery techniques for your {template.name.toLowerCase()}.
		</p>
	</div>

	<form onsubmit={handleSubmit} class="step-form">
		<div class="joinery-grid stagger-children">
			{#each template.joineryOptions as option}
				{@const isSelected = selectedIds.includes(option.id)}
				<button
					type="button"
					onclick={() => toggleOption(option.id)}
					class="joinery-option"
					class:joinery-selected={isSelected}
				>
					<div class="joinery-header">
						<h3 class="joinery-name">{option.name}</h3>
						<span class="badge {getDifficultyBadgeClass(option.difficulty)}">
							{option.difficulty}
						</span>
					</div>

					<p class="joinery-description">{option.description}</p>

					{#if isSelected}
						<div class="joinery-checkmark">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
							<span>Selected</span>
						</div>
					{/if}
				</button>
			{/each}
		</div>

		{#if error}
			<div class="error-banner">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="error-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<span>{error}</span>
			</div>
		{/if}

		<!-- Navigation Buttons -->
		<div class="button-row">
			<button type="button" onclick={onBack} class="btn-secondary">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="btn-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
				Back
			</button>
			<button type="submit" class="btn-primary">
				Next
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="btn-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
	</form>
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

	/* Form */
	.step-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	/* Joinery Grid */
	.joinery-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-md);
	}

	@media (min-width: 640px) {
		.joinery-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	/* Joinery Option */
	.joinery-option {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-lg);
		background: var(--color-white);
		border: 2px solid rgba(17, 17, 17, 0.1);
		border-radius: var(--radius-lg);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.joinery-option:hover {
		border-color: var(--color-walnut-light);
		box-shadow: var(--shadow-soft);
	}

	.joinery-selected {
		border-color: var(--color-walnut);
		background: rgba(93, 64, 55, 0.04);
	}

	.joinery-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.joinery-name {
		font-family: var(--font-display);
		font-size: 1rem;
		color: var(--color-ink);
		margin: 0;
	}

	.joinery-description {
		font-size: 0.8125rem;
		color: var(--color-ink-muted);
		margin: 0;
		line-height: 1.5;
	}

	.joinery-checkmark {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--color-walnut);
		font-size: 0.8125rem;
		font-weight: 500;
		margin-top: var(--space-xs);
	}

	.joinery-checkmark svg {
		width: 16px;
		height: 16px;
	}

	/* Error Banner */
	.error-banner {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--color-error-soft);
		border-radius: var(--radius-md);
		color: var(--color-error);
		font-size: 0.875rem;
	}

	.error-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	/* Button Row */
	.button-row {
		display: flex;
		justify-content: space-between;
		padding-top: var(--space-md);
		border-top: 1px solid rgba(17, 17, 17, 0.08);
		margin-top: var(--space-md);
	}

	.btn-icon {
		width: 18px;
		height: 18px;
	}
</style>
