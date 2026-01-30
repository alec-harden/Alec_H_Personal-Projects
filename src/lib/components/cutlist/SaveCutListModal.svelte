<script lang="ts">
	/**
	 * Modal for saving cut list to a project
	 * Allows selecting project and naming the cut list
	 */

	interface Project {
		id: string;
		name: string;
	}

	interface Props {
		open: boolean;
		projects: Project[];
		onSave: (projectId: string, name: string) => void;
		onClose: () => void;
		saving: boolean;
	}

	let { open, projects, onSave, onClose, saving }: Props = $props();

	// Track selected project and cut list name
	let selectedProjectId = $state<string | null>(null);
	let cutListName = $state<string>('');

	// Reset selection when modal opens
	$effect(() => {
		if (open) {
			selectedProjectId = null;
			cutListName = '';
		}
	});

	// Handle overlay click to close
	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget && !saving) {
			onClose();
		}
	}

	// Handle save click
	function handleSave() {
		if (selectedProjectId && cutListName.trim() && !saving) {
			onSave(selectedProjectId, cutListName.trim());
		}
	}

	// Handle project selection
	function selectProject(projectId: string) {
		if (!saving) {
			selectedProjectId = projectId;
		}
	}

	// Derive if save button should be enabled
	const canSave = $derived(
		selectedProjectId !== null && cutListName.trim().length > 0 && !saving
	);
</script>

{#if open}
	<div class="modal-overlay" onclick={handleOverlayClick} role="presentation">
		<div class="modal-content" role="dialog" aria-labelledby="modal-title">
			<!-- Header -->
			<header class="modal-header">
				<h2 id="modal-title" class="modal-title">Save Cut List</h2>
				{#if !saving}
					<button
						type="button"
						class="modal-close"
						onclick={onClose}
						aria-label="Close modal"
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</header>

			<!-- Body -->
			<div class="modal-body">
				{#if projects.length === 0}
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
				{:else}
					<div class="form-section">
						<!-- Cut List Name Input -->
						<div class="form-group">
							<label for="cutlist-name" class="form-label">Cut List Name</label>
							<input
								id="cutlist-name"
								type="text"
								class="form-input"
								placeholder="e.g., Table legs cut plan"
								bind:value={cutListName}
								disabled={saving}
								autocomplete="off"
							/>
						</div>

						<!-- Project Selection -->
						<div class="form-group">
							<label class="form-label">Select Project</label>
							<div class="projects-list">
								{#each projects as project (project.id)}
									<button
										type="button"
										class="project-card"
										class:selected={selectedProjectId === project.id}
										onclick={() => selectProject(project.id)}
										disabled={saving}
									>
										<div class="project-radio">
											{#if selectedProjectId === project.id}
												<div class="radio-dot"></div>
											{/if}
										</div>
										<span class="project-name">{project.name}</span>
									</button>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer Actions -->
			<footer class="modal-footer">
				<button type="button" class="btn-ghost" onclick={onClose} disabled={saving}>
					Cancel
				</button>
				<button
					type="button"
					class="btn-primary"
					onclick={handleSave}
					disabled={!canSave || projects.length === 0}
				>
					{#if saving}
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
						Saving...
					{:else}
						Save
					{/if}
				</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	/* Modal Overlay */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-lg);
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Modal Content */
	.modal-content {
		background: var(--color-white);
		border-radius: var(--radius-lg);
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		max-width: 500px;
		width: 100%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Header */
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-lg);
		border-bottom: 1px solid rgba(17, 17, 17, 0.08);
	}

	.modal-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--color-ink);
		margin: 0;
	}

	.modal-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		background: none;
		color: var(--color-ink-muted);
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.modal-close:hover {
		background: var(--color-paper-dark);
		color: var(--color-ink);
	}

	.modal-close svg {
		width: 20px;
		height: 20px;
	}

	/* Body */
	.modal-body {
		padding: var(--space-lg);
		overflow-y: auto;
		flex: 1;
	}

	/* Form Section */
	.form-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.form-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-ink);
	}

	.form-input {
		padding: var(--space-sm) var(--space-md);
		border: 1px solid rgba(17, 17, 17, 0.15);
		border-radius: var(--radius-md);
		font-size: 0.9375rem;
		color: var(--color-ink);
		background: var(--color-white);
		transition: border-color var(--transition-fast);
	}

	.form-input:focus {
		outline: none;
		border-color: var(--color-walnut);
		box-shadow: 0 0 0 3px var(--color-walnut-soft);
	}

	.form-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: var(--color-paper);
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
		padding: var(--space-2xl) var(--space-lg);
		text-align: center;
	}

	.empty-icon {
		width: 48px;
		height: 48px;
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

	/* Projects List */
	.projects-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-height: 240px;
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
	}

	.project-card:hover:not(:disabled) {
		border-color: var(--color-walnut);
		background: var(--color-walnut-soft);
	}

	.project-card.selected {
		border-color: var(--color-walnut);
		background: var(--color-walnut-soft);
		box-shadow: 0 0 0 1px var(--color-walnut);
	}

	.project-card:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.project-radio {
		flex-shrink: 0;
		width: 20px;
		height: 20px;
		border: 2px solid var(--color-ink-muted);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: border-color var(--transition-fast);
	}

	.project-card.selected .project-radio {
		border-color: var(--color-walnut);
	}

	.radio-dot {
		width: 10px;
		height: 10px;
		background: var(--color-walnut);
		border-radius: 50%;
		animation: dotScale 0.2s ease-out;
	}

	@keyframes dotScale {
		from {
			transform: scale(0);
		}
		to {
			transform: scale(1);
		}
	}

	.project-name {
		font-size: 0.9375rem;
		color: var(--color-ink);
	}

	/* Footer */
	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-sm);
		padding: var(--space-lg);
		border-top: 1px solid rgba(17, 17, 17, 0.08);
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
