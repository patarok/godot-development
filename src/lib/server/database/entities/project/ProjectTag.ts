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

import { Project } from './Project';

@Entity()
@Unique('UQ_ProjectTag_project_tag', ['projectId', 'tagId'])
export class ProjectTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @Column({ type: 'uuid', name: 'tag_id' })
  tagId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
