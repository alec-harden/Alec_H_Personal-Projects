<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Header from '$lib/components/Header.svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	// Mobile sidebar state
	let sidebarOpen = $state(false);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-layout">
	<!-- Sidebar (Desktop) -->
	<div class="sidebar-desktop">
		<Sidebar />
	</div>

	<!-- Mobile Sidebar Overlay -->
	{#if sidebarOpen}
		<button type="button" class="sidebar-overlay" onclick={() => (sidebarOpen = false)} aria-label="Close sidebar"></button>
		<div class="sidebar-mobile animate-slide-in-left">
			<Sidebar />
		</div>
	{/if}

	<!-- Main Content Area -->
	<div class="main-wrapper">
		<Header onMenuClick={() => (sidebarOpen = true)} />

		<main class="main-content">
			<div class="content-container">
				{@render children()}
			</div>
		</main>
	</div>
</div>

<style>
	.app-layout {
		min-height: 100vh;
		background: var(--color-paper);
	}

	/* Desktop Sidebar */
	.sidebar-desktop {
		display: none;
	}

	@media (min-width: 1024px) {
		.sidebar-desktop {
			display: block;
		}
	}

	/* Mobile Sidebar */
	.sidebar-overlay {
		position: fixed;
		inset: 0;
		background: rgba(17, 17, 17, 0.4);
		backdrop-filter: blur(2px);
		z-index: 45;
	}

	.sidebar-mobile {
		position: fixed;
		left: 0;
		top: 0;
		z-index: 50;
	}

	@media (min-width: 1024px) {
		.sidebar-overlay,
		.sidebar-mobile {
			display: none;
		}
	}

	/* Main Content Wrapper */
	.main-wrapper {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	@media (min-width: 1024px) {
		.main-wrapper {
			margin-left: var(--sidebar-width);
		}
	}

	/* Main Content */
	.main-content {
		flex: 1;
		padding: var(--space-lg);
	}

	@media (min-width: 768px) {
		.main-content {
			padding: var(--space-xl);
		}
	}

	@media (min-width: 1024px) {
		.main-content {
			padding: var(--space-xl) var(--space-2xl);
		}
	}

	.content-container {
		max-width: var(--content-max-width);
		margin: 0 auto;
	}
</style>
