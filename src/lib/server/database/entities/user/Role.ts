import { Entity,
         PrimaryGeneratedColumn,
         Column,
         OneToMany }
from 'typeorm';


import { RolePermission } from './RolePermission';
import { User } from './User';

@Entity()
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: false })
    isMainRole: boolean;

    @Column({ type: 'varchar', unique: true })
    name: string; // e.g., 'admin', 'user'

    @OneToMany(() => User, (user) => user.role, { cascade: false })
    users: User[];

    @OneToMany(() => RolePermission, (rp) => rp.role)
    rolePermissions: RolePermission[];
}