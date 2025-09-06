import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../user/User';
import { Task } from './Task';

/**
 * Join entity between User and Task.
 * - userId: string (User.id is uuid)
 * - taskId: uuid string (Task.id is uuid)
 * - Optional role or note fields can be added later; keeping minimal for now.
 */
@Entity()
@Index(['userId'])
@Index(['taskId'])
@Index(['userId', 'taskId'], { unique: true })
export class UserTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'task_id' })
  taskId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
