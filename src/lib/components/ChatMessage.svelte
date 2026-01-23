<script lang="ts">
	// Chat message bubble component
	// Modern Artisan aesthetic with warm wood-toned styling

	interface Props {
		role: 'user' | 'assistant';
		content: string;
	}

	let { role, content }: Props = $props();
</script>

<div class="message-wrapper" class:message-user={role === 'user'} class:message-assistant={role === 'assistant'}>
	<div class="message-bubble" class:bubble-user={role === 'user'} class:bubble-assistant={role === 'assistant'}>
		{#if role === 'assistant'}
			<span class="assistant-label">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="assistant-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
				</svg>
				Workshop Assistant
			</span>
		{/if}
		<p class="message-content">{content}</p>
	</div>
</div>

<style>
	.message-wrapper {
		display: flex;
		margin-bottom: var(--space-md);
	}

	.message-user {
		justify-content: flex-end;
	}

	.message-assistant {
		justify-content: flex-start;
	}

	.message-bubble {
		max-width: 80%;
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-lg);
	}

	.bubble-user {
		background: var(--color-walnut);
		color: var(--color-white);
		border-bottom-right-radius: var(--radius-sm);
	}

	.bubble-assistant {
		background: var(--color-white);
		color: var(--color-ink);
		border: 1px solid rgba(17, 17, 17, 0.08);
		border-bottom-left-radius: var(--radius-sm);
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

	.message-content {
		white-space: pre-wrap;
		font-size: 0.9375rem;
		line-height: 1.6;
		margin: 0;
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.message-bubble {
			max-width: 90%;
			padding: var(--space-sm) var(--space-md);
		}

		.message-content {
			font-size: 0.875rem;
		}
	}
</style>
