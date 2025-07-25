import { writable } from 'svelte/store';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../database.types';
import type { Emitter, EmitterInsert, EmitterUpdate } from '../db/emitters/index.js';
import {
	getEmittersForField,
	addEmitter as dbAddEmitter,
	updateEmitter as dbUpdateEmitter,
	removeEmitter as dbRemoveEmitter
} from '../db/emitters/index.js';

// Emitter Store Types
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

export interface EmitterStoreInstance {
	subscribe: (this: void, run: (value: EmitterStoreState) => void) => () => void;
	loadEmitters: (fieldId: string) => Promise<void>;
	hydrate: (emitters: Emitter[], fieldId: string) => void;
	addEmitter: (data: EmitterInsert) => Promise<void>;
	updateEmitter: (id: string, data: EmitterUpdate) => Promise<void>;
	removeEmitter: (id: string) => Promise<void>;
	handleRealtimePatch: (patch: {
		eventType: 'INSERT' | 'UPDATE' | 'DELETE';
		new?: Emitter;
		old?: Emitter;
	}) => void;
	clearError: () => void;
	getAll: () => Emitter[];
	destroy: () => void;
}

// Re-export types from userRole store for compatibility
export type { UserRole, UserRoleState, UserPermissions, UserRoleStoreInstance } from './userRole';

// Emitter Store Factory
export function createEmitterStore(supabase: SupabaseClient<Database>): EmitterStoreInstance {
	const store = writable<EmitterStoreState>({
		emitters: new Map(),
		loading: false,
		error: null,
		fieldId: null
	});

	const pendingUpdates = new Map<string, OptimisticUpdate>();
	let currentState: EmitterStoreState;

	// Keep a live subscription to avoid memory leaks
	const unsubscribe = store.subscribe((state) => {
		currentState = state;
	});

	async function loadEmitters(fieldId: string): Promise<void> {
		store.update((state) => ({
			...state,
			loading: true,
			error: null,
			fieldId
		}));

		try {
			const emitters = await getEmittersForField(supabase, fieldId);
			const emitterMap = new Map(emitters.map((emitter) => [emitter.id, emitter]));

			store.update((state) => ({
				...state,
				emitters: emitterMap,
				loading: false
			}));
		} catch (error) {
			store.update((state) => ({
				...state,
				loading: false,
				error: error instanceof Error ? error.message : 'Failed to load emitters'
			}));
		}
	}

	function hydrate(emitters: Emitter[], fieldId: string): void {
		const emitterMap = new Map(emitters.map((emitter) => [emitter.id, emitter]));
		store.update((state) => ({
			...state,
			emitters: emitterMap,
			loading: false,
			fieldId
		}));
	}

	async function addEmitter(data: EmitterInsert): Promise<void> {
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
		store.update((state) => {
			const newEmitters = new Map(state.emitters);
			newEmitters.set(tempId, tempEmitter);
			return {
				...state,
				emitters: newEmitters
			};
		});

		const optimisticUpdate: OptimisticUpdate = {
			id: tempId,
			type: 'add',
			tempData: tempEmitter
		};
		pendingUpdates.set(tempId, optimisticUpdate);

		try {
			const newEmitter = await dbAddEmitter(supabase, data);

			// Replace temp emitter with real emitter
			store.update((state) => {
				const newEmitters = new Map(state.emitters);
				newEmitters.delete(tempId);
				newEmitters.set(newEmitter.id, newEmitter);
				return {
					...state,
					emitters: newEmitters
				};
			});

			pendingUpdates.delete(tempId);
		} catch (error) {
			// Rollback optimistic update
			store.update((state) => {
				const newEmitters = new Map(state.emitters);
				newEmitters.delete(tempId);
				return {
					...state,
					emitters: newEmitters,
					error: error instanceof Error ? error.message : 'Failed to add emitter'
				};
			});

			pendingUpdates.delete(tempId);
			throw error;
		}
	}

	async function updateEmitter(id: string, data: EmitterUpdate): Promise<void> {
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

		store.update((state) => {
			const newEmitters = new Map(state.emitters);
			newEmitters.set(id, optimisticEmitter);
			return {
				...state,
				emitters: newEmitters
			};
		});

		const optimisticUpdate: OptimisticUpdate = {
			id,
			type: 'update',
			originalData: originalEmitter,
			tempData: optimisticEmitter
		};
		pendingUpdates.set(id, optimisticUpdate);

		try {
			const updatedEmitter = await dbUpdateEmitter(supabase, id, data);

			if (updatedEmitter) {
				store.update((state) => {
					const newEmitters = new Map(state.emitters);
					newEmitters.set(id, updatedEmitter);
					return {
						...state,
						emitters: newEmitters
					};
				});
			}

			pendingUpdates.delete(id);
		} catch (error) {
			// Rollback optimistic update
			store.update((state) => {
				const newEmitters = new Map(state.emitters);
				newEmitters.set(id, originalEmitter);
				return {
					...state,
					emitters: newEmitters,
					error: error instanceof Error ? error.message : 'Failed to update emitter'
				};
			});

			pendingUpdates.delete(id);
			throw error;
		}
	}

	async function removeEmitter(id: string): Promise<void> {
		const originalEmitter = currentState.emitters.get(id);

		if (!originalEmitter) {
			throw new Error(`Emitter with id ${id} not found`);
		}

		// Optimistic update - remove from map
		store.update((state) => {
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
		pendingUpdates.set(id, optimisticUpdate);

		try {
			await dbRemoveEmitter(supabase, id);
			pendingUpdates.delete(id);
		} catch (error) {
			// Rollback optimistic update
			store.update((state) => {
				const newEmitters = new Map(state.emitters);
				newEmitters.set(id, originalEmitter);
				return {
					...state,
					emitters: newEmitters,
					error: error instanceof Error ? error.message : 'Failed to remove emitter'
				};
			});

			pendingUpdates.delete(id);
			throw error;
		}
	}

	function handleRealtimePatch(patch: {
		eventType: 'INSERT' | 'UPDATE' | 'DELETE';
		new?: Emitter;
		old?: Emitter;
	}): void {
		const { eventType, new: newRecord, old: oldRecord } = patch;

		store.update((state) => {
			const newEmitters = new Map(state.emitters);

			switch (eventType) {
				case 'INSERT':
					if (newRecord && newRecord.field_id === state.fieldId) {
						// Don't add if it's a pending optimistic update
						if (!pendingUpdates.has(newRecord.id)) {
							newEmitters.set(newRecord.id, newRecord);
						}
					}
					break;

				case 'UPDATE':
					if (newRecord && newRecord.field_id === state.fieldId) {
						// Don't update if it's a pending optimistic update
						if (!pendingUpdates.has(newRecord.id)) {
							newEmitters.set(newRecord.id, newRecord);
						}
					}
					break;

				case 'DELETE':
					if (oldRecord) {
						// Don't remove if it's a pending optimistic update
						if (!pendingUpdates.has(oldRecord.id)) {
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

	function clearError(): void {
		store.update((state) => ({
			...state,
			error: null
		}));
	}

	function getAll(): Emitter[] {
		return Array.from(currentState.emitters.values());
	}

	function destroy(): void {
		unsubscribe();
		pendingUpdates.clear();
		store.set({
			emitters: new Map(),
			loading: false,
			error: null,
			fieldId: null
		});
	}

	return {
		subscribe: store.subscribe,
		loadEmitters,
		hydrate,
		addEmitter,
		updateEmitter,
		removeEmitter,
		handleRealtimePatch,
		clearError,
		getAll,
		destroy
	};
}

// User Role Store Factory - delegates to consolidated implementation
export { createUserRoleStore } from './userRole';
