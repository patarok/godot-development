import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { SubRoleCfg } from '../config/SubRoleCfg';


// since a SubRole(Cfg=configurable) can appear in a multitude of users
// and a User should be able to get assigned several Subroles, like pm and contributor(on contributor side)
// we bind them m:n -- so many explicit m:n can "pretzel" your brain, but it is good for understanding what happens.
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