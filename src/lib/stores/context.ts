import { getContext, setContext } from 'svelte';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../database.types';
import type { EmitterStoreInstance, UserRoleStoreInstance } from './factories';
import { createEmitterStore, createUserRoleStore } from './factories';

const EMITTER_STORE_KEY = 'emitterStore';
const USER_ROLE_STORE_KEY = 'userRoleStore';

export function setStoreContext(supabase: SupabaseClient<Database>) {
	const emitterStore = createEmitterStore(supabase);
	const userRoleStore = createUserRoleStore(supabase);
	
	setContext(EMITTER_STORE_KEY, emitterStore);
	setContext(USER_ROLE_STORE_KEY, userRoleStore);
	
	return { emitterStore, userRoleStore };
}

export function getEmitterStore(): EmitterStoreInstance {
	const store = getContext<EmitterStoreInstance>(EMITTER_STORE_KEY);
	if (!store) {
		throw new Error('EmitterStore not found in context. Make sure to call setStoreContext first.');
	}
	return store;
}

export function getUserRoleStore(): UserRoleStoreInstance {
	const store = getContext<UserRoleStoreInstance>(USER_ROLE_STORE_KEY);
	if (!store) {
		throw new Error('UserRoleStore not found in context. Make sure to call setStoreContext first.');
	}
	return store;
}
