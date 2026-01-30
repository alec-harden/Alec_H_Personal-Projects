<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Format date for display
	function formatDate(date: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(date);
	}

	// Get mode display label
	function getModeLabel(mode: string): string {
		return mode === 'linear' ? 'Linear (1D)' : 'Sheet (2D)';
	}
</script>

<svelte:head>
	<title>Cut Lists | WoodShop Toolbox</title>
</svelte:head>

<div class="page-container animate-fade-in">
	<!-- Header -->
	<header class="page-header">
		<div class="header-content">
			<div>
				<h1 class="page-title">Cut Lists</h1>
				<p class="page-description">
					View and manage your saved cut lists for optimized cutting patterns.
				</p>
			</div>
			<a href="/cutlist" class="btn-primary">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				New Cut List
			</a>
		</div>
	</header>

	<!-- Cut Lists Grid -->
	{#if data.cutLists.length === 0}
		<div class="empty-state sanded-surface">
			<div class="empty-icon">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
			</div>
			<h2 class="empty-title">No Cut Lists Yet</h2>
			<p class="empty-text">
				Create your first cut list to optimize your cutting patterns and minimize waste.
			</p>
			<a href="/cutlist" class="btn-primary">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				Create Cut List
			</a>
		</div>
	{:else}
		<div class="cutlists-grid">
			{#each data.cutLists as cutList (cutList.id)}
				<a href="/cutlist/{cutList.id}" class="cutlist-card sanded-surface">
					<div class="card-header">
						<h3 class="card-title">{cutList.name}</h3>
						<div class="card-badge">{getModeLabel(cutList.mode)}</div>
					</div>

					<div class="card-meta">
						{#if cutList.project}
							<div class="meta-item">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="meta-icon">
									<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
								</svg>
								<span class="meta-label">{cutList.project.name}</span>
							</div>
						{/if}

						<div class="meta-item">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="meta-icon">
								<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<span class="meta-label">{formatDate(cutList.updatedAt)}</span>
						</div>

						<div class="meta-item">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="meta-icon">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
							</svg>
							<span class="meta-label">Kerf: {cutList.kerf}"</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-xl);
	}

	/* Header */
	.page-header {
		margin-bottom: var(--space-xl);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-lg);
	}

	.page-title {
		font-family: var(--font-display);
		font-size: 2rem;
		color: var(--color-ink);
		margin: 0 0 var(--space-xs) 0;
	}

	.page-description {
		font-size: 0.9375rem;
		color: var(--color-ink-muted);
		line-height: 1.6;
		margin: 0;
		max-width: 600px;
	}

	.btn-icon {
		width: 20px;
		height: 20px;
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-lg);
		padding: var(--space-3xl);
		border-radius: var(--radius-lg);
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

	.empty-title {
		font-family: var(--font-display);
		font-size: 1.5rem;
		color: var(--color-ink);
		margin: 0;
	}

	.empty-text {
		font-size: 0.9375rem;
		color: var(--color-ink-muted);
		line-height: 1.6;
		margin: 0;
		max-width: 400px;
	}

	/* Cut Lists Grid */
	.cutlists-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: var(--space-lg);
	}

	.cutlist-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition: all var(--transition-fast);
		border: 1px solid transparent;
	}

	.cutlist-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		border-color: var(--color-walnut);
	}

	/* Card Header */
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-md);
		padding-bottom: var(--space-md);
		border-bottom: 1px solid rgba(17, 17, 17, 0.08);
	}

	.card-title {
		font-family: var(--font-display);
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-ink);
		margin: 0;
		flex: 1;
		line-height: 1.4;
	}

	.card-badge {
		display: inline-flex;
		align-items: center;
		padding: var(--space-xs) var(--space-sm);
		background: var(--color-walnut-soft);
		color: var(--color-walnut);
		border-radius: var(--radius-md);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		white-space: nowrap;
	}

	/* Card Meta */
	.card-meta {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--color-ink-muted);
		font-size: 0.875rem;
	}

	.meta-icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	.meta-label {
		font-size: 0.875rem;
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.page-container {
			padding: var(--space-md);
		}

		.header-content {
			flex-direction: column;
			align-items: stretch;
		}

		.page-title {
			font-size: 1.5rem;
		}

		.cutlists-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
