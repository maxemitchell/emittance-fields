<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from '../../routes/$types.d';
	import type { CollaboratorRole } from '$lib/db/field-collaborators';
	import type { Field } from '$lib/db/fields';

	let { form, field } = $props<{
		form: ActionData | null;
		field: Field;
	}>();

	let userId = $state('');
	let role: CollaboratorRole = $state('viewer');
</script>

<form
	method="POST"
	action="?/addFieldCollaborator"
	use:enhance
	class="w-full rounded-lg border bg-white p-6 shadow-sm"
>
	<h3 class="mb-4 text-lg font-semibold text-gray-800">Add Collaborator</h3>

	{#if form?.addFieldCollaboratorAction?.error}
		<div class="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
			{form.addFieldCollaboratorAction.error}: {form.addFieldCollaboratorAction.details?.toString()}
		</div>
	{/if}

	<input type="hidden" name="field_id" value={field.id} />

	<div class="space-y-4">
		<div>
			<label for="user_id" class="mb-1 block text-sm font-medium text-gray-700">User ID</label>
			<input
				id="user_id"
				name="user_id"
				type="text"
				bind:value={userId}
				placeholder="Paste user UUID"
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				required
			/>
		</div>
		<div>
			<label for="role" class="mb-1 block text-sm font-medium text-gray-700">Role</label>
			<select
				id="role"
				name="role"
				bind:value={role}
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				required
			>
				<option value="viewer">Viewer</option>
				<option value="editor">Editor</option>
			</select>
		</div>
	</div>

	<button
		type="submit"
		disabled={form?.addFieldCollaboratorAction?.pending}
		class="mt-6 w-full rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
	>
		{form?.addFieldCollaboratorAction?.pending ? 'Adding...' : 'Add Collaborator'}
	</button>
</form>
