import type { RequestEvent } from '@sveltejs/kit';

export function isAdmin(locals: any): boolean {
  return !!locals?.user && locals.user.role === 'admin';
}
