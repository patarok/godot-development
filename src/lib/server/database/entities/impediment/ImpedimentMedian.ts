import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Index,
         CreateDateColumn,
         UpdateDateColumn }
from 'typeorm';

@Entity()
@Index(['title'])
export class ImpedimentMedian {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 256 })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string | null;

  @Column({ type: 'boolean', default: false })
  hasSolution: boolean;

  @Column({ type: 'float', nullable: true })
  averageHours?: number | null;

  @Column({ type: 'int', default: 0 })
  occurrenceCount: number;

  @Column({ type: 'float', nullable: true })
  confidenceScore?: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
