import { AppDataSource } from '$lib/server/database/config/datasource';
import {
    Project,
    Priority,
    TaskStatus,
    User,
    TaskType,
    Task
} from '$lib/server/database';
import { toPlainArray } from '$lib/utils/index';

/**
 * Server-side cache for read-mostly lookup data.
 *
 * The `+layout.server.ts` loader recomputed projects/priorities/states/users/types/
 * metaTasks on EVERY navigation, even though these rarely change. This cache holds
 * the last computed plain arrays and only re-queries after TTL expiry or an explicit
 * invalidation (e.g. when a mutation changes one of these tables).
 *
 * This runs *before* the planned TypeORM repository layer (TASK-0006.04): it reduces
 * request load immediately without requiring the repositories yet.
 */

type LookupData = {
    projects: any[];
    priorities: any[];
    states: any[];
    users: any[];
    types: any[];
    metaTasks: any[];
};

const DEFAULT_TTL_MS = 30_000; // 30s — short enough that rare edits propagate quickly

let cache: LookupData | null = null;
let cachedAt = 0;

/**
 * Invalidate the lookup cache. Call this after any mutation that touches
 * Project / Priority / TaskStatus / User / TaskType / Task(meta) tables.
 */
export function invalidateLookupCache(): void {
    cache = null;
    cachedAt = 0;
}

/**
 * Load (or reuse) the lookup data. Returns plain objects ready for the loader.
 */
export async function getLookupData(ttlMs: number = DEFAULT_TTL_MS): Promise<LookupData> {
    const now = Date.now();
    if (cache && now - cachedAt < ttlMs) {
        return cache;
    }

    const [projects, priorities, states, users, types, metaTasks] = await Promise.all([
        AppDataSource.getRepository(Project).find({ where: { isActive: true }, order: { title: 'ASC' } }),
        AppDataSource.getRepository(Priority).find({ order: { rank: 'ASC', name: 'ASC' } }),
        AppDataSource.getRepository(TaskStatus).find({ order: { rank: 'ASC', name: 'ASC' } }),
        AppDataSource.getRepository(User).find({ order: { email: 'ASC' } }),
        AppDataSource.getRepository(TaskType).find({ order: { rank: 'ASC', name: 'ASC' } }),
        AppDataSource.getRepository(Task).find({
            where: { isMeta: true },
            order: { title: 'ASC' },
            select: { id: true, title: true }
        })
    ]);

    const result: LookupData = {
        projects: toPlainArray(projects),
        priorities: toPlainArray(priorities),
        states: toPlainArray(states),
        users: toPlainArray(users),
        types: toPlainArray(types),
        metaTasks: toPlainArray(metaTasks)
    };

    cache = result;
    cachedAt = now;
    return result;
}
