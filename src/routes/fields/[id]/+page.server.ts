import type { PageServerLoad } from './$types';
import { getField } from '$lib/db/fields';
import { redirect, type Actions } from '@sveltejs/kit';
import { deleteFieldAction, updateFieldAction } from '$lib/actions/fields';
import { getFieldCollaborators } from '$lib/db/field-collaborators';
import {
	addFieldCollaboratorAction,
	removeFieldCollaboratorAction,
	updateFieldCollaboratorAction
} from '$lib/actions/field-collaborators';
import { withActionErrorHandling } from '$lib/action-middleware';

export const load: PageServerLoad = async ({ locals: { supabase }, params }) => {
	const { id } = params;
	const field = await getField(supabase, id);

	if (!field) {
		return redirect(303, '/');
	}

	const collaborators = await getFieldCollaborators(supabase, id);

	return { field, collaborators };
};

export const actions: Actions = {
	updateField: withActionErrorHandling(updateFieldAction),
	deleteField: withActionErrorHandling(deleteFieldAction),
	addFieldCollaborator: withActionErrorHandling(addFieldCollaboratorAction),
	updateFieldCollaborator: withActionErrorHandling(updateFieldCollaboratorAction),
	removeFieldCollaborator: withActionErrorHandling(removeFieldCollaboratorAction)
};
