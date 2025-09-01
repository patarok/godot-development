import type { PageServerLoad } from './$types';
import { listUsers } from '$lib/server/userStorage';

// For now, fetch from Mailhog HTTP API
async function fetchMailhogMessages(): Promise<any[]> {
  try {
    const res = await fetch('http://mail:8025/api/v2/messages');
    if (!res.ok) return [];
    const data = await res.json();
    return data?.items ?? [];
  } catch {
    return [];
  }
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'admin') return { notAdmin: true } as any;
  const [users, messages] = await Promise.all([listUsers(), fetchMailhogMessages()]);
  // Normalize messages list for UI
  const mails = messages.map((m: any) => ({
    id: m.ID,
    from: m.Content?.Headers?.From?.[0] ?? '',
    to: m.Content?.Headers?.To?.[0] ?? '',
    subject: m.Content?.Headers?.Subject?.[0] ?? '(no subject)',
    date: m.Content?.Headers?.Date?.[0] ?? ''
  }));
  return { users, mails };
};
