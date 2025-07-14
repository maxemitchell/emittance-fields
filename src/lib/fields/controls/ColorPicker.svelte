<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		colorChanged: { color: string };
	}>();

	let { currentColor = '#000000' } = $props<{
		currentColor?: string;
	}>();

	let isOpen = $state(false);
	let hexInput = $state(currentColor);
	let selectedIndex = $state(0);
	let focusedGrid = $state<'recent' | 'palette'>('recent');

	// Prop reactivity sync
	$effect(() => {
		if (currentColor !== hexInput && !isOpen) {
			hexInput = currentColor;
		}
	});

	// Recent colors - could be stored in localStorage
	const recentColors = $state([
		'#FF0000',
		'#00FF00',
		'#0000FF',
		'#FFFF00',
		'#FF00FF',
		'#00FFFF',
		'#000000',
		'#FFFFFF'
	]);

	// Common color palette
	const colorPalette = [
		['#FF0000', '#FF4500', '#FF8C00', '#FFD700', '#FFFF00', '#ADFF2F', '#00FF00', '#00CED1'],
		['#00BFFF', '#0080FF', '#0000FF', '#8A2BE2', '#9400D3', '#FF00FF', '#FF1493', '#DC143C'],
		['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D3D3D3', '#A9A9A9'],
		['#696969', '#778899', '#708090', '#2F4F4F', '#000000', '#191970', '#800080', '#8B008B']
	];

	function isValidHex(hex: string): boolean {
		return /^#[0-9A-F]{6}$/i.test(hex);
	}

	function handleHexInput(event: Event) {
		const target = event.target as HTMLInputElement;
		let value = target.value;

		// Ensure it starts with #
		if (!value.startsWith('#')) {
			value = '#' + value;
		}

		// Remove invalid characters and limit to 7 characters
		value = value.replace(/[^#0-9A-F]/gi, '').substring(0, 7);

		hexInput = value;

		// If it's a valid hex color, update the current color
		if (isValidHex(value)) {
			currentColor = value.toUpperCase();
			dispatch('colorChanged', { color: currentColor });
		}
	}

	function selectColor(color: string) {
		currentColor = color;
		hexInput = color;

		// Add to recent colors if not already there
		if (!recentColors.includes(color)) {
			recentColors.unshift(color);
			if (recentColors.length > 8) {
				recentColors.pop();
			}
		}

		dispatch('colorChanged', { color: currentColor });
		isOpen = false;
	}

	function togglePicker() {
		isOpen = !isOpen;
	}

	// Close picker when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.color-picker-container')) {
			isOpen = false;
		}
	}

	// Handle keyboard navigation in color picker
	function handleKeyDown(event: KeyboardEvent) {
		if (!isOpen) return;

		switch (event.key) {
			case 'Escape':
				isOpen = false;
				event.preventDefault();
				break;
			case 'Tab':
				// Allow normal tab behavior
				break;
			case 'ArrowLeft':
				navigateGrid(-1, 0);
				event.preventDefault();
				break;
			case 'ArrowRight':
				navigateGrid(1, 0);
				event.preventDefault();
				break;
			case 'ArrowUp':
				navigateGrid(0, -1);
				event.preventDefault();
				break;
			case 'ArrowDown':
				navigateGrid(0, 1);
				event.preventDefault();
				break;
			case 'Enter':
			case ' ':
				selectCurrentColor();
				event.preventDefault();
				break;
		}
	}

	function navigateGrid(deltaX: number, deltaY: number) {
		const colors = focusedGrid === 'recent' ? recentColors : colorPalette.flat();
		const cols = focusedGrid === 'recent' ? 8 : 8;

		const currentRow = Math.floor(selectedIndex / cols);
		const currentCol = selectedIndex % cols;

		let newRow = currentRow + deltaY;
		let newCol = currentCol + deltaX;

		// Switch between grids when moving up/down at boundaries
		if (focusedGrid === 'recent' && newRow < 0) {
			focusedGrid = 'palette';
			newRow = colorPalette.length - 1;
			selectedIndex = newRow * 8 + newCol;
		} else if (focusedGrid === 'palette' && newRow >= colorPalette.length) {
			focusedGrid = 'recent';
			newRow = 0;
			selectedIndex = newCol;
		} else {
			// Clamp to bounds
			newRow = Math.max(0, Math.min(newRow, Math.floor(colors.length / cols)));
			newCol = Math.max(0, Math.min(newCol, cols - 1));
			selectedIndex = newRow * cols + newCol;
		}

		// Ensure index is within bounds
		selectedIndex = Math.max(0, Math.min(selectedIndex, colors.length - 1));
	}

	function selectCurrentColor() {
		const colors = focusedGrid === 'recent' ? recentColors : colorPalette.flat();
		if (selectedIndex < colors.length) {
			selectColor(colors[selectedIndex]);
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="color-picker-container relative">
	<button
		type="button"
		class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-300 bg-white shadow-sm transition-all hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
		onclick={togglePicker}
		aria-label="Choose color"
	>
		<div
			class="h-6 w-6 rounded border border-gray-300"
			style="background-color: {currentColor};"
		></div>
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 bottom-12 z-50 w-64 rounded-lg border bg-white p-4 shadow-lg"
			role="dialog"
			aria-label="Color picker"
			tabindex="0"
			onkeydown={handleKeyDown}
		>
			<!-- Hex input -->
			<div class="mb-4">
				<label for="hex-input" class="mb-2 block text-sm font-medium text-gray-700">
					Hex Color
				</label>
				<input
					id="hex-input"
					type="text"
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					bind:value={hexInput}
					oninput={handleHexInput}
					placeholder="#000000"
					maxlength="7"
				/>
				{#if !isValidHex(hexInput)}
					<p class="mt-1 text-xs text-red-600">Enter a valid hex color (e.g., #FF0000)</p>
				{/if}
			</div>

			<!-- Recent colors -->
			<div class="mb-4">
				<p class="mb-2 text-sm font-medium text-gray-700">Recent Colors</p>
				<div class="flex flex-wrap gap-2" role="listbox" aria-label="Recent colors">
					{#each recentColors as color, index (color)}
						<button
							type="button"
							class="h-8 w-8 rounded border border-gray-300 transition-all hover:scale-110 focus:ring-2 focus:ring-blue-500 focus:outline-none {focusedGrid ===
								'recent' && selectedIndex === index
								? 'ring-2 ring-blue-500'
								: ''}"
							style="background-color: {color};"
							onclick={() => selectColor(color)}
							aria-label="Select {color}"
							role="option"
							aria-selected={focusedGrid === 'recent' && selectedIndex === index}
						></button>
					{/each}
				</div>
			</div>

			<!-- Color palette -->
			<div>
				<p class="mb-2 text-sm font-medium text-gray-700">Color Palette</p>
				<div class="space-y-2" role="listbox" aria-label="Color palette">
					{#each colorPalette as row, rowIndex (rowIndex)}
						<div class="flex gap-2">
							{#each row as color, colIndex (color)}
								{@const paletteIndex = rowIndex * 8 + colIndex}
								<button
									type="button"
									class="h-8 w-8 rounded border border-gray-300 transition-all hover:scale-110 focus:ring-2 focus:ring-blue-500 focus:outline-none {focusedGrid ===
										'palette' && selectedIndex === paletteIndex
										? 'ring-2 ring-blue-500'
										: ''}"
									style="background-color: {color};"
									onclick={() => selectColor(color)}
									aria-label="Select {color}"
									role="option"
									aria-selected={focusedGrid === 'palette' && selectedIndex === paletteIndex}
								></button>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.color-picker-container {
		/* Ensure dropdown appears above other content */
		z-index: 10;
	}
</style>
