<script lang="ts">
	/**
	 * ManualPlacement Component
	 *
	 * Drag-drop stock assignment and position editing for cut lists
	 */

	interface Cut {
		id: string;
		length: number;
		width: number | null;
		label: string | null;
		assignedStockId: string | null;
		overridePosition: number | null;
	}

	interface Stock {
		id: string;
		length: number;
		width: number | null;
		label: string | null;
	}

	interface Props {
		cuts: Cut[];
		stock: Stock[];
		cutListId: string;
		mode: 'linear' | 'sheet';
	}

	let { cuts, stock, cutListId, mode }: Props = $props();

	// Local state for cuts (synced with props)
	let localCuts = $state<Cut[]>([...cuts]);

	// Position editing state
	let editingCutId = $state<string | null>(null);
	let positionInput = $state('');
	let positionInputRef: HTMLInputElement | null = $state(null);

	// Drag state
	let dragOverCutId = $state<string | null>(null);

	// Sync localCuts when cuts prop changes
	$effect(() => {
		localCuts = [...cuts];
	});

	// Detect conflicts between cuts assigned to the same stock
	function detectConflicts(cuts: Cut[], stock: Stock[]): Map<string, string[]> {
		const conflicts = new Map<string, string[]>();

		// Group cuts by assignedStockId
		const cutsByStock = new Map<string, Cut[]>();
		cuts.forEach((cut) => {
			if (cut.assignedStockId && cut.overridePosition !== null) {
				if (!cutsByStock.has(cut.assignedStockId)) {
					cutsByStock.set(cut.assignedStockId, []);
				}
				cutsByStock.get(cut.assignedStockId)!.push(cut);
			}
		});

		// Check for overlaps within each stock
		cutsByStock.forEach((stockCuts, stockId) => {
			// Sort by position
			const sorted = [...stockCuts].sort((a, b) => a.overridePosition! - b.overridePosition!);

			for (let i = 0; i < sorted.length; i++) {
				const cut1 = sorted[i];
				const cut1End = cut1.overridePosition! + cut1.length;

				for (let j = i + 1; j < sorted.length; j++) {
					const cut2 = sorted[j];
					// Check if cut1 overlaps with cut2
					if (cut1End > cut2.overridePosition!) {
						// Conflict detected
						if (!conflicts.has(cut1.id)) {
							conflicts.set(cut1.id, []);
						}
						if (!conflicts.has(cut2.id)) {
							conflicts.set(cut2.id, []);
						}
						conflicts.get(cut1.id)!.push(cut2.id);
						conflicts.get(cut2.id)!.push(cut1.id);
					}
				}
			}
		});

		return conflicts;
	}

	// Calculate conflicts
	const conflicts = $derived(detectConflicts(localCuts, stock));

	// Get stock by id
	function getStock(stockId: string | null): Stock | null {
		if (!stockId) return null;
		return stock.find((s) => s.id === stockId) || null;
	}

	// Drag-drop handlers
	function handleDragStart(e: DragEvent, stockId: string) {
		if (!e.dataTransfer) return;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', stockId);
	}

	function handleDragOver(e: DragEvent, cutId: string) {
		e.preventDefault();
		if (!e.dataTransfer) return;
		e.dataTransfer.dropEffect = 'move';
		dragOverCutId = cutId;
	}

	function handleDragLeave(e: DragEvent, cutId: string) {
		if (dragOverCutId === cutId) {
			dragOverCutId = null;
		}
	}

	async function handleDrop(e: DragEvent, cutId: string) {
		e.preventDefault();
		dragOverCutId = null;

		if (!e.dataTransfer) return;
		const stockId = e.dataTransfer.getData('text/plain');
		if (!stockId) return;

		// Update local state optimistically
		const cutIndex = localCuts.findIndex((c) => c.id === cutId);
		if (cutIndex === -1) return;

		const oldAssignment = localCuts[cutIndex].assignedStockId;
		localCuts[cutIndex] = { ...localCuts[cutIndex], assignedStockId: stockId };

		// Persist to API
		try {
			const response = await fetch(`/api/cutlist/${cutListId}/cuts/${cutId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ assignedStockId: stockId })
			});

			if (!response.ok) {
				// Revert on error
				localCuts[cutIndex] = { ...localCuts[cutIndex], assignedStockId: oldAssignment };
				console.error('Failed to assign stock');
			}
		} catch (error) {
			// Revert on error
			localCuts[cutIndex] = { ...localCuts[cutIndex], assignedStockId: oldAssignment };
			console.error('Failed to assign stock:', error);
		}
	}

	// Position editing
	function startPositionEdit(cutId: string, currentPosition: number | null) {
		editingCutId = cutId;
		positionInput = currentPosition !== null ? currentPosition.toString() : '0';
		requestAnimationFrame(() => {
			positionInputRef?.focus();
			positionInputRef?.select();
		});
	}

	async function commitPositionEdit(cutId: string) {
		const parsed = parseFloat(positionInput);
		const cut = localCuts.find((c) => c.id === cutId);
		if (!cut) {
			editingCutId = null;
			return;
		}

		// Validation
		if (isNaN(parsed) || parsed < 0) {
			// Invalid: revert
			editingCutId = null;
			return;
		}

		// Check if position + cut length exceeds stock length
		const assignedStock = getStock(cut.assignedStockId);
		if (assignedStock && parsed + cut.length > assignedStock.length) {
			// Position exceeds stock - show as conflict but allow (UI will display warning)
			alert(`Position ${parsed}" + cut length ${cut.length}" exceeds stock length ${assignedStock.length}"`);
		}

		// Update local state optimistically
		const cutIndex = localCuts.findIndex((c) => c.id === cutId);
		const oldPosition = localCuts[cutIndex].overridePosition;
		localCuts[cutIndex] = { ...localCuts[cutIndex], overridePosition: parsed };

		editingCutId = null;

		// Persist to API
		try {
			const response = await fetch(`/api/cutlist/${cutListId}/cuts/${cutId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ overridePosition: parsed })
			});

			if (!response.ok) {
				// Revert on error
				localCuts[cutIndex] = { ...localCuts[cutIndex], overridePosition: oldPosition };
				console.error('Failed to update position');
			}
		} catch (error) {
			// Revert on error
			localCuts[cutIndex] = { ...localCuts[cutIndex], overridePosition: oldPosition };
			console.error('Failed to update position:', error);
		}
	}

	function cancelPositionEdit() {
		editingCutId = null;
	}

	function handlePositionKeydown(e: KeyboardEvent, cutId: string) {
		if (e.key === 'Enter') {
			e.preventDefault();
			commitPositionEdit(cutId);
		} else if (e.key === 'Escape') {
			e.preventDefault();
			cancelPositionEdit();
		}
	}

	// Reset assignment for a cut
	async function resetCut(cutId: string) {
		const cutIndex = localCuts.findIndex((c) => c.id === cutId);
		if (cutIndex === -1) return;

		const oldAssignment = localCuts[cutIndex].assignedStockId;
		const oldPosition = localCuts[cutIndex].overridePosition;

		// Update local state optimistically
		localCuts[cutIndex] = {
			...localCuts[cutIndex],
			assignedStockId: null,
			overridePosition: null
		};

		// Persist to API
		try {
			const response = await fetch(`/api/cutlist/${cutListId}/cuts/${cutId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ assignedStockId: null, overridePosition: null })
			});

			if (!response.ok) {
				// Revert on error
				localCuts[cutIndex] = {
					...localCuts[cutIndex],
					assignedStockId: oldAssignment,
					overridePosition: oldPosition
				};
				console.error('Failed to reset cut');
			}
		} catch (error) {
			// Revert on error
			localCuts[cutIndex] = {
				...localCuts[cutIndex],
				assignedStockId: oldAssignment,
				overridePosition: oldPosition
			};
			console.error('Failed to reset cut:', error);
		}
	}

	// Format dimension for display
	function formatDimension(value: number): string {
		return `${value}"`;
	}

	// Get conflict tooltip
	function getConflictTooltip(cutId: string): string {
		const conflictingIds = conflicts.get(cutId);
		if (!conflictingIds || conflictingIds.length === 0) return '';

		const conflictingCuts = conflictingIds
			.map((id) => {
				const cut = localCuts.find((c) => c.id === id);
				return cut?.label || 'Unnamed cut';
			})
			.join(', ');

		return `Overlaps with: ${conflictingCuts}`;
	}
</script>

<div class="manual-placement">
	<div class="section-header">
		<h2 class="section-title">Manual Stock Assignment</h2>
		<p class="section-description">
			Drag stock items onto cuts to assign material, then edit positions as needed.
		</p>
	</div>

	<div class="layout">
		<!-- Stock List (Draggable) -->
		<div class="stock-panel">
			<h3 class="panel-title">Available Stock</h3>
			<div class="stock-list">
				{#each stock as stockItem (stockItem.id)}
					<div
						class="stock-card"
						draggable="true"
						ondragstart={(e) => handleDragStart(e, stockItem.id)}
					>
						<div class="stock-label">
							{stockItem.label || `Stock ${stockItem.length}"`}
						</div>
						<div class="stock-dimensions">
							{stockItem.length}"
							{#if mode === 'sheet' && stockItem.width !== null}
								x {stockItem.width}"
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Cuts List (Drop Zones) -->
		<div class="cuts-panel">
			<h3 class="panel-title">Cuts</h3>
			<div class="cuts-list">
				{#each localCuts as cut (cut.id)}
					{@const assignedStock = getStock(cut.assignedStockId)}
					{@const hasConflict = conflicts.has(cut.id)}
					<div
						class="cut-card"
						class:cut-assigned={cut.assignedStockId !== null}
						class:cut-conflict={hasConflict}
						class:cut-dragover={dragOverCutId === cut.id}
						ondragover={(e) => handleDragOver(e, cut.id)}
						ondragleave={(e) => handleDragLeave(e, cut.id)}
						ondrop={(e) => handleDrop(e, cut.id)}
						title={hasConflict ? getConflictTooltip(cut.id) : ''}
					>
						<div class="cut-header">
							<div class="cut-label">
								{cut.label || 'Unnamed Cut'}
							</div>
							<div class="cut-dimensions">
								{cut.length}"
								{#if mode === 'sheet' && cut.width !== null}
									x {cut.width}"
								{/if}
							</div>
						</div>

						<div class="cut-details">
							{#if cut.assignedStockId && assignedStock}
								<div class="assigned-stock-info">
									<span class="detail-label">Stock:</span>
									<span class="detail-value">
										{assignedStock.label || `Stock ${assignedStock.length}"`}
									</span>
								</div>

								<div class="position-info">
									<span class="detail-label">Position:</span>
									{#if editingCutId === cut.id}
										<input
											bind:this={positionInputRef}
											type="number"
											min="0"
											step="0.125"
											bind:value={positionInput}
											onblur={() => commitPositionEdit(cut.id)}
											onkeydown={(e) => handlePositionKeydown(e, cut.id)}
											class="position-input"
										/>
									{:else}
										<button
											type="button"
											onclick={() => startPositionEdit(cut.id, cut.overridePosition)}
											class="position-value"
										>
											{cut.overridePosition !== null ? `${cut.overridePosition}"` : 'Auto'}
										</button>
									{/if}
								</div>

								<button
									type="button"
									onclick={() => resetCut(cut.id)}
									class="reset-btn"
									title="Reset to algorithm"
								>
									Reset
								</button>
							{:else}
								<div class="unassigned-hint">Drop stock here to assign</div>
							{/if}
						</div>

						{#if hasConflict}
							<div class="conflict-warning">
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									class="warning-icon"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
									/>
								</svg>
								<span>Overlap detected</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.manual-placement {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	.section-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.section-title {
		font-family: var(--font-display);
		font-size: 1.5rem;
		color: var(--color-ink);
		margin: 0;
	}

	.section-description {
		font-size: 0.875rem;
		color: var(--color-ink-muted);
		margin: 0;
	}

	.layout {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: var(--space-xl);
	}

	.stock-panel,
	.cuts-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.panel-title {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-ink);
		margin: 0;
	}

	/* Stock List */
	.stock-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.stock-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: var(--space-md);
		background: var(--color-white);
		border: 2px solid var(--color-walnut-light);
		border-radius: var(--radius-md);
		cursor: grab;
		transition: all 0.2s ease;
	}

	.stock-card:hover {
		border-color: var(--color-walnut);
		box-shadow: 0 2px 8px rgba(93, 64, 55, 0.1);
	}

	.stock-card:active {
		cursor: grabbing;
	}

	.stock-label {
		font-weight: 600;
		color: var(--color-ink);
	}

	.stock-dimensions {
		font-size: 0.875rem;
		color: var(--color-ink-muted);
		font-family: var(--font-mono, monospace);
	}

	/* Cuts List */
	.cuts-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.cut-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: var(--color-white);
		border: 2px dashed var(--color-border-light);
		border-radius: var(--radius-md);
		transition: all 0.2s ease;
	}

	.cut-card.cut-dragover {
		border-color: var(--color-walnut);
		background: rgba(251, 191, 36, 0.05);
	}

	.cut-card.cut-assigned {
		border-style: solid;
		border-color: var(--color-walnut-light);
		background: rgba(251, 191, 36, 0.02);
	}

	.cut-card.cut-conflict {
		border-color: #dc2626;
		background: rgba(220, 38, 38, 0.02);
	}

	.cut-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.cut-label {
		font-weight: 600;
		color: var(--color-ink);
	}

	.cut-dimensions {
		font-size: 0.875rem;
		color: var(--color-ink-muted);
		font-family: var(--font-mono, monospace);
	}

	.cut-details {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-md);
	}

	.assigned-stock-info,
	.position-info {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.detail-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--color-ink-muted);
	}

	.detail-value {
		font-size: 0.875rem;
		color: var(--color-ink);
	}

	.position-value {
		padding: 4px 8px;
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		font-family: var(--font-mono, monospace);
		color: var(--color-ink);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.position-value:hover {
		border-color: var(--color-walnut);
		background: rgba(93, 64, 55, 0.05);
	}

	.position-input {
		width: 80px;
		padding: 4px 8px;
		border: 1px solid var(--color-walnut);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		font-family: var(--font-mono, monospace);
		background: var(--color-white);
		color: var(--color-ink);
		outline: none;
		box-shadow: 0 0 0 3px rgba(93, 64, 55, 0.1);
	}

	.reset-btn {
		padding: 4px 12px;
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-ink-muted);
		cursor: pointer;
		transition: all 0.2s ease;
		margin-left: auto;
	}

	.reset-btn:hover {
		border-color: var(--color-walnut);
		color: var(--color-walnut);
	}

	.unassigned-hint {
		font-size: 0.875rem;
		font-style: italic;
		color: var(--color-ink-muted);
	}

	.conflict-warning {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-sm);
		background: rgba(220, 38, 38, 0.05);
		border-left: 3px solid #dc2626;
		border-radius: var(--radius-sm);
		color: #dc2626;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.warning-icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.layout {
			grid-template-columns: 1fr;
		}

		.stock-panel {
			order: 2;
		}

		.cuts-panel {
			order: 1;
		}
	}
</style>
