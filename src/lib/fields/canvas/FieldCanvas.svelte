<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { useCanvasRenderer } from './useCanvasRenderer';
	import type { Field } from '../../db/fields';
	import type { Emitter } from '../../db/emitters';
	import type { Writable, Readable } from 'svelte/store';

	interface Viewport {
		x: number;
		y: number;
		scale: number;
	}

	interface Props {
		field: Field;
		viewport: Writable<Viewport>;
		emitters: Readable<Map<string, Emitter>>;
		canEdit: boolean;
		selectedColor?: string;
		onEmitterPlace?: (x: number, y: number, color: string) => void;
		onEmitterSelect?: (emitter: Emitter) => void;
		onEmitterHover?: (emitter: Emitter | null) => void;
	}

	let {
		field,
		viewport,
		emitters,
		canEdit,
		selectedColor = '#000000',
		onEmitterPlace,
		onEmitterSelect,
		onEmitterHover
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let renderer: ReturnType<typeof useCanvasRenderer>;
	let isPointerDown = false;
	let lastPointerPos = { x: 0, y: 0 };
	let isPanning = false;
	let hoveredEmitter: Emitter | null = null;

	// Transform screen coordinates to field coordinates
	function screenToField(clientX: number, clientY: number): { x: number; y: number } {
		const rect = canvas.getBoundingClientRect();
		const canvasX = clientX - rect.left;
		const canvasY = clientY - rect.top;

		// Simple translation-based coordinate system
		const fieldX = Math.floor((canvasX - $viewport.x) / $viewport.scale);
		const fieldY = Math.floor((canvasY - $viewport.y) / $viewport.scale);

		return { x: fieldX, y: fieldY };
	}

	// Clamp coordinates to field bounds
	function clampToField(x: number, y: number): { x: number; y: number } {
		return {
			x: Math.max(0, Math.min(field.width - 1, Math.round(x))),
			y: Math.max(1, Math.min(field.height, Math.round(y))) // y must be > 0, so min is 1
		};
	}

	// Handle pointer down (mouse or touch)
	function handlePointerDown(event: PointerEvent) {
		canvas.setPointerCapture(event.pointerId);
		isPointerDown = true;
		lastPointerPos = { x: event.clientX, y: event.clientY };

		// Check if we're starting a pan (right click or with modifier keys)
		isPanning = event.button === 2 || event.ctrlKey || event.metaKey;

		if (!isPanning && canEdit) {
			// Place emitter immediately on click
			const fieldPos = screenToField(event.clientX, event.clientY);
			const clampedPos = clampToField(fieldPos.x, fieldPos.y);

			if (clampedPos.x >= 0 && clampedPos.y >= 0) {
				onEmitterPlace?.(clampedPos.x, clampedPos.y, selectedColor);
			}
		}
	}

	// Handle pointer move
	function handlePointerMove(event: PointerEvent) {
		const currentPos = { x: event.clientX, y: event.clientY };

		if (isPointerDown) {
			if (isPanning) {
				// Pan the viewport
				const deltaX = currentPos.x - lastPointerPos.x;
				const deltaY = currentPos.y - lastPointerPos.y;

				viewport.update((v) => ({
					...v,
					x: v.x + deltaX,
					y: v.y + deltaY
				}));
			} else if (canEdit) {
				// Continue placing emitters while dragging
				const fieldPos = screenToField(event.clientX, event.clientY);
				const clampedPos = clampToField(fieldPos.x, fieldPos.y);

				if (clampedPos.x >= 0 && clampedPos.y >= 0) {
					onEmitterPlace?.(clampedPos.x, clampedPos.y, selectedColor);
				}
			}
		} else {
			// Handle hover
			const fieldPos = screenToField(event.clientX, event.clientY);
			const clampedPos = clampToField(fieldPos.x, fieldPos.y);

			if (clampedPos.x >= 0 && clampedPos.y >= 0) {
				const emitter = renderer?.getEmitterAt(clampedPos.x, clampedPos.y);
				if (emitter !== hoveredEmitter) {
					hoveredEmitter = emitter || null;
					onEmitterHover?.(hoveredEmitter);
				}
			}
		}

		lastPointerPos = currentPos;
	}

	// Handle pointer up
	function handlePointerUp(event: PointerEvent) {
		canvas.releasePointerCapture(event.pointerId);
		isPointerDown = false;
		isPanning = false;

		// If we weren't panning or dragging, this might be a click to select
		if (!isPanning && hoveredEmitter) {
			onEmitterSelect?.(hoveredEmitter);
		}
	}

	// Handle wheel zoom
	function handleWheel(event: WheelEvent) {
		// Only prevent default and zoom if mouse is over the canvas
		const rect = canvas.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;

		// Check if mouse is within canvas bounds
		if (mouseX < 0 || mouseX > rect.width || mouseY < 0 || mouseY > rect.height) {
			return; // Don't handle wheel events outside canvas
		}

		event.preventDefault();

		const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;

		viewport.update((v) => {
			const newScale = Math.max(0.1, Math.min(10, v.scale * scaleFactor));
			const scaleChange = newScale / v.scale;

			// Zoom towards mouse position
			const newX = mouseX - (mouseX - v.x) * scaleChange;
			const newY = mouseY - (mouseY - v.y) * scaleChange;

			return {
				x: newX,
				y: newY,
				scale: newScale
			};
		});
	}

	// Handle context menu (prevent default to allow right-click pan)
	function handleContextMenu(event: MouseEvent) {
		event.preventDefault();
	}

	// Handle resize
	function handleResize() {
		if (canvas && renderer) {
			const rect = canvas.getBoundingClientRect();
			renderer.resize(rect.width, rect.height);
		}
	}

	// Handle keyboard shortcuts
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'r' && !event.ctrlKey && !event.metaKey) {
			// Reset viewport
			viewport.set({ x: 0, y: 0, scale: 1 });
			event.preventDefault();
		}
	}

	onMount(() => {
		if (canvas) {
			renderer = useCanvasRenderer(canvas, field, {
				enableDirtyRegions: true,
				enableOffscreenCanvas: true
			});

			// Initial render
			renderer.updateEmitters($emitters);
			renderer.updateViewport($viewport);

			// Set up resize observer
			const resizeObserver = new ResizeObserver(handleResize);
			resizeObserver.observe(canvas);

			// Add keyboard event listener
			window.addEventListener('keydown', handleKeyDown);

			// Initial size
			handleResize();

			return () => {
				resizeObserver.disconnect();
				window.removeEventListener('keydown', handleKeyDown);
			};
		}
	});

	onDestroy(() => {
		renderer?.destroy();
	});

	// Reactive updates
	$effect(() => {
		if (renderer) {
			renderer.updateEmitters($emitters);
		}
	});

	$effect(() => {
		if (renderer) {
			renderer.updateViewport($viewport);
		}
	});

	$effect(() => {
		if (renderer) {
			renderer.updateField(field);
		}
	});
</script>

<canvas
	bind:this={canvas}
	class="field-canvas"
	style="
		width: 100%;
		height: 100%;
		cursor: {canEdit ? 'crosshair' : 'default'};
		background-color: {field.background_color};
	"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onwheel={handleWheel}
	oncontextmenu={handleContextMenu}
	tabindex="0"
	aria-label="Field canvas for placing emitters"
>
	Your browser does not support the HTML5 canvas element.
</canvas>

<style>
	.field-canvas {
		touch-action: none;
		user-select: none;
		outline: none;
		border: 1px solid #ccc;
	}

	.field-canvas:focus {
		outline: 2px solid #007acc;
		outline-offset: 2px;
	}
</style>
