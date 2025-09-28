import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { revokeSession } from '$lib/server/services';

export const POST: RequestHandler = async ({ cookies }) => {
  const token = cookies.get('session');
  if (token) await revokeSession(token);
  cookies.delete('session', { path: '/' });
  return json({ ok: true });
};
