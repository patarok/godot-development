import { AppDataSource } from '$lib/server/database/config/datasource';
import { ProjectLog } from '$lib/server/database/entities/project/ProjectLog';

export async function logProjectActivity(userId: string, projectId: string, action: string, message?: string) {
    try {
        const repo = AppDataSource.getRepository(ProjectLog);
        await repo.save(repo.create({ userId, projectId, action, message: message ?? null }));
    } catch {
        // swallow errors: logging is best-effort
    }
}