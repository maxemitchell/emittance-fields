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

	// Handle keyboard navigation for accessibility
	function handleKeyDown(event: KeyboardEvent) {
		if (!canEdit || !cursorPosition) return;

		let newX = cursorPosition.x;
		let newY = cursorPosition.y;

		switch (event.key) {
			case 'ArrowLeft':
				newX = Math.max(0, newX - 1);
				event.preventDefault();
				break;
			case 'ArrowRight':
				newX = Math.min(field.width - 1, newX + 1);
				event.preventDefault();
				break;
			case 'ArrowUp':
				newY = Math.max(0, newY - 1);
				event.preventDefault();
				break;
			case 'ArrowDown':
				newY = Math.min(field.height - 1, newY + 1);
				event.preventDefault();
				break;
			case 'Enter':
			case ' ':
				// Place emitter at current cursor position
				if (cursorPosition) {
					// Dispatch custom event for placing emitter
					overlayElement.dispatchEvent(
						new CustomEvent('placeEmitter', {
							detail: { x: cursorPosition.x, y: cursorPosition.y, color: selectedColor }
						})
					);
				}
				event.preventDefault();
				break;
			default:
				return;
		}

		if (newX !== cursorPosition.x || newY !== cursorPosition.y) {
			cursorPosition = { x: newX, y: newY };
			// Update mouse position for visual feedback
			if (overlayElement) {
				const screenPos = fieldToScreen(newX, newY);
				mouseX = screenPos.x + overlayElement.getBoundingClientRect().left;
				mouseY = screenPos.y + overlayElement.getBoundingClientRect().top;
			}
		}
	}

	// Calculate grid pattern properties for SVG pattern-based rendering
	const gridPattern = $derived(() => {
		// Only show grid if zoomed in enough (when each pixel is at least 4 screen pixels)
		if ($viewport.scale < 4) return null;

		// Show every pixel when highly zoomed, every few pixels when less zoomed
		const step = $viewport.scale >= 8 ? 1 : Math.max(1, Math.floor(10 / $viewport.scale));
		const patternSize = step * $viewport.scale;

		return {
			size: patternSize,
			step,
			// Calculate visible viewport bounds in field coordinates to limit pattern area
			viewportBounds: {
				minX: Math.max(0, Math.floor(-$viewport.x / $viewport.scale)),
				minY: Math.max(0, Math.floor(-$viewport.y / $viewport.scale)),
				maxX: Math.min(
					field.width,
					Math.ceil((-$viewport.x + window.innerWidth) / $viewport.scale)
				),
				maxY: Math.min(
					field.height,
					Math.ceil((-$viewport.y + window.innerHeight) / $viewport.scale)
				)
			}
		};
	});

	// Generate visible grid lines only (for fallback if SVG patterns don't work)
	function generateVisibleGridLines() {
		const gridLines: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = [];

		if (!gridPattern) return gridLines;

		const { step, viewportBounds } = gridPattern;

		// Only generate lines that are visible in the current viewport
		// Vertical lines
		for (
			let x = Math.floor(viewportBounds.minX / step) * step;
			x <= viewportBounds.maxX;
			x += step
		) {
			if (x < 0 || x > field.width) continue;
			const screenPos = fieldToScreen(x, Math.max(0, viewportBounds.minY));
			const endPos = fieldToScreen(x, Math.min(field.height, viewportBounds.maxY));
			gridLines.push({
				x1: Math.round(screenPos.x) + 0.5,
				y1: Math.round(screenPos.y),
				x2: Math.round(endPos.x) + 0.5,
				y2: Math.round(endPos.y),
				key: `v-${x}`
			});
		}

		// Horizontal lines
		for (
			let y = Math.floor(viewportBounds.minY / step) * step;
			y <= viewportBounds.maxY;
			y += step
		) {
			if (y < 0 || y > field.height) continue;
			const screenPos = fieldToScreen(Math.max(0, viewportBounds.minX), y);
			const endPos = fieldToScreen(Math.min(field.width, viewportBounds.maxX), y);
			gridLines.push({
				x1: Math.round(screenPos.x),
				y1: Math.round(screenPos.y) + 0.5,
				x2: Math.round(endPos.x),
				y2: Math.round(endPos.y) + 0.5,
				key: `h-${y}`
			});
		}

		return gridLines;
	}

	// Get visible grid lines (only render what's visible)
	const gridLines = $derived(showGrid && !gridPattern ? generateVisibleGridLines() : []);

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
	onkeydown={handleKeyDown}
	role="application"
	aria-label="Field visualization with {field.width}x{field.height} pixels - use arrow keys to navigate, Enter to place emitter"
	tabindex="0"
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
	{#if showGrid}
		{#if gridPattern}
			<!-- Use SVG pattern for better performance -->
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
				<defs>
					<pattern
						id="grid-pattern"
						width={gridPattern.size}
						height={gridPattern.size}
						patternUnits="userSpaceOnUse"
					>
						<path
							d="M {gridPattern.size} 0 L 0 0 0 {gridPattern.size}"
							fill="none"
							stroke="#000"
							stroke-width="1"
						/>
					</pattern>
				</defs>
				<rect
					x={fieldBounds().x}
					y={fieldBounds().y}
					width={fieldBounds().width}
					height={fieldBounds().height}
					fill="url(#grid-pattern)"
				/>
			</svg>
		{:else if gridLines.length > 0}
			<!-- Fallback to individual lines -->
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
					<line
						x1={line.x1}
						y1={line.y1}
						x2={line.x2}
						y2={line.y2}
						stroke="#000"
						stroke-width="1"
					/>
				{/each}
			</svg>
		{/if}
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
