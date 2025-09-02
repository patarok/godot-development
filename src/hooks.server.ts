import type { Handle } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { createHash } from 'crypto';

function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('session');
  let user = null as null | {
    id: number;
    username: string | null;
    email: string;
    forename: string | null;
    surname: string | null;
    role: 'admin' | 'user';
    rolesAll: string[]; // extra info if needed
  };

  if (token) {
    const tokenHash = hashToken(token);
    const now = new Date();
    const session = await prisma.session.findUnique({ where: { tokenHash: tokenHash } });
    if (session && (!session.revokedAt) && session.expiresAt > now) {
      const u = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { roles: { include: { role: true } } }
      });
      if (u) {
        const titles = u.roles.map((ur) => ur.role.title);
        const isAdmin = titles.includes('Admin');
        user = {
          id: u.id,
          username: u.username,
          email: u.email,
          forename: u.forename,
          surname: u.surname,
          role: isAdmin ? 'admin' : 'user',
          rolesAll: titles
        };
      }
    }
  }

  event.locals.user = user;
  return resolve(event);
};