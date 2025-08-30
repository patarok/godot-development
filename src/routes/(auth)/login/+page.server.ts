import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { verify } from '@node-rs/argon2';
import { getUser, setUserToken } from '$lib/server/userStorage';

export const actions = {
    default: async ({ cookies, request }) => {
        const { username, password } = Object.fromEntries(await request.formData()) as Record<string, string>;

        if (!username || !password) {
            return fail(400, { error: true, message: '<strong>Username</strong> and/or <strong>password</strong> can not be blank.' });
        }

        const user = await getUser(username);
        if (!user) {
            return fail(400, { error: true, message: 'User not exists.' });
        }

        const validPassword = await verify(user.password, password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        });

        if (!validPassword) {
            return fail(400, { error: true, message: 'You have entered invalid credentials.' });
        }

        const token = await setUserToken(user.username); // serialized + atomic save

        cookies.set('session', token, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30
        });

        redirect(302, '/');
    }
} satisfies Actions;