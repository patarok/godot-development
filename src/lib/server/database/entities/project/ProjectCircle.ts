import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Index,
         CreateDateColumn,
         UpdateDateColumn }
from 'typeorm';

/**
 * ProjectCircle stands on its own for now. Relations to Project or SegmentGroupCircle are commented out
 * until those designs are finalized.
 */
@Entity()
@Index(['name'], { unique: true })
export class ProjectCircle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string | null;

  // Future: link to Project via projectId
  // @Column({ type: 'uuid', nullable: true })
  // projectId?: string | null;
  // @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
  // @JoinColumn({ name: 'projectId' })
  // project?: Project | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
