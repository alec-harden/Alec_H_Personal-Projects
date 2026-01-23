<script lang="ts">
	// ToolCard component for dashboard navigation
	// Modern Artisan aesthetic with illustrative warmth
	// Features hand-drawn style icon placeholders

	interface Props {
		title: string;
		description: string;
		href: string;
		icon?: string;
		disabled?: boolean;
	}

	let { title, description, href, icon = 'tool', disabled = false }: Props = $props();

	// Schematic-style icon paths
	const iconPaths: Record<string, string> = {
		clipboard: `
			M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
			M9 5a2 2 0 002 2h2a2 2 0 002-2
			M9 5a2 2 0 012-2h2a2 2 0 012 2
			M12 12h3
			M12 16h3
			M9 12h.01
			M9 16h.01
		`,
		scissors: `
			M14.121 14.121L19 19
			M7 7l7 7
			M19 5l-7 7
			M9.879 9.879a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243z
			M14.121 14.121a3 3 0 10 4.243 4.243 3 3 0 00-4.243-4.243z
		`,
		ruler: `
			M6 3v18
			M6 3h12l3 3v12l-3 3H6
			M10 7h2
			M10 11h4
			M10 15h2
		`,
		tool: `
			M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z
		`
	};

	const iconPath = $derived(iconPaths[icon] || iconPaths.tool);
</script>

{#if disabled}
	<div class="tool-card tool-card-disabled" aria-disabled="true">
		<div class="tool-card-content">
			<!-- Icon Container -->
			<div class="tool-icon-container">
				<div class="tool-icon illustration-placeholder">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
						<path d={iconPath} />
					</svg>
				</div>
			</div>

			<!-- Text Content -->
			<div class="tool-text">
				<h3 class="tool-title">{title}</h3>
				<p class="tool-description">{description}</p>
			</div>

			<!-- Coming Soon Badge -->
			<div class="tool-badge">
				<span class="badge badge-neutral">Coming Soon</span>
			</div>
		</div>
	</div>
{:else}
	<a {href} class="tool-card artisan-card sanded-surface">
		<div class="tool-card-content">
			<!-- Icon Container -->
			<div class="tool-icon-container">
				<div class="tool-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
						<path d={iconPath} />
					</svg>
				</div>
			</div>

			<!-- Text Content -->
			<div class="tool-text">
				<h3 class="tool-title">{title}</h3>
				<p class="tool-description">{description}</p>
			</div>

			<!-- Arrow Indicator -->
			<div class="tool-arrow">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M9 5l7 7-7 7" />
				</svg>
			</div>
		</div>
	</a>
{/if}

<style>
	.tool-card {
		display: block;
		text-decoration: none;
		color: inherit;
		padding: var(--space-lg);
		background: var(--color-white);
		border: 1px solid rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-lg);
		transition: all var(--transition-base);
	}

	.tool-card:not(.tool-card-disabled):hover {
		box-shadow: var(--shadow-medium);
		transform: translateY(-3px);
		border-color: rgba(93, 64, 55, 0.2);
	}

	.tool-card-disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.tool-card-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		height: 100%;
	}

	/* Icon */
	.tool-icon-container {
		margin-bottom: var(--space-xs);
	}

	.tool-icon {
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(
			135deg,
			var(--color-paper-warm) 0%,
			var(--color-paper-dark) 100%
		);
		border-radius: var(--radius-md);
		color: var(--color-walnut);
	}

	.tool-icon svg {
		width: 28px;
		height: 28px;
	}

	.tool-card-disabled .tool-icon {
		opacity: 0.6;
	}

	/* Text */
	.tool-text {
		flex: 1;
	}

	.tool-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--color-ink);
		margin: 0 0 var(--space-xs) 0;
		line-height: 1.3;
	}

	.tool-description {
		font-size: 0.875rem;
		color: var(--color-ink-muted);
		margin: 0;
		line-height: 1.5;
	}

	/* Badge */
	.tool-badge {
		margin-top: auto;
		padding-top: var(--space-sm);
	}

	/* Arrow */
	.tool-arrow {
		position: absolute;
		bottom: var(--space-lg);
		right: var(--space-lg);
		width: 24px;
		height: 24px;
		color: var(--color-walnut-light);
		opacity: 0;
		transform: translateX(-4px);
		transition: all var(--transition-fast);
	}

	.tool-card {
		position: relative;
	}

	.tool-card:not(.tool-card-disabled):hover .tool-arrow {
		opacity: 1;
		transform: translateX(0);
	}
</style>
