import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Task } from './Task';
import { User } from '../user/User';

@Entity()
@Index(['taskId', 'startedAt'])
@Index(['userId', 'startedAt'])
export class TimeEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'task_id' })
  taskId: string;
  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // When the work happened (UTC). Use this for grouping by day.
  @Column({ type: 'timestamptz', name: 'started_at' })
  startedAt: Date;

  // Optional end timestamp
  @Column({ type: 'timestamptz', name: 'ended_at', nullable: true })
  endedAt?: Date | null;

  // Convenience: minutes logged if you don’t want start/end pairs
  @Column({ type: 'int', nullable: true })
  minutes?: number | null;

  // Optional note
  @Column({ type: 'varchar', length: 1024, nullable: true })
  note?: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
