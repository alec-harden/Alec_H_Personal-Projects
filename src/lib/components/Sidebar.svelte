<script lang="ts">
	// Sidebar navigation component
	// Modern Artisan aesthetic with sanded surface hover effects

	import { page } from '$app/stores';

	interface NavItem {
		label: string;
		href: string;
		icon: string;
		description?: string;
	}

	const navigationItems: NavItem[] = [
		{
			label: 'Dashboard',
			href: '/',
			icon: 'home',
			description: 'Overview & recent projects'
		},
		{
			label: 'Projects',
			href: '/projects',
			icon: 'folder',
			description: 'View all projects'
		},
		{
			label: 'BOMs',
			href: '/projects',
			icon: 'clipboard',
			description: 'View all bills of materials'
		},
		{
			label: 'Cut Lists',
			href: '/cutlist',
			icon: 'scissors',
			description: 'View all cut lists'
		}
	];

	const toolItems: NavItem[] = [
		{
			label: 'Create BOM',
			href: '/bom/new',
			icon: 'clipboard-plus',
			description: 'New bill of materials'
		},
		{
			label: 'Create Cut List',
			href: '/cutlist',
			icon: 'scissors-plus',
			description: 'New cut optimizer'
		}
	];

	function isActive(href: string, currentPath: string): boolean {
		if (href === '/') return currentPath === '/';
		return currentPath.startsWith(href);
	}

	// SVG icon paths
	const icons: Record<string, string> = {
		home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
		folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
		clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
		'clipboard-plus': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
		scissors: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
		'scissors-plus': 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z'
	};
</script>

<aside class="sidebar">
	<!-- Brand Mark -->
	<div class="sidebar-brand">
		<div class="brand-mark">
			<svg viewBox="0 0 40 40" fill="none" class="brand-icon">
				<!-- Stylized wood log cross-section -->
				<circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="1.5" fill="none" />
				<circle cx="20" cy="20" r="14" stroke="currentColor" stroke-width="1" opacity="0.6" fill="none" />
				<circle cx="20" cy="20" r="10" stroke="currentColor" stroke-width="0.75" opacity="0.4" fill="none" />
				<circle cx="20" cy="20" r="6" stroke="currentColor" stroke-width="0.5" opacity="0.3" fill="none" />
				<circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.5" />
			</svg>
		</div>
		<div class="brand-text">
			<span class="brand-name">WoodShop</span>
			<span class="brand-tagline">Toolbox</span>
		</div>
	</div>

	<div class="divider"></div>

	<!-- Navigation -->
	<nav class="sidebar-nav">
		<!-- NAVIGATION Section -->
		<div class="nav-section-label">NAVIGATION</div>
		<ul class="nav-list">
			{#each navigationItems as item}
				{@const active = isActive(item.href, $page.url.pathname)}
				<li>
					<a
						href={item.href}
						class="nav-item sanded-surface"
						class:nav-item-active={active}
						aria-current={active ? 'page' : undefined}
					>
						<div class="nav-item-icon" class:nav-item-icon-active={active}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d={icons[item.icon]} />
							</svg>
						</div>
						<div class="nav-item-content">
							<span class="nav-item-label">{item.label}</span>
							{#if item.description}
								<span class="nav-item-description">{item.description}</span>
							{/if}
						</div>
						{#if active}
							<div class="nav-item-indicator"></div>
						{/if}
					</a>
				</li>
			{/each}
		</ul>

		<!-- TOOLS Section -->
		<div class="nav-section-label nav-section-label-spaced">TOOLS</div>
		<ul class="nav-list">
			{#each toolItems as item}
				{@const active = isActive(item.href, $page.url.pathname)}
				<li>
					<a
						href={item.href}
						class="nav-item sanded-surface"
						class:nav-item-active={active}
						aria-current={active ? 'page' : undefined}
					>
						<div class="nav-item-icon" class:nav-item-icon-active={active}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d={icons[item.icon]} />
							</svg>
						</div>
						<div class="nav-item-content">
							<span class="nav-item-label">{item.label}</span>
							{#if item.description}
								<span class="nav-item-description">{item.description}</span>
							{/if}
						</div>
						{#if active}
							<div class="nav-item-indicator"></div>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<!-- Decorative Joinery Illustration -->
	<div class="sidebar-illustration">
		<div class="illustration-placeholder" style="height: 120px;">
			<div class="joinery-preview">
				<svg viewBox="0 0 80 60" fill="none" stroke="currentColor" stroke-width="0.75">
					<!-- Dovetail joint illustration -->
					<path d="M5 5h30v50H5z" opacity="0.3" />
					<path d="M45 5h30v50H45z" opacity="0.3" />
					<path d="M35 10l10 5v10l-10 5l10 5v10l-10 5" stroke-dasharray="2 2" />
					<path d="M45 15l-10-5M45 25l-10-5M45 35l-10-5M45 45l-10-5" stroke-dasharray="2 2" />
				</svg>
				<span>Dovetail Joint</span>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<div class="sidebar-footer">
		<div class="footer-version">
			<span>v1.0.0</span>
			<span class="footer-dot">&middot;</span>
			<span>Modern Artisan</span>
		</div>
	</div>
</aside>

<style>
	.sidebar {
		width: var(--sidebar-width);
		height: 100vh;
		background: var(--color-white);
		border-right: 1px solid rgba(17, 17, 17, 0.08);
		display: flex;
		flex-direction: column;
		position: fixed;
		left: 0;
		top: 0;
		z-index: 40;
	}

	/* Brand Section */
	.sidebar-brand {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg) var(--space-lg);
	}

	.brand-mark {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.brand-icon {
		width: 40px;
		height: 40px;
		color: var(--color-walnut);
	}

	.brand-text {
		display: flex;
		flex-direction: column;
	}

	.brand-name {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--color-ink);
		line-height: 1.1;
	}

	.brand-tagline {
		font-size: 0.75rem;
		color: var(--color-ink-muted);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	/* Divider */
	.sidebar .divider {
		margin: 0 var(--space-lg);
	}

	/* Navigation */
	.sidebar-nav {
		flex: 1;
		padding: var(--space-md) var(--space-md);
		overflow-y: auto;
	}

	.nav-section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-ink-muted);
		padding: var(--space-sm) var(--space-sm);
		margin-bottom: var(--space-xs);
	}

	.nav-section-label-spaced {
		margin-top: var(--space-lg);
	}

	.nav-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-sm);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--color-ink);
		position: relative;
		overflow: hidden;
	}

	.nav-item-icon {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		background: var(--color-paper);
		color: var(--color-ink-muted);
		flex-shrink: 0;
		transition: all var(--transition-fast);
	}

	.nav-item-icon svg {
		width: 20px;
		height: 20px;
	}

	.nav-item-icon-active {
		background: var(--color-walnut);
		color: var(--color-white);
	}

	.nav-item-content {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.nav-item-label {
		font-weight: 500;
		font-size: 0.9375rem;
		line-height: 1.3;
	}

	.nav-item-description {
		font-size: 0.75rem;
		color: var(--color-ink-muted);
		line-height: 1.3;
	}

	.nav-item-active {
		background: rgba(93, 64, 55, 0.08);
	}

	.nav-item-active .nav-item-label {
		color: var(--color-walnut-dark);
		font-weight: 600;
	}

	.nav-item-indicator {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 3px;
		height: 24px;
		background: var(--color-walnut);
		border-radius: var(--radius-full) 0 0 var(--radius-full);
	}

	/* Illustration Section */
	.sidebar-illustration {
		padding: var(--space-md) var(--space-lg);
	}

	.joinery-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		height: 100%;
	}

	.joinery-preview svg {
		width: 80px;
		height: 60px;
		color: var(--color-walnut);
		opacity: 0.6;
	}

	.joinery-preview span {
		font-size: 0.6875rem;
		color: var(--color-walnut);
		font-style: italic;
	}

	/* Footer */
	.sidebar-footer {
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid rgba(17, 17, 17, 0.06);
	}

	.footer-version {
		font-size: 0.6875rem;
		color: var(--color-ink-muted);
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.footer-dot {
		opacity: 0.5;
	}
</style>
