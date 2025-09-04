import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserRole } from './UserRole';
import { RolePermission } from './RolePermission';

@Entity()
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', unique: true })
    name: string; // e.g., 'admin', 'user'

    @OneToMany(() => UserRole, (userRole) => userRole.role)
    userRoles: UserRole[];

    @OneToMany(() => RolePermission, (rp) => rp.role)
    rolePermissions: RolePermission[];
}