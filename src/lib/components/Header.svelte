<script lang="ts">
	// Header component for WoodShop Toolbox
	// Modern Artisan aesthetic - clean top bar for mobile/tablet
	import UserMenu from './UserMenu.svelte';

	interface User {
		id: string;
		email: string;
		createdAt: Date;
	}

	interface Props {
		onMenuClick?: () => void;
		user?: User | null;
	}

	let { onMenuClick, user = null }: Props = $props();
</script>

<header class="app-header">
	<div class="header-content">
		<!-- Mobile Menu Button -->
		<button
			type="button"
			class="menu-button"
			onclick={onMenuClick}
			aria-label="Open navigation menu"
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
				<path d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</button>

		<!-- Mobile Brand -->
		<div class="mobile-brand">
			<svg viewBox="0 0 40 40" fill="none" class="brand-icon">
				<circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="1.5" fill="none" />
				<circle cx="20" cy="20" r="14" stroke="currentColor" stroke-width="1" opacity="0.6" fill="none" />
				<circle cx="20" cy="20" r="10" stroke="currentColor" stroke-width="0.75" opacity="0.4" fill="none" />
				<circle cx="20" cy="20" r="6" stroke="currentColor" stroke-width="0.5" opacity="0.3" fill="none" />
				<circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.5" />
			</svg>
			<span class="brand-name">WoodShop Toolbox</span>
		</div>

		<!-- User Authentication Actions -->
		<div class="header-actions">
			{#if user}
				<UserMenu email={user.email} />
			{:else}
				<a href="/auth/login" class="login-link">Log in</a>
			{/if}
		</div>
	</div>
</header>

<style>
	.app-header {
		height: var(--header-height);
		background: var(--color-white);
		border-bottom: 1px solid rgba(17, 17, 17, 0.08);
		position: sticky;
		top: 0;
		z-index: 30;
	}

	@media (min-width: 1024px) {
		.app-header {
			background: transparent;
			border-bottom: none;
		}
	}

	.header-content {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 var(--space-md);
		max-width: var(--content-max-width);
		margin: 0 auto;
	}

	@media (min-width: 768px) {
		.header-content {
			padding: 0 var(--space-lg);
		}
	}

	/* Menu Button - Mobile Only */
	.menu-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: none;
		border: none;
		border-radius: var(--radius-md);
		color: var(--color-ink);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.menu-button:hover {
		background: var(--color-paper);
	}

	.menu-button svg {
		width: 24px;
		height: 24px;
	}

	@media (min-width: 1024px) {
		.menu-button {
			display: none;
		}
	}

	/* Mobile Brand */
	.mobile-brand {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.brand-icon {
		width: 32px;
		height: 32px;
		color: var(--color-walnut);
	}

	.brand-name {
		font-family: var(--font-display);
		font-size: 1.125rem;
		color: var(--color-ink);
	}

	@media (min-width: 1024px) {
		.mobile-brand {
			display: none;
		}
	}

	/* Header Actions */
	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	/* Login Link */
	.login-link {
		font-size: 0.875rem;
		color: var(--color-ink-muted);
		text-decoration: none;
		padding: 0.375rem 0.75rem;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.login-link:hover {
		color: var(--color-walnut);
		background: var(--color-paper);
	}
</style>
