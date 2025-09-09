import {Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne} from 'typeorm';
import { UserRole } from './UserRole';
import { RolePermission } from './RolePermission';
import type {User} from "$lib/server/database";

@Entity()
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: false })
    isMainRole: boolean;

    @Column({ type: 'varchar', unique: true })
    name: string; // e.g., 'admin', 'user'

    @OneToMany(() => User, (user) => user.roles, { onDelete: 'CASCADE' })
    users: User[];

    @OneToMany(() => RolePermission, (rp) => rp.role)
    rolePermissions: RolePermission[];
}