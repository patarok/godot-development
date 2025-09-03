import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/server/database/database-connection-init';
import { registerUser, createSession, assignRoleToUser } from '$lib/server/services/authService';

export const actions: Actions = {
    default: async ({ request, cookies, getClientAddress }) => {
        if (process.env.DEBUG_REGISTER === '1') debugger;
        await initializeDatabase();
        const form = await request.formData();
        const email = String(form.get('email') ?? '');
        const username = String(form.get('username') ?? '');
        const password = String(form.get('password') ?? '');
        const roleRaw = String(form.get('role') ?? '').toLowerCase();
        const role = roleRaw === 'admin' ? 'admin' : 'user'; // whitelist, default to user

        if (!email || !password) return fail(400, { message: 'Missing fields' });

        try {
            const user = await registerUser({ email, username: username || undefined, password });

            // Assign role (creates Role row if missing)
            await assignRoleToUser(user.id, role);

            const { token } = await createSession(user.id, {
                userAgent: request.headers.get('user-agent') ?? undefined,
                ip: getClientAddress()
            });
            cookies.set('session', token, { path: '/', httpOnly: true, sameSite: 'lax', secure: false, maxAge: 60 * 60 * 24 * 30 });

        } catch {
            return fail(400, { message: 'Registration failed' });
        }
        redirect(302, '/');
    }
};