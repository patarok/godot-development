import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../user/User';
import { Priority } from '../state/Priority';
import { ProjectState } from '../state/ProjectState';
import { RiskLevel } from '../state/RiskLevel';
import { Task } from '../task/Task';
import { ProjectAssignedUser } from './ProjectAssignedUser';
import { ProjectResponsibleUser } from './ProjectResponsibleUser';

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

  @Column({ type: 'boolean', default: false })
  isDone: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  currentIterationNumber: number;

  @Column({ type: 'int', default: 0 })
  iterationWarnAt: number;

  @Column({ type: 'int', nullable: true })
  maxIterations?: number | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true, transformer: { to: (v?: number | null) => v ?? null, from: (v?: string | null) => (v == null ? null : Number(v)) } })
  estimatedBudget?: number | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true, transformer: { to: (v?: number | null) => v ?? null, from: (v?: string | null) => (v == null ? null : Number(v)) } })
  actualCost?: number | null;

  @Column({ type: 'int', nullable: true })
  estimatedHours?: number | null;

  @Column({ type: 'int', nullable: true })
  actualHours?: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  startDate?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endDate?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  actualStartDate?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  actualEndDate?: Date | null;

  // Optional relation to RiskLevel
  @ManyToOne(() => RiskLevel, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'riskLevelId' })
  riskLevel?: RiskLevel | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'mainResponsibleId' })
  mainResponsible?: User | null;

  // @ManyToOne(() => User, { onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'activeUserId' })
  // activeUser?: User | null;

  @OneToMany(() => Task, (t) => t.project)
  tasks?: Task[];

  // Junctions
  @OneToMany(() => ProjectAssignedUser, (pu) => pu.project)
  assignedUserLinks?: ProjectAssignedUser[];

  @OneToMany(() => ProjectResponsibleUser, (ru) => ru.project)
  responsibleUserLinks?: ProjectResponsibleUser[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
