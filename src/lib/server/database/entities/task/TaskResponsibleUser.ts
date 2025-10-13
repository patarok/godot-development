import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Unique,
         ManyToOne,
         JoinColumn,
         CreateDateColumn,
         UpdateDateColumn }
from 'typeorm';

import { User } from '$lib/server/database/entities';

import { Task } from './Task';

@Entity()
@Unique('UQ_TaskResponsible_task_user', ['taskId', 'userId'])
export class TaskResponsibleUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'task_id' })
  taskId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
