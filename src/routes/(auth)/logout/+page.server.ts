import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';

import { revokeSession } from '$lib/server/services';

export const actions: Actions = {
    default: async ({ cookies }) => {

        const token = cookies.get('session');
        if (token) await revokeSession(token);
        cookies.delete('session', { path: '/' });
        redirect(303, '/');
    }
};