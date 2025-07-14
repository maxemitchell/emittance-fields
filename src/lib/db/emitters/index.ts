import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '../../../database.types';
import { emitterStore } from '$lib/stores/emitters';

export interface RealtimeSubscription {
	channel: RealtimeChannel;
	unsubscribe: () => void;
}

export interface RealtimeOptions {
	onError?: (error: Error) => void;
}

// Types for the emitters table
export type Emitter = Database['public']['Tables']['emitters']['Row'];
export type EmitterInsert = Database['public']['Tables']['emitters']['Insert'];
export type EmitterUpdate = Database['public']['Tables']['emitters']['Update'];

/**
 * Get all emitters for a given field.
 * - Anyone can view emitters in public fields.
 * - Collaborators (viewer/editor) and owners can view emitters in their fields.
 */
export const getEmittersForField = async (
	supabase: SupabaseClient<Database>,
	fieldId: string
): Promise<Emitter[]> => {
	const { data, error } = await supabase.from('emitters').select().eq('field_id', fieldId);

	if (error) throw error;
	return data ?? [];
};

/**
 * Add a new emitter to a field.
 * - Field owners and collaborators with editor role can add emitters (RLS enforced).
 */
export const addEmitter = async (
	supabase: SupabaseClient<Database>,
	data: EmitterInsert
): Promise<Emitter> => {
	const { data: result, error } = await supabase.from('emitters').insert(data).select().single();

	if (error) throw error;
	return result;
};

/**
 * Update an emitter.
 * - Field owners and collaborators with editor role can update emitters (RLS enforced).
 */
export const updateEmitter = async (
	supabase: SupabaseClient<Database>,
	id: string,
	data: EmitterUpdate
): Promise<Emitter | null> => {
	const { data: result, error } = await supabase
		.from('emitters')
		.update(data)
		.eq('id', id)
		.select()
		.maybeSingle();

	if (error) throw error;
	return result;
};

/**
 * Remove (delete) an emitter.
 * - Field owners and collaborators with editor role can delete emitters (RLS enforced).
 */
export const removeEmitter = async (
	supabase: SupabaseClient<Database>,
	id: string
): Promise<Emitter | null> => {
	const { data: result, error } = await supabase
		.from('emitters')
		.delete()
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return result;
};

export function subscribeToEmitters(
	supabase: SupabaseClient<Database>,
	fieldId: string,
	options: RealtimeOptions = {}
): RealtimeSubscription {
	const channel = supabase
		.channel(`emitters:${fieldId}`)
		.on(
			'postgres_changes',
			{
				event: 'INSERT',
				schema: 'public',
				table: 'emitters',
				filter: `field_id=eq.${fieldId}`
			},
			(payload) => {
				try {
					const newEmitter = payload.new as Emitter;
					emitterStore.handleRealtimePatch({
						eventType: 'INSERT',
						new: newEmitter
					});
				} catch (error) {
					options.onError?.(error instanceof Error ? error : new Error('Failed to handle INSERT'));
				}
			}
		)
		.on(
			'postgres_changes',
			{
				event: 'UPDATE',
				schema: 'public',
				table: 'emitters',
				filter: `field_id=eq.${fieldId}`
			},
			(payload) => {
				try {
					const updatedEmitter = payload.new as Emitter;
					emitterStore.handleRealtimePatch({
						eventType: 'UPDATE',
						new: updatedEmitter,
						old: payload.old as Emitter
					});
				} catch (error) {
					options.onError?.(error instanceof Error ? error : new Error('Failed to handle UPDATE'));
				}
			}
		)
		.on(
			'postgres_changes',
			{
				event: 'DELETE',
				schema: 'public',
				table: 'emitters',
				filter: `field_id=eq.${fieldId}`
			},
			(payload) => {
				try {
					const deletedEmitter = payload.old as Emitter;
					emitterStore.handleRealtimePatch({
						eventType: 'DELETE',
						old: deletedEmitter
					});
				} catch (error) {
					options.onError?.(error instanceof Error ? error : new Error('Failed to handle DELETE'));
				}
			}
		);

	// Subscribe to the channel
	channel.subscribe();

	return {
		channel,
		unsubscribe: () => {
			supabase.removeChannel(channel);
		}
	};
}
