<script lang="ts">
	import type { FieldCollaborator, CollaboratorRole } from '$lib/db/field-collaborators';
	import type { Field } from '$lib/db/fields';
	import type { User } from '@supabase/supabase-js';
	import { enhance } from '$app/forms';
	import type { ActionData } from '../../routes/$types.d';

	let {
		collaborator,
		field,
		user,
		form
	}: {
		field: Field;
		collaborator: FieldCollaborator;
		user: User | null;
		form: ActionData | null;
	} = $props();

	let canEdit = $derived(user?.id === field.owner_id || user?.id === collaborator.user_id);

	const roleLabels: Record<CollaboratorRole, string> = {
		viewer: 'Viewer',
		editor: 'Editor'
	};

	let editingRole = $state(false);
	let editingRoleValue: CollaboratorRole = $state(collaborator.role as CollaboratorRole);

	function shortUserId(uid: string) {
		if (!uid) return '';
		return uid.slice(0, 8) + '...' + uid.slice(-4);
	}

	function handleEditCancel() {
		editingRole = false;
	}
</script>

<li class="flex flex-col rounded-lg px-2 py-3 transition-colors hover:bg-gray-50">
	<div class="flex items-center">
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<div class="truncate font-mono text-xs text-gray-700" title={collaborator.user_id}>
					{shortUserId(collaborator.user_id)}
				</div>
				{#if user?.id === collaborator.user_id}
					<span class="ml-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700"
						>You</span
					>
				{/if}
				{#if user?.id === field.owner_id && collaborator.user_id === field.owner_id}
					<span
						class="ml-1 rounded bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700"
						>Owner</span
					>
				{/if}
			</div>
			<div class="mt-0.5 text-xs text-gray-400">
				Added {new Date(collaborator.created_at).toLocaleDateString()}
			</div>
		</div>
		<div class="ml-4 flex flex-shrink-0 items-center gap-2">
			{#if canEdit && editingRole}
				<form
					method="POST"
					action="?/updateFieldCollaborator"
					class="flex items-center gap-2"
					use:enhance
				>
					<input type="hidden" name="id" value={collaborator.id} />
					<select
						name="role"
						bind:value={editingRoleValue}
						class="rounded border border-gray-300 px-2 py-1 text-xs transition focus:ring-2 focus:ring-blue-400 focus:outline-none"
						required
					>
						<option value="viewer">Viewer</option>
						<option value="editor">Editor</option>
					</select>
					<button
						type="submit"
						class="rounded bg-blue-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
					>
						Save
					</button>
					<button
						type="button"
						class="rounded bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-300 focus:ring-2 focus:ring-gray-300 focus:outline-none"
						onclick={handleEditCancel}
					>
						Cancel
					</button>
				</form>
			{:else}
				<span
					class="rounded border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
				>
					{roleLabels[collaborator.role as CollaboratorRole] ?? collaborator.role}
				</span>
				{#if canEdit}
					<button
						type="button"
						class="ml-1 text-xs font-medium text-blue-600 transition hover:underline"
						title="Edit role"
						onclick={() => {
							editingRole = true;
							editingRoleValue = collaborator.role as CollaboratorRole;
						}}
					>
						Edit
					</button>
				{/if}
			{/if}
			{#if canEdit}
				<form method="POST" action="?/removeFieldCollaborator" class="ml-2" use:enhance>
					<input type="hidden" name="id" value={collaborator.id} />
					<button
						type="submit"
						class="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-200 focus:ring-2 focus:ring-red-300 focus:outline-none"
						title="Remove collaborator"
						disabled={form?.removeFieldCollaboratorAction?.pending}
					>
						{form?.removeFieldCollaboratorAction?.pending ? 'Removing...' : 'Remove'}
					</button>
				</form>
			{/if}
		</div>
	</div>
	<!-- Error row -->
	<div class="mt-1 flex min-h-[1.25rem] items-center">
		{#if canEdit && editingRole && form?.updateFieldCollaboratorAction?.error}
			<div class="text-xs text-red-600">
				{form.updateFieldCollaboratorAction.error}
			</div>
		{:else if canEdit && form?.removeFieldCollaboratorAction?.error}
			<div class="text-xs text-red-600">
				{form.removeFieldCollaboratorAction.error}
			</div>
		{/if}
	</div>
</li>
