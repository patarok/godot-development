import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Index,
         CreateDateColumn,
         UpdateDateColumn,
         ManyToOne,
         JoinColumn }
from 'typeorm';

import { User,
         Task }
from '$lib/server/database/entities';

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
  @JoinColumn({ name: 'solution_id' })
  solution?: Solution | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee?: User | null;

  @ManyToOne(() => Task, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'task_id' })
  task?: Task | null;

  @Column({ type: 'float', nullable: true })
  similarityScore?: number | null;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
