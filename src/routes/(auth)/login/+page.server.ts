import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

import { loginWithPassword } from '$lib/server/services';

export const actions: Actions = {
    default: async ({ request, cookies, getClientAddress }) => {

        const form = await request.formData();
        const identifier = String(form.get('username') ?? '');
        const password = String(form.get('password') ?? '');
        if (!identifier || !password) return fail(400, { message: 'Missing credentials' });

        const res = await loginWithPassword(identifier, password, { userAgent: request.headers.get('user-agent') ?? undefined, ip: getClientAddress() });
        if (!res) return fail(401, { message: 'Invalid credentials' });

        cookies.set('session', res.token, { path: '/', httpOnly: true, sameSite: 'lax', secure: false, maxAge: 60 * 60 * 24 * 30 });
        //throw redirect(303, '/');
        redirect(302, '/');
    }
};