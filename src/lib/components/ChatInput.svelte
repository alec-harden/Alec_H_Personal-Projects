<script lang="ts">
	// Chat input component with submit button
	// Modern Artisan aesthetic with warm wood-toned styling

	interface Props {
		onSubmit: (message: string) => void;
		disabled?: boolean;
		placeholder?: string;
	}

	let {
		onSubmit,
		disabled = false,
		placeholder = 'Describe your woodworking project...'
	}: Props = $props();

	let inputValue = $state('');

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (inputValue.trim() && !disabled) {
			onSubmit(inputValue.trim());
			inputValue = '';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (inputValue.trim() && !disabled) {
				onSubmit(inputValue.trim());
				inputValue = '';
			}
		}
	}
</script>

<form onsubmit={handleSubmit} class="chat-form">
	<div class="input-wrapper">
		<textarea
			bind:value={inputValue}
			onkeydown={handleKeydown}
			{placeholder}
			{disabled}
			rows="2"
			class="chat-textarea"
			class:textarea-disabled={disabled}
		></textarea>
		<div class="input-hint">
			<span>Press Enter to send</span>
		</div>
	</div>
	<button
		type="submit"
		disabled={disabled || !inputValue.trim()}
		class="send-button"
		class:button-disabled={disabled || !inputValue.trim()}
	>
		{#if disabled}
			<span class="loading-dots">
				<span class="dot"></span>
				<span class="dot"></span>
				<span class="dot"></span>
			</span>
		{:else}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="send-icon">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
			</svg>
			<span class="send-text">Send</span>
		{/if}
	</button>
</form>

<style>
	.chat-form {
		display: flex;
		gap: var(--space-md);
		align-items: flex-end;
	}

	.input-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.chat-textarea {
		width: 100%;
		resize: none;
		padding: var(--space-md) var(--space-lg);
		border: 1px solid rgba(17, 17, 17, 0.15);
		border-radius: var(--radius-lg);
		font-family: var(--font-body);
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--color-ink);
		background: var(--color-white);
		transition: all var(--transition-fast);
	}

	.chat-textarea::placeholder {
		color: var(--color-ink-muted);
	}

	.chat-textarea:focus {
		outline: none;
		border-color: var(--color-walnut);
		box-shadow: 0 0 0 3px rgba(93, 64, 55, 0.1);
	}

	.textarea-disabled {
		background: var(--color-paper);
		color: var(--color-ink-muted);
		cursor: not-allowed;
	}

	.input-hint {
		display: flex;
		justify-content: flex-end;
		font-size: 0.6875rem;
		color: var(--color-ink-muted);
		opacity: 0.7;
	}

	.send-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		padding: var(--space-md) var(--space-xl);
		background: var(--color-walnut);
		color: var(--color-white);
		border: none;
		border-radius: var(--radius-lg);
		font-family: var(--font-body);
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
		min-width: 100px;
		height: fit-content;
	}

	.send-button:hover:not(.button-disabled) {
		background: var(--color-walnut-dark);
		transform: translateY(-1px);
	}

	.button-disabled {
		background: var(--color-paper-dark);
		color: var(--color-ink-muted);
		cursor: not-allowed;
	}

	.send-icon {
		width: 18px;
		height: 18px;
	}

	/* Loading animation */
	.loading-dots {
		display: flex;
		gap: 4px;
		align-items: center;
		justify-content: center;
	}

	.dot {
		width: 6px;
		height: 6px;
		background: var(--color-ink-muted);
		border-radius: 50%;
		animation: bounce 1.4s infinite ease-in-out both;
	}

	.dot:nth-child(1) {
		animation-delay: -0.32s;
	}

	.dot:nth-child(2) {
		animation-delay: -0.16s;
	}

	@keyframes bounce {
		0%, 80%, 100% {
			transform: scale(0.6);
			opacity: 0.5;
		}
		40% {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.chat-form {
			flex-direction: column;
			gap: var(--space-sm);
		}

		.send-button {
			width: 100%;
			padding: var(--space-md);
		}

		.input-hint {
			display: none;
		}

		.send-text {
			display: inline;
		}
	}
</style>
