import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne, JoinColumn
} from 'typeorm';
import { User } from '../user/User'

import { Priority } from '../state/Priority'
import { TaskState } from '../state/TaskState'
import { Project } from '../project/Project'


@Entity()
@Index(['title'])
@Index(['description'])
@Index(['isActive'])
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 512 })
    title: string;

    @Column({ type: 'varchar', nullable: true })
    description?: string;

    @Column({ type: 'boolean', default: false })
    isDone: boolean;

    // creatorId: who initially created the task
    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'creatorId' })
    creator?: User | null;

    @ManyToOne(() => TaskState, { onDelete: 'RESTRICT', nullable: false })
    @JoinColumn({ name: 'taskStateId' })
    taskState: TaskState;

    @ManyToOne(() => Priority, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'priorityId' })
    priority?: Priority;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'activeUserId' })
    user?: User;

    @Column({ type: 'int', nullable: true })
    actualHours?: number | null;

    @Column({ type: 'boolean', default: true })
    hasSegmentGroupCircle: boolean;

    // OPTIONAL: segmentGroupCircleId: UUID? (relation commented until entity exists)
    @Column({ type: 'uuid', nullable: true })
    segmentGroupCircleId?: string | null;
    // @ManyToOne(() => SegmentGroupCircle, { onDelete: 'SET NULL', nullable: true })
    // @JoinColumn({ name: 'segmentGroupCircleId' })
    // segmentGroupCircle?: SegmentGroupCircle | null;

    // Project relation (optional)
    @Column({ type: 'uuid', nullable: true })
    projectId?: string | null;
    @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'projectId' })
    project?: Project | null;

    @ManyToOne(() => Task, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'parentTaskId' })
    parent?: Task;

    @Column({ type: 'timestamptz' })
    dueDate: Date;

    @Column({ type: 'timestamptz', default: () => 'now()' })
    startDate: Date;

    // OPTIONAL: iterationSegmentId: UUID? (relation commented until entity exists)
    @Column({ type: 'uuid', nullable: true })
    iterationSegmentId?: string | null;
    // @ManyToOne(() => IterationSegment, { onDelete: 'SET NULL', nullable: true })
    // @JoinColumn({ name: 'iterationSegmentId' })
    // iterationSegment?: IterationSegment | null;


    @Column({ type: 'timestamptz', nullable: true })
    lastUsedAt?: Date | null;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}