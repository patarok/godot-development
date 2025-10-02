import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { AppDataSource, initializeDatabase, TimeEntry } from '$lib/server/database';
import { Between } from 'typeorm';

function startOfUtcDay(d: Date) {
  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return dt;
}

function fmtISODateUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const GET: RequestHandler = async ({ params, url }) => {
  const taskId = params.taskId;
  const days = Math.max(1, Math.min(31, Number(url.searchParams.get('days') ?? '7')));

  await initializeDatabase();
  const repo = AppDataSource.getRepository(TimeEntry);

  const now = new Date();
  const endDay = startOfUtcDay(now);
  const startDay = new Date(endDay);
  startDay.setUTCDate(endDay.getUTCDate() - (days - 1));

  // Load minimal rows in range
  const rows = await repo.find({
    where: {
      taskId,
      startedAt: Between(startDay, new Date(endDay.getTime() + 24 * 60 * 60 * 1000 - 1))
    },
    order: { startedAt: 'ASC' }
  });

  const dayKeys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDay);
    d.setUTCDate(startDay.getUTCDate() + i);
    dayKeys.push(fmtISODateUTC(d));
  }

  const map = new Map<string, Set<string>>();
  for (const key of dayKeys) map.set(key, new Set());

  for (const r of rows) {
    const key = fmtISODateUTC(startOfUtcDay(new Date(r.startedAt)));
    const set = map.get(key);
    if (set) set.add(r.userId);
  }

  const series = dayKeys.map((day) => ({ day, value: (map.get(day)?.size ?? 0) }));
  return json({ series });
};
