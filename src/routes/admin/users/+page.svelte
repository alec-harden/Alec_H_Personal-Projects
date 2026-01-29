<script lang="ts">
	import { enhance } from '$app/forms';

	interface User {
		id: string;
		email: string;
		role: 'user' | 'admin';
		disabled: boolean;
		createdAt: Date;
	}

	interface Props {
		data: { users: User[] };
		form: { error?: string; email?: string } | null;
	}

	let { data, form }: Props = $props();

	let showCreateForm = $state(false);
	let loading = $state(false);

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Users | Admin | WoodShop Toolbox</title>
</svelte:head>

<div class="min-h-screen bg-stone-100 py-8 px-4">
	<div class="max-w-4xl mx-auto">
		<div class="flex justify-between items-center mb-6">
			<div>
				<h1 class="text-3xl font-bold text-stone-800">Users</h1>
				<p class="mt-1 text-stone-600">Manage user accounts</p>
			</div>
			<button
				onclick={() => (showCreateForm = !showCreateForm)}
				class="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
			>
				{showCreateForm ? 'Cancel' : 'New User'}
			</button>
		</div>

		{#if form?.error}
			<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
				{form.error}
			</div>
		{/if}

		{#if showCreateForm}
			<div class="mb-8 p-6 bg-white shadow-lg border border-amber-200 rounded-lg">
				<h2 class="text-lg font-semibold text-stone-800 mb-4">Create New User</h2>

				<form
					method="POST"
					action="?/create"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							await update();
							loading = false;
						};
					}}
					class="space-y-4"
				>
					<div>
						<label for="email" class="block text-sm font-medium text-stone-700 mb-1">
							Email <span class="text-red-500">*</span>
						</label>
						<input
							type="email"
							id="email"
							name="email"
							required
							value={form?.email ?? ''}
							class="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
							placeholder="user@example.com"
						/>
					</div>

					<div>
						<label for="password" class="block text-sm font-medium text-stone-700 mb-1">
							Password <span class="text-red-500">*</span>
						</label>
						<input
							type="password"
							id="password"
							name="password"
							required
							minlength={8}
							class="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
							placeholder="Minimum 8 characters"
						/>
						<p class="text-xs text-stone-500 mt-1">Must be at least 8 characters</p>
					</div>

					<div>
						<label for="role" class="block text-sm font-medium text-stone-700 mb-1">
							Role
						</label>
						<select
							id="role"
							name="role"
							class="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
						>
							<option value="user">User</option>
							<option value="admin">Admin</option>
						</select>
					</div>

					<div class="flex justify-end gap-3 pt-4 border-t border-stone-200">
						<button
							type="button"
							onclick={() => (showCreateForm = false)}
							class="px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							class="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 transition-colors"
						>
							{loading ? 'Creating...' : 'Create User'}
						</button>
					</div>
				</form>
			</div>
		{/if}

		<!-- User List -->
		{#if data.users.length === 0}
			<div class="bg-white shadow-lg rounded-lg p-8 text-center">
				<div class="text-5xl mb-4">&#128100;</div>
				<h3 class="text-lg font-semibold text-stone-800 mb-2">No users yet</h3>
				<p class="text-stone-600 mb-4">Create your first user to get started.</p>
				<button
					onclick={() => (showCreateForm = true)}
					class="text-amber-700 hover:text-amber-800 font-medium"
				>
					Create your first user
				</button>
			</div>
		{:else}
			<div class="space-y-3">
				{#each data.users as user}
					<a
						href="/admin/users/{user.id}"
						class="block bg-white shadow-sm border border-stone-200 rounded-lg p-4 hover:shadow-md hover:border-amber-300 transition-all"
					>
						<div class="flex items-center gap-4">
							<div class="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600">
								<span class="text-lg">&#128100;</span>
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="font-semibold text-lg text-stone-800 truncate">{user.email}</h3>
								<p class="text-stone-500 text-sm">Created {formatDate(user.createdAt)}</p>
							</div>
							<div class="flex items-center gap-2 shrink-0">
								<!-- Role Badge -->
								{#if user.role === 'admin'}
									<span class="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
										Admin
									</span>
								{:else}
									<span class="px-2 py-1 text-xs font-medium rounded-full bg-stone-100 text-stone-700">
										User
									</span>
								{/if}
								<!-- Status Badge -->
								{#if user.disabled}
									<span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
										Disabled
									</span>
								{:else}
									<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
										Active
									</span>
								{/if}
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}

		<!-- Back to Dashboard -->
		<div class="mt-8 text-center">
			<a href="/" class="text-amber-700 hover:text-amber-800 font-medium">
				&larr; Back to Dashboard
			</a>
		</div>
	</div>
</div>
