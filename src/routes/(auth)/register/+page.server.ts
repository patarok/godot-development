import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { hash } from '@node-rs/argon2';
import { getUser, upsertUser } from '$lib/server/userStorage';

export const actions = {
    default: async ({ request }) => {
        const { username, password } = Object.fromEntries(await request.formData()) as Record<string, string>;

        if (!username || !password) {
            return fail(400, {
                error: true,
                message: '<strong>Username</strong> and/or <strong>password</strong> can not be blank.'
            });
        }

        const trimmedUsername = username.trim();

        const existing = await getUser(trimmedUsername);
        if (existing) {
            return fail(400, {
                error: true,
                message: '<strong>Username</strong> already exists.'
            });
        }

        const hashedPassword = await hash(password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        });

        await upsertUser({ username: trimmedUsername, password: hashedPassword, token: '' });

        redirect(303, '/login');
    }
} satisfies Actions;