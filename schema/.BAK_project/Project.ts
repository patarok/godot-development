import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/User';
import { Priority } from '../state/Priority';
import { ProjectState } from '../state/ProjectState';

@Entity()
@Index(['title'])
@Index(['isActive'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 256 })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string | null;

  @ManyToOne(() => ProjectState, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'projectStateId' })
  projectState: ProjectState;

  @ManyToOne(() => Priority, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'priorityId' })
  priority?: Priority | null;

  // Creator/auditor of the project (nullable)
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creatorId' })
  creator?: User | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
