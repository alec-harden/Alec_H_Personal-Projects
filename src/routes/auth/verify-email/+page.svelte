<script lang="ts">
	interface Props {
		data: { success: boolean; error?: string };
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Email Verification | WoodShop Toolbox</title>
</svelte:head>

<div class="min-h-screen bg-stone-100 flex items-center justify-center py-12 px-4">
	<div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
		{#if data.success}
			<div class="text-center">
				<div
					class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4"
				>
					<span class="text-green-600 text-2xl">&#x2713;</span>
				</div>
				<h1 class="text-2xl font-bold text-stone-800 mb-2">Email Verified!</h1>
				<p class="text-stone-600 mb-6">
					Your email address has been successfully verified. You can now enjoy all features of
					WoodShop Toolbox.
				</p>
				<a
					href="/"
					class="inline-block px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
				>
					Go to Dashboard
				</a>
			</div>
		{:else}
			<div class="text-center">
				<div
					class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4"
				>
					<span class="text-red-600 text-2xl">&#x2717;</span>
				</div>
				<h1 class="text-2xl font-bold text-stone-800 mb-2">Verification Failed</h1>
				<p class="text-stone-600 mb-6">
					{data.error}
				</p>
				<a
					href="/auth/resend-verification"
					class="inline-block px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
				>
					Request New Verification Email
				</a>
			</div>
		{/if}
	</div>
</div>
