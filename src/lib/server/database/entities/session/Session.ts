import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Index,
         ManyToOne,
         JoinColumn }
from 'typeorm';

import { User } from '$lib/server/database/entities';

@Entity()
export class Session {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'user_id' })
    @Index()
    userId: string;

    @Column({ type: 'varchar', length: 128 })
    @Index()
    tokenHash: string;

    @Column({ type: 'timestamptz', default: () => 'now()' })
    createdAt: Date;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    lastUsedAt?: Date | null;

    @Column({  type: 'varchar', nullable: true })
    userAgent?: string | null;

    @Column({ type: 'inet', nullable: true })
    ip?: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    revokedAt?: Date | null;

    @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}