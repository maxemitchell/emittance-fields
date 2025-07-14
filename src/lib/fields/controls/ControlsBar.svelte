<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { CollaboratorRole } from '$lib/db/field-collaborators';
	import ColorPicker from './ColorPicker.svelte';
	import ZoomControls from './ZoomControls.svelte';

	const dispatch = createEventDispatcher<{
		colorChanged: { color: string };
		zoomIn: void;
		zoomOut: void;
		zoomToFit: void;
		zoomToActual: void;
		resetPan: void;
	}>();

	let {
		currentColor = '#000000',
		currentZoom = 1,
		minZoom = 0.1,
		maxZoom = 10,
		userRole,
		isOwner = false,
		isPublic = false,
		showControls = true
	} = $props<{
		currentColor?: string;
		currentZoom?: number;
		minZoom?: number;
		maxZoom?: number;
		userRole?: CollaboratorRole | null;
		isOwner?: boolean;
		isPublic?: boolean;
		showControls?: boolean;
	}>();

	// Determine if user can edit
	const canEdit = $derived(isOwner || userRole === 'editor');
	const canView = $derived(isOwner || userRole === 'viewer' || userRole === 'editor' || isPublic);

	// Event handlers
	function handleColorChanged(event: CustomEvent<{ color: string }>) {
		dispatch('colorChanged', event.detail);
	}

	function handleZoomIn() {
		dispatch('zoomIn');
	}

	function handleZoomOut() {
		dispatch('zoomOut');
	}

	function handleZoomToFit() {
		dispatch('zoomToFit');
	}

	function handleZoomToActual() {
		dispatch('zoomToActual');
	}

	function handleResetPan() {
		dispatch('resetPan');
	}
</script>

{#if showControls && canView}
	<div class="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 transform">
		<div
			class="flex items-center gap-4 rounded-xl border border-gray-200 bg-white/95 p-4 shadow-xl backdrop-blur-md"
		>
			<!-- Color picker - only show if user can edit -->
			{#if canEdit}
				<div class="flex items-center gap-2">
					<span class="text-sm font-medium text-gray-700">Color:</span>
					<ColorPicker {currentColor} on:colorChanged={handleColorChanged} />
				</div>

				<!-- Divider -->
				<div class="h-8 w-px bg-gray-300"></div>
			{/if}

			<!-- Zoom controls -->
			<div class="flex items-center gap-2">
				<span class="text-sm font-medium text-gray-700">Zoom:</span>
				<ZoomControls
					{currentZoom}
					{minZoom}
					{maxZoom}
					on:zoomIn={handleZoomIn}
					on:zoomOut={handleZoomOut}
					on:zoomToFit={handleZoomToFit}
					on:zoomToActual={handleZoomToActual}
					on:resetPan={handleResetPan}
				/>
			</div>
		</div>
	</div>
{/if}

<!-- Mobile-responsive adjustments -->
<style>
	@media (max-width: 640px) {
		.fixed {
			position: fixed;
			bottom: 1rem;
			left: 1rem;
			right: 1rem;
			transform: none;
		}

		.flex {
			flex-wrap: wrap;
			justify-content: center;
		}

		.gap-4 {
			gap: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.fixed {
			bottom: 0.5rem;
			left: 0.5rem;
			right: 0.5rem;
		}
	}
</style>
