import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') return { notAdmin: true } as any;
  const idStr = url.searchParams.get('id') ?? '';
  const id = Number(idStr);
  if (!id || Number.isNaN(id)) return { notFound: true } as any;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { roles: { include: { role: true } } }
  });
  if (!user) return { notFound: true } as any;
  const roles = await prisma.role.findMany({});
  return {
    user: {
      id: String(user.id),
      email: user.email,
      username: user.username,
      forename: user.forename,
      surname: user.surname,
      isActive: user.isActive,
      roles: user.roles.map((ur) => ur.role.title)
    },
    availableRoles: roles.map((r) => ({ id: r.id, title: r.title, isMainRole: r.isMainRole }))
  } as any;
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });
    const data = Object.fromEntries(await request.formData()) as Record<string, string>;
    const id = Number(data.id);
    if (!id || Number.isNaN(id)) return fail(400, { message: 'Missing id' });
    try {
      // Update basic profile fields
      await prisma.user.update({
        where: { id },
        data: {
          email: data.email,
          username: data.username,
          forename: data.forename || null,
          surname: data.surname || null,
          isActive: data.isActive === 'on'
        }
      });

      // Update single selected role among Admin / Consumer / Contributor
      const desiredRole = data.role; // expects exact titles
      if (desiredRole) {
        const role = await prisma.role.findFirst({ where: { title: desiredRole } });
        if (!role) return fail(400, { message: 'Unknown role' });
        // Remove existing Admin or main-role assignments, then add the desired one
        const userRoles = await prisma.userRole.findMany({ where: { userId: id }, include: { role: true } });
        const rolesToRemove = userRoles.filter((ur) => ur.role.title === 'Admin' || ur.role.isMainRole);
        if (rolesToRemove.length) {
          await prisma.userRole.deleteMany({ where: { id: { in: rolesToRemove.map((ur) => ur.id) } } });
        }
        const existingDesired = userRoles.find((ur) => ur.roleId === role.id);
        if (!existingDesired) {
          await prisma.userRole.create({ data: { userId: id, roleId: role.id } });
        }
      }

      redirect(303, '/admin/users/list');
    } catch (e: any) {
      return fail(400, { message: e.message || 'Update failed' });
    }
  }
};
