import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { SubRoleCfg } from '../config/SubRoleCfg';

@Entity()
@Index(['userId'])
@Index(['roleId'])
@Index(['userId', 'roleId'], { unique: true })
export class UserSubRole {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Map to existing snake_case columns to avoid sync issues in existing DBs
    @Column({ type: 'uuid', name: 'user_id' })
    userId: string;

    @Column({ type: 'uuid', name: 'role_id' })
    roleId: string;

    @ManyToOne(() => User, user => user.subRoles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => SubRoleCfg, subRoleCfg => subRoleCfg.userSubRoles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'subrole_id' })
    subRoleCfg: SubRoleCfg;

    @CreateDateColumn()
    assignedAt: Date;
}