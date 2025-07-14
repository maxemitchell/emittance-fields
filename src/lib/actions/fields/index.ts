import type { Action } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { createField, updateField, deleteField } from '$lib/db/fields';

export const createFieldAction: Action = async ({ request, locals: { supabase, user } }) => {
	const data = await request.formData();
	// TODO[MM]: Add Form Validations

	if (!user) {
		return fail(401, { createFieldAction: { error: 'Unauthorized' } });
	}

	const field = await createField(supabase, {
		owner_id: user.id,
		name: data.get('name') as string,
		background_color: data.get('background_color') as string,
		is_public: data.get('is_public') === 'true',
		description: data.get('description') as string,
		width: parseInt(data.get('width') as string),
		height: parseInt(data.get('height') as string)
	});

	return {
		createFieldAction: {
			status: 200,
			message: 'Field created successfully'
		},
		success: true,
		field
	};
};

export const updateFieldAction: Action = async ({ request, locals: { supabase, user } }) => {
	const data = await request.formData();
	// TODO[MM]: Add Form Validations

	if (!user) {
		return fail(401, { updateFieldAction: { error: 'Unauthorized' } });
	}

	const field = await updateField(supabase, data.get('id') as string, {
		name: data.get('name') as string,
		background_color: data.get('background_color') as string,
		is_public: data.get('is_public') === 'true',
		description: data.get('description') as string,
		width: parseInt(data.get('width') as string),
		height: parseInt(data.get('height') as string)
	});

	if (!field) {
		return fail(404, { updateFieldAction: { error: 'Field not found' } });
	}

	return {
		success: true,
		field
	};
};

export const deleteFieldAction: Action = async ({ request, locals: { supabase, user } }) => {
	const data = await request.formData();
	// TODO[MM]: Add Form Validations

	if (!user) {
		return fail(401, { deleteFieldAction: { error: 'Unauthorized' } });
	}

	const field = await deleteField(supabase, data.get('id') as string);

	if (!field) {
		return fail(404, {
			deleteFieldAction: { error: 'Field not found or not authorized to delete' }
		});
	}

	return {
		deleteFieldAction: {
			status: 200,
			message: 'Field deleted successfully'
		},
		success: true
	};
};
