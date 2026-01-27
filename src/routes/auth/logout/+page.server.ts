import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { deleteSession } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ locals, cookies }) => {
		if (locals.sessionId) {
			await deleteSession(locals.sessionId, cookies);
		}

		throw redirect(302, '/');
	}
};
