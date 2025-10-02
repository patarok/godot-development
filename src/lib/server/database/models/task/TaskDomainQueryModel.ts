import { Repository, DataSource, SelectQueryBuilder, In } from 'typeorm';
import { Task, User, Priority, TaskStatus, Project } from '../../entities';
import type { PaginatedResult, PaginationOptions } from '../pagination';

export interface TaskSearchFilters {
    title?: string;
    isDone?: boolean;
    isActive?: boolean;
    statusId?: string;      // filter by TaskStatus id
    priorityId?: string;    // filter by Priority id
    projectId?: string;     // filter by Project id
    userId?: string;        // filter by active user id (task.user)
    creatorId?: string;     // filter by creator id
    createdAfter?: Date;
    createdBefore?: Date;
}

export interface TaskDataShort {
    id: string;
    title: string;
    status?: string;        // status name
    priority?: string;      // priority name
    project?: string;       // project name
    user?: string;          // active user display name
    dueDate: Date;
    plannedStartDate: Date;
    isDone: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}


export class TaskDomainQueryModel {
    private taskRepository: Repository<Task>;

    constructor(private dataSource: DataSource) {
        this.taskRepository = dataSource.getRepository(Task);
    }

    // ========================================
    // TASK LOOKUP OPERATIONS
    // ========================================

    async findTaskById(taskId: string, includeRelations = true): Promise<Task | null> {
        const relations = includeRelations ? ['creator', 'taskStatus', 'priority', 'project', 'user'] : [];
        return this.taskRepository.findOne({ where: { id: taskId }, relations });
    }

    async findTasksByIds(taskIds: string[], includeRelations = false): Promise<Task[]> {
        if (taskIds.length === 0) return [];
        const relations = includeRelations ? ['creator', 'taskStatus', 'priority', 'project', 'user'] : [];
        return this.taskRepository.find({ where: { id: In(taskIds) }, relations });
    }

    // ========================================
    // TASK LIST AND SEARCH OPERATIONS
    // ========================================

    async findTasks(
        filters: TaskSearchFilters = {},
        pagination: PaginationOptions<'title' | 'dueDate' | 'plannedStartDate' | 'startDate' | 'createdAt' | 'updatedAt'> = {}
    ): Promise<PaginatedResult<TaskDataShort>> {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination;

        const qb = this.taskRepository
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.creator', 'creator')
            .leftJoinAndSelect('task.taskStatus', 'taskStatus')
            .leftJoinAndSelect('task.priority', 'priority')
            .leftJoinAndSelect('task.project', 'project')
            .leftJoinAndSelect('task.user', 'activeUser');

        this.applyTaskFilters(qb, filters);

        qb.orderBy(`task.${sortBy}`, sortOrder);
        qb.skip((page - 1) * limit).take(limit);

        const [tasks, total] = await qb.getManyAndCount();

        const data: TaskDataShort[] = tasks.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.taskStatus?.name,
            priority: t.priority?.name,
            project: t.project?.name ?? undefined,
            user: t.user ? `${t.user.forename} ${t.user.surname}` : undefined,
            dueDate: t.dueDate,
            plannedStartDate: t.plannedStartDate,
            isDone: t.isDone,
            isActive: t.isActive,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
        }));

        const totalPages = Math.ceil(total / limit);
        return {
            data,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
        };
    }

    // ========================================
    // PRIVATE HELPER METHODS
    // ========================================

    private applyTaskFilters(qb: SelectQueryBuilder<Task>, f: TaskSearchFilters) {
        if (f.title) {
            qb.andWhere('LOWER(task.title) LIKE LOWER(:title)', { title: `%${f.title}%` });
        }
        if (typeof f.isDone === 'boolean') {
            qb.andWhere('task.isDone = :isDone', { isDone: f.isDone });
        }
        if (typeof f.isActive === 'boolean') {
            qb.andWhere('task.isActive = :isActive', { isActive: f.isActive });
        }
        if (f.statusId) {
            qb.andWhere('taskStatus.id = :statusId', { statusId: f.statusId });
        }
        if (f.priorityId) {
            qb.andWhere('priority.id = :priorityId', { priorityId: f.priorityId });
        }
        if (f.projectId) {
            qb.andWhere('project.id = :projectId', { projectId: f.projectId });
        }
        if (f.userId) {
            qb.andWhere('activeUser.id = :userId', { userId: f.userId });
        }
        if (f.creatorId) {
            qb.andWhere('creator.id = :creatorId', { creatorId: f.creatorId });
        }
        if (f.createdAfter) {
            qb.andWhere('task.createdAt >= :createdAfter', { createdAfter: f.createdAfter });
        }
        if (f.createdBefore) {
            qb.andWhere('task.createdAt <= :createdBefore', { createdBefore: f.createdBefore });
        }
    }
}
