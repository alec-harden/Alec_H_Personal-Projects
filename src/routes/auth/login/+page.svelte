<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		data: { redirect?: string | null };
		form: { error?: string; email?: string } | null;
	}

	let { data, form }: Props = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Log In - WoodShop Toolbox</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-stone-100 py-12 px-4">
	<div class="max-w-md w-full">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-stone-800">Welcome Back</h1>
			<p class="mt-2 text-stone-600">Log in to WoodShop Toolbox</p>
		</div>

		<form
			method="POST"
			class="bg-white shadow-lg rounded-lg p-8"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
		>
			{#if form?.error}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
					{form.error}
				</div>
			{/if}

			<div class="mb-4">
				<label for="email" class="block text-sm font-medium text-stone-700 mb-1"> Email </label>
				<input
					type="email"
					id="email"
					name="email"
					value={form?.email ?? ''}
					required
					class="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
					placeholder="you@example.com"
				/>
			</div>

			<div class="mb-4">
				<label for="password" class="block text-sm font-medium text-stone-700 mb-1">
					Password
				</label>
				<input
					type="password"
					id="password"
					name="password"
					required
					class="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
					placeholder="Your password"
				/>
			</div>

			<div class="mb-6 flex justify-end">
				<a href="/auth/forgot-password" class="text-sm text-amber-600 hover:text-amber-700">
					Forgot password?
				</a>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium rounded-md transition-colors"
			>
				{loading ? 'Logging in...' : 'Log In'}
			</button>

			<p class="mt-4 text-center text-sm text-stone-600">
				Don't have an account?
				<a href="/auth/signup" class="text-amber-600 hover:text-amber-700 font-medium"> Sign up </a>
			</p>
		</form>
	</div>
</div>
