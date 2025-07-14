import { writable, derived, type Readable } from 'svelte/store';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../database.types';
import type { Field } from '$lib/db/fields';

// Extended role type to include public access
export type UserRole = 'owner' | 'editor' | 'viewer' | 'public' | null;

export interface UserRoleState {
	fieldId: string | null;
	role: UserRole;
	loading: boolean;
	error: string | null;
}

export interface UserPermissions {
	canView: boolean;
	canEdit: boolean;
	canDelete: boolean;
	canManageCollaborators: boolean;
}

export interface UserRoleStoreInstance {
	subscribe: (this: void, run: (value: UserRoleState) => void) => () => void;
	permissions: Readable<UserPermissions>;
	loadUserRole: (fieldId: string) => Promise<void>;
	checkFieldAccess: (fieldId: string) => Promise<boolean>;
	checkFieldEditAccess: (fieldId: string) => Promise<boolean>;
	checkIsFieldOwner: (fieldId: string) => Promise<boolean>;
	checkIsFieldPublic: (fieldId: string) => Promise<boolean>;
	handleCollaboratorChange: (fieldId: string) => Promise<void>;
	clearError: () => void;
	reset: () => void;
	destroy: () => void;
}

// Factory function to create a UserRoleStore instance
export function createUserRoleStore(supabase: SupabaseClient<Database>): UserRoleStoreInstance {
	const store = writable<UserRoleState>({
		fieldId: null,
		role: null,
		loading: false,
		error: null
	});

	let currentState: UserRoleState;

	// Keep a live subscription to avoid memory leaks
	const unsubscribe = store.subscribe((state) => {
		currentState = state;
	});

	// Derived store for user permissions
	const permissions = derived(store, (state): UserPermissions => {
		const isOwner = state.role === 'owner';
		const isEditor = state.role === 'editor';
		const isViewer = state.role === 'viewer';
		const isPublic = state.role === 'public';

		return {
			canView: isOwner || isEditor || isViewer || isPublic,
			canEdit: isOwner || isEditor,
			canDelete: isOwner || isEditor,
			canManageCollaborators: isOwner
		};
	});

	async function loadUserRole(fieldId: string): Promise<void> {
		store.update((state) => ({
			...state,
			loading: true,
			error: null,
			fieldId
		}));

		try {
			// Parallelize role check RPCs for better performance
			const [
				{ data: isOwner, error: ownerError },
				{ data: hasEditorAccess, error: editorError },
				{ data: hasViewAccess, error: viewError },
				{ data: isPublic, error: publicError }
			] = await Promise.all([
				supabase.rpc('is_field_owner', { field_uuid: fieldId }),
				supabase.rpc('has_field_editor_access', { field_uuid: fieldId }),
				supabase.rpc('has_field_access', { field_uuid: fieldId }),
				supabase.rpc('is_field_public', { field_uuid: fieldId })
			]);

			if (ownerError) throw ownerError;
			if (editorError) throw editorError;
			if (viewError) throw viewError;
			if (publicError) throw publicError;

			let role: UserRole = null;

			if (isOwner) {
				role = 'owner';
			} else if (hasEditorAccess) {
				role = 'editor';
			} else if (isPublic) {
				role = 'public';
			} else if (hasViewAccess) {
				role = 'viewer';
			}

			store.update((state) => ({
				...state,
				role,
				loading: false
			}));
		} catch (error) {
			store.update((state) => ({
				...state,
				loading: false,
				error: error instanceof Error ? error.message : 'Failed to load user role'
			}));
		}
	}

	async function checkFieldAccess(fieldId: string): Promise<boolean> {
		try {
			const { data: hasAccess, error } = await supabase.rpc('has_field_access', {
				field_uuid: fieldId
			});

			if (error) throw error;
			return hasAccess ?? false;
		} catch (error) {
			console.error('Error checking field access:', error);
			return false;
		}
	}

	async function checkFieldEditAccess(fieldId: string): Promise<boolean> {
		try {
			const { data: hasAccess, error } = await supabase.rpc('has_field_editor_access', {
				field_uuid: fieldId
			});

			if (error) throw error;
			return hasAccess ?? false;
		} catch (error) {
			console.error('Error checking field edit access:', error);
			return false;
		}
	}

	async function checkIsFieldOwner(fieldId: string): Promise<boolean> {
		try {
			const { data: isOwner, error } = await supabase.rpc('is_field_owner', {
				field_uuid: fieldId
			});

			if (error) throw error;
			return isOwner ?? false;
		} catch (error) {
			console.error('Error checking field ownership:', error);
			return false;
		}
	}

	async function checkIsFieldPublic(fieldId: string): Promise<boolean> {
		try {
			const { data: isPublic, error } = await supabase.rpc('is_field_public', {
				field_uuid: fieldId
			});

			if (error) throw error;
			return isPublic ?? false;
		} catch (error) {
			console.error('Error checking field public status:', error);
			return false;
		}
	}

	// Update role when collaborator status changes - properly re-check access
	async function handleCollaboratorChange(fieldId: string): Promise<void> {
		// Only update if this is for the current field
		if (currentState.fieldId === fieldId) {
			// Re-check actual access instead of assuming role
			await loadUserRole(fieldId);
		}
	}

	function clearError(): void {
		store.update((state) => ({
			...state,
			error: null
		}));
	}

	function reset(): void {
		store.set({
			fieldId: null,
			role: null,
			loading: false,
			error: null
		});
	}

	function destroy(): void {
		unsubscribe();
		reset();
	}

	return {
		subscribe: store.subscribe,
		permissions,
		loadUserRole,
		checkFieldAccess,
		checkFieldEditAccess,
		checkIsFieldOwner,
		checkIsFieldPublic,
		handleCollaboratorChange,
		clearError,
		reset,
		destroy
	};
}

// Singleton instance (for backward compatibility)
class UserRoleStore {
	private storeInstance: UserRoleStoreInstance | null = null;

	init(supabase: SupabaseClient<Database>) {
		this.storeInstance = createUserRoleStore(supabase);
	}

	get subscribe() {
		if (!this.storeInstance) throw new Error('UserRoleStore not initialized');
		return this.storeInstance.subscribe;
	}

	get permissions() {
		if (!this.storeInstance) throw new Error('UserRoleStore not initialized');
		return this.storeInstance.permissions;
	}

	async loadUserRole(fieldId: string): Promise<void> {
		if (!this.storeInstance) throw new Error('UserRoleStore not initialized');
		return this.storeInstance.loadUserRole(fieldId);
	}

	async checkFieldAccess(fieldId: string): Promise<boolean> {
		if (!this.storeInstance) throw new Error('UserRoleStore not initialized');
		return this.storeInstance.checkFieldAccess(fieldId);
	}

	async checkFieldEditAccess(fieldId: string): Promise<boolean> {
		if (!this.storeInstance) throw new Error('UserRoleStore not initialized');
		return this.storeInstance.checkFieldEditAccess(fieldId);
	}

	async checkIsFieldOwner(fieldId: string): Promise<boolean> {
		if (!this.storeInstance) throw new Error('UserRoleStore not initialized');
		return this.storeInstance.checkIsFieldOwner(fieldId);
	}

	async checkIsFieldPublic(fieldId: string): Promise<boolean> {
		if (!this.storeInstance) throw new Error('UserRoleStore not initialized');
		return this.storeInstance.checkIsFieldPublic(fieldId);
	}

	async handleCollaboratorChange(fieldId: string): Promise<void> {
		if (!this.storeInstance) throw new Error('UserRoleStore not initialized');
		return this.storeInstance.handleCollaboratorChange(fieldId);
	}

	clearError(): void {
		if (!this.storeInstance) throw new Error('UserRoleStore not initialized');
		this.storeInstance.clearError();
	}

	reset(): void {
		if (!this.storeInstance) throw new Error('UserRoleStore not initialized');
		this.storeInstance.reset();
	}

	destroy(): void {
		if (!this.storeInstance) throw new Error('UserRoleStore not initialized');
		this.storeInstance.destroy();
	}
}

export const userRoleStore = new UserRoleStore();

// Helper function to get user role for a field (used in page.server.ts)
export async function getUserRole(
	supabase: SupabaseClient<Database>,
	userId: string | undefined,
	field: Field
): Promise<UserRole> {
	// Handle unauthenticated users
	if (!userId) {
		return field.is_public ? 'public' : null;
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

		// Check if user has view access (collaborator)
		const { data: hasViewAccess, error: viewError } = await supabase.rpc('has_field_access', {
			field_uuid: field.id
		});

		if (viewError) throw viewError;
		if (hasViewAccess) return 'viewer';

		// Check if field is public
		return field.is_public ? 'public' : null;
	} catch (error) {
		console.error('Error getting user role:', error);
		return field.is_public ? 'public' : null;
	}
}
