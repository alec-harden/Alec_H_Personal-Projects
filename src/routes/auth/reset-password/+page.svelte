<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		data: { valid: boolean; token?: string; error?: string };
		form: { success?: boolean; error?: string } | null;
	}

	let { data, form }: Props = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Reset Password - WoodShop Toolbox</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-stone-100 py-12 px-4">
	<div class="max-w-md w-full">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-stone-800">Reset Password</h1>
			<p class="mt-2 text-stone-600">Enter your new password</p>
		</div>

		<div class="bg-white shadow-lg rounded-lg p-8">
			{#if form?.success}
				<div class="text-center">
					<div class="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-md">
						<p class="font-medium">Password reset successful!</p>
						<p class="text-sm mt-1">You can now log in with your new password.</p>
					</div>
					<a
						href="/auth/login"
						class="inline-block mt-4 py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md transition-colors"
					>
						Go to Login
					</a>
				</div>
			{:else if !data.valid}
				<div class="text-center">
					<div class="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
						<p class="font-medium">Invalid Reset Link</p>
						<p class="text-sm mt-1">{data.error}</p>
					</div>
					<a
						href="/auth/forgot-password"
						class="inline-block mt-4 py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md transition-colors"
					>
						Request New Link
					</a>
				</div>
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
					{#if form?.error}
						<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
							{form.error}
						</div>
					{/if}

					<input type="hidden" name="token" value={data.token} />

					<div class="mb-4">
						<label for="password" class="block text-sm font-medium text-stone-700 mb-1">
							New Password
						</label>
						<input
							type="password"
							id="password"
							name="password"
							required
							minlength="8"
							class="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
							placeholder="At least 8 characters"
						/>
					</div>

					<div class="mb-6">
						<label for="confirmPassword" class="block text-sm font-medium text-stone-700 mb-1">
							Confirm Password
						</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							required
							minlength="8"
							class="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
							placeholder="Confirm your password"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium rounded-md transition-colors"
					>
						{loading ? 'Resetting...' : 'Reset Password'}
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
