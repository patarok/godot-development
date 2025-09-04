import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
// import { ProjectStateKind } from '../config/ProjectStateKind'; // Uncomment when implemented

/**
 * ProjectState represents the lifecycle state of a project (e.g., Planned, Active, On Hold, Completed).
 */
@Entity()
@Index(['name'], { unique: true })
@Index(['rank'])
export class ProjectState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ type: 'int', default: 0 })
  rank: number;

  @Column({ type: 'varchar', length: 16, nullable: true })
  color?: string | null;

  @Column({ type: 'varchar', nullable: true })
  description?: string | null;

  // Optional relation to a kind table (commented until available)
  // @ManyToOne(() => ProjectStateKind, { onDelete: 'RESTRICT', nullable: true })
  // @JoinColumn({ name: 'kindId' })
  // kind?: ProjectStateKind | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
