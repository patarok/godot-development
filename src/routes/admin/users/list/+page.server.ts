import type { PageServerLoad } from './$types';
import { AppDataSource, User, UserRole, initializeDatabase } from '$lib/server/database';
import { In } from 'typeorm';

export const load: PageServerLoad = async ({ locals }) => {
  // Only admins can view the user list. Non-admins see a friendly message handled by the page.
  if (!locals.user || locals.user.role !== 'admin') {
    return { notAdmin: true, users: [] };
  }

  await initializeDatabase();

  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find({ order: { createdAt: 'DESC' } });

  // Fetch roles for these users and compute a simple role label (admin/user)
  const ids = users.map((u) => u.id);

  const userRoles = ids.length
    ? await urRepo.find({ where: { userId: In(ids) }, relations: ['role'] })
    : [];
  const roleByUser = new Map<string, string>();
  for (const ur of userRoles as any[]) {
    const name = ur.role?.name as string | undefined;
    if (!name) continue;
    if (name === 'admin') {
      roleByUser.set(ur.userId, 'admin');
    } else if (!roleByUser.has(ur.userId)) {
      roleByUser.set(ur.userId, 'user');
    }
  }

  const plain = users.map((u) => ({
    id: u.id,
    username: u.username ?? u.email,
    email: u.email,
    forename: u.forename ?? null,
    surname: u.surname ?? null,
    isActive: u.isActive,
    role: roleByUser.get(u.id) ?? 'user'
  }));

  return { notAdmin: false, users: plain };
};