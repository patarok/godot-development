import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Index,
         CreateDateColumn,
         UpdateDateColumn }
from 'typeorm';

/**
 * RiskLevel represents qualitative/quantitative risk classification for Projects (e.g., Low, Medium, High).
 */
@Entity()
@Index(['name'], { unique: true })
@Index(['rank'])
export class RiskLevel {
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

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
