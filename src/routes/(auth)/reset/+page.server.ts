import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { resetPasswordWithToken } from '$lib/server/services';

export const actions: Actions = {
    default: async ({ request }) => {
        const form = await request.formData();
        const token = String(form.get('token') ?? '');
        const password = String(form.get('password') ?? '');
        if (!token || !password) return fail(400, { message: 'Missing fields' });
        const ok = await resetPasswordWithToken(token, password);
        if (!ok) return fail(400, { message: 'Invalid or expired token' });
        throw redirect(303, '/(auth)/login');
    }
};