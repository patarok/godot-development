import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'project_log' })
@Index(['projectId', 'createdAt'])
@Index(['userId', 'createdAt'])
export class ProjectLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'project_id' })
    projectId: string;

    @Column({ type: 'uuid', name: 'user_id' })
    userId: string;

    // e.g. 'project.create' | 'project.update' | 'project.task.add' | 'project.task.remove'
    //      'project.assigned.add' | 'project.assigned.remove'
    //      'project.responsible.add' | 'project.responsible.remove'
    //      'project.mainResponsible.set'
    @Column({ type: 'varchar', length: 64 })
    action: string;

    // free-form, keep it short
    @Column({ type: 'varchar', length: 1024, nullable: true })
    message?: string | null;

    @CreateDateColumn()
    createdAt: Date;
}