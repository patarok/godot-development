import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Index,
         CreateDateColumn,
         UpdateDateColumn }
from 'typeorm';

/**
 * Tag dictionary entity for reusable task tags.
 * - slug: unique, lowercase identifier (e.g., "bug", "frontend")
 * - name: display label
 * - color: optional color token/hex
 */
@Entity()
@Index(['slug'], { unique: true })
@Index(['name'])
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  slug: string; // normalized identifier

  @Column({ type: 'varchar', length: 128 })
  name: string; // display name

  @Column({ type: 'varchar', length: 16, nullable: true })
  color?: string | null;

  @Column({ type: 'varchar', nullable: true })
  description?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
