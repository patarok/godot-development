import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { hash } from '@node-rs/argon2';
import { resetPasswordWithToken, createSessionForUser, getUserByToken } from '$lib/server/userStorage';

export const load: PageServerLoad = async ({ url }) => {
    const token = url.searchParams.get('token') ?? '';
    return { token };
};

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const data = Object.fromEntries(await request.formData()) as Record<string, string>;
        const token = data.token;
        const newPassword = data.password;
        if (!token || !newPassword) return fail(400, { message: 'Missing token or password' });
        const hashedPassword = await hash(newPassword, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        });
        const ok = await resetPasswordWithToken(token, hashedPassword);
        if (!ok) return fail(400, { message: 'Invalid or expired token' });
        // Optionally auto-login: we don't know username here; skip auto-login for simplicity
        redirect(303, '/login');
    }
};
