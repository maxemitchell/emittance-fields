import { writable, derived } from 'svelte/store';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Enums } from '../../database.types';
import type { Field } from '$lib/db/fields';

export interface UserRoleState {
	fieldId: string | null;
	role: 'owner' | 'editor' | 'viewer' | null;
	loading: boolean;
	error: string | null;
}

export interface UserPermissions {
	canView: boolean;
	canEdit: boolean;
	canDelete: boolean;
	canManageCollaborators: boolean;
}

class UserRoleStore {
	private store = writable<UserRoleState>({
		fieldId: null,
		role: null,
		loading: false,
		error: null
	});

	private supabase: SupabaseClient<Database> | null = null;

	subscribe = this.store.subscribe;

	// Derived store for user permissions
	permissions = derived(this.store, (state): UserPermissions => {
		const isOwner = state.role === 'owner';
		const isEditor = state.role === 'editor';
		const isViewer = state.role === 'viewer';

		return {
			canView: isOwner || isEditor || isViewer,
			canEdit: isOwner || isEditor,
			canDelete: isOwner || isEditor,
			canManageCollaborators: isOwner
		};
	});

	init(supabase: SupabaseClient<Database>) {
		this.supabase = supabase;
	}

	async loadUserRole(fieldId: string): Promise<void> {
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
			// Check if user is owner
			const { data: isOwner, error: ownerError } = await this.supabase.rpc('is_field_owner', {
				field_uuid: fieldId
			});

			if (ownerError) throw ownerError;

			if (isOwner) {
				this.store.update((state) => ({
					...state,
					role: 'owner',
					loading: false
				}));
				return;
			}

			// Check if user has editor access
			const { data: hasEditorAccess, error: editorError } = await this.supabase.rpc(
				'has_field_editor_access',
				{ field_uuid: fieldId }
			);

			if (editorError) throw editorError;

			if (hasEditorAccess) {
				this.store.update((state) => ({
					...state,
					role: 'editor',
					loading: false
				}));
				return;
			}

			// Check if user has view access (collaborator or public field)
			const { data: hasViewAccess, error: viewError } = await this.supabase.rpc(
				'has_field_access',
				{ field_uuid: fieldId }
			);

			if (viewError) throw viewError;

			if (hasViewAccess) {
				this.store.update((state) => ({
					...state,
					role: 'viewer',
					loading: false
				}));
				return;
			}

			// No access
			this.store.update((state) => ({
				...state,
				role: null,
				loading: false
			}));
		} catch (error) {
			this.store.update((state) => ({
				...state,
				loading: false,
				error: error instanceof Error ? error.message : 'Failed to load user role'
			}));
		}
	}

	async checkFieldAccess(fieldId: string): Promise<boolean> {
		if (!this.supabase) {
			throw new Error('Supabase client not initialized');
		}

		try {
			const { data: hasAccess, error } = await this.supabase.rpc('has_field_access', {
				field_uuid: fieldId
			});

			if (error) throw error;
			return hasAccess ?? false;
		} catch (error) {
			console.error('Error checking field access:', error);
			return false;
		}
	}

	async checkFieldEditAccess(fieldId: string): Promise<boolean> {
		if (!this.supabase) {
			throw new Error('Supabase client not initialized');
		}

		try {
			const { data: hasAccess, error } = await this.supabase.rpc('has_field_editor_access', {
				field_uuid: fieldId
			});

			if (error) throw error;
			return hasAccess ?? false;
		} catch (error) {
			console.error('Error checking field edit access:', error);
			return false;
		}
	}

	async checkIsFieldOwner(fieldId: string): Promise<boolean> {
		if (!this.supabase) {
			throw new Error('Supabase client not initialized');
		}

		try {
			const { data: isOwner, error } = await this.supabase.rpc('is_field_owner', {
				field_uuid: fieldId
			});

			if (error) throw error;
			return isOwner ?? false;
		} catch (error) {
			console.error('Error checking field ownership:', error);
			return false;
		}
	}

	async checkIsFieldPublic(fieldId: string): Promise<boolean> {
		if (!this.supabase) {
			throw new Error('Supabase client not initialized');
		}

		try {
			const { data: isPublic, error } = await this.supabase.rpc('is_field_public', {
				field_uuid: fieldId
			});

			if (error) throw error;
			return isPublic ?? false;
		} catch (error) {
			console.error('Error checking field public status:', error);
			return false;
		}
	}

	// Update role when collaborator status changes
	handleCollaboratorChange(
		fieldId: string,
		userId: string,
		role: Enums<'collaborator_role'> | null
	): void {
		const currentState = this.getCurrentState();

		// Only update if this is for the current field
		if (currentState.fieldId === fieldId) {
			this.store.update((state) => ({
				...state,
				role: role || 'viewer' // If removed from collaborators, check if still has view access
			}));
		}
	}

	clearError(): void {
		this.store.update((state) => ({
			...state,
			error: null
		}));
	}

	reset(): void {
		this.store.set({
			fieldId: null,
			role: null,
			loading: false,
			error: null
		});
	}

	private getCurrentState(): UserRoleState {
		let currentState: UserRoleState;
		this.store.subscribe((state) => {
			currentState = state;
		})();
		return currentState!;
	}
}

export const userRoleStore = new UserRoleStore();

// Helper function to get user role for a field (used in page.server.ts)
export async function getUserRole(
	supabase: SupabaseClient<Database>,
	userId: string | undefined,
	field: Field
): Promise<'owner' | 'editor' | 'viewer' | 'public'> {
	if (!userId) {
		// Not logged in - can only view public fields
		return field.is_public ? 'public' : 'public';
	}

	try {
		// Check if user is owner
		const { data: isOwner, error: ownerError } = await supabase.rpc('is_field_owner', {
			field_uuid: field.id
		});

		if (ownerError) throw ownerError;
		if (isOwner) return 'owner';

		// Check if user has editor access
		const { data: hasEditorAccess, error: editorError } = await supabase.rpc(
			'has_field_editor_access',
			{ field_uuid: field.id }
		);

		if (editorError) throw editorError;
		if (hasEditorAccess) return 'editor';

		// Check if user has view access (collaborator or public field)
		const { data: hasViewAccess, error: viewError } = await supabase.rpc('has_field_access', {
			field_uuid: field.id
		});

		if (viewError) throw viewError;
		if (hasViewAccess) return 'viewer';

		// No access but field is public
		return field.is_public ? 'public' : 'public';
	} catch (error) {
		console.error('Error getting user role:', error);
		return field.is_public ? 'public' : 'public';
	}
}
