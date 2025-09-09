import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Index,
         CreateDateColumn,
         UpdateDateColumn,
         ManyToOne,
         JoinColumn }
from 'typeorm';

import { User } from '../user/User';

@Entity()
@Index(['title'])
export class Solution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 256 })
  title: string;

  @Column({ type: 'varchar' })
  explanation: string;

  @Column({ type: 'varchar', nullable: true })
  link?: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author?: User | null;

  @Column({ type: 'varchar', nullable: true })
  category?: string | null;

  @Column({ type: 'float', nullable: true })
  effectiveness?: number | null;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
