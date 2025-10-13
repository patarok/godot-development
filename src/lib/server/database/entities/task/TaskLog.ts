import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'task_log' })
@Index(['taskId', 'createdAt'])
@Index(['userId', 'createdAt'])
export class TaskLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'task_id' })
    taskId: string;

    @Column({ type: 'uuid', name: 'user_id' })
    userId: string;

    // e.g. 'task.create' | 'task.update' | 'task.toggle' | 'tag.add' | 'tag.remove'
    @Column({ type: 'varchar', length: 64 })
    action: string;

    // free-form, keep it short; no diffs, no JSON needed
    @Column({ type: 'varchar', length: 1024, nullable: true })
    message?: string | null;

    @CreateDateColumn()
    createdAt: Date;
}