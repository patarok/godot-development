import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Index,
         CreateDateColumn,
         UpdateDateColumn }
from 'typeorm';

/**
 * TaskType lookup table.
 * Admin-manageable list of allowed task types.
 */
@Entity()
@Index(['name'], { unique: true })
@Index(['rank'])
export class TaskType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 128 })
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
