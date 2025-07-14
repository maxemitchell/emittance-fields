import type { Actions, PageServerLoad } from './$types';
import { getFields } from '$lib/db/fields';
import { createFieldAction, updateFieldAction, deleteFieldAction } from '$lib/actions/fields';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const fields = await getFields(supabase);
	return { fields };
};

export const actions: Actions = {
	createField: createFieldAction,
	updateField: updateFieldAction,
	deleteField: deleteFieldAction
};
