<script lang="ts">
	// BOM Chat page
	// Modern Artisan aesthetic with warm wood-toned styling

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

<div class="bom-chat-page animate-fade-in">
	<!-- Header -->
	<header class="page-header">
		<a href="/" class="back-link">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="back-icon">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			Back to Dashboard
		</a>
		<h1 class="page-title">BOM Generator</h1>
		<p class="page-description">
			Describe your project and I'll help you create a bill of materials.
		</p>
	</header>

	<!-- Chat Messages -->
	<div class="chat-container">
		{#if chat.messages.length === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
						<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</div>
				<p class="empty-title">Start by describing your project</p>
				<p class="empty-hint">
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
			<div class="streaming-indicator">
				<div class="streaming-bubble">
					<span class="assistant-label">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="assistant-icon">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
						</svg>
						Workshop Assistant
					</span>
					<span class="loading-dots">
						<span class="dot"></span>
						<span class="dot"></span>
						<span class="dot"></span>
					</span>
				</div>
			</div>
		{/if}

		{#if chat.error}
			<div class="error-message">
				<div class="error-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
					</svg>
				</div>
				<div class="error-content">
					<p class="error-title">Something went wrong</p>
					<p class="error-detail">Please check your API key configuration and try again.</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Chat Input -->
	<div class="input-area">
		<ChatInput onSubmit={handleSubmit} disabled={chat.status === 'streaming'} />
	</div>
</div>

<style>
	.bom-chat-page {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 140px);
		max-width: 800px;
		margin: 0 auto;
	}

	/* Header */
	.page-header {
		margin-bottom: var(--space-xl);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: 0.875rem;
		color: var(--color-walnut);
		text-decoration: none;
		margin-bottom: var(--space-sm);
		transition: color var(--transition-fast);
	}

	.back-link:hover {
		color: var(--color-walnut-dark);
	}

	.back-icon {
		width: 16px;
		height: 16px;
	}

	.page-title {
		font-family: var(--font-display);
		font-size: 1.75rem;
		color: var(--color-ink);
		margin: 0 0 var(--space-xs) 0;
	}

	.page-description {
		font-size: 0.9375rem;
		color: var(--color-ink-muted);
		margin: 0;
	}

	/* Chat Container */
	.chat-container {
		flex: 1;
		overflow-y: auto;
		margin-bottom: var(--space-md);
		padding-right: var(--space-sm);
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: var(--space-3xl) var(--space-lg);
	}

	.empty-icon {
		width: 64px;
		height: 64px;
		color: var(--color-walnut);
		opacity: 0.3;
		margin-bottom: var(--space-lg);
	}

	.empty-icon svg {
		width: 100%;
		height: 100%;
	}

	.empty-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--color-ink-soft);
		margin: 0 0 var(--space-sm) 0;
	}

	.empty-hint {
		font-size: 0.875rem;
		color: var(--color-ink-muted);
		margin: 0;
		max-width: 360px;
	}

	/* Streaming Indicator */
	.streaming-indicator {
		display: flex;
		justify-content: flex-start;
		margin-bottom: var(--space-md);
	}

	.streaming-bubble {
		background: var(--color-white);
		border: 1px solid rgba(17, 17, 17, 0.08);
		border-radius: var(--radius-lg);
		border-bottom-left-radius: var(--radius-sm);
		padding: var(--space-md) var(--space-lg);
		box-shadow: var(--shadow-soft);
	}

	.assistant-label {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-walnut);
		margin-bottom: var(--space-sm);
	}

	.assistant-icon {
		width: 14px;
		height: 14px;
	}

	.loading-dots {
		display: flex;
		gap: 6px;
	}

	.dot {
		width: 8px;
		height: 8px;
		background: var(--color-walnut);
		border-radius: 50%;
		animation: bounce 1.4s infinite ease-in-out both;
	}

	.dot:nth-child(1) { animation-delay: -0.32s; }
	.dot:nth-child(2) { animation-delay: -0.16s; }

	@keyframes bounce {
		0%, 80%, 100% {
			transform: scale(0.6);
			opacity: 0.4;
		}
		40% {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* Error Message */
	.error-message {
		display: flex;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		background: var(--color-error-soft);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-md);
	}

	.error-icon {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		color: var(--color-error);
	}

	.error-icon svg {
		width: 100%;
		height: 100%;
	}

	.error-title {
		font-weight: 600;
		color: var(--color-error);
		margin: 0 0 var(--space-xs) 0;
	}

	.error-detail {
		font-size: 0.875rem;
		color: var(--color-ink-soft);
		margin: 0;
	}

	/* Input Area */
	.input-area {
		padding-top: var(--space-md);
		border-top: 1px solid rgba(17, 17, 17, 0.08);
	}
</style>
