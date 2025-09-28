import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Unique,
         ManyToOne,
         JoinColumn,
         CreateDateColumn,
         UpdateDateColumn }
from 'typeorm';

import { Tag } from '$lib/server/database/entities';

import { Deadline } from './Deadline';

@Entity()
@Unique('UQ_DeadlineTag_deadline_tag', ['deadlineId', 'tagId'])
export class DeadlineTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'deadline_id' })
  deadlineId: string;

  @Column({ type: 'uuid', name: 'tag_id' })
  tagId: string;

  @ManyToOne(() => Deadline, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deadline_id' })
  deadline: Deadline;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
