<script lang="ts">
	// ToolCard component for dashboard navigation
	// Displays individual tools with icon, title, description, and link

	interface Props {
		title: string;
		description: string;
		href: string;
		icon?: string;
		disabled?: boolean;
	}

	let { title, description, href, icon = '&#x1f527;', disabled = false }: Props = $props();
</script>

{#if disabled}
	<div
		class="block p-6 rounded-xl border border-gray-200 bg-white shadow-sm opacity-50 cursor-not-allowed"
	>
		<div class="text-4xl mb-3">{@html icon}</div>
		<h2 class="text-lg font-semibold text-gray-900">{title}</h2>
		<p class="text-sm text-gray-600 mt-1">{description}</p>
		<span class="inline-block mt-3 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded"
			>Coming Soon</span
		>
	</div>
{:else}
	<a
		{href}
		class="block p-6 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
	>
		<div class="text-4xl mb-3">{@html icon}</div>
		<h2 class="text-lg font-semibold text-gray-900">{title}</h2>
		<p class="text-sm text-gray-600 mt-1">{description}</p>
	</a>
{/if}
