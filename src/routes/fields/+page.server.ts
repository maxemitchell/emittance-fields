import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ depends, locals: { supabase } }) => {
	depends('supabase:db:fields');
	const { data: fields } = await supabase.from('fields').select('id,name').order('id');
	return { fields: fields ?? [] };
};
