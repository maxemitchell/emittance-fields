# PR Review: Field Visualization and Canvas Rendering

## Executive Summary

This is a substantial and well-architected PR that implements the core field visualization system with canvas rendering, Svelte stores for state management, and comprehensive UI controls. The overall architecture is sound and appropriate for a SvelteKit + Supabase application. However, there are several critical issues around **store singleton leakage**, **accessibility gaps**, and **performance optimizations** that should be addressed before merging.

### Key Verdict on Stores Usage

**✅ STORES ARE APPROPRIATE HERE** - The use of Svelte stores for emitters and user roles fits well with the SvelteKit reactive model and the need for optimistic updates + real-time synchronization. The pattern should be kept but improved with the fixes outlined below.

---

## 🚨 Critical Issues (Must Fix)

### 1. Store Singleton Leakage (High Priority)

**Problem**: Both `emitterStore` and `userRoleStore` are global singletons that will cause state bleeding when users navigate between multiple fields.

**Impact**:

- Opening two field tabs will corrupt each other's state
- User permissions from one field leak into another
- Optimistic updates can appear in wrong fields

**Solution**: Refactor stores to use factory pattern:

```typescript
// emitters.ts
export const createEmitterStore = (supabase: SupabaseClient) => {
	// Current EmitterStore implementation but as instance, not singleton
};

// Usage in FieldVisualizer.svelte
const emitterStore = createEmitterStore(supabase);
onMount(() => emitterStore.loadEmitters(fieldId));
onDestroy(() => emitterStore.destroy());
```

### 2. getCurrentState() Memory Leak

**Problem**: `getCurrentState()` creates a new subscription on every call without cleanup.

**Solution**: Keep a single live subscription:

```typescript
private currentState: EmitterStoreState;

constructor() {
  this.store.subscribe(state => this.currentState = state);
}
```

### 3. Data Fetch Duplication

**Problem**: Page server fetches emitters, but FieldVisualizer ignores them and re-fetches via store.

**Impact**: Extra network request, loading flicker, poor UX

**Solution**: Hydrate store with server data:

```typescript
// FieldVisualizer.svelte
onMount(() => {
	emitterStore.hydrate(initialEmitters); // No network hit
	emitterStore.setupRealtime(fieldId);
});
```

---

## ⚠️ Major Issues (Should Fix)

### 4. Canvas Performance Bottlenecks

**Issues**:

- `renderEmittersToImageData()` repaints entire canvas each frame
- New `tempCanvas` created every render
- Dirty regions computed but never used

**Solutions**:

```typescript
// Reuse canvas
private tempCanvas = document.createElement('canvas');

// Use dirty regions or document constraints
if (enableDirtyRegions && dirtyRegions.length > 0) {
  // Only repaint dirty rectangles
} else {
  // Document: "Fields limited to 512x512 for performance"
}
```

### 5. Grid Rendering Performance

**Problem**: `generateGridLines()` creates up to 60,000 DOM elements on every pan/zoom.

**Solution**: Use SVG patterns or Canvas overlay:

```typescript
// Option 1: SVG Pattern
<defs>
  <pattern id="grid" width="{gridSize}" height="{gridSize}">
    <path d="M {gridSize} 0 L 0 0 0 {gridSize}" fill="none" stroke="#e5e7eb"/>
  </pattern>
</defs>

// Option 2: Only render visible lines
const visibleLines = calculateVisibleGridLines(viewport, field);
```

### 6. Accessibility Gaps

**Missing**:

- Keyboard navigation in ColorPicker
- Screen reader support for canvas interactions
- Focus trapping in dropdowns
- ARIA labels and roles

**Solutions**:

```typescript
// ColorPicker keyboard support
onkeydown={(e) => {
  if (e.key === 'Escape') closePanel();
  if (e.key === 'ArrowDown') focusNextColor();
}}

// Canvas accessibility
<canvas
  aria-label="Field visualization with {emitters.length} emitters"
  tabindex="0"
  onkeydown={handleCanvasKeyboard}
/>
```

---

## 🔧 Code Quality Improvements

### 7. Prop Reactivity Issues

**Problem**: Components don't sync when parent changes props.

```typescript
// ColorPicker.svelte - Add reactive sync
$: if (currentColor !== $props.currentColor) {
	currentColor = $props.currentColor;
	hexInput = $props.currentColor;
}
```

### 8. Event Handler Optimization

**Problem**: `viewport.update` fires on every pixel of pan/drag.

```typescript
// Debounce viewport updates
let rafId: number;
function updateViewport(fn: Function) {
	cancelAnimationFrame(rafId);
	rafId = requestAnimationFrame(() => viewport.update(fn));
}
```

### 9. TypeScript Improvements

**Issues**:

- Missing null checks in optimistic update rollbacks
- Mixed usage of derived values (callable vs direct)
- Inconsistent optional prop handling

**Solutions**:

```typescript
// Handle null responses from Supabase
const newEmitter = await addEmitter(this.supabase, data);
if (!newEmitter) {
	throw new Error('Failed to create emitter - possible permission issue');
}

// Consistent derived usage
const canEdit = $derived(isOwner || userRole === 'editor');
// Not: const canEdit = $derived(() => isOwner || userRole === 'editor');
```

---

## 💡 Future Improvements

### 10. Scalability Considerations

**For large fields (1000+ emitters)**:

- Move to WebGL/WebGPU point rendering
- Implement spatial indexing for emitter lookups
- Consider virtual scrolling for management panels

**For high concurrency**:

- Implement CRDT or operational transform instead of last-writer-wins
- Add conflict resolution UI for simultaneous edits

### 11. Store Pattern Evolution

**Current approach is good**, but consider these future enhancements:

```typescript
// Option A: TanStack Query integration
import { createQuery, createMutation } from '@tanstack/svelte-query';
const emittersQuery = createQuery({
	queryKey: ['emitters', fieldId],
	queryFn: () => getEmittersForField(supabase, fieldId)
});

// Option B: Enhanced factory pattern
export const useFieldStores = (fieldId: string, supabase: SupabaseClient) => ({
	emitters: createEmitterStore(fieldId, supabase),
	userRole: createUserRoleStore(fieldId, supabase),
	viewport: createViewportStore()
});
```

---

## 📝 Specific File Actions

### `src/lib/stores/emitters.ts`

- [ ] Convert to factory function
- [ ] Fix getCurrentState() subscription leak
- [ ] Add null check for addEmitter response
- [ ] Add cleanup method called from onDestroy

### `src/lib/stores/userRole.ts`

- [ ] Convert to factory function
- [ ] Parallelize role check RPCs
- [ ] Add 'none' state vs null for clarity

### `src/lib/fields/canvas/useCanvasRenderer.ts`

- [ ] Reuse tempCanvas instance
- [ ] Implement dirty region rendering or document constraints
- [ ] Add device pixel ratio support
- [ ] Ensure destroy() is called

### `src/lib/fields/controls/ColorPicker.svelte`

- [ ] Add prop reactivity sync
- [ ] Implement keyboard navigation
- [ ] Add proper ARIA roles (listbox/option)
- [ ] Fix click-outside performance

### `src/lib/fields/canvas/CanvasOverlay.svelte`

- [ ] Optimize grid rendering with patterns or viewport clipping
- [ ] Convert function calls to derived stores
- [ ] Add ARIA live regions for screen readers

### `src/lib/fields/FieldVisualizer.svelte`

- [ ] Hydrate stores with server data
- [ ] Extract viewport logic to composable
- [ ] Add keyboard shortcut handling

### `src/routes/fields/[id]/+page.svelte`

- [ ] Improve responsive design for management panel
- [ ] Add loading states during store initialization

---

## 🎯 Recommended Merge Strategy

1. **Phase 1 (Blocking)**: Fix critical singleton and performance issues (#1-3, #5)
2. **Phase 2 (Same PR)**: Address accessibility and prop reactivity (#6-8)
3. **Phase 3 (Future PR)**: Implement scalability improvements (#10-11)

## Overall Assessment

**Strengths**:

- Solid architectural choices
- Appropriate use of Svelte stores
- Clean separation of concerns
- Good TypeScript typing
- Thoughtful optimistic update patterns

**Needs Work**:

- Store lifecycle management
- Performance optimizations
- Accessibility compliance
- Prop reactivity edge cases

This is a high-quality implementation that demonstrates good understanding of SvelteKit patterns. The store approach is definitely the right choice here. With the fixes above, this will be a robust foundation for the field visualization system.
