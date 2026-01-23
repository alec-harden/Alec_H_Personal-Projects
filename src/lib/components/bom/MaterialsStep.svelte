<script lang="ts">
	// Materials selection step
	// Modern Artisan aesthetic with elegant form styling

	import type { ProjectTemplate } from '$lib/data/templates';

	interface MaterialValues {
		woodSpecies: string;
		finish: string;
		additionalNotes: string;
	}

	interface Props {
		template: ProjectTemplate;
		initialValues?: Partial<MaterialValues>;
		onSubmit: (values: MaterialValues) => void;
		onBack: () => void;
	}

	const { template, initialValues, onSubmit, onBack }: Props = $props();

	// Derive default values reactively from props
	const defaultWoodSpecies = $derived(initialValues?.woodSpecies ?? template.suggestedWoods[0] ?? '');
	const defaultFinish = $derived(initialValues?.finish ?? template.suggestedFinishes[0] ?? '');
	const defaultNotes = $derived(initialValues?.additionalNotes ?? '');

	let woodSpecies = $state('');
	let customWood = $state('');
	let finish = $state('');
	let customFinish = $state('');
	let additionalNotes = $state('');

	// Track template to detect when user switches project type
	let lastTemplateId = $state('');

	// Sync state when props change (e.g., navigating back or switching template)
	$effect(() => {
		if (template.id !== lastTemplateId) {
			woodSpecies = defaultWoodSpecies;
			finish = defaultFinish;
			additionalNotes = defaultNotes;
			customWood = '';
			customFinish = '';
			lastTemplateId = template.id;
		}
	});

	let errors = $state<Record<string, string>>({});

	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		const finalWood = woodSpecies === 'other' ? customWood.trim() : woodSpecies;
		const finalFinish = finish === 'other' ? customFinish.trim() : finish;

		if (!finalWood) {
			newErrors.woodSpecies = 'Please select or enter a wood species';
		}
		if (!finalFinish) {
			newErrors.finish = 'Please select or enter a finish type';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (validate()) {
			onSubmit({
				woodSpecies: woodSpecies === 'other' ? customWood.trim() : woodSpecies,
				finish: finish === 'other' ? customFinish.trim() : finish,
				additionalNotes: additionalNotes.trim()
			});
		}
	}
</script>

<div class="step-container animate-fade-in">
	<div class="step-header">
		<h2 class="step-title">Materials & Finish</h2>
		<p class="step-description">
			Specify wood species and finish for your {template.name.toLowerCase()}.
		</p>
	</div>

	<form onsubmit={handleSubmit} class="step-form">
		<!-- Wood Species -->
		<div class="form-group">
			<label for="woodSpecies" class="label">Wood Species</label>
			<select
				id="woodSpecies"
				bind:value={woodSpecies}
				class="input-field select-field"
				class:input-error={errors.woodSpecies}
			>
				{#each template.suggestedWoods as wood}
					<option value={wood}>{wood}</option>
				{/each}
				<option value="other">Other (specify)</option>
			</select>
			{#if woodSpecies === 'other'}
				<input
					type="text"
					bind:value={customWood}
					placeholder="Enter wood species"
					class="input-field custom-input"
				/>
			{/if}
			{#if errors.woodSpecies}
				<p class="error-message">{errors.woodSpecies}</p>
			{/if}
		</div>

		<!-- Finish Type -->
		<div class="form-group">
			<label for="finish" class="label">Finish Type</label>
			<select
				id="finish"
				bind:value={finish}
				class="input-field select-field"
				class:input-error={errors.finish}
			>
				{#each template.suggestedFinishes as finishOption}
					<option value={finishOption}>{finishOption}</option>
				{/each}
				<option value="other">Other (specify)</option>
			</select>
			{#if finish === 'other'}
				<input
					type="text"
					bind:value={customFinish}
					placeholder="Enter finish type"
					class="input-field custom-input"
				/>
			{/if}
			{#if errors.finish}
				<p class="error-message">{errors.finish}</p>
			{/if}
		</div>

		<!-- Additional Notes -->
		<div class="form-group">
			<label for="additionalNotes" class="label">
				Additional Notes <span class="label-optional">(optional)</span>
			</label>
			<textarea
				id="additionalNotes"
				bind:value={additionalNotes}
				rows="4"
				placeholder="Any special requirements, modifications, or details..."
				class="input-field textarea-field"
			></textarea>
		</div>

		<!-- Navigation Buttons -->
		<div class="button-row">
			<button type="button" onclick={onBack} class="btn-secondary">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="btn-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
				Back
			</button>
			<button type="submit" class="btn-primary">
				Generate BOM
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="btn-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
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

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.label-optional {
		font-weight: 400;
		color: var(--color-ink-muted);
	}

	/* Custom Input */
	.custom-input {
		margin-top: var(--space-sm);
	}

	/* Textarea */
	.textarea-field {
		resize: none;
		min-height: 100px;
	}

	/* Error Message */
	.error-message {
		font-size: 0.75rem;
		color: var(--color-error);
		margin: 0;
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
