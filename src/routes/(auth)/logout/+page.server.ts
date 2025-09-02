import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/server/database/database-connection-init';
import { revokeSession } from '$lib/server/services/authService';

export const actions: Actions = {
    default: async ({ cookies }) => {
        await initializeDatabase();
        const token = cookies.get('session');
        if (token) await revokeSession(token);
        cookies.delete('session', { path: '/' });
        throw redirect(303, '/');
    }
};