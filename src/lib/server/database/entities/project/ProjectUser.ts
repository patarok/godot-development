import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Index,
         ManyToOne,
         JoinColumn,
         CreateDateColumn,
         UpdateDateColumn,
         Unique }
from 'typeorm';

import { User } from '$lib/server/database/entities';

import { Project } from './Project';

@Entity()
@Unique('UQ_ProjectUser_project_user', ['projectId', 'userId'])
export class ProjectUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
