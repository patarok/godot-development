import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Role } from './Role';

@Entity()
@Index(['userId'])
@Index(['roleId'])
@Index(['userId', 'roleId'], { unique: true })
export class UserRole {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @Column({ type: 'uuid' })
    roleId: string;

    @ManyToOne(() => User, user => user.roles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Role, role => role.userRoles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'roleId' })
    role: Role;

    @CreateDateColumn()
    assignedAt: Date;
}