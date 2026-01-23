<script lang="ts">
	// Dimensions input step
	// Modern Artisan aesthetic with clean form styling

	import type { ProjectTemplate } from '$lib/data/templates';

	interface DimensionValues {
		length: number;
		width: number;
		height?: number;
		unit: 'inches' | 'cm';
		projectName: string;
	}

	interface Props {
		template: ProjectTemplate;
		initialValues?: Partial<DimensionValues>;
		onSubmit: (values: DimensionValues) => void;
		onBack: () => void;
	}

	const { template, initialValues, onSubmit, onBack }: Props = $props();

	// Derive default values reactively from props
	const defaultLength = $derived(initialValues?.length ?? template.defaultDimensions.length.default);
	const defaultWidth = $derived(initialValues?.width ?? template.defaultDimensions.width.default);
	const defaultHeight = $derived(initialValues?.height ?? template.defaultDimensions.height?.default ?? 0);
	const defaultUnit = $derived(initialValues?.unit ?? 'inches');
	const defaultProjectName = $derived(initialValues?.projectName ?? '');

	let length = $state(0);
	let width = $state(0);
	let height = $state(0);
	let unit = $state<'inches' | 'cm'>('inches');
	let projectName = $state('');

	// Track template to detect when user switches project type
	let lastTemplateId = $state('');

	// Sync state when props change (e.g., navigating back or switching template)
	$effect(() => {
		if (template.id !== lastTemplateId) {
			length = defaultLength;
			width = defaultWidth;
			height = defaultHeight;
			unit = defaultUnit;
			projectName = defaultProjectName;
			lastTemplateId = template.id;
		}
	});

	// Validation errors
	let errors = $state<Record<string, string>>({});

	function validate(): boolean {
		const newErrors: Record<string, string> = {};
		const dims = template.defaultDimensions;

		if (length < dims.length.min || length > dims.length.max) {
			newErrors.length = `Must be between ${dims.length.min} and ${dims.length.max}`;
		}
		if (width < dims.width.min || width > dims.width.max) {
			newErrors.width = `Must be between ${dims.width.min} and ${dims.width.max}`;
		}
		if (dims.height && (height < dims.height.min || height > dims.height.max)) {
			newErrors.height = `Must be between ${dims.height.min} and ${dims.height.max}`;
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (validate()) {
			onSubmit({
				length,
				width,
				height: template.defaultDimensions.height ? height : undefined,
				unit,
				projectName: projectName.trim() || `My ${template.name}`
			});
		}
	}
</script>

<div class="step-container animate-fade-in">
	<div class="step-header">
		<h2 class="step-title">Project Dimensions</h2>
		<p class="step-description">
			Enter the dimensions for your {template.name.toLowerCase()}.
		</p>
	</div>

	<form onsubmit={handleSubmit} class="step-form">
		<!-- Project Name -->
		<div class="form-group">
			<label for="projectName" class="label">
				Project Name <span class="label-optional">(optional)</span>
			</label>
			<input
				type="text"
				id="projectName"
				bind:value={projectName}
				placeholder="My {template.name}"
				class="input-field"
			/>
		</div>

		<!-- Unit Selector -->
		<div class="form-group">
			<span id="unit-label" class="label">Units</span>
			<div class="unit-options" role="radiogroup" aria-labelledby="unit-label">
				<label class="unit-option" class:unit-selected={unit === 'inches'}>
					<input
						type="radio"
						name="unit"
						value="inches"
						checked={unit === 'inches'}
						onchange={() => (unit = 'inches')}
						class="unit-radio"
					/>
					<span class="unit-label">Inches</span>
				</label>
				<label class="unit-option" class:unit-selected={unit === 'cm'}>
					<input
						type="radio"
						name="unit"
						value="cm"
						checked={unit === 'cm'}
						onchange={() => (unit = 'cm')}
						class="unit-radio"
					/>
					<span class="unit-label">Centimeters</span>
				</label>
			</div>
		</div>

		<!-- Dimension Inputs -->
		<div class="dimension-grid">
			<!-- Length -->
			<div class="form-group">
				<label for="length" class="label">
					Length <span class="label-unit">({unit})</span>
				</label>
				<input
					type="number"
					id="length"
					bind:value={length}
					min={template.defaultDimensions.length.min}
					max={template.defaultDimensions.length.max}
					class="input-field"
					class:input-error={errors.length}
				/>
				{#if errors.length}
					<p class="error-message">{errors.length}</p>
				{/if}
			</div>

			<!-- Width -->
			<div class="form-group">
				<label for="width" class="label">
					Width <span class="label-unit">({unit})</span>
				</label>
				<input
					type="number"
					id="width"
					bind:value={width}
					min={template.defaultDimensions.width.min}
					max={template.defaultDimensions.width.max}
					class="input-field"
					class:input-error={errors.width}
				/>
				{#if errors.width}
					<p class="error-message">{errors.width}</p>
				{/if}
			</div>

			<!-- Height (conditional) -->
			{#if template.defaultDimensions.height}
				<div class="form-group">
					<label for="height" class="label">
						Height <span class="label-unit">({unit})</span>
					</label>
					<input
						type="number"
						id="height"
						bind:value={height}
						min={template.defaultDimensions.height.min}
						max={template.defaultDimensions.height.max}
						class="input-field"
						class:input-error={errors.height}
					/>
					{#if errors.height}
						<p class="error-message">{errors.height}</p>
					{/if}
				</div>
			{/if}
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

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.label-optional,
	.label-unit {
		font-weight: 400;
		color: var(--color-ink-muted);
	}

	/* Unit Options */
	.unit-options {
		display: flex;
		gap: var(--space-md);
	}

	.unit-option {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--color-white);
		border: 1px solid rgba(17, 17, 17, 0.15);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.unit-option:hover {
		border-color: var(--color-walnut-light);
	}

	.unit-selected {
		border-color: var(--color-walnut);
		background: rgba(93, 64, 55, 0.04);
	}

	.unit-radio {
		width: 16px;
		height: 16px;
		accent-color: var(--color-walnut);
	}

	.unit-label {
		font-size: 0.9375rem;
		color: var(--color-ink);
	}

	/* Dimension Grid */
	.dimension-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-md);
	}

	@media (min-width: 640px) {
		.dimension-grid {
			grid-template-columns: repeat(3, 1fr);
		}
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
