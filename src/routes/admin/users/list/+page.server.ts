import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/server/database/database-connection-init';
import { AppDataSource } from '$lib/server/database/config/datasource';
import { User } from '$lib/server/database/entities/user/User';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  await initializeDatabase();
  const users = await AppDataSource.getRepository(User).find({ order: { createdAt: 'DESC' } as any });
  return { users };
};