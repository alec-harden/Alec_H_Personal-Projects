<script lang="ts">
	import BomSelector from '$lib/components/cutlist/BomSelector.svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData, ActionData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	// Two-step flow state
	let selectedProjectId = $state<string | null>(null);
	let selectedBomIds = $state<Set<string>>(new Set());
	let loading = $state<boolean>(false);

	// Derived state
	const selectedProject = $derived(
		data.projects.find((p) => p.id === selectedProjectId) || null
	);

	const canLoad = $derived(selectedBomIds.size > 0 && !loading);

	// Handlers
	function selectProject(projectId: string) {
		selectedProjectId = projectId;
		selectedBomIds = new Set(); // Reset BOM selection when changing project
	}

	function toggleBom(bomId: string) {
		const newSet = new Set(selectedBomIds);
		if (newSet.has(bomId)) {
			newSet.delete(bomId);
		} else {
			newSet.add(bomId);
		}
		selectedBomIds = newSet;
	}

	function backToProjects() {
		selectedProjectId = null;
		selectedBomIds = new Set();
	}
</script>

<div class="page-container">
	<!-- Header -->
	<header class="page-header">
		<div class="header-content">
			<h1 class="page-title">Import from BOM</h1>
			<p class="page-subtitle">
				Select a project and BOMs to load lumber items as available stock
			</p>
		</div>
		<a href="/cutlist" class="btn-ghost">Back to Cut List</a>
	</header>

	<!-- Error Display -->
	{#if form?.error}
		<div class="error-banner">
			<svg viewBox="0 0 20 20" fill="currentColor" class="error-icon">
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
					clip-rule="evenodd"
				/>
			</svg>
			<span>{form.error}</span>
		</div>
	{/if}

	<!-- Content Area -->
	<div class="content-area">
		{#if data.projects.length === 0}
			<!-- Empty State - No Projects -->
			<div class="empty-state">
				<div class="empty-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
						/>
					</svg>
				</div>
				<p class="empty-text">No projects yet</p>
				<a href="/projects" class="empty-link">Create your first project</a>
			</div>
		{:else if !selectedProjectId}
			<!-- Step 1: Project Selection -->
			<div class="selection-card">
				<h2 class="selection-title">Select a Project</h2>
				<div class="projects-list">
					{#each data.projects as project (project.id)}
						{@const bomCount = project.boms.length}
						<button
							type="button"
							class="project-card"
							onclick={() => selectProject(project.id)}
						>
							<div class="project-radio">
								<div class="radio-ring"></div>
							</div>
							<div class="project-content">
								<span class="project-name">{project.name}</span>
								<span class="project-meta">
									{bomCount}
									{bomCount === 1 ? 'BOM' : 'BOMs'}
								</span>
							</div>
						</button>
					{/each}
				</div>
			</div>
		{:else if selectedProject}
			<!-- Step 2: BOM Selection -->
			<div class="selection-card">
				<div class="card-header">
					<button type="button" class="back-button" onclick={backToProjects}>
						<svg viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
						Back to projects
					</button>
					<h2 class="selection-title">{selectedProject.name}</h2>
				</div>

				{#if selectedProject.boms.length === 0}
					<div class="empty-state-small">
						<p class="empty-text">No BOMs in this project</p>
						<a href="/projects/{selectedProject.id}" class="empty-link">
							Go to project to create a BOM
						</a>
					</div>
				{:else}
					<!-- BOM Selector Form -->
					<form
						method="POST"
						action="?/loadFromBoms"
						use:enhance={() => {
							loading = true;
							return async ({ result }) => {
								loading = false;
								if (result.type === 'success' && result.data?.stock) {
									// Redirect to cutlist with pre-populated stock
									goto('/cutlist', {
										state: {
											stock: result.data.stock,
											mode: result.data.mode
										}
									});
								}
							};
						}}
					>
						<input type="hidden" name="projectId" value={selectedProject.id} />

						<div class="form-section">
							<label class="form-label">Select BOMs to Import</label>
							<BomSelector
								boms={selectedProject.boms}
								{selectedBomIds}
								onToggle={toggleBom}
								disabled={loading}
							/>
						</div>

						<div class="selection-summary">
							<span class="summary-text">
								{selectedBomIds.size}
								{selectedBomIds.size === 1 ? 'BOM' : 'BOMs'} selected
							</span>
						</div>

						<div class="form-actions">
							<button type="button" class="btn-ghost" onclick={backToProjects} disabled={loading}>
								Cancel
							</button>
							<button type="submit" class="btn-primary" disabled={!canLoad}>
								{#if loading}
									<svg viewBox="0 0 24 24" class="btn-spinner">
										<circle
											cx="12"
											cy="12"
											r="10"
											fill="none"
											stroke="currentColor"
											stroke-width="3"
											opacity="0.25"
										/>
										<path
											d="M12 2a10 10 0 0110 10"
											fill="none"
											stroke="currentColor"
											stroke-width="3"
											stroke-linecap="round"
										/>
									</svg>
									Loading...
								{:else}
									Load Stock
								{/if}
							</button>
						</div>
					</form>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Page Layout */
	.page-container {
		max-width: 1024px;
		margin: 0 auto;
		padding: var(--space-lg);
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-xl);
	}

	.header-content {
		flex: 1;
	}

	.page-title {
		font-family: var(--font-display);
		font-size: 2rem;
		color: var(--color-ink);
		margin: 0 0 var(--space-sm) 0;
	}

	.page-subtitle {
		font-size: 0.9375rem;
		color: var(--color-ink-muted);
		margin: 0;
	}

	/* Content Area */
	.content-area {
		margin-top: var(--space-xl);
	}

	/* Selection Card */
	.selection-card {
		background: var(--color-white);
		border: 1px solid rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.card-header {
		margin-bottom: var(--space-lg);
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-sm);
		border: none;
		background: none;
		color: var(--color-walnut);
		font-size: 0.875rem;
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
		margin-bottom: var(--space-md);
	}

	.back-button:hover {
		background: var(--color-walnut-soft);
	}

	.back-button svg {
		width: 16px;
		height: 16px;
	}

	.selection-title {
		font-family: var(--font-display);
		font-size: 1.5rem;
		color: var(--color-ink);
		margin: 0 0 var(--space-lg) 0;
	}

	/* Projects List */
	.projects-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-height: 500px;
		overflow-y: auto;
	}

	.project-card {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md);
		background: var(--color-white);
		border: 1px solid rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: left;
		width: 100%;
	}

	.project-card:hover {
		border-color: var(--color-walnut);
		background: var(--color-walnut-soft);
	}

	.project-radio {
		flex-shrink: 0;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.radio-ring {
		width: 20px;
		height: 20px;
		border: 2px solid var(--color-ink-muted);
		border-radius: 50%;
		transition: border-color var(--transition-fast);
	}

	.project-card:hover .radio-ring {
		border-color: var(--color-walnut);
	}

	.project-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.project-name {
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--color-ink);
	}

	.project-meta {
		font-size: 0.8125rem;
		color: var(--color-ink-muted);
	}

	/* Form Section */
	.form-section {
		margin-bottom: var(--space-lg);
	}

	.form-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-ink);
		margin-bottom: var(--space-sm);
	}

	/* Selection Summary */
	.selection-summary {
		padding: var(--space-md);
		background: var(--color-paper);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-lg);
		text-align: center;
	}

	.summary-text {
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--color-ink);
	}

	/* Form Actions */
	.form-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-sm);
	}

	/* Empty States */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
		padding: var(--space-2xl) var(--space-lg);
		text-align: center;
	}

	.empty-state-small {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-xl) var(--space-lg);
		text-align: center;
	}

	.empty-icon {
		width: 64px;
		height: 64px;
		color: var(--color-ink-muted);
		opacity: 0.5;
	}

	.empty-icon svg {
		width: 100%;
		height: 100%;
	}

	.empty-text {
		font-size: 0.9375rem;
		color: var(--color-ink-muted);
		margin: 0;
	}

	.empty-link {
		font-size: 0.875rem;
		color: var(--color-walnut);
		text-decoration: none;
		padding: var(--space-xs) var(--space-md);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.empty-link:hover {
		background: var(--color-walnut-soft);
		color: var(--color-walnut-dark);
	}

	/* Error Banner */
	.error-banner {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: #fef2f2;
		border: 1px solid #fca5a5;
		border-radius: var(--radius-md);
		color: #991b1b;
		margin-bottom: var(--space-lg);
	}

	.error-icon {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}

	/* Button Spinner */
	.btn-spinner {
		width: 16px;
		height: 16px;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
