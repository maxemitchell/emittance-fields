import type { Field } from '../../db/fields';
import type { Emitter } from '../../db/emitters';

interface Viewport {
	x: number;
	y: number;
	scale: number;
}

interface DirtyRegion {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface CanvasRendererOptions {
	enableDirtyRegions?: boolean;
	enableOffscreenCanvas?: boolean;
	pixelRatio?: number;
}

export class CanvasRenderer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private offscreenCanvas?: OffscreenCanvas;
	private tempCanvas: HTMLCanvasElement;
	private tempCtx: CanvasRenderingContext2D;
	private field: Field;
	private emitters: Map<string, Emitter> = new Map();
	private viewport: Viewport = { x: 0, y: 0, scale: 1 };
	private dirtyRegions: DirtyRegion[] = [];
	private options: CanvasRendererOptions;
	private animationId?: number;
	private needsRedraw = false;
	private imageData?: ImageData;

	constructor(canvas: HTMLCanvasElement, field: Field, options: CanvasRendererOptions = {}) {
		this.canvas = canvas;
		this.field = field;
		this.options = {
			enableDirtyRegions: true,
			enableOffscreenCanvas: typeof OffscreenCanvas !== 'undefined',
			pixelRatio: 1, // Force 1:1 pixel ratio for crisp rendering
			...options
		};

		const ctx = canvas.getContext('2d', {
			alpha: false
		});
		if (!ctx) {
			throw new Error('Failed to get 2D context');
		}
		this.ctx = ctx;

		// Set up reusable temporary canvas
		this.tempCanvas = document.createElement('canvas');
		this.tempCanvas.width = field.width;
		this.tempCanvas.height = field.height;
		const tempCtx = this.tempCanvas.getContext('2d', {
			alpha: false
		});
		if (!tempCtx) {
			throw new Error('Failed to get 2D context for temp canvas');
		}
		this.tempCtx = tempCtx;
		this.tempCtx.imageSmoothingEnabled = false;

		// Set up offscreen canvas if enabled and available
		if (this.options.enableOffscreenCanvas && typeof OffscreenCanvas !== 'undefined') {
			this.offscreenCanvas = new OffscreenCanvas(field.width, field.height);
		}

		this.setupCanvas();
		this.initializeImageData();
	}

	private setupCanvas() {
		// Configure canvas for pixel-perfect rendering
		this.ctx.imageSmoothingEnabled = false;
		// Legacy browser support for image smoothing
		const ctx = this.ctx as CanvasRenderingContext2D & {
			webkitImageSmoothingEnabled?: boolean;
			mozImageSmoothingEnabled?: boolean;
			msImageSmoothingEnabled?: boolean;
		};
		if (ctx.webkitImageSmoothingEnabled !== undefined) ctx.webkitImageSmoothingEnabled = false;
		if (ctx.mozImageSmoothingEnabled !== undefined) ctx.mozImageSmoothingEnabled = false;
		if (ctx.msImageSmoothingEnabled !== undefined) ctx.msImageSmoothingEnabled = false;

		// Set canvas size to exact pixel dimensions
		const rect = this.canvas.getBoundingClientRect();
		this.canvas.width = Math.floor(rect.width);
		this.canvas.height = Math.floor(rect.height);

		// Ensure crisp pixel rendering
		this.canvas.style.imageRendering = 'pixelated';
		this.canvas.style.imageRendering = 'crisp-edges';
	}

	private initializeImageData() {
		// Create ImageData buffer for efficient pixel manipulation
		this.imageData = this.ctx.createImageData(this.field.width, this.field.height);

		// Fill with background color
		const bgColor = this.hexToRgb(this.field.background_color);
		for (let i = 0; i < this.imageData.data.length; i += 4) {
			this.imageData.data[i] = bgColor.r; // R
			this.imageData.data[i + 1] = bgColor.g; // G
			this.imageData.data[i + 2] = bgColor.b; // B
			this.imageData.data[i + 3] = 255; // A
		}
	}

	private hexToRgb(hex: string): { r: number; g: number; b: number } {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16)
				}
			: { r: 0, g: 0, b: 0 };
	}

	private setPixel(x: number, y: number, color: string) {
		if (!this.imageData || x < 0 || x >= this.field.width || y < 0 || y >= this.field.height) {
			return;
		}

		const rgb = this.hexToRgb(color);
		const index = (y * this.field.width + x) * 4;

		this.imageData.data[index] = rgb.r;
		this.imageData.data[index + 1] = rgb.g;
		this.imageData.data[index + 2] = rgb.b;
		this.imageData.data[index + 3] = 255;
	}

	private renderEmittersToImageData() {
		if (!this.imageData) return;

		// Reset to background color
		const bgColor = this.hexToRgb(this.field.background_color);
		for (let i = 0; i < this.imageData.data.length; i += 4) {
			this.imageData.data[i] = bgColor.r;
			this.imageData.data[i + 1] = bgColor.g;
			this.imageData.data[i + 2] = bgColor.b;
			this.imageData.data[i + 3] = 255;
		}

		// Render emitters
		for (const emitter of this.emitters.values()) {
			this.setPixel(emitter.x, emitter.y, emitter.color);
		}
	}

	private renderToCanvas() {
		if (!this.imageData) return;

		// Clear canvas
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Use reusable temporary canvas
		this.tempCtx.putImageData(this.imageData, 0, 0);

		// Calculate pixel-aligned transform
		const translateX = Math.round(this.viewport.x);
		const translateY = Math.round(this.viewport.y);
		const scale = this.viewport.scale;

		// Draw the field to the main canvas with pixel-aligned transform
		this.ctx.save();
		this.ctx.translate(translateX, translateY);
		this.ctx.scale(scale, scale);

		// For pixel-perfect rendering, we want to ensure the image lands on exact pixel boundaries
		// When the scale is an integer, this helps avoid sub-pixel rendering
		if (scale % 1 === 0) {
			// Integer scale - can render pixel-perfect
			this.ctx.drawImage(this.tempCanvas, 0, 0);
		} else {
			// Non-integer scale - still render but may have some antialiasing
			this.ctx.drawImage(this.tempCanvas, 0, 0);
		}

		this.ctx.restore();
	}

	private renderFrame = () => {
		if (!this.needsRedraw) return;

		this.renderEmittersToImageData();
		this.renderToCanvas();

		this.needsRedraw = false;
		this.animationId = undefined;
	};

	private scheduleRender() {
		if (this.animationId) return;

		this.needsRedraw = true;
		this.animationId = requestAnimationFrame(this.renderFrame);
	}

	// Public API
	updateField(field: Field) {
		this.field = field;
		this.initializeImageData();
		this.scheduleRender();
	}

	updateEmitters(emitters: Map<string, Emitter>) {
		this.emitters = new Map(emitters);
		this.scheduleRender();
	}

	updateViewport(viewport: Viewport) {
		this.viewport = { ...viewport };
		this.scheduleRender();
	}

	addEmitter(emitter: Emitter) {
		this.emitters.set(emitter.id, emitter);
		if (this.options.enableDirtyRegions) {
			this.dirtyRegions.push({
				x: emitter.x,
				y: emitter.y,
				width: 1,
				height: 1
			});
		}
		this.scheduleRender();
	}

	removeEmitter(id: string) {
		const emitter = this.emitters.get(id);
		if (emitter) {
			this.emitters.delete(id);
			if (this.options.enableDirtyRegions) {
				this.dirtyRegions.push({
					x: emitter.x,
					y: emitter.y,
					width: 1,
					height: 1
				});
			}
			this.scheduleRender();
		}
	}

	updateEmitter(id: string, updates: Partial<Emitter>) {
		const emitter = this.emitters.get(id);
		if (emitter) {
			const oldX = emitter.x;
			const oldY = emitter.y;

			const updatedEmitter = { ...emitter, ...updates };
			this.emitters.set(id, updatedEmitter);

			if (this.options.enableDirtyRegions) {
				// Mark old position as dirty
				this.dirtyRegions.push({
					x: oldX,
					y: oldY,
					width: 1,
					height: 1
				});

				// Mark new position as dirty if position changed
				if (updates.x !== undefined || updates.y !== undefined) {
					this.dirtyRegions.push({
						x: updatedEmitter.x,
						y: updatedEmitter.y,
						width: 1,
						height: 1
					});
				}
			}

			this.scheduleRender();
		}
	}

	resize(width: number, height: number) {
		this.canvas.width = Math.floor(width);
		this.canvas.height = Math.floor(height);
		this.canvas.style.width = `${Math.floor(width)}px`;
		this.canvas.style.height = `${Math.floor(height)}px`;
		this.setupCanvas();
		this.scheduleRender();
	}

	getEmitterAt(x: number, y: number): Emitter | undefined {
		for (const emitter of this.emitters.values()) {
			if (emitter.x === x && emitter.y === y) {
				return emitter;
			}
		}
		return undefined;
	}

	destroy() {
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
		}
		this.emitters.clear();
		this.dirtyRegions.length = 0;
	}
}

export function useCanvasRenderer(
	canvas: HTMLCanvasElement,
	field: Field,
	options?: CanvasRendererOptions
) {
	const renderer = new CanvasRenderer(canvas, field, options);

	return {
		updateField: renderer.updateField.bind(renderer),
		updateEmitters: renderer.updateEmitters.bind(renderer),
		updateViewport: renderer.updateViewport.bind(renderer),
		addEmitter: renderer.addEmitter.bind(renderer),
		removeEmitter: renderer.removeEmitter.bind(renderer),
		updateEmitter: renderer.updateEmitter.bind(renderer),
		resize: renderer.resize.bind(renderer),
		getEmitterAt: renderer.getEmitterAt.bind(renderer),
		destroy: renderer.destroy.bind(renderer)
	};
}
