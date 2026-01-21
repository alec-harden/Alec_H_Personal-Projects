<script lang="ts">
	// Materials selection step
	// Collects wood species, finish, and additional notes

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

	let { template, initialValues, onSubmit, onBack }: Props = $props();

	let woodSpecies = $state(initialValues?.woodSpecies ?? template.suggestedWoods[0] ?? '');
	let customWood = $state('');
	let finish = $state(initialValues?.finish ?? template.suggestedFinishes[0] ?? '');
	let customFinish = $state('');
	let additionalNotes = $state(initialValues?.additionalNotes ?? '');

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

<div>
	<h2 class="mb-2 text-xl font-semibold text-gray-900">Materials &amp; Finish</h2>
	<p class="mb-6 text-gray-600">
		Specify wood species and finish for your {template.name.toLowerCase()}.
	</p>

	<form onsubmit={handleSubmit} class="space-y-6">
		<!-- Wood Species -->
		<div>
			<label for="woodSpecies" class="block text-sm font-medium text-gray-700">
				Wood Species
			</label>
			<select
				id="woodSpecies"
				bind:value={woodSpecies}
				class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20
					{errors.woodSpecies ? 'border-red-500' : ''}"
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
					class="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
				/>
			{/if}
			{#if errors.woodSpecies}
				<p class="mt-1 text-xs text-red-600">{errors.woodSpecies}</p>
			{/if}
		</div>

		<!-- Finish Type -->
		<div>
			<label for="finish" class="block text-sm font-medium text-gray-700">
				Finish Type
			</label>
			<select
				id="finish"
				bind:value={finish}
				class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20
					{errors.finish ? 'border-red-500' : ''}"
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
					class="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
				/>
			{/if}
			{#if errors.finish}
				<p class="mt-1 text-xs text-red-600">{errors.finish}</p>
			{/if}
		</div>

		<!-- Additional Notes -->
		<div>
			<label for="additionalNotes" class="block text-sm font-medium text-gray-700">
				Additional Notes (optional)
			</label>
			<textarea
				id="additionalNotes"
				bind:value={additionalNotes}
				rows="3"
				placeholder="Any special requirements, modifications, or details..."
				class="mt-1 block w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
			></textarea>
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
				Generate BOM
			</button>
		</div>
	</form>
</div>
