import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { AppDataSource, User } from '$lib/server/database';
import { toPlainArray } from '$lib/utils';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');

  const users = await AppDataSource.getRepository(User).find({ order: { createdAt: 'DESC' } });


  const plainUsers = toPlainArray(users);
  return { plainUsers };
};