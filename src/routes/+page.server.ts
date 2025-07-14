import type { Actions, PageServerLoad } from './$types';
import { getFields } from '$lib/db/fields';
import { createFieldAction } from '$lib/actions/fields';
import { withActionErrorHandling } from '$lib/action-middleware';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const fields = await getFields(supabase);
	return { fields };
};

export const actions: Actions = {
	createField: withActionErrorHandling(createFieldAction)
};
