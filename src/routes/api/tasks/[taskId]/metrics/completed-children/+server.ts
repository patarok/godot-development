import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { AppDataSource, initializeDatabase, Task } from '$lib/server/database';
import { Between } from 'typeorm';

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function fmtISODateUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const GET: RequestHandler = async ({ params, url }) => {
  const parentId = params.taskId; // meta task id
  const days = Math.max(1, Math.min(31, Number(url.searchParams.get('days') ?? '7')));

  await initializeDatabase();
  const repo = AppDataSource.getRepository(Task);

  const now = new Date();
  const endDay = startOfUtcDay(now);
  const startDay = new Date(endDay);
  startDay.setUTCDate(endDay.getUTCDate() - (days - 1));
  const endExclusive = new Date(endDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  // Fetch children completed in the window
  const rows = await repo.find({
    where: {
      parent: { id: parentId } as any,
      isDone: true,
      doneDate: (AppDataSource.driver as any).utils?.Between
        ? (AppDataSource.driver as any).utils.Between(startDay, endExclusive)
        : undefined
    } as any,
    select: { id: true, doneDate: true }
  });

  const dayKeys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDay);
    d.setUTCDate(startDay.getUTCDate() + i);
    dayKeys.push(fmtISODateUTC(d));
  }

  const counts = new Map<string, number>();
  for (const k of dayKeys) counts.set(k, 0);

  for (const r of rows) {
    const key = fmtISODateUTC(startOfUtcDay(new Date(r.doneDate)));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const series = dayKeys.map((day) => ({ day, value: counts.get(day) ?? 0 }));
  return json({ series });
};
