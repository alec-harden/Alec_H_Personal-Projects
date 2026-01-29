<script lang="ts">
	// CSV Upload Component
	// Drag-and-drop file upload with validation feedback

	import type { BOMItem } from '$lib/types/bom';
	import { parseCSVFile, validateFile, type CSVValidationError } from '$lib/utils/csv-import';

	interface Props {
		onImport: (items: BOMItem[]) => void;
		onCancel: () => void;
	}

	let { onImport, onCancel }: Props = $props();

	// Component state
	let dragging = $state(false);
	let errors = $state<CSVValidationError[]>([]);
	let fileError = $state<string | null>(null);
	let parsing = $state(false);
	let fileInputRef = $state<HTMLInputElement>();

	// Reset state for new upload attempt
	function resetState() {
		errors = [];
		fileError = null;
		parsing = false;
		dragging = false;
	}

	// Handle file selection (from button or drag-and-drop)
	async function handleFile(file: File) {
		resetState();

		// Validate file first
		const validationError = validateFile(file);
		if (validationError) {
			fileError = validationError;
			return;
		}

		// Parse CSV
		parsing = true;
		try {
			const result = await parseCSVFile(file);

			if (result.errors.length > 0) {
				errors = result.errors;
				parsing = false;
				return;
			}

			if (result.items.length === 0) {
				fileError = 'No valid items found in CSV';
				parsing = false;
				return;
			}

			// Success - call onImport
			onImport(result.items);
		} catch (err) {
			fileError = err instanceof Error ? err.message : 'Failed to parse CSV file';
			parsing = false;
		}
	}

	// Drag and drop handlers
	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		dragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	}

	// Button click handler
	function handleButtonClick() {
		fileInputRef?.click();
	}

	// File input change handler
	function handleFileInput(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			handleFile(target.files[0]);
		}
	}
</script>

<div class="csv-upload">
	{#if parsing}
		<div class="upload-zone loading">
			<div class="spinner"></div>
			<p class="loading-text">Parsing CSV...</p>
		</div>
	{:else if errors.length > 0 || fileError}
		<div class="error-display">
			<div class="error-header">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
				<h3 class="error-title">
					{fileError ? 'File Error' : `${errors.length} validation error${errors.length === 1 ? '' : 's'} found`}
				</h3>
			</div>

			{#if fileError}
				<div class="error-message">
					{fileError}
				</div>
			{:else}
				<div class="error-list">
					{#each errors as error}
						<div class="error-item">
							<span class="error-row">Row {error.row}:</span>
							<span class="error-field">{error.field}</span>
							<span class="error-separator">-</span>
							<span class="error-text">{error.message}</span>
						</div>
					{/each}
				</div>
			{/if}

			<button type="button" onclick={resetState} class="btn-primary">
				Try Again
			</button>
		</div>
	{:else}
		<div
			class="upload-zone"
			class:dragging
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			role="button"
			tabindex="0"
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="upload-icon">
				<path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
			</svg>

			<h3 class="upload-title">Drag and drop your CSV file here</h3>

			<div class="upload-divider">
				<span class="divider-line"></span>
				<span class="divider-text">or</span>
				<span class="divider-line"></span>
			</div>

			<button type="button" onclick={handleButtonClick} class="btn-primary">
				Browse Files
			</button>

			<input
				bind:this={fileInputRef}
				type="file"
				accept=".csv,text/csv"
				onchange={handleFileInput}
				class="file-input-hidden"
			/>

			<p class="upload-help">
				Expected format: Category, Name, Quantity, Unit, Description, Notes
			</p>
		</div>
	{/if}

	<div class="upload-actions">
		<button type="button" onclick={onCancel} class="btn-secondary">
			Cancel
		</button>
	</div>
</div>

<style>
	.csv-upload {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		padding: var(--space-xl);
		max-width: 600px;
		margin: 0 auto;
	}

	.upload-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-lg);
		padding: var(--space-3xl) var(--space-xl);
		background: var(--color-white);
		border: 2px dashed var(--color-ink-muted);
		border-radius: var(--radius-lg);
		transition: all var(--transition-base);
		cursor: pointer;
	}

	.upload-zone:hover {
		border-color: var(--color-walnut);
		background: var(--color-paper-warm);
	}

	.upload-zone.dragging {
		border-color: var(--color-walnut);
		background: var(--color-warning-soft);
		border-style: solid;
		box-shadow: var(--shadow-medium);
	}

	.upload-zone.loading {
		cursor: default;
		border-style: solid;
		border-color: var(--color-ink-muted);
	}

	.upload-zone.loading:hover {
		background: var(--color-white);
	}

	.upload-icon {
		width: 48px;
		height: 48px;
		color: var(--color-walnut);
	}

	.upload-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--color-ink);
		margin: 0;
	}

	.upload-divider {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		width: 100%;
	}

	.divider-line {
		flex: 1;
		height: 1px;
		background: var(--color-ink-muted);
		opacity: 0.3;
	}

	.divider-text {
		font-size: 0.875rem;
		color: var(--color-ink-muted);
		font-weight: 500;
	}

	.upload-help {
		font-size: 0.8125rem;
		color: var(--color-ink-muted);
		text-align: center;
		margin: 0;
	}

	.file-input-hidden {
		display: none;
	}

	/* Loading state */
	.loading-text {
		font-size: 1rem;
		color: var(--color-ink);
		margin: 0;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--color-paper-dark);
		border-top-color: var(--color-walnut);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Error display */
	.error-display {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		padding: var(--space-xl);
		background: var(--color-error-soft);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-lg);
	}

	.error-header {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.error-icon {
		width: 24px;
		height: 24px;
		color: var(--color-error);
		flex-shrink: 0;
	}

	.error-title {
		font-family: var(--font-display);
		font-size: 1.125rem;
		color: var(--color-error);
		margin: 0;
	}

	.error-message {
		padding: var(--space-md);
		background: var(--color-white);
		border-radius: var(--radius-sm);
		color: var(--color-ink);
		font-size: 0.9375rem;
	}

	.error-list {
		max-height: 200px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: var(--space-md);
		background: var(--color-white);
		border-radius: var(--radius-sm);
	}

	.error-item {
		display: flex;
		gap: var(--space-xs);
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--color-ink);
	}

	.error-row {
		font-weight: 600;
		color: var(--color-error);
		white-space: nowrap;
	}

	.error-field {
		font-weight: 500;
		color: var(--color-ink-soft);
		white-space: nowrap;
	}

	.error-separator {
		color: var(--color-ink-muted);
	}

	.error-text {
		color: var(--color-ink);
	}

	/* Actions */
	.upload-actions {
		display: flex;
		justify-content: flex-end;
		padding-top: var(--space-md);
		border-top: 1px solid rgba(17, 17, 17, 0.08);
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.csv-upload {
			padding: var(--space-md);
		}

		.upload-zone {
			padding: var(--space-xl) var(--space-md);
		}

		.upload-title {
			font-size: 1.125rem;
			text-align: center;
		}

		.error-item {
			flex-wrap: wrap;
		}
	}
</style>
