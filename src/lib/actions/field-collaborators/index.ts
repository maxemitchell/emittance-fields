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
		return fail(401, { addFieldCollaboratorAction: { error: 'Unauthorized' } });
	}

	const field_id = data.get('field_id') as string;
	const user_id = data.get('user_id') as string;
	const role = data.get('role') as CollaboratorRole;

	if (!field_id || !user_id) {
		return fail(400, { addFieldCollaboratorAction: { error: 'Missing field_id or user_id' } });
	}

	const collaborator = await addFieldCollaborator(supabase, {
		field_id,
		user_id,
		role
	});
	return {
		addFieldCollaboratorAction: {
			status: 200,
			message: 'Collaborator added successfully'
		},
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
		return fail(401, { updateFieldCollaboratorAction: { error: 'Unauthorized' } });
	}

	const id = data.get('id') as string;
	const role = data.get('role') as CollaboratorRole;

	if (!id || !role) {
		return fail(400, { updateFieldCollaboratorAction: { error: 'Missing id or role' } });
	}

	const collaborator = await updateFieldCollaborator(supabase, id, { role });
	if (!collaborator) {
		return fail(404, {
			updateFieldCollaboratorAction: {
				error: 'Collaborator not found or not authorized to update'
			}
		});
	}
	return {
		updateFieldCollaboratorAction: {
			status: 200,
			message: 'Collaborator updated successfully'
		},
		success: true,
		collaborator
	};
};

export const removeFieldCollaboratorAction: Action = async ({
	request,
	locals: { supabase, user }
}) => {
	const data = await request.formData();

	if (!user) {
		return fail(401, { removeFieldCollaboratorAction: { error: 'Unauthorized' } });
	}

	const id = data.get('id') as string;

	if (!id) {
		return fail(400, { removeFieldCollaboratorAction: { error: 'Missing field_collaborator id' } });
	}

	const collaborator = await removeFieldCollaborator(supabase, id);

	if (!collaborator) {
		return fail(404, {
			removeFieldCollaboratorAction: {
				error: 'Collaborator not found or not authorized to remove'
			}
		});
	}
	return {
		removeFieldCollaboratorAction: {
			status: 200,
			message: 'Collaborator removed successfully'
		},
		success: true,
		collaborator
	};
};
