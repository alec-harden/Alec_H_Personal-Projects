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
	<main class="max-w-6xl mx-auto px-6 py-8">
		{@render children()}
	</main>
</div>
