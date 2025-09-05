import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from '../project/Project';
import { Priority } from '../state/Priority';
import { User } from '../user/User';

@Entity()
@Index(['title'])
@Index(['dueAt'])
export class Deadline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 256 })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string | null;

  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => Priority, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'priorityId' })
  priority?: Priority | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creatorId' })
  creator?: User | null;

  @Column({ type: 'timestamptz' })
  dueAt: Date;

  @Column({ type: 'boolean', default: false })
  isDone: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
