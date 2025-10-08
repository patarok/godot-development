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

import { Task } from '$lib/server/database/entities';

import { Project } from './Project';

@Entity()
@Unique('UQ_ProjectTask_project_task', ['projectId', 'taskId'])
export class ProjectTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @Column({ type: 'uuid', name: 'task_id' })
  taskId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
