<script lang="ts">
	// Wizard step progress indicator
	// Displays current progress through the 4-step BOM wizard

	interface Props {
		currentStep: number;
		totalSteps?: number;
	}

	let { currentStep, totalSteps = 4 }: Props = $props();

	const stepLabels = ['Project Type', 'Dimensions', 'Joinery', 'Materials'];
</script>

<div class="mb-8">
	<div class="flex items-center justify-between">
		{#each Array(totalSteps) as _, index}
			{@const stepNumber = index + 1}
			{@const isCompleted = stepNumber < currentStep}
			{@const isCurrent = stepNumber === currentStep}

			<!-- Step circle and label -->
			<div class="flex flex-col items-center">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors
						{isCompleted ? 'border-amber-600 bg-amber-600 text-white' : ''}
						{isCurrent ? 'border-amber-600 bg-amber-50 text-amber-700' : ''}
						{!isCompleted && !isCurrent ? 'border-gray-300 bg-white text-gray-400' : ''}"
				>
					{#if isCompleted}
						<span>&#10003;</span>
					{:else}
						{stepNumber}
					{/if}
				</div>
				<span
					class="mt-2 text-xs font-medium
						{isCompleted || isCurrent ? 'text-amber-700' : 'text-gray-400'}"
				>
					{stepLabels[index]}
				</span>
			</div>

			<!-- Connecting line (except after last step) -->
			{#if index < totalSteps - 1}
				<div
					class="mx-2 h-0.5 flex-1 transition-colors
						{stepNumber < currentStep ? 'bg-amber-600' : 'bg-gray-300'}"
				></div>
			{/if}
		{/each}
	</div>
</div>
