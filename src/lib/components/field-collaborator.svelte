<script lang="ts">
	import type { FieldCollaborator, CollaboratorRole } from '$lib/db/field-collaborators';
	import type { Field } from '$lib/db/fields';
	import type { User } from '@supabase/supabase-js';

	let {
		collaborator,
		field,
		user
	}: {
		field: Field;
		collaborator: FieldCollaborator;
		user: User | null;
	} = $props();

	let canEdit = $derived(user?.id === field.owner_id || user?.id === collaborator.user_id);

	const roleLabels: Record<CollaboratorRole, string> = {
		viewer: 'Viewer',
		editor: 'Editor'
	};

	let removing = $state(false);

	let editingRole = $state(false);
	let editingRoleValue: CollaboratorRole = $state(collaborator.role as CollaboratorRole);

	function shortUserId(uid: string) {
		if (!uid) return '';
		return uid.slice(0, 8) + '...' + uid.slice(-4);
	}
</script>

<li class="flex items-center py-3">
	<div class="flex-1">
		<div class="font-mono text-xs text-gray-700" title={collaborator.user_id}>
			{shortUserId(collaborator.user_id)}
		</div>
		<div class="text-xs text-gray-400">
			Added {new Date(collaborator.created_at).toLocaleDateString()}
		</div>
	</div>
	<div class="ml-4 flex items-center gap-2">
		{#if canEdit && editingRole}
			<form method="POST" action="?/updateFieldCollaborator" class="flex items-center gap-2">
				<input type="hidden" name="id" value={collaborator.id} />
				<select
					name="role"
					bind:value={editingRoleValue}
					class="rounded border px-2 py-1 text-xs"
					required
				>
					<option value="viewer">Viewer</option>
					<option value="editor">Editor</option>
				</select>
				<button
					type="submit"
					class="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
					onclick={() => (editingRole = false)}
				>
					Save
				</button>
				<button
					type="button"
					class="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300"
					onclick={() => (editingRole = false)}
				>
					Cancel
				</button>
			</form>
		{:else}
			<span class="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
				{roleLabels[collaborator.role as CollaboratorRole] ?? collaborator.role}
			</span>
			{#if canEdit}
				<button
					type="button"
					class="ml-1 text-xs text-blue-500 hover:underline"
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
			<form method="POST" action="?/removeFieldCollaborator" class="ml-2">
				<input type="hidden" name="id" value={collaborator.id} />
				<button
					type="submit"
					class="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200"
					title="Remove collaborator"
					onclick={() => (removing = true)}
					disabled={removing}
				>
					Remove
				</button>
			</form>
		{/if}
	</div>
</li>
