<script lang="ts">
	import FieldManagement from '$lib/components/field-management.svelte';
	import FieldCollaborators from '$lib/components/field-collaborators.svelte';
	import FieldVisualizer from '$lib/fields/FieldVisualizer.svelte';

	let { data, form } = $props();
	let { field, collaborators, userRole, user, emitters, supabase } = $derived(data);

	let showDetails = $state(false);
</script>

<div class="flex min-h-screen flex-col">
	<!-- Navigation Bar -->
	<nav class="flex items-center justify-between bg-white p-4 shadow-sm">
		<a
			href="/"
			class="inline-flex items-center text-blue-600 hover:underline focus:outline-none"
			style="text-decoration: none;"
		>
			<svg
				class="mr-2 h-5 w-5"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			Back
		</a>

		<div class="flex items-center gap-4">
			<h1 class="text-xl font-semibold text-gray-900">{field.name}</h1>
			<button
				onclick={() => (showDetails = !showDetails)}
				class="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
			>
				{showDetails ? 'Hide' : 'Show'} Details
			</button>
		</div>
	</nav>

	<!-- Main Content -->
	<div class="relative overflow-hidden" style="height: 70vh;">
		<!-- Field Visualizer -->
		<FieldVisualizer {field} {supabase} {userRole} initialEmitters={emitters} />

		<!-- Details Panel (overlay) -->
		{#if showDetails}
			<div class="absolute top-0 right-0 bottom-0 w-96 bg-white shadow-2xl">
				<div class="h-full overflow-y-auto">
					<!-- Header -->
					<div class="sticky top-0 border-b border-gray-100 bg-white p-6 pb-4">
						<h2 class="text-xl font-semibold text-gray-900">Field Management</h2>
						<button
							onclick={() => (showDetails = false)}
							class="absolute top-4 right-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
							aria-label="Close panel"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					<!-- Content -->
					<div class="space-y-6 p-6 pt-4">
						<FieldCollaborators {collaborators} {form} {field} {user} />
						<FieldManagement {field} {form} />
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
