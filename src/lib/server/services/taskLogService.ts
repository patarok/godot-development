import { AppDataSource } from '$lib/server/database/config/datasource';
import { TaskLog } from '$lib/server/database/entities/task/TaskLog';

export async function logTaskActivity(userId: string, taskId: string, action: string, message?: string) {
    try {
        const repo = AppDataSource.getRepository(TaskLog);
        await repo.save(repo.create({ userId, taskId, action, message: message ?? null }));
    } catch {
        // Best-effort logging: swallow errors so user action never fails because of logging
    }
}