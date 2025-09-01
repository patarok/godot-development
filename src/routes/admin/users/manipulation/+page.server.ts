import type { Actions, PageServerLoad } from './$types';
import { getUserById, updateUserById } from '$lib/server/userStorage';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') return { notAdmin: true } as any;
  const id = url.searchParams.get('id') ?? '';
  const user = id ? await getUserById(id) : null;
  if (!user) return { notFound: true } as any;
  return { user };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });
    const data = Object.fromEntries(await request.formData()) as Record<string, string>;
    const id = data.id;
    if (!id) return fail(400, { message: 'Missing id' });
    try {
      const updated = await updateUserById(id, {
        email: data.email,
        username: data.username,
        forename: data.forename || undefined,
        surname: data.surname || undefined,
        role: (data.role === 'admin' ? 'admin' : 'user') as 'admin'|'user',
        isActive: data.isActive === 'on'
      });
      if (!updated) return fail(404, { message: 'User not found' });
      redirect(303, '/admin/users/list');
    } catch (e: any) {
      return fail(400, { message: e.message || 'Update failed' });
    }
  }
};
