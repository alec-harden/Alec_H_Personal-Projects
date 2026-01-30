<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		form: { success?: boolean; message?: string } | null;
	}

	let { form }: Props = $props();
	let loading = $state(false);
	let email = $state('');
</script>

<svelte:head>
	<title>Forgot Password - WoodShop Toolbox</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-stone-100 py-12 px-4">
	<div class="max-w-md w-full">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-stone-800">Forgot Password</h1>
			<p class="mt-2 text-stone-600">Enter your email to receive a reset link</p>
		</div>

		<div class="bg-white shadow-lg rounded-lg p-8">
			{#if form?.success}
				<div class="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-md">
					<p class="font-medium">Check your email</p>
					<p class="text-sm mt-1">{form.message}</p>
				</div>
				<p class="text-center text-sm text-stone-600 mt-4">
					<a href="/auth/login" class="text-amber-600 hover:text-amber-700 font-medium">
						Return to login
					</a>
				</p>
			{:else}
				<form
					method="POST"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							await update();
							loading = false;
						};
					}}
				>
					<div class="mb-6">
						<label for="email" class="block text-sm font-medium text-stone-700 mb-1">
							Email address
						</label>
						<input
							type="email"
							id="email"
							name="email"
							bind:value={email}
							required
							class="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
							placeholder="you@example.com"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium rounded-md transition-colors"
					>
						{loading ? 'Sending...' : 'Send Reset Link'}
					</button>

					<p class="mt-4 text-center text-sm text-stone-600">
						Remember your password?
						<a href="/auth/login" class="text-amber-600 hover:text-amber-700 font-medium">
							Log in
						</a>
					</p>
				</form>
			{/if}
		</div>
	</div>
</div>
