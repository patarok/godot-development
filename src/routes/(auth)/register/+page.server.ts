import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { hash } from '@node-rs/argon2';
import { getUser, getUserByEmail, upsertUser } from '$lib/server/userStorage';

export const actions = {
    default: async ({ request }) => {
        const { email, forename, surname, username, password, role } = Object.fromEntries(await request.formData()) as Record<string, string>;

        if (!email || !username || !password) {
            return fail(400, {
                error: true,
                message: '<strong>Email</strong>, <strong>username</strong> and <strong>password</strong> can not be blank.'
            });
        }

        const trimmedUsername = username.trim();
        const normalizedEmail = email.trim().toLowerCase();
        const emailValid = /.+@.+\..+/.test(normalizedEmail);
        if (!emailValid) {
            return fail(400, { error: true, message: 'Please provide a valid <strong>email</strong>.' });
        }

        const existing = await getUser(trimmedUsername);
        if (existing) {
            return fail(400, {
                error: true,
                message: '<strong>Username</strong> already exists.'
            });
        }

        const roleValue = role?.trim().toLowerCase();
        if (roleValue !== 'admin' && roleValue !== 'user') {
            return fail(400, { error: true, message: 'Invalid role selected.' });
        }

        const existingEmail = await getUserByEmail(normalizedEmail);
        if (existingEmail) {
            return fail(400, {
                error: true,
                message: '<strong>Email</strong> already in use.'
            });
        }

        const hashedPassword = await hash(password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        });

        await upsertUser({ email: normalizedEmail, forename: forename?.trim() || undefined, surname: surname?.trim() || undefined, username: trimmedUsername, role: roleValue as 'admin' | 'user', password: hashedPassword });

        redirect(303, '/login');
    }
} satisfies Actions;