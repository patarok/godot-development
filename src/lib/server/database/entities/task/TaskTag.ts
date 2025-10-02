import { Entity,
         PrimaryGeneratedColumn,
         Column,
         ManyToOne,
         JoinColumn,
         CreateDateColumn,
         UpdateDateColumn,
         Index }
from 'typeorm';

import { Task } from './Task';
import { Tag } from './Tag';

/**
 * TaskTag links tasks to reusable Tag rows.
 * Ensures uniqueness of (taskId, tagId).
 */
@Entity()
@Index(['taskId'])
@Index(['tagId'])
@Index(['taskId', 'tagId'], { unique: true })
export class TaskTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'task_id' })
  taskId: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ type: 'uuid', name: 'tag_id' })
  tagId: string;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
