// src/lib/server/database/models/task/TaskDomainModel.ts

import { Repository, DataSource, QueryRunner } from 'typeorm';
import {
    Task,
    TaskStatus,
    Priority,
    Project,
    User
} from '../../entities';

/**
 * Domain model for managing Task CRUD operations and write-related workflows.
 * This model handles creation, updates, deletion, and state transitions for tasks.
 *
 * Separation Note: This model does NOT import TaskDomainQueryModel to avoid circular dependencies.
 * For read-only operations, use TaskDomainQueryModel separately.
 */
export class TaskDomainModel {
    private taskRepository: Repository<Task>;
    private taskStatusRepository: Repository<TaskStatus>;
    private priorityRepository: Repository<Priority>;
    private projectRepository: Repository<Project>;
    private userRepository: Repository<User>;

    constructor(private dataSource: DataSource) {
        this.taskRepository = dataSource.getRepository(Task);
        this.taskStatusRepository = dataSource.getRepository(TaskStatus);
        this.priorityRepository = dataSource.getRepository(Priority);
        this.projectRepository = dataSource.getRepository(Project);
        this.userRepository = dataSource.getRepository(User);
    }

    // ========================================
    // TASK CREATION
    // ========================================

    async createTask(taskData: {
        title: string;
        description?: string;
        creatorId?: string;
        statusId: string;
        priorityId?: string;
        projectId?: string;
        dueDate: Date;
        plannedStartDate: Date;
        startDate?: Date;
    }): Promise<Task> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Validate status
            const status = await queryRunner.manager.findOne(TaskStatus, { where: { id: taskData.statusId } });
            if (!status) throw new Error(`TaskStatus with ID ${taskData.statusId} not found`);

            // Validate optional relations
            const creator = taskData.creatorId
                ? await queryRunner.manager.findOne(User, { where: { id: taskData.creatorId } })
                : null;
            const priority = taskData.priorityId
                ? await queryRunner.manager.findOne(Priority, { where: { id: taskData.priorityId } })
                : null;
            const project = taskData.projectId
                ? await queryRunner.manager.findOne(Project, { where: { id: taskData.projectId } })
                : null;

            const task = queryRunner.manager.create(Task, {
                title: taskData.title,
                description: taskData.description,
                creator,
                taskStatus: status,
                priority,
                project,
                dueDate: taskData.dueDate,
                plannedStartDate: taskData.plannedStartDate,
                startDate: taskData.startDate ?? new Date(),
                isActive: true,
                hasSegmentGroupCircle: false
            });

            const savedTask = await queryRunner.manager.save(task);
            await queryRunner.commitTransaction();

            return await this.taskRepository.findOne({
                where: { id: savedTask.id },
                relations: ['creator', 'taskStatus', 'priority', 'project']
            }) as Task;

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    // ========================================
    // TASK UPDATE
    // ========================================

    async updateTask(taskId: string, updateData: Partial<{
        title: string;
        description?: string;
        isDone: boolean;
        actualHours: number;
        dueDate: Date;
        doneDate: Date;
        startDate: Date;
        plannedStartDate: Date;
        priorityId?: string;
        statusId?: string;
        projectId?: string;
        userId?: string;
    }>): Promise<Task> {
        const task = await this.taskRepository.findOne({ where: { id: taskId } });
        if (!task) throw new Error(`Task with ID ${taskId} not found`);

        // Reassign relations if needed
        if (updateData.priorityId) {
            task.priority = await this.priorityRepository.findOne({ where: { id: updateData.priorityId } }) ?? null;
        }
        if (updateData.statusId) {
            task.taskStatus = await this.taskStatusRepository.findOne({ where: { id: updateData.statusId } }) ?? task.taskStatus;
        }
        if (updateData.projectId) {
            task.project = await this.projectRepository.findOne({ where: { id: updateData.projectId } }) ?? null;
        }
        if (updateData.userId) {
            task.user = await this.userRepository.findOne({ where: { id: updateData.userId } }) ?? null;
        }

        Object.assign(task, updateData);
        await this.taskRepository.save(task);

        return await this.taskRepository.findOne({
            where: { id: taskId },
            relations: ['creator', 'taskStatus', 'priority', 'project', 'user']
        }) as Task;
    }

    // ========================================
    // TASK STATE OPERATIONS
    // ========================================

    async setTaskActiveStatus(taskId: string, isActive: boolean): Promise<Task> {
        const task = await this.taskRepository.findOne({ where: { id: taskId } });
        if (!task) throw new Error(`Task with ID ${taskId} not found`);

        task.isActive = isActive;
        return await this.taskRepository.save(task);
    }

    async markTaskDone(taskId: string): Promise<Task> {
        const task = await this.taskRepository.findOne({ where: { id: taskId } });
        if (!task) throw new Error(`Task with ID ${taskId} not found`);

        task.isDone = true;
        task.doneDate = new Date();
        return await this.taskRepository.save(task);
    }

    // ========================================
    // TASK DELETION
    // ========================================

    async softDeleteTask(taskId: string): Promise<Task> {
        return await this.setTaskActiveStatus(taskId, false);
    }

    async hardDeleteTask(taskId: string): Promise<boolean> {
        const task = await this.taskRepository.findOne({ where: { id: taskId } });
        if (!task) throw new Error(`Task with ID ${taskId} not found`);

        await this.taskRepository.delete(taskId);
        return true;
    }

    // ========================================
    // VALIDATION HELPERS
    // ========================================

    async validateTaskExists(taskId: string): Promise<boolean> {
        const task = await this.taskRepository.findOne({ where: { id: taskId, isActive: true } });
        return !!task;
    }
}
