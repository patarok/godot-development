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

    // Map to existing snake_case columns to avoid sync issues in existing DBs
    @Column({ type: 'uuid', name: 'user_id' })
    userId: string;

    @Column({ type: 'uuid', name: 'role_id' })
    roleId: string;

    @ManyToOne(() => User, user => user.role, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Role, role => role.userRoles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @CreateDateColumn()
    assignedAt: Date;
}