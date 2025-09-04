import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { issuePasswordReset } from '$lib/server/services';

export const actions: Actions = {
    default: async ({ request }) => {

        const form = await request.formData();
        const identifier = String(form.get('identifier') ?? '');
        if (!identifier) return fail(400, { message: 'Missing email/username' });
        await issuePasswordReset(identifier);
        return { message: 'If the account exists, a reset email has been sent.' };
    }
};