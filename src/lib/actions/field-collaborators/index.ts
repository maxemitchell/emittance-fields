import type { Action } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import {
	addFieldCollaborator,
	updateFieldCollaborator,
	removeFieldCollaborator,
	type CollaboratorRole
} from '$lib/db/field-collaborators';

// Action to add a collaborator to a field
export const addFieldCollaboratorAction: Action = async ({
	request,
	locals: { supabase, user }
}) => {
	const data = await request.formData();

	if (!user) {
		return fail(401, { error: 'Unauthorized' });
	}

	const field_id = data.get('field_id') as string;
	const user_id = data.get('user_id') as string;
	const role = data.get('role') as CollaboratorRole;

	if (!field_id || !user_id) {
		return fail(400, { error: 'Missing field_id or user_id' });
	}

	const collaborator = await addFieldCollaborator(supabase, {
		field_id,
		user_id,
		role
	});
	return {
		success: true,
		collaborator
	};
};

// Action to update a collaborator's role
export const updateFieldCollaboratorAction: Action = async ({
	request,
	locals: { supabase, user }
}) => {
	const data = await request.formData();

	if (!user) {
		return fail(401, { error: 'Unauthorized' });
	}

	const id = data.get('id') as string;
	const role = data.get('role') as CollaboratorRole;

	if (!id || !role) {
		return fail(400, { error: 'Missing id or role' });
	}

	const collaborator = await updateFieldCollaborator(supabase, id, { role });
	if (!collaborator) {
		return fail(404, { error: 'Collaborator not found' });
	}
	return {
		success: true,
		collaborator
	};
};

// Action to remove a collaborator from a field
export const removeFieldCollaboratorAction: Action = async ({
	request,
	locals: { supabase, user }
}) => {
	const data = await request.formData();

	if (!user) {
		return fail(401, { error: 'Unauthorized' });
	}

	const id = data.get('id') as string;

	if (!id) {
		return fail(400, { error: 'Missing field_collaborator id' });
	}

	await removeFieldCollaborator(supabase, id);
	return {
		success: true
	};
};
