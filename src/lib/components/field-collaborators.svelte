<script lang="ts">
	import type { FieldCollaborator } from '$lib/db/field-collaborators';
	import AddFieldCollaboratorCard from './add-field-collaborator-card.svelte';
	import FieldCollaboratorComponent from './field-collaborator.svelte';
	import type { ActionData } from '../../routes/$types.d';
	import type { Field } from '$lib/db/fields';
	import type { User } from '@supabase/supabase-js';

	let {
		form,
		collaborators = [],
		field,
		user
	}: {
		form: ActionData | null;
		collaborators?: FieldCollaborator[];
		field: Field;
		user: User | null;
	} = $props();
</script>

<div class="mx-auto mb-6 w-full max-w-2xl rounded-lg border bg-white p-6 shadow-sm">
	<h3 class="mb-4 text-lg font-semibold text-gray-800">Collaborators</h3>

	{#if collaborators.length === 0}
		<div class="mb-4 text-sm text-gray-500">No collaborators yet.</div>
	{/if}

	<ul class="mb-4 divide-y divide-gray-100">
		{#each collaborators as collaborator (collaborator.id)}
			<FieldCollaboratorComponent {collaborator} {field} {user} {form} />
		{/each}
	</ul>

	<AddFieldCollaboratorCard {field} {form} />
</div>
