import { AppDataSource } from '../../config/datasource';
import { TimeEntry, Task, User } from '../../entities';

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function seedTimeEntries() {
  const timeRepo = AppDataSource.getRepository(TimeEntry);
  const taskRepo = AppDataSource.getRepository(Task);
  const userRepo = AppDataSource.getRepository(User);

  const tasks = await taskRepo.find({ take: 12, order: { createdAt: 'DESC' } });
  const users = await userRepo.find({ take: 6, order: { email: 'ASC' } });
  if (!tasks.length || !users.length) {
    console.log('Skipping time entry seed: need tasks and users.');
    return;
  }

  const today = startOfUtcDay(new Date());
  const entries: Partial<TimeEntry>[] = [];

  // For each of the first 6 tasks, create scattered entries over the last 7 days for 2-3 users.
  const useTasks = tasks.slice(0, Math.min(6, tasks.length));
  for (let tIdx = 0; tIdx < useTasks.length; tIdx++) {
    const t = useTasks[tIdx];
    const perTaskUsers = users.slice(tIdx % users.length).slice(0, 3);

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const day = new Date(today);
      day.setUTCDate(today.getUTCDate() - dayOffset);

      for (const u of perTaskUsers) {
        // Randomly decide if user worked that day
        if ((u.id.charCodeAt(0) + tIdx + dayOffset) % 2 === 0) {
          const startHour = 9 + ((tIdx + dayOffset) % 6); // 9..14 UTC
          const startedAt = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), startHour));
          const minutes = 30 + ((tIdx * 17 + dayOffset * 13) % 60); // 30..89 min
          entries.push({ taskId: t.id, userId: u.id, startedAt, minutes, note: 'Seeded work' });
        }
      }
    }
  }

  if (entries.length) {
    await timeRepo.save(entries.map((e) => timeRepo.create(e)));
    console.log(`Seeded time entries: ${entries.length}`);
  } else {
    console.log('No time entries generated.');
  }
}

async function run() {
  try {
    await AppDataSource.initialize();
  } catch (e: any) {
    console.warn('AppDataSource already initialized or failed to init. Proceeding. Reason:', e?.message ?? e);
  }

  try {
    await seedTimeEntries();
  } finally {
    try { await AppDataSource.destroy(); } catch {}
  }

  console.log('Time entries seeding completed.');
  if (typeof process !== 'undefined') process.exit(0);
}

// Execute when run directly
if (import.meta && (process as any)?.argv?.[1]?.includes('time_entries_seed')) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
