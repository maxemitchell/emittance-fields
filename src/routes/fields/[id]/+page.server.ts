import type { PageServerLoad } from './$types';
import { getField } from '$lib/db/fields';
import { redirect, type Actions } from '@sveltejs/kit';
import { deleteFieldAction, updateFieldAction } from '$lib/actions/fields';

export const load: PageServerLoad = async ({ locals: { supabase }, params }) => {
	const { id } = params;
	const field = await getField(supabase, id);

	if (!field) {
		return redirect(303, '/');
	}

	return { field };
};

export const actions: Actions = {
	updateField: updateFieldAction,
	deleteField: deleteFieldAction
};
