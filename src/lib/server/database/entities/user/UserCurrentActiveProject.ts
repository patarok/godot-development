import { Entity, PrimaryColumn, OneToOne, JoinColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Project } from '../project/Project';

@Entity('user_current_active_project')
export class UserCurrentActiveProject {
    @PrimaryColumn('uuid', { name: 'user_id' })
    userId: string;

    @Column('uuid', { name: 'project_id' })
    projectId: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToOne(() => Project, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt' })
    updatedAt: Date;

    @Column('numeric', { name: 'daily_goal', precision: 4, scale: 1, default: 4.0, transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) } })
    dailyGoal: number;
}
