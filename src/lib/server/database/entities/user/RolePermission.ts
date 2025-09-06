import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './Role';
import { Permission } from './Permission';

@Entity()
@Index(['roleId'])
@Index(['permissionId'])
@Index(['roleId', 'permissionId'], { unique: true })
export class RolePermission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Align to existing snake_case columns
    @Column({ type: 'uuid', name: 'role_id' })
    roleId: string;

    @Column({ type: 'uuid', name: 'permission_id' })
    permissionId: string;

    @ManyToOne(() => Role, role => role.rolePermissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @ManyToOne(() => Permission, permission => permission.roles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'permission_id' })
    permission: Permission;

    @CreateDateColumn()
    createdAt: Date;
}