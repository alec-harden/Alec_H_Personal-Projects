<script lang="ts">
	import ShopChecklist from '$lib/components/cutlist/ShopChecklist.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Format date for display
	function formatDate(date: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}

	// Get mode display label
	function getModeLabel(mode: string): string {
		return mode === 'linear' ? 'Linear (1D)' : 'Sheet (2D)';
	}
</script>

<div class="page-container">
	<!-- Header -->
	<header class="page-header">
		<div class="header-nav">
			<a href="/cutlist" class="back-link">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					class="back-icon"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Cut Lists
			</a>
		</div>
		<h1 class="page-title">{data.cutList.name}</h1>
		<div class="metadata">
			<span class="metadata-item">
				<span class="metadata-label">Mode:</span>
				<span class="metadata-value">{getModeLabel(data.cutList.mode)}</span>
			</span>
			<span class="metadata-item">
				<span class="metadata-label">Kerf:</span>
				<span class="metadata-value">{data.cutList.kerf}"</span>
			</span>
			<span class="metadata-item">
				<span class="metadata-label">Created:</span>
				<span class="metadata-value">{formatDate(data.cutList.createdAt)}</span>
			</span>
		</div>
	</header>

	<!-- Main Content -->
	<main class="page-content">
		<div class="content-card sanded-surface">
			<ShopChecklist
				cuts={data.cutList.cuts}
				cutListId={data.cutList.id}
				mode={data.cutList.mode}
			/>
		</div>
	</main>
</div>

<style>
	.page-container {
		max-width: 900px;
		margin: 0 auto;
		padding: var(--space-xl);
	}

	/* Header */
	.page-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		margin-bottom: var(--space-2xl);
	}

	.header-nav {
		display: flex;
		align-items: center;
	}

	.back-link {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--color-ink-muted);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		transition: color 0.2s ease;
	}

	.back-link:hover {
		color: var(--color-walnut);
	}

	.back-icon {
		width: 20px;
		height: 20px;
	}

	.page-title {
		font-family: var(--font-display);
		font-size: 2rem;
		color: var(--color-ink);
		margin: 0;
	}

	.metadata {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-lg);
		color: var(--color-ink-muted);
		font-size: 0.875rem;
	}

	.metadata-item {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.metadata-label {
		font-weight: 600;
	}

	.metadata-value {
		font-family: var(--font-mono, monospace);
	}

	/* Main Content */
	.page-content {
		width: 100%;
	}

	.content-card {
		padding: var(--space-xl);
		border-radius: var(--radius-lg);
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.page-container {
			padding: var(--space-md);
		}

		.page-title {
			font-size: 1.5rem;
		}

		.metadata {
			flex-direction: column;
			gap: var(--space-xs);
		}

		.content-card {
			padding: var(--space-lg);
		}
	}
</style>
