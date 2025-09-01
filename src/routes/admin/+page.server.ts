import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getUser, setUserToken } from '$lib/server/userStorage';
import { verify } from '@node-rs/argon2';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  return { isAdmin: !!user && user.role === 'admin', user };
};

export const actions: Actions = {
  adminLogin: async ({ request, cookies }) => {
    const { username, password } = Object.fromEntries(await request.formData()) as Record<string, string>;
    if (!username || !password) return fail(400, { message: 'Username and password are required' });
    const user = await getUser(username);
    if (!user || user.role !== 'admin') return fail(401, { message: 'Invalid credentials' });

    const ok = await verify(user.password, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1
    });
    if (!ok) return fail(401, { message: 'Invalid credentials' });

    const token = await setUserToken(user.username);
    cookies.set('session', token, {
      path: '/', httpOnly: true, sameSite: 'strict', maxAge: 60 * 60 * 24 * 30
    });
    redirect(303, '/admin');
  }
};
