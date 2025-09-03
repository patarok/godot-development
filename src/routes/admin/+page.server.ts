import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { initializeDatabase } from '$lib/server/database/database-connection-init';
import { loginWithPassword } from '$lib/server/services/authService';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  return { isAdmin: !!user && user.role === 'admin', user };
};

export const actions: Actions = {
  adminLogin: async ({ request, cookies, getClientAddress }) => {

    await initializeDatabase();
    const { username, password } = Object.fromEntries(await request.formData()) as Record<string, string>;
    if (!username || !password) return fail(400, { message: 'Username and password are required' });

    const res = await loginWithPassword(username, password, { userAgent: request.headers.get('user-agent') ?? undefined, ip: getClientAddress() });
    if (!res) return fail(401, { message: 'Invalid credentials' });

    cookies.set('session', res.token, {
      path: '/', httpOnly: true, sameSite: 'strict', maxAge: 60 * 60 * 24 * 30
    });
    redirect(302, '/admin');
  }
};
