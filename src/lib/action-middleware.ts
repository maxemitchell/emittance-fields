import type { Action } from '@sveltejs/kit';

/**
 * Middleware to wrap SvelteKit Actions and catch server errors.
 * Usage:
 *   export const myAction = withActionErrorHandling(async (event) => { ... });
 */
export function withActionErrorHandling(action: Action) {
	return async function (event: Parameters<typeof action>[0]) {
		try {
			return await action(event);
		} catch (error: unknown) {
			console.error('Action error:', error);
			return {
				[action.name]: {
					status: 500,
					error: 'Internal Server Error',
					details: (error as { message: string })?.message
				}
			};
		}
	};
}
