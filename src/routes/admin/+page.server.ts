import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loginWithPassword } from '$lib/server/services';
import { appState } from '$lib/state.svelte.js';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  return { isAdmin: !!user && user.role === 'admin', user };
};

export const actions: Actions = {
  adminLogin: async ({ request, cookies, getClientAddress }) => {

    const { username, password } = Object.fromEntries(await request.formData()) as Record<string, string>;
    if (!username || !password) return fail(400, { message: 'Username and password are required' });

    const res = await loginWithPassword(username, password, { userAgent: request.headers.get('user-agent') ?? undefined, ip: getClientAddress() });
    if (!res) return fail(401, { message: 'Invalid credentials' });
    debugger;
    appState.setAdmin();
    cookies.set('session', res.token, {
      path: '/', httpOnly: true, sameSite: 'strict', maxAge: 60 * 60 * 24 * 30
    });
    redirect(302, '/admin');
  }
};
