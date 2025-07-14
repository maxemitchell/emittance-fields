import type { PageServerLoad } from './$types';
import { getFields } from '$lib/db/fields';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const fields = await getFields(supabase);
	return { fields };
};
