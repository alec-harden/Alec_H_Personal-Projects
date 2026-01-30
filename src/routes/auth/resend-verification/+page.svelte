<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		data: { email: string; emailVerified: boolean };
		form: { error?: string; success?: boolean; message?: string } | null;
	}

	let { data, form }: Props = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Resend Verification | WoodShop Toolbox</title>
</svelte:head>

<div class="min-h-screen bg-stone-100 flex items-center justify-center py-12 px-4">
	<div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
		<h1 class="text-2xl font-bold text-stone-800 mb-2 text-center">Email Verification</h1>

		{#if data.emailVerified}
			<div class="text-center">
				<div
					class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4 mt-4"
				>
					<span class="text-green-600 text-2xl">&#x2713;</span>
				</div>
				<p class="text-stone-600 mb-6">
					Your email <strong>{data.email}</strong> is already verified.
				</p>
				<a
					href="/"
					class="inline-block px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
				>
					Go to Dashboard
				</a>
			</div>
		{:else}
			<p class="text-stone-600 mb-6 text-center">
				We'll send a verification link to <strong>{data.email}</strong>
			</p>

			{#if form?.error}
				<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
					{form.error}
				</div>
			{/if}

			{#if form?.success}
				<div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
					{form.message}
				</div>
			{/if}

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
				<button
					type="submit"
					disabled={loading}
					class="w-full px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 transition-colors"
				>
					{loading ? 'Sending...' : 'Send Verification Email'}
				</button>
			</form>

			<p class="mt-4 text-sm text-stone-500 text-center">
				Didn't receive the email? Check your spam folder or try again.
			</p>
		{/if}

		<div class="mt-6 text-center">
			<a href="/" class="text-amber-700 hover:text-amber-800 text-sm"> &larr; Back to Dashboard </a>
		</div>
	</div>
</div>
