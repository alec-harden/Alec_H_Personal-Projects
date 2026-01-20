<script lang="ts">
	// Chat input component with submit button
	// Handles message submission and disabled state during AI response

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

<form onsubmit={handleSubmit} class="flex gap-3">
	<textarea
		bind:value={inputValue}
		onkeydown={handleKeydown}
		{placeholder}
		{disabled}
		rows="2"
		class="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:bg-gray-50 disabled:text-gray-500"
	></textarea>
	<button
		type="submit"
		disabled={disabled || !inputValue.trim()}
		class="self-end rounded-xl bg-amber-700 px-6 py-3 font-medium text-white hover:bg-amber-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
	>
		{#if disabled}
			<span class="inline-block animate-pulse">...</span>
		{:else}
			Send
		{/if}
	</button>
</form>
