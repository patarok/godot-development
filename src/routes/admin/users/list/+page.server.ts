import type { PageServerLoad } from './$types';
import { listUsers } from '$lib/server/userStorage';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return { notAdmin: true, users: [] };
  }
  const users = await listUsers();
  return { notAdmin: false, users };
};
