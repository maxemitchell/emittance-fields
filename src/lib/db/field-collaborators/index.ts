import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../database.types';

// Types for the field_collaborators table and related enums
export type CollaboratorRole = Database['public']['Enums']['collaborator_role'];
export type FieldCollaborator = Database['public']['Tables']['field_collaborators']['Row'];
export type FieldCollaboratorInsert = Database['public']['Tables']['field_collaborators']['Insert'];
export type FieldCollaboratorUpdate = Database['public']['Tables']['field_collaborators']['Update'];

/**
 * Get all collaborators for a given field.
 * - Anyone can view collaborators on public fields.
 * - Collaborators can view other collaborators on the same field.
 * - Field owners can view all collaborators.
 */
export const getFieldCollaborators = async (
	supabase: SupabaseClient<Database>,
	fieldId: string
): Promise<FieldCollaborator[]> => {
	const { data, error } = await supabase
		.from('field_collaborators')
		.select()
		.eq('field_id', fieldId);

	if (error) throw error;
	return data ?? [];
};

/**
 * Get all fields a user collaborates on (as a collaborator, not owner).
 * - Users can view their own collaborator records.
 */
export const getCollaborationsForUser = async (
	supabase: SupabaseClient<Database>,
	userId: string
): Promise<FieldCollaborator[]> => {
	const { data, error } = await supabase.from('field_collaborators').select().eq('user_id', userId);

	if (error) throw error;
	return data ?? [];
};

/**
 * Add a collaborator to a field.
 * - Only field owners can add collaborators (enforced by RLS).
 * - Role defaults to 'viewer' if not specified.
 */
export const addFieldCollaborator = async (
	supabase: SupabaseClient<Database>,
	data: FieldCollaboratorInsert
): Promise<FieldCollaborator> => {
	const { data: result, error } = await supabase
		.from('field_collaborators')
		.insert(data)
		.select()
		.single();

	if (error) throw error;
	return result;
};

/**
 * Update a collaborator's role on a field.
 * - Only field owners can update collaborators (enforced by RLS).
 */
export const updateFieldCollaborator = async (
	supabase: SupabaseClient<Database>,
	id: string,
	data: FieldCollaboratorUpdate
): Promise<FieldCollaborator | null> => {
	const { data: result, error } = await supabase
		.from('field_collaborators')
		.update(data)
		.eq('id', id)
		.select()
		.maybeSingle();

	if (error) throw error;
	return result;
};

/**
 * Remove a collaborator from a field.
 * - Only field owners can remove collaborators (enforced by RLS).
 */
export const removeFieldCollaborator = async (
	supabase: SupabaseClient<Database>,
	id: string
): Promise<void> => {
	const { error } = await supabase.from('field_collaborators').delete().eq('id', id);

	if (error) throw error;
};
