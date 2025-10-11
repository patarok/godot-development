import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Index,
         CreateDateColumn,
         UpdateDateColumn,
         ManyToOne,
         OneToMany,
         JoinColumn }
from 'typeorm';

import {
    User,
    Priority,
    TaskStatus,
    ProjectTask,
    TaskType, ProjectAssignedUser, ProjectResponsibleUser
}
    from '$lib/server/database/entities';

import { TaskAssignedUser } from './TaskAssignedUser';
import { TaskResponsibleUser } from './TaskResponsibleUser';
import { TaskCurrentUser } from './TaskCurrentUser';
import { TaskDependency } from './TaskDependency';

@Entity()
@Index(['title'])
@Index(['description'])
@Index(['parent'])
@Index(['taskStatus'])
@Index(['isActive', 'isDone'])
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
    @JoinColumn({ name: 'creator_id' })
    creator?: User | null;

    @ManyToOne(() => TaskStatus, { onDelete: 'RESTRICT', nullable: false })
    @JoinColumn({ name: 'task_status_id' })
    taskStatus: TaskStatus;

    @ManyToOne(() => Priority, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'priority_id' })
    priority?: Priority;

    // Task type relation (optional)
    @ManyToOne(() => TaskType, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'task_type_id' })
    taskType?: TaskType | null;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'active_user_id' })
    user?: User;

    @Column({ type: 'int', nullable: true })
    actualHours?: number | null;

    @Column({ type: 'boolean', default: true })
    hasSegmentGroupCircle: boolean;

    // Tasks THIS task depends on (predecessors)
    @OneToMany(() => TaskDependency, (d) => d.successor)
    dependencyLinks?: TaskDependency[];

    // Tasks that depend on THIS task (successors)
    @OneToMany(() => TaskDependency, (d) => d.predecessor)
    dependentLinks?: TaskDependency[];

    // OPTIONAL: segmentGroupCircleId: UUID? (relation commented until entity exists)
    @Column({ type: 'uuid', nullable: true })
    segmentGroupCircleId?: string | null;
    // @ManyToOne(() => SegmentGroupCircle, { onDelete: 'SET NULL', nullable: true })
    // @JoinColumn({ name: 'segmentGroupCircleId' })
    // segmentGroupCircle?: SegmentGroupCircle | null;

    // Project relation (optional)
    // @Column({ type: 'uuid', nullable: true, name: 'project_id' })
    // projectId?: string | null;
    // @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
    // @JoinColumn({ name: 'project_id' })
    // project?: Project | null;
    // ADD the new Many-to-Many relation via the junction table
    @OneToMany(() => ProjectTask, (pt) => pt.task)
    projectLinks?: ProjectTask[];

    @ManyToOne(() => Task, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'parent_task_id' })
    parent?: Task;

    @OneToMany(() => Task, (t) => t.parent)
    children?: Task[];

    @Column({ type: 'boolean', default: false })
    isMeta: boolean;

    @Column({ type: 'timestamptz' })
    dueDate: Date;

    @Column({ type: 'timestamptz', nullable: true })
    doneDate?: Date | null;

    @Column({ type: 'timestamptz', default: () => 'now()' })
    startDate: Date;

    @Column({ type: 'timestamptz' })
    plannedStartDate: Date;

    // OPTIONAL: iterationSegmentId: UUID? (relation commented until entity exists)
    @Column({ type: 'uuid', nullable: true })
    iterationSegmentId?: string | null;
    // @ManyToOne(() => IterationSegment, { onDelete: 'SET NULL', nullable: true })
    // @JoinColumn({ name: 'iterationSegmentId' })
    // iterationSegment?: IterationSegment | null;

    // Junctions (keeping existing junctions for other Many-to-Many relations)
    @OneToMany(() => TaskAssignedUser, (tu) => tu.task)
    assignedUserLinks?: TaskAssignedUser[];

    @OneToMany(() => TaskResponsibleUser, (ru) => ru.task)
    responsibleUserLinks?: TaskResponsibleUser[];

    @OneToMany(() => TaskCurrentUser, (cu) => cu.task)
    currentUserLinks?: TaskCurrentUser[];

    @Column({ type: 'timestamptz', nullable: true })
    lastUsedAt?: Date | null;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'boolean', default: false })
    finishedApproved: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}