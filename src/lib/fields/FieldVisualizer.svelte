<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { derived } from 'svelte/store';
	import { page } from '$app/stores';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { Field } from '$lib/db/fields';
	import type { Database } from '../../database.types';
	import { emitterStore } from '$lib/stores/emitters';
	import { subscribeToEmitters } from '$lib/db/emitters';
	import FieldCanvas from './canvas/FieldCanvas.svelte';
	import CanvasOverlay from './canvas/CanvasOverlay.svelte';
	import ControlsBar from './controls/ControlsBar.svelte';
	import RoleGuard from './RoleGuard.svelte';

	interface Props {
		field: Field;
		userRole: 'owner' | 'editor' | 'viewer' | 'public';
	}

	let { field, userRole }: Props = $props();

	// Get supabase client from page data (inherited from layout)
	const supabase = $derived($page.data.supabase as SupabaseClient<Database>);

	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let realtimeUnsubscribe: (() => void) | null = null;

	// Derived state
	const canEdit = $derived(userRole === 'owner' || userRole === 'editor');

	// Create derived stores that match canvas component expectations
	const emittersMapStore = derived(emitterStore, (state) => state.emitters);

	// Create a simple viewport store that uses translation offsets
	let simpleViewport = $state({ x: 0, y: 0, scale: 1 });
	let canvasElement: HTMLElement | null = $state(null);
	let subscribers: Array<(value: { x: number; y: number; scale: number }) => void> = [];
	let realtimeActive = $state(false);

	// Get actual canvas dimensions
	function getCanvasDimensions() {
		if (!canvasElement) return { width: 800, height: 600 };
		const rect = canvasElement.getBoundingClientRect();
		return { width: rect.width, height: rect.height };
	}

	// Center the field in the canvas
	function centerField() {
		const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
		const scaleX = canvasWidth / field.width;
		const scaleY = canvasHeight / field.height;
		const scale = Math.min(scaleX, scaleY, 1) * 0.8; // Fit with padding

		simpleViewport = {
			x: (canvasWidth - field.width * scale) / 2,
			y: (canvasHeight - field.height * scale) / 2,
			scale: scale
		};

		// Notify all subscribers
		subscribers.forEach((fn) => fn(simpleViewport));
	}

	// Update viewport and notify subscribers
	function updateViewport(newViewport: { x: number; y: number; scale: number }) {
		simpleViewport = newViewport;
		subscribers.forEach((fn) => fn(simpleViewport));
	}

	const viewportWrapped = {
		subscribe: (fn: (value: { x: number; y: number; scale: number }) => void) => {
			fn(simpleViewport);
			subscribers.push(fn);
			return () => {
				const index = subscribers.indexOf(fn);
				if (index > -1) subscribers.splice(index, 1);
			};
		},
		set: (value: { x: number; y: number; scale: number }) => {
			updateViewport(value);
		},
		update: (
			fn: (value: {
				x: number;
				y: number;
				scale: number;
			}) => { x: number; y: number; scale: number }
		) => {
			updateViewport(fn(simpleViewport));
		}
	};

	// Initialize stores and real-time connection
	onMount(async () => {
		try {
			// Initialize stores
			// userRoleStore is already set in page.server.ts
			emitterStore.init(supabase);
			await emitterStore.loadEmitters(field.id);

			// Set up simple viewport to center the field
			// Wait a frame for the canvas element to be available
			setTimeout(() => {
				centerField();
			}, 0);

			// Connect to real-time updates
			const subscription = subscribeToEmitters(supabase, field.id);
			realtimeUnsubscribe = subscription.unsubscribe;

			isLoading = false;
		} catch (err) {
			console.error('Failed to initialize field visualizer:', err);
			error = err instanceof Error ? err.message : 'Unknown error occurred';
			isLoading = false;
		}
	});

	// Cleanup on destroy
	onDestroy(() => {
		if (realtimeUnsubscribe) {
			realtimeUnsubscribe();
		}
	});

	// Handle zoom controls
	function handleZoomIn() {
		updateViewport({ ...simpleViewport, scale: simpleViewport.scale * 1.2 });
	}

	function handleZoomOut() {
		updateViewport({ ...simpleViewport, scale: simpleViewport.scale * 0.8 });
	}

	function handleZoomToFit() {
		centerField();
	}

	function handleZoomToActual() {
		const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
		updateViewport({
			x: (canvasWidth - field.width) / 2,
			y: (canvasHeight - field.height) / 2,
			scale: 1
		});
	}

	function handlePanReset() {
		const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
		updateViewport({
			...simpleViewport,
			x: (canvasWidth - field.width * simpleViewport.scale) / 2,
			y: (canvasHeight - field.height * simpleViewport.scale) / 2
		});
	}

	// Handle color selection
	let selectedColor = $state('#000000');
	function handleColorChange(event: CustomEvent<{ color: string }>) {
		selectedColor = event.detail.color;
	}
</script>

<div class="relative h-full w-full overflow-hidden bg-gray-900">
	{#if isLoading}
		<div class="flex h-full items-center justify-center">
			<div class="text-center">
				<div
					class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
				></div>
				<p class="text-gray-600">Loading field...</p>
			</div>
		</div>
	{:else if error}
		<div class="flex h-full items-center justify-center">
			<div class="rounded-lg bg-red-50 p-6 text-center">
				<div class="mx-auto mb-4 h-12 w-12 text-red-500">
					<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-lg font-semibold text-red-800">Error Loading Field</h3>
				<p class="text-red-700">{error}</p>
			</div>
		</div>
	{:else}
		<!-- Canvas Container -->
		<div class="relative h-full w-full" bind:this={canvasElement}>
			<!-- Main Canvas -->
			<FieldCanvas
				{field}
				emitters={emittersMapStore}
				viewport={viewportWrapped}
				{canEdit}
				{selectedColor}
				onEmitterPlace={(x, y, color) => {
					if (!canEdit) return;

					// Ensure coordinates are within field bounds
					const clampedX = Math.max(0, Math.min(field.width - 1, Math.round(x)));
					const clampedY = Math.max(1, Math.min(field.height, Math.round(y))); // y must be > 0

					emitterStore.addEmitter({
						field_id: field.id,
						x: clampedX,
						y: clampedY,
						color
					});
				}}
			/>

			<!-- Canvas Overlay -->
			<CanvasOverlay {field} viewport={viewportWrapped} {canEdit} {selectedColor} />

			<!-- Role Guard -->
			<RoleGuard
				userRole={userRole === 'owner' ? 'editor' : userRole === 'editor' ? 'editor' : 'viewer'}
				isOwner={userRole === 'owner'}
				isPublic={userRole === 'public'}
			/>
		</div>

		<!-- Controls Bar -->
		<ControlsBar
			currentColor={selectedColor}
			currentZoom={simpleViewport.scale}
			userRole={userRole === 'owner' ? 'editor' : userRole === 'editor' ? 'editor' : 'viewer'}
			isOwner={userRole === 'owner'}
			isPublic={userRole === 'public'}
			on:colorChanged={handleColorChange}
			on:zoomIn={handleZoomIn}
			on:zoomOut={handleZoomOut}
			on:zoomToFit={handleZoomToFit}
			on:zoomToActual={handleZoomToActual}
			on:resetPan={handlePanReset}
		/>

		<!-- Real-time Activity Indicator -->
		<div class="fixed top-4 left-4 z-50">
			<div
				class="flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur-sm"
			>
				<div class="h-2 w-2 rounded-full {realtimeActive ? 'bg-green-500' : 'bg-gray-400'}"></div>
				<span class="text-gray-700">
					{realtimeActive ? 'Real-time Active' : 'No Recent Activity'}
				</span>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Remove global body styles that interfere with page scrolling */
</style>
