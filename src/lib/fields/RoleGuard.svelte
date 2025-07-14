<script lang="ts">
	import type { CollaboratorRole } from '$lib/db/field-collaborators';

	let {
		userRole,
		isOwner = false,
		isPublic = false,
		showOverlay = true
	} = $props<{
		userRole?: CollaboratorRole | null;
		isOwner?: boolean;
		isPublic?: boolean;
		showOverlay?: boolean;
	}>();

	// Determine if user can edit
	const canEdit = $derived(isOwner || userRole === 'editor');
	const canView = $derived(isOwner || userRole === 'viewer' || userRole === 'editor' || isPublic);

	// Determine user's role label
	const roleLabel = $derived(
		isOwner
			? 'Owner'
			: userRole === 'editor'
				? 'Editor'
				: userRole === 'viewer'
					? 'Viewer'
					: isPublic
						? 'Public View'
						: 'No Access'
	);

	// Determine role color
	const roleColor = $derived(
		isOwner
			? 'bg-purple-100 text-purple-800 border-purple-200'
			: userRole === 'editor'
				? 'bg-blue-100 text-blue-800 border-blue-200'
				: userRole === 'viewer'
					? 'bg-green-100 text-green-800 border-green-200'
					: isPublic
						? 'bg-gray-100 text-gray-800 border-gray-200'
						: 'bg-red-100 text-red-800 border-red-200'
	);
</script>

{#if !canView}
	<!-- No access overlay -->
	<div class="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
		<div class="text-center">
			<svg
				class="mx-auto mb-4 h-12 w-12 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-4a9 9 0 100-18 9 9 0 000 18z"
				/>
			</svg>
			<h3 class="mb-2 text-lg font-semibold text-gray-900">No Access</h3>
			<p class="text-gray-600">You don't have permission to view this field.</p>
		</div>
	</div>
{:else if showOverlay && !canEdit}
	<!-- View-only overlay -->
	<div class="absolute inset-0 z-40 cursor-not-allowed bg-transparent">
		<div class="absolute inset-0 bg-blue-50/10 backdrop-blur-[0.5px]"></div>

		<!-- View-only indicator -->
		<div class="absolute top-4 right-4 z-50">
			<div
				class="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 shadow-sm backdrop-blur-sm"
			>
				<svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
					/>
				</svg>
				<span class="text-sm font-medium text-gray-700">View Only</span>
			</div>
		</div>
	</div>
{/if}

<!-- Role indicator (always visible) -->
<div class="absolute top-4 left-4 z-50">
	<div
		class="flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium shadow-sm backdrop-blur-sm {roleColor}"
	>
		{#if isOwner}
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-4a9 9 0 100-18 9 9 0 000 18z"
				/>
			</svg>
		{:else if userRole === 'editor'}
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
				/>
			</svg>
		{:else if userRole === 'viewer'}
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
				/>
			</svg>
		{:else if isPublic}
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
				/>
			</svg>
		{/if}
		<span>{roleLabel}</span>
	</div>
</div>

<style>
	.cursor-not-allowed * {
		cursor: not-allowed !important;
	}
</style>
