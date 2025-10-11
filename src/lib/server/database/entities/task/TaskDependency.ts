import {
    Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn,
    Unique, Check, CreateDateColumn, UpdateDateColumn, Column, Index
} from 'typeorm';
import { Task } from './Task';

export enum DependencyPolicy {
    FinishToStart = 'FinishToStart',  // successor can start only when predecessor is done
    StartToStart = 'StartToStart',    // successor can start when predecessor is at least started
}

@Entity({ name: 'task_dependency' })
@Unique(['predecessorTaskId', 'successorTaskId'])
@Check(`"predecessor_task_id" <> "successor_task_id"`)
@Index(['successorTaskId', 'predecessorTaskId'])
export class TaskDependency {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'predecessor_task_id' })
    predecessorTaskId: string;

    @Column({ type: 'uuid', name: 'successor_task_id' })
    successorTaskId: string;

    @ManyToOne(() => Task, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'predecessor_task_id' })
    predecessor: Task;

    @ManyToOne(() => Task, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'successor_task_id' })
    successor: Task;

    // Option A: policy-driven
    @Column({ type: 'enum', enum: DependencyPolicy, default: DependencyPolicy.FinishToStart })
    policy: DependencyPolicy;

    // Option B (alternative or in addition): a minimum required status rank
    // If present, successor can advance only when predecessor.taskStatus.rank >= this value
    @Column({ type: 'int', name: 'min_required_status_rank', nullable: true })
    minRequiredStatusRank?: number | null;

    // Optional: positive lag in hours/days you may add later
    @Column({ type: 'int', name: 'lag_hours', nullable: true })
    lagHours?: number | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}