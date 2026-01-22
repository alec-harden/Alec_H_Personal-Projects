<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<Header />
	<main class="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
		{@render children()}
	</main>
</div>
