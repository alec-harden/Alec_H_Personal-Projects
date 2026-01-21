<script lang="ts">
	// BOM Wizard container component
	// Orchestrates the 4-step wizard flow and manages accumulated state

	import type { ProjectDetails } from '$lib/types/bom';
	import type { ProjectTemplate } from '$lib/data/templates';
	import { templates } from '$lib/data/templates';

	import WizardProgress from './WizardProgress.svelte';
	import ProjectTypeStep from './ProjectTypeStep.svelte';
	import DimensionsStep from './DimensionsStep.svelte';
	import JoineryStep from './JoineryStep.svelte';
	import MaterialsStep from './MaterialsStep.svelte';

	interface Props {
		onComplete: (details: ProjectDetails) => void;
	}

	let { onComplete }: Props = $props();

	// Wizard state
	let currentStep = $state(1);
	let selectedTemplate = $state<ProjectTemplate | null>(null);
	let projectDetails = $state<Partial<ProjectDetails>>({});

	// Step handlers
	function handleTemplateSelect(template: ProjectTemplate) {
		selectedTemplate = template;
		projectDetails = {
			...projectDetails,
			templateId: template.id
		};
		currentStep = 2;
	}

	function handleDimensionsSubmit(dimensions: {
		length: number;
		width: number;
		height?: number;
		unit: 'inches' | 'cm';
		projectName: string;
	}) {
		projectDetails = {
			...projectDetails,
			projectName: dimensions.projectName,
			dimensions: {
				length: dimensions.length,
				width: dimensions.width,
				height: dimensions.height,
				unit: dimensions.unit
			}
		};
		currentStep = 3;
	}

	function handleJoinerySubmit(selectedIds: string[]) {
		projectDetails = {
			...projectDetails,
			joinery: selectedIds
		};
		currentStep = 4;
	}

	function handleMaterialsSubmit(materials: {
		woodSpecies: string;
		finish: string;
		additionalNotes: string;
	}) {
		const completeDetails: ProjectDetails = {
			templateId: projectDetails.templateId!,
			projectName: projectDetails.projectName!,
			dimensions: projectDetails.dimensions!,
			joinery: projectDetails.joinery!,
			woodSpecies: materials.woodSpecies,
			finish: materials.finish,
			additionalNotes: materials.additionalNotes || undefined
		};
		onComplete(completeDetails);
	}

	function goBack() {
		if (currentStep > 1) {
			currentStep = currentStep - 1;
		}
	}
</script>

<div class="mx-auto max-w-3xl">
	<WizardProgress {currentStep} />

	{#if currentStep === 1}
		<ProjectTypeStep {templates} onSelect={handleTemplateSelect} />
	{:else if currentStep === 2 && selectedTemplate}
		<DimensionsStep
			template={selectedTemplate}
			initialValues={{
				length: projectDetails.dimensions?.length,
				width: projectDetails.dimensions?.width,
				height: projectDetails.dimensions?.height,
				unit: projectDetails.dimensions?.unit,
				projectName: projectDetails.projectName
			}}
			onSubmit={handleDimensionsSubmit}
			onBack={goBack}
		/>
	{:else if currentStep === 3 && selectedTemplate}
		<JoineryStep
			template={selectedTemplate}
			initialValues={projectDetails.joinery}
			onSubmit={handleJoinerySubmit}
			onBack={goBack}
		/>
	{:else if currentStep === 4 && selectedTemplate}
		<MaterialsStep
			template={selectedTemplate}
			initialValues={{
				woodSpecies: projectDetails.woodSpecies,
				finish: projectDetails.finish,
				additionalNotes: projectDetails.additionalNotes
			}}
			onSubmit={handleMaterialsSubmit}
			onBack={goBack}
		/>
	{/if}
</div>
