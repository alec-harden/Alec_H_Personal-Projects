<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	interface User {
		id: string;
		email: string;
		role: 'user' | 'admin';
		disabled: boolean;
		createdAt: Date;
	}

	interface Props {
		data: { user: User };
		form: { error?: string; success?: boolean; message?: string } | null;
	}

	let { data, form }: Props = $props();

	let resetLoading = $state(false);
	let toggleLoading = $state(false);
	let showSuccess = $state(false);
	let successMessage = $state('');

	// Check if this is the current user's own account
	const isOwnAccount = $derived($page.data.user?.id === data.user.id);

	// Show success message when form returns success
	$effect(() => {
		if (form?.success && form?.message) {
			successMessage = form.message;
			showSuccess = true;
			const timer = setTimeout(() => {
				showSuccess = false;
			}, 3000);
			return () => clearTimeout(timer);
		}
	});

	// Format date nicely
	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>{data.user.email} | Users | Admin | WoodShop Toolbox</title>
</svelte:head>

<div class="min-h-screen bg-stone-100 py-8 px-4">
	<div class="max-w-3xl mx-auto">
		<!-- Back link -->
		<div class="mb-4">
			<a href="/admin/users" class="text-amber-700 hover:text-amber-800 font-medium text-sm">
				&larr; Back to Users
			</a>
		</div>

		<!-- Header -->
		<div class="mb-6">
			<h1 class="text-3xl font-bold text-stone-800 mb-2">{data.user.email}</h1>
			<div class="flex items-center gap-2">
				<!-- Role badge -->
				{#if data.user.role === 'admin'}
					<span
						class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
					>
						Admin
					</span>
				{:else}
					<span
						class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800"
					>
						User
					</span>
				{/if}
				<!-- Status badge -->
				{#if data.user.disabled}
					<span
						class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
					>
						Disabled
					</span>
				{:else}
					<span
						class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
					>
						Active
					</span>
				{/if}
			</div>
		</div>

		<!-- Error message -->
		{#if form?.error}
			<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
				{form.error}
			</div>
		{/if}

		<!-- Success message -->
		{#if showSuccess}
			<div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
				{successMessage}
			</div>
		{/if}

		<!-- User Details Card -->
		<div class="bg-white shadow-lg border border-stone-200 rounded-lg p-6 mb-6">
			<h2 class="text-lg font-semibold text-stone-800 mb-4">User Details</h2>
			<dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<dt class="text-sm font-medium text-stone-500">Email</dt>
					<dd class="mt-1 text-sm text-stone-900">{data.user.email}</dd>
				</div>
				<div>
					<dt class="text-sm font-medium text-stone-500">Role</dt>
					<dd class="mt-1 text-sm text-stone-900 capitalize">{data.user.role}</dd>
				</div>
				<div>
					<dt class="text-sm font-medium text-stone-500">Status</dt>
					<dd class="mt-1 text-sm text-stone-900">
						{data.user.disabled ? 'Disabled' : 'Active'}
					</dd>
				</div>
				<div>
					<dt class="text-sm font-medium text-stone-500">Created</dt>
					<dd class="mt-1 text-sm text-stone-900">{formatDate(data.user.createdAt)}</dd>
				</div>
			</dl>
		</div>

		<!-- Actions Section -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Reset Password Form -->
			<div class="bg-white shadow-lg border border-stone-200 rounded-lg p-6">
				<h2 class="text-lg font-semibold text-stone-800 mb-4">Reset Password</h2>
				<form
					method="POST"
					action="?/resetPassword"
					use:enhance={() => {
						resetLoading = true;
						return async ({ update }) => {
							await update();
							resetLoading = false;
						};
					}}
					class="space-y-4"
				>
					<div>
						<label for="newPassword" class="block text-sm font-medium text-stone-700 mb-1">
							New Password <span class="text-red-500">*</span>
						</label>
						<input
							type="password"
							id="newPassword"
							name="newPassword"
							required
							minlength="8"
							placeholder="Minimum 8 characters"
							class="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
						/>
					</div>
					<button
						type="submit"
						disabled={resetLoading}
						class="w-full px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 transition-colors"
					>
						{resetLoading ? 'Resetting...' : 'Reset Password'}
					</button>
				</form>
			</div>

			<!-- Toggle Status Form -->
			<div class="bg-white shadow-lg border border-stone-200 rounded-lg p-6">
				<h2 class="text-lg font-semibold text-stone-800 mb-4">Account Status</h2>
				{#if isOwnAccount}
					<p class="text-sm text-stone-500 mb-4">
						You cannot modify your own account status.
					</p>
					<button
						type="button"
						disabled
						class="w-full px-4 py-2 bg-stone-300 text-stone-500 rounded-lg cursor-not-allowed"
					>
						Cannot disable yourself
					</button>
				{:else}
					<form
						method="POST"
						action="?/toggleDisabled"
						use:enhance={() => {
							toggleLoading = true;
							return async ({ update }) => {
								await update();
								toggleLoading = false;
							};
						}}
						class="space-y-4"
					>
						<div class="flex items-start gap-2">
							<input
								type="checkbox"
								id="confirmToggle"
								required
								class="mt-1 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
							/>
							<label for="confirmToggle" class="text-sm text-stone-600">
								I understand this will
								<strong>{data.user.disabled ? 'enable' : 'disable'}</strong>
								this user account
							</label>
						</div>
						{#if data.user.disabled}
							<button
								type="submit"
								disabled={toggleLoading}
								class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
							>
								{toggleLoading ? 'Enabling...' : 'Enable User'}
							</button>
						{:else}
							<button
								type="submit"
								disabled={toggleLoading}
								class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
							>
								{toggleLoading ? 'Disabling...' : 'Disable User'}
							</button>
						{/if}
					</form>
				{/if}
			</div>
		</div>

		<!-- Back to Users link -->
		<div class="mt-8 text-center">
			<a href="/admin/users" class="text-amber-700 hover:text-amber-800 font-medium">
				&larr; Back to Users
			</a>
		</div>
	</div>
</div>
