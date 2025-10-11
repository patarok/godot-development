import type { PageServerLoad } from './$types';
import { AppDataSource, User, Role, initializeDatabase } from '$lib/server/database';
import { In } from 'typeorm';

export const load: PageServerLoad = async ({ locals }) => {
  // Only admins can view the user list. Non-admins see a friendly message handled by the page.
  if (!locals.user || locals.user.role !== 'admin') {
    return { notAdmin: true, users: [] };
  }

  await initializeDatabase();

  const userRepo = AppDataSource.getRepository(User);

  // Load the role relation directly
  const users = await userRepo.find({
    relations: { role: true },
    order: { createdAt: 'DESC' }
  });

  const plain = users.map((u) => ({
    id: u.id,
    username: u.username ?? u.email,
    email: u.email,
    forename: u.forename ?? null,
    surname: u.surname ?? null,
    isActive: u.isActive,
    role: u.role?.name ?? 'user' // use the role name directly
  }));

  return { notAdmin: false, users: plain };
};