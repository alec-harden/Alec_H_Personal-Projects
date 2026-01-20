<script lang="ts">
	// Chat message bubble component
	// Displays user or assistant messages with appropriate styling

	interface Props {
		role: 'user' | 'assistant';
		content: string;
	}

	let { role, content }: Props = $props();
</script>

<div class="flex {role === 'user' ? 'justify-end' : 'justify-start'} mb-4">
	<div
		class="max-w-[80%] rounded-2xl px-4 py-3 {role === 'user'
			? 'bg-amber-700 text-white rounded-br-md'
			: 'bg-gray-100 text-gray-900 rounded-bl-md'}"
	>
		{#if role === 'assistant'}
			<span class="text-xs text-gray-500 block mb-1">AI Assistant</span>
		{/if}
		<p class="whitespace-pre-wrap">{content}</p>
	</div>
</div>
