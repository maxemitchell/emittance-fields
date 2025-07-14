<script lang="ts">
	import type { Field } from '../../db/fields';
	import type { Emitter } from '../../db/emitters';
	import type { Writable } from 'svelte/store';

	interface Viewport {
		x: number;
		y: number;
		scale: number;
	}

	interface Props {
		field: Field;
		viewport: Writable<Viewport>;
		canEdit: boolean;
		selectedColor?: string;
		showGrid?: boolean;
		showCursor?: boolean;
		showHoverPreview?: boolean;
		cursorPosition?: { x: number; y: number } | null;
		hoveredEmitter?: Emitter | null;
	}

	let {
		field,
		viewport,
		canEdit,
		selectedColor = '#000000',
		showGrid = true,
		showCursor = true,
		showHoverPreview = true,
		cursorPosition = null,
		hoveredEmitter = null
	}: Props = $props();

	let overlayElement: HTMLDivElement;
	let mouseX = $state(0);
	let mouseY = $state(0);
	let isMouseInside = $state(false);

	// Transform field coordinates to screen coordinates
	function fieldToScreen(fieldX: number, fieldY: number): { x: number; y: number } {
		const screenX = fieldX * $viewport.scale + $viewport.x;
		const screenY = fieldY * $viewport.scale + $viewport.y;
		return { x: screenX, y: screenY };
	}

	// Transform screen coordinates to field coordinates
	function screenToField(clientX: number, clientY: number): { x: number; y: number } {
		if (!overlayElement) return { x: 0, y: 0 };

		const rect = overlayElement.getBoundingClientRect();
		const canvasX = clientX - rect.left;
		const canvasY = clientY - rect.top;

		const fieldX = Math.floor((canvasX - $viewport.x) / $viewport.scale);
		const fieldY = Math.floor((canvasY - $viewport.y) / $viewport.scale);

		return { x: fieldX, y: fieldY };
	}

	// Clamp coordinates to field bounds
	function clampToField(x: number, y: number): { x: number; y: number } {
		return {
			x: Math.max(0, Math.min(field.width - 1, x)),
			y: Math.max(0, Math.min(field.height - 1, y))
		};
	}

	// Handle mouse movement for cursor tracking
	function handleMouseMove(event: MouseEvent) {
		mouseX = event.clientX;
		mouseY = event.clientY;

		if (overlayElement) {
			const fieldPos = screenToField(event.clientX, event.clientY);
			const clampedPos = clampToField(fieldPos.x, fieldPos.y);

			// Update cursor position for display
			if (clampedPos.x >= 0 && clampedPos.y >= 0) {
				cursorPosition = clampedPos;
			}
		}
	}

	function handleMouseEnter() {
		isMouseInside = true;
	}

	function handleMouseLeave() {
		isMouseInside = false;
		cursorPosition = null;
	}

	// Generate grid lines
	function generateGridLines() {
		const gridLines: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = [];

		// Only show grid if zoomed in enough (when each pixel is at least 4 screen pixels)
		if ($viewport.scale < 4) return gridLines;

		// Show every pixel when highly zoomed, every few pixels when less zoomed
		const step = $viewport.scale >= 8 ? 1 : Math.max(1, Math.floor(10 / $viewport.scale));

		// Vertical lines - align to pixel boundaries
		for (let x = 0; x <= field.width; x += step) {
			const screenPos = fieldToScreen(x, 0);
			const endPos = fieldToScreen(x, field.height);
			gridLines.push({
				x1: Math.round(screenPos.x) + 0.5, // +0.5 for crisp 1px lines
				y1: Math.round(screenPos.y),
				x2: Math.round(endPos.x) + 0.5,
				y2: Math.round(endPos.y),
				key: `v-${x}`
			});
		}

		// Horizontal lines - align to pixel boundaries
		for (let y = 0; y <= field.height; y += step) {
			const screenPos = fieldToScreen(0, y);
			const endPos = fieldToScreen(field.width, y);
			gridLines.push({
				x1: Math.round(screenPos.x),
				y1: Math.round(screenPos.y) + 0.5, // +0.5 for crisp 1px lines
				x2: Math.round(endPos.x),
				y2: Math.round(endPos.y) + 0.5,
				key: `h-${y}`
			});
		}

		return gridLines;
	}

	// Get visible grid lines
	const gridLines = $derived(showGrid ? generateGridLines() : []);

	// Get hover preview position
	const hoverPreviewPosition = $derived(() => {
		if (!showHoverPreview || !canEdit || !cursorPosition || !isMouseInside) return null;

		const screenPos = fieldToScreen(cursorPosition.x, cursorPosition.y);
		return {
			x: Math.round(screenPos.x),
			y: Math.round(screenPos.y),
			size: Math.max(1, Math.round($viewport.scale))
		};
	});

	// Get cursor info text
	const cursorInfo = $derived(() => {
		if (!showCursor || !cursorPosition || !isMouseInside) return null;

		const existingEmitter = hoveredEmitter;
		if (existingEmitter) {
			return `(${existingEmitter.x}, ${existingEmitter.y}) - ${existingEmitter.color}`;
		}

		return `(${cursorPosition.x}, ${cursorPosition.y})`;
	});

	// Get field bounds in screen coordinates
	const fieldBounds = $derived(() => {
		const topLeft = fieldToScreen(0, 0);
		const bottomRight = fieldToScreen(field.width, field.height);

		return {
			x: topLeft.x,
			y: topLeft.y,
			width: bottomRight.x - topLeft.x,
			height: bottomRight.y - topLeft.y
		};
	});
</script>

<div
	bind:this={overlayElement}
	class="canvas-overlay"
	style="
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		overflow: hidden;
	"
	onmousemove={handleMouseMove}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="presentation"
>
	<!-- Field bounds outline -->
	<div
		class="field-bounds"
		style="
			position: absolute;
			left: {fieldBounds().x}px;
			top: {fieldBounds().y}px;
			width: {fieldBounds().width}px;
			height: {fieldBounds().height}px;
			border: 2px solid rgba(0, 0, 0, 0.3);
			box-sizing: border-box;
		"
	></div>

	<!-- Grid overlay -->
	{#if showGrid && gridLines.length > 0}
		<svg
			class="grid-overlay"
			style="
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				opacity: 0.4;
			"
			shape-rendering="crispEdges"
		>
			{#each gridLines as line (line.key)}
				<line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#000" stroke-width="1" />
			{/each}
		</svg>
	{/if}

	<!-- Hover preview -->
	{#if hoverPreviewPosition() && !hoveredEmitter}
		<div
			class="hover-preview"
			style="
				position: absolute;
				left: {hoverPreviewPosition()!.x}px;
				top: {hoverPreviewPosition()!.y}px;
				width: {hoverPreviewPosition()!.size}px;
				height: {hoverPreviewPosition()!.size}px;
				background-color: {selectedColor};
				opacity: 0.6;
				border: 1px solid rgba(255, 255, 255, 0.8);
				box-sizing: border-box;
				image-rendering: pixelated;
				z-index: 10;
			"
		></div>
	{/if}

	<!-- Crosshair -->
	{#if showCursor && isMouseInside && $viewport.scale > 4}
		<div
			class="crosshair"
			style="
				position: absolute;
				left: {mouseX}px;
				top: {mouseY}px;
				width: 20px;
				height: 20px;
				transform: translate(-50%, -50%);
				pointer-events: none;
				z-index: 20;
			"
		>
			<div
				style="
					position: absolute;
					left: 50%;
					top: 0;
					width: 1px;
					height: 100%;
					background-color: rgba(255, 255, 255, 0.8);
					transform: translateX(-50%);
				"
			></div>
			<div
				style="
					position: absolute;
					left: 0;
					top: 50%;
					width: 100%;
					height: 1px;
					background-color: rgba(255, 255, 255, 0.8);
					transform: translateY(-50%);
				"
			></div>
		</div>
	{/if}

	<!-- Cursor info -->
	{#if cursorInfo()}
		<div
			class="cursor-info"
			style="
				position: absolute;
				left: {mouseX + 15}px;
				top: {mouseY - 25}px;
				background-color: rgba(0, 0, 0, 0.8);
				color: white;
				padding: 4px 8px;
				border-radius: 4px;
				font-size: 12px;
				font-family: monospace;
				white-space: nowrap;
				z-index: 30;
				pointer-events: none;
			"
		>
			{cursorInfo()}
		</div>
	{/if}

	<!-- Emitter highlight -->
	{#if hoveredEmitter}
		{@const screenPos = fieldToScreen(hoveredEmitter.x, hoveredEmitter.y)}
		<div
			class="emitter-highlight"
			style="
				position: absolute;
				left: {screenPos.x}px;
				top: {screenPos.y}px;
				width: {$viewport.scale}px;
				height: {$viewport.scale}px;
				border: 2px solid rgba(255, 255, 255, 0.9);
				box-sizing: border-box;
				transform: translate(-50%, -50%);
				z-index: 15;
				animation: pulse 1s infinite;
			"
		></div>
	{/if}
</div>

<style>
	.canvas-overlay {
		user-select: none;
	}

	.field-bounds {
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5);
	}

	.hover-preview {
		image-rendering: pixelated;
		image-rendering: -moz-crisp-edges;
		image-rendering: crisp-edges;
	}

	.emitter-highlight {
		image-rendering: pixelated;
		image-rendering: -moz-crisp-edges;
		image-rendering: crisp-edges;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.cursor-info {
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
	}
</style>
