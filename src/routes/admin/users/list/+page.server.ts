import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals }) => {
  // TODO: migrate locals.user to Prisma-backed session; for now, keep admin gate as-is
  if (!locals.user || locals.user.role !== 'admin') {
    return { notAdmin: true, users: [] } as any;
  }
  const users = await prisma.user.findMany({
    include: { roles: { include: { role: true } } }
  });
  const shaped = users.map((u) => ({
    id: String(u.id),
    email: u.email,
    username: u.username,
    forename: u.forename,
    surname: u.surname,
    // Show a concise role display: Admin OR first main role
    role:
      u.roles.find((ur) => ur.role.title === 'Admin')?.role.title ??
      u.roles.find((ur) => ur.role.isMainRole)?.role.title ??
      '—',
    isActive: u.isActive
  }));
  return { notAdmin: false, users: shaped } as any;
};
