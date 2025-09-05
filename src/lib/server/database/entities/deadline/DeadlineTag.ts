import { Entity, PrimaryGeneratedColumn, Column, Unique, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Deadline } from './Deadline';
import { Tag } from '../task/Tag';

@Entity()
@Unique('UQ_DeadlineTag_deadline_tag', ['deadlineId', 'tagId'])
export class DeadlineTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  deadlineId: string;

  @Column({ type: 'uuid' })
  tagId: string;

  @ManyToOne(() => Deadline, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deadlineId' })
  deadline: Deadline;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tagId' })
  tag: Tag;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
