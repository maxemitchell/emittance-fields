import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

type TestTable = {
	id: number;
	something: number;
};

export const load: PageServerLoad = async () => {
	const { data, error } = await supabase.from('test_table').select<'test_table', TestTable>();

	if (error) {
		console.error('Error loading test_table:', error.message);
		return { test_table: [] };
	}

	return {
		test_table: data ?? []
	};
};
