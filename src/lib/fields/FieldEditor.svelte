<script lang="ts">
	import { writable } from 'svelte/store';
	import type { Field } from '../db/fields';
	import type { CollaboratorRole } from '../db/field-collaborators';
	import { ControlsBar, RoleGuard } from './controls';

	let {
		field,
		userRole,
		isOwner = false,
		isPublic = false
	} = $props<{
		field: Field;
		userRole?: CollaboratorRole | null;
		isOwner?: boolean;
		isPublic?: boolean;
	}>();

	// Example state for the field editor
	const currentColor = writable('#000000');
	const currentZoom = writable(1);
	const viewport = writable({ x: 0, y: 0, scale: 1 });

	// Example event handlers
	function handleColorChanged(event: CustomEvent<{ color: string }>) {
		currentColor.set(event.detail.color);
		console.log('Color changed to:', event.detail.color);
	}

	function handleZoomIn() {
		currentZoom.update((zoom) => Math.min(zoom * 1.2, 10));
		console.log('Zoom in');
	}

	function handleZoomOut() {
		currentZoom.update((zoom) => Math.max(zoom / 1.2, 0.1));
		console.log('Zoom out');
	}

	function handleZoomToFit() {
		currentZoom.set(1);
		viewport.set({ x: 0, y: 0, scale: 1 });
		console.log('Zoom to fit');
	}

	function handleZoomToActual() {
		currentZoom.set(1);
		console.log('Zoom to actual size');
	}

	function handleResetPan() {
		viewport.update((v) => ({ ...v, x: 0, y: 0 }));
		console.log('Reset pan');
	}
</script>

<div class="relative h-96 overflow-hidden rounded-lg border bg-gray-100">
	<!-- Role guard overlay -->
	<RoleGuard {userRole} {isOwner} {isPublic} />

	<!-- Field content area -->
	<div class="h-full w-full p-4">
		<div class="flex h-full items-center justify-center">
			<div class="text-center">
				<h3 class="mb-2 text-lg font-semibold text-gray-700">
					{field.name}
				</h3>
				<p class="text-sm text-gray-500">
					{field.width} × {field.height} pixels
				</p>
				<div
					class="mx-auto mt-4 h-24 w-24 rounded border-2 border-gray-400"
					style="background-color: {field.background_color};"
				></div>
				<p class="mt-2 text-xs text-gray-400">
					Background Color: {field.background_color}
				</p>
			</div>
		</div>
	</div>

	<!-- Controls bar -->
	<ControlsBar
		currentColor={$currentColor}
		currentZoom={$currentZoom}
		minZoom={0.1}
		maxZoom={10}
		{userRole}
		{isOwner}
		{isPublic}
		on:colorChanged={handleColorChanged}
		on:zoomIn={handleZoomIn}
		on:zoomOut={handleZoomOut}
		on:zoomToFit={handleZoomToFit}
		on:zoomToActual={handleZoomToActual}
		on:resetPan={handleResetPan}
	/>
</div>
