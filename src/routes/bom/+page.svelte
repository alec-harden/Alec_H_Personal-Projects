<script lang="ts">
	import { Chat } from '@ai-sdk/svelte';
	import ChatMessage from '$lib/components/ChatMessage.svelte';
	import ChatInput from '$lib/components/ChatInput.svelte';

	const chat = new Chat({});

	function handleSubmit(message: string) {
		chat.sendMessage({
			text: message
		});
	}

	// Helper to extract text content from message parts
	function getMessageText(message: (typeof chat.messages)[number]): string {
		return message.parts
			.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
			.map((part) => part.text)
			.join('');
	}
</script>

<svelte:head>
	<title>BOM Generator | WoodShop Toolbox</title>
</svelte:head>

<div class="flex flex-col h-[calc(100vh-140px)]">
	<!-- Header -->
	<div class="mb-6">
		<a href="/" class="text-amber-700 hover:text-amber-800 text-sm mb-2 inline-block"
			>&larr; Back to Dashboard</a
		>
		<h1 class="text-2xl font-bold text-gray-900">BOM Generator</h1>
		<p class="text-gray-600 mt-1">
			Describe your project and I'll help you create a bill of materials.
		</p>
	</div>

	<!-- Chat Messages -->
	<div class="flex-1 overflow-y-auto mb-4 pr-2">
		{#if chat.messages.length === 0}
			<div class="text-center text-gray-500 py-12">
				<p class="text-lg mb-2">Start by describing your project</p>
				<p class="text-sm">
					Example: "I'm building a farmhouse dining table, 72 inches long by 36 inches wide"
				</p>
			</div>
		{:else}
			{#each chat.messages.filter((m) => m.role !== 'system') as message}
				<ChatMessage
					role={message.role as 'user' | 'assistant'}
					content={getMessageText(message)}
				/>
			{/each}
		{/if}

		{#if chat.status === 'streaming'}
			<div class="flex justify-start mb-4">
				<div class="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
					<span class="text-xs text-gray-500 block mb-1">AI Assistant</span>
					<span class="inline-flex gap-1">
						<span
							class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
							style="animation-delay: 0ms"
						></span>
						<span
							class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
							style="animation-delay: 150ms"
						></span>
						<span
							class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
							style="animation-delay: 300ms"
						></span>
					</span>
				</div>
			</div>
		{/if}

		{#if chat.error}
			<div class="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
				<p class="font-medium">Something went wrong</p>
				<p class="text-sm mt-1">Please check your API key configuration and try again.</p>
			</div>
		{/if}
	</div>

	<!-- Chat Input -->
	<div class="border-t border-gray-200 pt-4">
		<ChatInput onSubmit={handleSubmit} disabled={chat.status === 'streaming'} />
	</div>
</div>
