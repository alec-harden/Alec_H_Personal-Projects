<script lang="ts">
	// Wizard step progress indicator
	// Modern Artisan aesthetic with wood-grain inspired progress

	interface Props {
		currentStep: number;
		totalSteps?: number;
	}

	let { currentStep, totalSteps = 4 }: Props = $props();

	const stepLabels = ['Project Type', 'Dimensions', 'Joinery', 'Materials'];
</script>

<div class="wizard-progress">
	<div class="progress-track">
		{#each Array(totalSteps) as _, index}
			{@const stepNumber = index + 1}
			{@const isCompleted = stepNumber < currentStep}
			{@const isCurrent = stepNumber === currentStep}

			<!-- Step Marker -->
			<div class="step-container">
				<div
					class="step-marker"
					class:step-completed={isCompleted}
					class:step-current={isCurrent}
					class:step-pending={!isCompleted && !isCurrent}
				>
					{#if isCompleted}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
						</svg>
					{:else}
						<span class="step-number">{stepNumber}</span>
					{/if}
				</div>

				<span
					class="step-label"
					class:step-label-active={isCompleted || isCurrent}
				>
					{stepLabels[index]}
				</span>
			</div>

			<!-- Connecting Line (except after last step) -->
			{#if index < totalSteps - 1}
				<div class="step-connector">
					<div
						class="connector-fill"
						class:connector-active={stepNumber < currentStep}
					></div>
				</div>
			{/if}
		{/each}
	</div>

	<!-- Wood grain progress bar below -->
	<div class="progress-bar-container">
		<div class="wood-grain-progress">
			<div
				class="wood-grain-progress-fill"
				style="width: {((currentStep - 1) / (totalSteps - 1)) * 100}%"
			></div>
		</div>
	</div>
</div>

<style>
	.wizard-progress {
		margin-bottom: var(--space-2xl);
	}

	.progress-track {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		position: relative;
	}

	/* Step Container */
	.step-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
		position: relative;
		z-index: 1;
	}

	/* Step Marker */
	.step-marker {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
		font-weight: 600;
		font-size: 0.9375rem;
		transition: all var(--transition-base);
		background: var(--color-white);
		border: 2px solid var(--color-paper-dark);
	}

	.step-marker svg {
		width: 18px;
		height: 18px;
	}

	.step-completed {
		background: var(--color-walnut);
		border-color: var(--color-walnut);
		color: var(--color-white);
	}

	.step-current {
		background: var(--color-white);
		border-color: var(--color-walnut);
		color: var(--color-walnut);
		box-shadow: 0 0 0 4px rgba(93, 64, 55, 0.1);
	}

	.step-pending {
		background: var(--color-white);
		border-color: var(--color-paper-dark);
		color: var(--color-ink-muted);
	}

	.step-number {
		font-family: var(--font-display);
	}

	/* Step Label */
	.step-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-ink-muted);
		text-align: center;
		white-space: nowrap;
		transition: color var(--transition-fast);
	}

	.step-label-active {
		color: var(--color-walnut);
	}

	/* Connector Line */
	.step-connector {
		flex: 1;
		height: 2px;
		background: var(--color-paper-dark);
		margin-top: 22px;
		position: relative;
		overflow: hidden;
	}

	.connector-fill {
		position: absolute;
		inset: 0;
		background: var(--color-walnut);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform var(--transition-slow);
	}

	.connector-active {
		transform: scaleX(1);
	}

	/* Progress Bar */
	.progress-bar-container {
		margin-top: var(--space-lg);
		padding: 0 22px;
	}

	/* Hide on mobile, show simplified version */
	@media (max-width: 640px) {
		.step-label {
			display: none;
		}

		.step-marker {
			width: 36px;
			height: 36px;
			font-size: 0.8125rem;
		}

		.step-connector {
			margin-top: 18px;
		}

		.progress-bar-container {
			padding: 0 18px;
		}
	}
</style>
