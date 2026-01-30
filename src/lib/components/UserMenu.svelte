<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		email: string;
		role: 'user' | 'admin';
	}

	let { email, role }: Props = $props();
	let open = $state(false);

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.user-menu')) {
			open = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="user-menu relative">
	<button
		onclick={() => (open = !open)}
		class="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
	>
		<span class="w-7 h-7 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
			{email[0].toUpperCase()}
		</span>
		<span class="hidden sm:inline max-w-32 truncate">{email}</span>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if open}
		<div class="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-stone-200 py-1 z-50">
			<div class="px-4 py-2 border-b border-stone-100">
				<p class="text-sm font-medium text-stone-900 truncate">{email}</p>
			</div>

			{#if role === 'admin'}
				<a
					href="/admin/users"
					class="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
					onclick={() => (open = false)}
				>
					Manage Users
				</a>
				<a
					href="/admin/templates"
					class="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
					onclick={() => (open = false)}
				>
					Manage Templates
				</a>
			{/if}

			<form method="POST" action="/auth/logout" use:enhance>
				<button
					type="submit"
					class="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
				>
					Log out
				</button>
			</form>
		</div>
	{/if}
</div>
