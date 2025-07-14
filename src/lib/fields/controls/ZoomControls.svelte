<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		zoomIn: void;
		zoomOut: void;
		zoomToFit: void;
		zoomToActual: void;
		resetPan: void;
	}>();

	let {
		currentZoom = 1,
		minZoom = 0.1,
		maxZoom = 10
	} = $props<{
		currentZoom?: number;
		minZoom?: number;
		maxZoom?: number;
	}>();

	const zoomPercentage = $derived(Math.round(currentZoom * 100));
	const canZoomIn = $derived(currentZoom < maxZoom);
	const canZoomOut = $derived(currentZoom > minZoom);

	function handleZoomIn() {
		dispatch('zoomIn');
	}

	function handleZoomOut() {
		dispatch('zoomOut');
	}

	function handleZoomToFit() {
		dispatch('zoomToFit');
	}

	function handleResetPan() {
		dispatch('resetPan');
	}
</script>

<div class="flex items-center gap-2 rounded-lg border bg-white p-2 shadow-sm">
	<!-- Zoom out button -->
	<button
		type="button"
		class="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
		onclick={handleZoomOut}
		disabled={!canZoomOut}
		aria-label="Zoom out"
		title="Zoom out"
	>
		<span class="text-lg font-bold text-gray-700">−</span>
	</button>

	<!-- Zoom percentage display -->
	<span class="min-w-[3rem] text-center text-sm font-medium text-gray-700">
		{zoomPercentage}%
	</span>

	<!-- Zoom in button -->
	<button
		type="button"
		class="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
		onclick={handleZoomIn}
		disabled={!canZoomIn}
		aria-label="Zoom in"
		title="Zoom in"
	>
		<span class="text-lg font-bold text-gray-700">+</span>
	</button>

	<!-- Divider -->
	<div class="mx-1 h-6 w-px bg-gray-300"></div>

	<!-- Fit to screen button -->
	<button
		type="button"
		class="rounded px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
		onclick={handleZoomToFit}
		aria-label="Fit to screen"
		title="Fit to screen"
	>
		Fit
	</button>

	<!-- Reset button -->
	<button
		type="button"
		class="rounded px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
		onclick={handleResetPan}
		aria-label="Reset view"
		title="Reset view to center"
	>
		Reset
	</button>
</div>

<!-- Mobile-friendly layout for small screens -->
<style>
	@media (max-width: 640px) {
		.flex {
			flex-wrap: wrap;
		}
	}
</style>
