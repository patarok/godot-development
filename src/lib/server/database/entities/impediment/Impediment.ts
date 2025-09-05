import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/User';
import { Task } from '../task/Task';
import { Solution } from './Solution';

@Entity()
@Index(['title'])
export class Impediment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 256 })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string | null;

  // statusId as config lookup (no table yet). Stored as simple int for now
  @Column({ type: 'int' })
  statusId: number;

  @Column({ type: 'int', nullable: true })
  estimatedHours?: number | null;

  @Column({ type: 'int', nullable: true })
  actualHours?: number | null;

  @Column({ type: 'boolean', default: false })
  isDone: boolean;

  @ManyToOne(() => Solution, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'solutionId' })
  solution?: Solution | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee?: User | null;

  @ManyToOne(() => Task, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'taskId' })
  task?: Task | null;

  @Column({ type: 'float', nullable: true })
  similarityScore?: number | null;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
