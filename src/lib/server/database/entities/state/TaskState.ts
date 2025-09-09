import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Index,
         CreateDateColumn,
         UpdateDateColumn }
from 'typeorm';
// import { TaskStateKind } from '../config/TaskStateKind'; // Uncomment when implemented

/**
 * TaskState represents the workflow state of a task (e.g., Todo, In Progress, Done).
 * Minimal implementation to satisfy current dependencies from Task.ts.
 */
@Entity()
@Index(['name'], { unique: true })
@Index(['rank'])
export class TaskState {
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
  // @ManyToOne(() => TaskStateKind, { onDelete: 'RESTRICT', nullable: true })
  // @JoinColumn({ name: 'kindId' })
  // kind?: TaskStateKind | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
