import { AppDataSource } from "$lib/server/database";
import { Task } from '$lib/server/database/entities/task/Task';
import { TaskStatus } from '$lib/server/database/entities/status/TaskStatus';
import { TaskDependency, DependencyPolicy } from '$lib/server/database/entities/task/TaskDependency';

export async function canTransitionToStatus(taskId: string, targetStatusId: string): Promise<{ ok: boolean; blockers?: string[] }> {
    const taskRepo = AppDataSource.getRepository(Task);
    const statusRepo = AppDataSource.getRepository(TaskStatus);
    const depRepo = AppDataSource.getRepository(TaskDependency);

    const [task, targetStatus] = await Promise.all([
        taskRepo.findOne({
            where: { id: taskId },
            relations: ['taskStatus'],
        }),
        statusRepo.findOne({ where: { id: targetStatusId } }),
    ]);

    if (!task || !targetStatus) return { ok: false, blockers: ['Task or status not found'] };

    // Only restrict when transitioning beyond initial
    if ((targetStatus.rank ?? 0) <= 0) return { ok: true };

    const deps = await depRepo.find({
        where: { successorTaskId: taskId },
        relations: ['predecessor', 'predecessor.taskStatus'],
    });

    const blockers: string[] = [];
    for (const d of deps) {
        const pred = d.predecessor;
        const predRank = pred.taskStatus?.rank ?? 0;

        // Policy-based checks
        if (d.policy === DependencyPolicy.FinishToStart && !pred.isDone) {
            blockers.push(`Requires "${pred.title}" to be Done`);
            continue;
        }
        if (d.policy === DependencyPolicy.StartToStart && predRank <= 0) {
            blockers.push(`Requires "${pred.title}" to be Started`);
            continue;
        }
        if (d.minRequiredStatusRank != null && predRank < d.minRequiredStatusRank) {
            blockers.push(`Requires "${pred.title}" to reach status rank ${d.minRequiredStatusRank}+`);
            continue;
        }
    }

    return blockers.length ? { ok: false, blockers } : { ok: true };
}