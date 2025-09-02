import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/server/database/database-connection-init';
import { registerUser, createSession } from '$lib/server/services/authService';

export const actions: Actions = {
    default: async ({ request, cookies, getClientAddress }) => {
        await initializeDatabase();
        const form = await request.formData();
        const email = String(form.get('email') ?? '');
        const username = String(form.get('username') ?? '');
        const password = String(form.get('password') ?? '');
        if (!email || !password) return fail(400, { message: 'Missing fields' });

        try {
            const user = await registerUser({ email, username: username || undefined, password });
            const { token } = await createSession(user.id, { userAgent: request.headers.get('user-agent') ?? undefined, ip: getClientAddress() });
            cookies.set('session', token, { path: '/', httpOnly: true, sameSite: 'lax', secure: false, maxAge: 60 * 60 * 24 * 30 });
            throw redirect(303, '/');
        } catch {
            return fail(400, { message: 'Registration failed' });
        }
    }
};