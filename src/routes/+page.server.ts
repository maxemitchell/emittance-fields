import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: test_table } = await supabase
		.from('test_table')
		.select('something')
		.limit(5)
		.order('something');
	return { test_table: test_table ?? [] };
};
