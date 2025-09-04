import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Priority lookup table for tasks.
 * - UUID primary key
 * - name: unique textual name (e.g., Low, Medium, High)
 * - rank: numeric ordering (lower is more important); not unique
 * - color: optional hex or token for UI
 * - description: optional
 */
@Entity()
@Index(['name'], { unique: true })
@Index(['rank'])
export class Priority {
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
