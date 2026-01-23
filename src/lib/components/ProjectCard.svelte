<script lang="ts">
	// ProjectCard component
	// Displays active project builds with wood-grain progress bars
	// Modern Artisan aesthetic with illustrative warmth

	interface Props {
		name: string;
		type: string;
		progress: number; // 0-100
		lastUpdated?: string;
		thumbnailIcon?: string;
		href?: string;
	}

	let { name, type, progress, lastUpdated, thumbnailIcon = 'project', href }: Props = $props();

	// Format relative time
	function formatRelativeTime(dateStr?: string): string {
		if (!dateStr) return 'Just started';
		try {
			const date = new Date(dateStr);
			const now = new Date();
			const diffMs = now.getTime() - date.getTime();
			const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

			if (diffDays === 0) return 'Today';
			if (diffDays === 1) return 'Yesterday';
			if (diffDays < 7) return `${diffDays} days ago`;
			if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
			return `${Math.floor(diffDays / 30)} months ago`;
		} catch {
			return 'Recently';
		}
	}

	// Project type icons (schematic style)
	const typeIcons: Record<string, string> = {
		table: 'M4 4h16v2H4zM6 8v10h2V8H6zm10 0v10h2V8h-2z',
		cabinet: 'M5 3h14v18H5V3zm2 2v14h10V5H7zm2 2h6v2H9V7zm0 4h6v2H9v-2z',
		bookshelf: 'M4 3h16v18H4V3zm2 2v14h12V5H6zm1 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h10v2H7v-2z',
		box: 'M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18L18.09 7 12 9.82 5.91 7 12 4.18zM5 8.82l6 3.33v7.03l-6-3.33V8.82zm14 0v7.03l-6 3.33v-7.03l6-3.33z',
		project: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-7l-4 4h3v2h2v-2h3l-4-4z'
	};

	const iconPath = $derived(typeIcons[thumbnailIcon] || typeIcons.project);
</script>

{#if href}
	<a {href} class="project-card artisan-card sanded-surface">
		<div class="project-card-inner">
			<!-- Thumbnail / Icon -->
			<div class="project-thumbnail joinery-schematic">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
					<path d={iconPath} />
				</svg>
			</div>

			<!-- Content -->
			<div class="project-content">
				<div class="project-header">
					<h3 class="project-name">{name}</h3>
					<span class="project-type">{type}</span>
				</div>

				<!-- Wood Grain Progress Bar -->
				<div class="project-progress">
					<div class="wood-grain-progress">
						<div class="wood-grain-progress-fill" style="width: {progress}%"></div>
					</div>
					<div class="progress-meta">
						<span class="progress-percent">{progress}% complete</span>
						<span class="progress-updated">{formatRelativeTime(lastUpdated)}</span>
					</div>
				</div>
			</div>
		</div>
	</a>
{:else}
	<div class="project-card artisan-card">
		<div class="project-card-inner">
			<div class="project-thumbnail joinery-schematic">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
					<path d={iconPath} />
				</svg>
			</div>
			<div class="project-content">
				<div class="project-header">
					<h3 class="project-name">{name}</h3>
					<span class="project-type">{type}</span>
				</div>
				<div class="project-progress">
					<div class="wood-grain-progress">
						<div class="wood-grain-progress-fill" style="width: {progress}%"></div>
					</div>
					<div class="progress-meta">
						<span class="progress-percent">{progress}% complete</span>
						<span class="progress-updated">{formatRelativeTime(lastUpdated)}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.project-card {
		display: block;
		text-decoration: none;
		color: inherit;
		padding: var(--space-lg);
		cursor: pointer;
	}

	.project-card-inner {
		display: flex;
		gap: var(--space-lg);
	}

	/* Thumbnail */
	.project-thumbnail {
		width: 64px;
		height: 64px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-sm);
	}

	.project-thumbnail svg {
		width: 32px;
		height: 32px;
		color: var(--color-walnut);
		opacity: 0.8;
	}

	/* Content */
	.project-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.project-header {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.project-name {
		font-family: var(--font-display);
		font-size: 1.125rem;
		color: var(--color-ink);
		margin: 0;
		line-height: 1.3;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.project-type {
		font-size: 0.75rem;
		color: var(--color-ink-muted);
		text-transform: capitalize;
	}

	/* Progress Section */
	.project-progress {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-top: auto;
	}

	.progress-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.progress-percent {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-walnut);
	}

	.progress-updated {
		font-size: 0.6875rem;
		color: var(--color-ink-muted);
	}
</style>
