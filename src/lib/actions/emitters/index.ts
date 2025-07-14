import type { Action } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { addEmitter, updateEmitter, removeEmitter } from '$lib/db/emitters';

// Action to add an emitter to a field
export const addEmitterAction: Action = async ({ request, locals: { supabase, user } }) => {
	const data = await request.formData();

	if (!user) {
		return fail(401, { addEmitterAction: { error: 'Unauthorized' } });
	}

	const field_id = data.get('field_id') as string;
	const x = Number(data.get('x'));
	const y = Number(data.get('y'));
	const color = data.get('color') as string | undefined;

	if (!field_id || isNaN(x) || isNaN(y)) {
		return fail(400, { addEmitterAction: { error: 'Missing required emitter fields' } });
	}

	const emitter = await addEmitter(supabase, {
		field_id,
		x,
		y,
		color
	});

	return {
		addEmitterAction: {
			status: 200,
			message: 'Emitter added successfully'
		},
		success: true,
		emitter
	};
};

// Action to update an emitter
export const updateEmitterAction: Action = async ({ request, locals: { supabase, user } }) => {
	const data = await request.formData();

	if (!user) {
		return fail(401, { updateEmitterAction: { error: 'Unauthorized' } });
	}

	const id = data.get('id') as string;
	const name = data.get('name') as string | null;
	const type = data.get('type') as string | null;
	const config = data.get('config') as string | null;

	if (!id) {
		return fail(400, { updateEmitterAction: { error: 'Missing emitter id' } });
	}

	const updateData: Record<string, unknown> = {};
	if (name !== null) updateData.name = name;
	if (type !== null) updateData.type = type;
	if (config !== null) updateData.config = config;

	const emitter = await updateEmitter(supabase, id, updateData);
	if (!emitter) {
		return fail(404, {
			updateEmitterAction: {
				error: 'Emitter not found or not authorized to update'
			}
		});
	}
	return {
		updateEmitterAction: {
			status: 200,
			message: 'Emitter updated successfully'
		},
		success: true,
		emitter
	};
};

// Action to remove an emitter
export const removeEmitterAction: Action = async ({ request, locals: { supabase, user } }) => {
	const data = await request.formData();

	if (!user) {
		return fail(401, { removeEmitterAction: { error: 'Unauthorized' } });
	}

	const id = data.get('id') as string;

	if (!id) {
		return fail(400, { removeEmitterAction: { error: 'Missing emitter id' } });
	}

	const emitter = await removeEmitter(supabase, id);

	if (!emitter) {
		return fail(404, {
			removeEmitterAction: {
				error: 'Emitter not found or not authorized to remove'
			}
		});
	}
	return {
		removeEmitterAction: {
			status: 200,
			message: 'Emitter removed successfully'
		},
		success: true,
		emitter
	};
};
