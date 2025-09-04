import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Task } from './Task';

/**
 * TaskTag represents a simple tagging mechanism for tasks.
 * There is no separate Tag entity yet; tags are stored as strings.
 * Ensures uniqueness of (taskId, tag).
 */
@Entity()
@Index(['taskId'])
@Index(['tag'])
@Index(['taskId', 'tag'], { unique: true })
export class TaskTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  taskId: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column({ type: 'varchar', length: 128 })
  tag: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
