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

  @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project | null;

  @ManyToOne(() => Priority, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'priority_id' })
  priority?: Priority | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creator_id' })
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
