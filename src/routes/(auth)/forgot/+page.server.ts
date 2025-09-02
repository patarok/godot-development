import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/server/database/database-connection-init';
import { issuePasswordReset } from '$lib/server/services/authService';

export const actions: Actions = {
    default: async ({ request }) => {
        await initializeDatabase();
        const form = await request.formData();
        const identifier = String(form.get('identifier') ?? '');
        if (!identifier) return fail(400, { message: 'Missing email/username' });
        await issuePasswordReset(identifier);
        return { message: 'If the account exists, a reset email has been sent.' };
    }
};