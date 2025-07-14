import { writable } from 'svelte/store';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../database.types';
import type { Emitter, EmitterInsert, EmitterUpdate } from '../db/emitters/index.js';
import {
	getEmittersForField,
	addEmitter,
	updateEmitter,
	removeEmitter
} from '../db/emitters/index.js';

export interface EmitterStoreState {
	emitters: Map<string, Emitter>;
	loading: boolean;
	error: string | null;
	fieldId: string | null;
}

export interface OptimisticUpdate {
	id: string;
	type: 'add' | 'update' | 'remove';
	originalData?: Emitter;
	tempData?: Emitter;
}

class EmitterStore {
	private store = writable<EmitterStoreState>({
		emitters: new Map(),
		loading: false,
		error: null,
		fieldId: null
	});

	private pendingUpdates = new Map<string, OptimisticUpdate>();
	private supabase: SupabaseClient<Database> | null = null;

	subscribe = this.store.subscribe;

	init(supabase: SupabaseClient<Database>) {
		this.supabase = supabase;
	}

	async loadEmitters(fieldId: string): Promise<void> {
		if (!this.supabase) {
			throw new Error('Supabase client not initialized');
		}

		this.store.update((state) => ({
			...state,
			loading: true,
			error: null,
			fieldId
		}));

		try {
			const emitters = await getEmittersForField(this.supabase, fieldId);
			const emitterMap = new Map(emitters.map((emitter) => [emitter.id, emitter]));

			this.store.update((state) => ({
				...state,
				emitters: emitterMap,
				loading: false
			}));
		} catch (error) {
			this.store.update((state) => ({
				...state,
				loading: false,
				error: error instanceof Error ? error.message : 'Failed to load emitters'
			}));
		}
	}

	async addEmitter(data: EmitterInsert): Promise<void> {
		if (!this.supabase) {
			throw new Error('Supabase client not initialized');
		}

		// Generate temporary ID for optimistic update
		const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
		const tempEmitter: Emitter = {
			id: tempId,
			field_id: data.field_id,
			x: data.x,
			y: data.y,
			color: data.color || '#ff0000',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};

		// Optimistic update
		this.store.update((state) => ({
			...state,
			emitters: new Map(state.emitters.set(tempId, tempEmitter))
		}));

		const optimisticUpdate: OptimisticUpdate = {
			id: tempId,
			type: 'add',
			tempData: tempEmitter
		};
		this.pendingUpdates.set(tempId, optimisticUpdate);

		try {
			const newEmitter = await addEmitter(this.supabase, data);

			// Replace temp emitter with real emitter
			this.store.update((state) => {
				const newEmitters = new Map(state.emitters);
				newEmitters.delete(tempId);
				newEmitters.set(newEmitter.id, newEmitter);
				return {
					...state,
					emitters: newEmitters
				};
			});

			this.pendingUpdates.delete(tempId);
		} catch (error) {
			// Rollback optimistic update
			this.store.update((state) => {
				const newEmitters = new Map(state.emitters);
				newEmitters.delete(tempId);
				return {
					...state,
					emitters: newEmitters,
					error: error instanceof Error ? error.message : 'Failed to add emitter'
				};
			});

			this.pendingUpdates.delete(tempId);
			throw error;
		}
	}

	async updateEmitter(id: string, data: EmitterUpdate): Promise<void> {
		if (!this.supabase) {
			throw new Error('Supabase client not initialized');
		}

		const currentState = this.getCurrentState();
		const originalEmitter = currentState.emitters.get(id);

		if (!originalEmitter) {
			throw new Error(`Emitter with id ${id} not found`);
		}

		// Optimistic update
		const optimisticEmitter: Emitter = {
			...originalEmitter,
			...data,
			updated_at: new Date().toISOString()
		};

		this.store.update((state) => ({
			...state,
			emitters: new Map(state.emitters.set(id, optimisticEmitter))
		}));

		const optimisticUpdate: OptimisticUpdate = {
			id,
			type: 'update',
			originalData: originalEmitter,
			tempData: optimisticEmitter
		};
		this.pendingUpdates.set(id, optimisticUpdate);

		try {
			const updatedEmitter = await updateEmitter(this.supabase, id, data);

			if (updatedEmitter) {
				this.store.update((state) => ({
					...state,
					emitters: new Map(state.emitters.set(id, updatedEmitter))
				}));
			}

			this.pendingUpdates.delete(id);
		} catch (error) {
			// Rollback optimistic update
			this.store.update((state) => ({
				...state,
				emitters: new Map(state.emitters.set(id, originalEmitter)),
				error: error instanceof Error ? error.message : 'Failed to update emitter'
			}));

			this.pendingUpdates.delete(id);
			throw error;
		}
	}

	async removeEmitter(id: string): Promise<void> {
		if (!this.supabase) {
			throw new Error('Supabase client not initialized');
		}

		const currentState = this.getCurrentState();
		const originalEmitter = currentState.emitters.get(id);

		if (!originalEmitter) {
			throw new Error(`Emitter with id ${id} not found`);
		}

		// Optimistic update - remove from map
		this.store.update((state) => {
			const newEmitters = new Map(state.emitters);
			newEmitters.delete(id);
			return {
				...state,
				emitters: newEmitters
			};
		});

		const optimisticUpdate: OptimisticUpdate = {
			id,
			type: 'remove',
			originalData: originalEmitter
		};
		this.pendingUpdates.set(id, optimisticUpdate);

		try {
			await removeEmitter(this.supabase, id);
			this.pendingUpdates.delete(id);
		} catch (error) {
			// Rollback optimistic update
			this.store.update((state) => ({
				...state,
				emitters: new Map(state.emitters.set(id, originalEmitter)),
				error: error instanceof Error ? error.message : 'Failed to remove emitter'
			}));

			this.pendingUpdates.delete(id);
			throw error;
		}
	}

	// Real-time patch handler
	handleRealtimePatch(patch: {
		eventType: 'INSERT' | 'UPDATE' | 'DELETE';
		new?: Emitter;
		old?: Emitter;
	}): void {
		const { eventType, new: newRecord, old: oldRecord } = patch;

		this.store.update((state) => {
			const newEmitters = new Map(state.emitters);

			switch (eventType) {
				case 'INSERT':
					if (newRecord && newRecord.field_id === state.fieldId) {
						// Don't add if it's a pending optimistic update
						if (!this.pendingUpdates.has(newRecord.id)) {
							newEmitters.set(newRecord.id, newRecord);
						}
					}
					break;

				case 'UPDATE':
					if (newRecord && newRecord.field_id === state.fieldId) {
						// Don't update if it's a pending optimistic update
						if (!this.pendingUpdates.has(newRecord.id)) {
							newEmitters.set(newRecord.id, newRecord);
						}
					}
					break;

				case 'DELETE':
					if (oldRecord) {
						// Don't remove if it's a pending optimistic update
						if (!this.pendingUpdates.has(oldRecord.id)) {
							newEmitters.delete(oldRecord.id);
						}
					}
					break;
			}

			return {
				...state,
				emitters: newEmitters
			};
		});
	}

	clearError(): void {
		this.store.update((state) => ({
			...state,
			error: null
		}));
	}

	getAll(): Emitter[] {
		const state = this.getCurrentState();
		return Array.from(state.emitters.values());
	}

	private getCurrentState(): EmitterStoreState {
		let currentState: EmitterStoreState;
		this.store.subscribe((state) => {
			currentState = state;
		})();
		return currentState!;
	}
}

export const emitterStore = new EmitterStore();
