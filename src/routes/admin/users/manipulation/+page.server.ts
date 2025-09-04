import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { AppDataSource, User } from '$lib/server/database';
import { toPlain } from '$lib/utils';

export const load: PageServerLoad = async ({ url, locals }) => {

  if (!locals.user || locals.user.role !== 'admin') return { notAdmin: true } as any;
  const id = url.searchParams.get('id') ?? '';

  if (!id) return { notFound: true } as any;
  const user = await AppDataSource.getRepository(User).findOne({ where: { id } });

  if (!user) return { notFound: true } as any;
  const plainUser = toPlain(user);
  return { user: plainUser };

};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });

    const data = Object.fromEntries(await request.formData()) as Record<string, string>;
    const id = Number(data.id);
    if (!id) return fail(400, { message: 'Missing id' });
    try {
      const repo = AppDataSource.getRepository(User);
      const user = await repo.findOne({ where: { id } });
      if (!user) return fail(404, { message: 'User not found' });
      user.email = data.email?.trim().toLowerCase() || user.email;
      user.username = data.username?.trim() || user.username;
      user.forename = data.forename?.trim() || null as any;
      user.surname = data.surname?.trim() || null as any;
      user.isActive = data.isActive === 'on';
      await repo.save(user);
      redirect(303, '/admin/users/list');
    } catch (e: any) {
      return fail(400, { message: e.message || 'Update failed' });
    }
  }
};
