import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../database.types';

export type Field = Database['public']['Tables']['fields']['Row'];
export type FieldInsert = Database['public']['Tables']['fields']['Insert'];
export type FieldUpdate = Database['public']['Tables']['fields']['Update'];

/**
 * Get a single field by id.
 * Returns the field if the user has access (public, owner, or collaborator).
 */
export const getField = async (
	supabase: SupabaseClient<Database>,
	id: string
): Promise<Field | null> => {
	const { data: field, error } = await supabase.from('fields').select().eq('id', id).maybeSingle();

	if (error) throw error;
	return field;
};

/**
 * Get all fields visible to the current user.
 * - If ownerId is provided, gets all fields owned by that user.
 * - If isPublic is true, gets all public fields.
 * - Gets all fields the user can see (public, owner, or collaborator).
 * - RLS enforces public/owner/collaborator access.
 */
export const getFields = async (supabase: SupabaseClient<Database>): Promise<Field[]> => {
	const { data: fields, error } = await supabase.from('fields').select();

	if (error) throw error;
	return fields ?? [];
};

/**
 * Create a new field.
 * The current user must be the owner (enforced by RLS).
 */
export const createField = async (
	supabase: SupabaseClient<Database>,
	data: FieldInsert
): Promise<Field> => {
	const { data: field, error } = await supabase.from('fields').insert(data).select().single();

	if (error) throw error;
	return field;
};

/**
 * Update an existing field.
 * Only the owner or a collaborator with editor role can update (enforced by RLS).
 */
export const updateField = async (
	supabase: SupabaseClient<Database>,
	id: string,
	data: FieldUpdate
): Promise<Field | null> => {
	const { data: field, error } = await supabase
		.from('fields')
		.update(data)
		.eq('id', id)
		.select()
		.maybeSingle();

	if (error) throw error;
	return field;
};

/**
 * Delete a field by id.
 * Only the owner can delete (enforced by RLS).
 */
export const deleteField = async (
	supabase: SupabaseClient<Database>,
	id: string
): Promise<Field | null> => {
	const { data, error } = await supabase.from('fields').delete().eq('id', id).select().single();

	if (error) throw error;
	return data;
};
