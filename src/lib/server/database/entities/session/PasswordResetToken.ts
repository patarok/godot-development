import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/User';

@Entity()
export class PasswordResetToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    @Index()
    userId: number;

    @Column({ type: 'varchar', length: 128 })
    @Index()
    tokenHash: string;

    @Column({ type: 'timestamptz', default: () => 'now()' })
    createdAt: Date;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    usedAt?: Date | null;

    @ManyToOne(() => User, (user) => user.passwordResetTokens, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}