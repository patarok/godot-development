import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { issuePasswordReset } from '$lib/server/services';

type TokenCredentials = Awaited<ReturnType<typeof issuePasswordReset>>;

export const actions: Actions = {
    requestreset: async ({ request }) => {

        const form = await request.formData();
        const identifier = String(form.get('identifier') ?? '');
        if (!identifier) return fail(400, { message: 'Missing email/username' });

        const result: TokenCredentials = await issuePasswordReset(identifier);
        if (!tokenCredentials) {
            return fail(400, { error: 'User not found' });
        }
        const { token, expiresAt, user } = tokenCredentials;
        try {
            //foo -- send the mail with the token attached

        }
        catch{
            //bar -- message that there was a problem with sending the email.
        }

        return { message: 'If the account exists, a reset email has been sent.' };
    }
} satisfies Actions;