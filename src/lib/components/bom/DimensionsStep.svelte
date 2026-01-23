<script lang="ts">
	// Dimensions input step
	// Collects project dimensions with validation against template ranges

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

<div>
	<h2 class="mb-2 text-xl font-semibold text-gray-900">Project Dimensions</h2>
	<p class="mb-6 text-gray-600">
		Enter the dimensions for your {template.name.toLowerCase()}.
	</p>

	<form onsubmit={handleSubmit} class="space-y-6">
		<!-- Project Name -->
		<div>
			<label for="projectName" class="block text-sm font-medium text-gray-700">
				Project Name (optional)
			</label>
			<input
				type="text"
				id="projectName"
				bind:value={projectName}
				placeholder="My {template.name}"
				class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
			/>
		</div>

		<!-- Unit Selector -->
		<div>
			<span id="unit-label" class="block text-sm font-medium text-gray-700">Units</span>
			<div class="mt-1 flex gap-4" role="radiogroup" aria-labelledby="unit-label">
				<label class="flex items-center gap-2">
					<input
						type="radio"
						name="unit"
						value="inches"
						checked={unit === 'inches'}
						onchange={() => (unit = 'inches')}
						class="h-4 w-4 text-amber-600 focus:ring-amber-500"
					/>
					<span class="text-sm text-gray-700">Inches</span>
				</label>
				<label class="flex items-center gap-2">
					<input
						type="radio"
						name="unit"
						value="cm"
						checked={unit === 'cm'}
						onchange={() => (unit = 'cm')}
						class="h-4 w-4 text-amber-600 focus:ring-amber-500"
					/>
					<span class="text-sm text-gray-700">Centimeters</span>
				</label>
			</div>
		</div>

		<!-- Dimension Inputs -->
		<div class="grid gap-4 sm:grid-cols-3">
			<!-- Length -->
			<div>
				<label for="length" class="block text-sm font-medium text-gray-700">
					Length ({unit})
				</label>
				<input
					type="number"
					id="length"
					bind:value={length}
					min={template.defaultDimensions.length.min}
					max={template.defaultDimensions.length.max}
					class="mt-1 block w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20
						{errors.length ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-amber-500'}"
				/>
				{#if errors.length}
					<p class="mt-1 text-xs text-red-600">{errors.length}</p>
				{/if}
			</div>

			<!-- Width -->
			<div>
				<label for="width" class="block text-sm font-medium text-gray-700">
					Width ({unit})
				</label>
				<input
					type="number"
					id="width"
					bind:value={width}
					min={template.defaultDimensions.width.min}
					max={template.defaultDimensions.width.max}
					class="mt-1 block w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20
						{errors.width ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-amber-500'}"
				/>
				{#if errors.width}
					<p class="mt-1 text-xs text-red-600">{errors.width}</p>
				{/if}
			</div>

			<!-- Height (conditional) -->
			{#if template.defaultDimensions.height}
				<div>
					<label for="height" class="block text-sm font-medium text-gray-700">
						Height ({unit})
					</label>
					<input
						type="number"
						id="height"
						bind:value={height}
						min={template.defaultDimensions.height.min}
						max={template.defaultDimensions.height.max}
						class="mt-1 block w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20
							{errors.height ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-amber-500'}"
					/>
					{#if errors.height}
						<p class="mt-1 text-xs text-red-600">{errors.height}</p>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Navigation Buttons -->
		<div class="flex justify-between pt-4">
			<button
				type="button"
				onclick={onBack}
				class="rounded-lg border border-gray-300 bg-white px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
			>
				Back
			</button>
			<button
				type="submit"
				class="rounded-lg bg-amber-700 px-6 py-2 font-medium text-white transition-colors hover:bg-amber-800"
			>
				Next
			</button>
		</div>
	</form>
</div>
