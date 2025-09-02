import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './Role';
import { Permission } from './Permission';

@Entity()
@Index(['roleId'])
@Index(['permissionId'])
@Index(['roleId', 'permissionId'], { unique: true })
export class RolePermission {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    roleId: number;

    @Column({ type: 'int' })
    permissionId: number;

    @ManyToOne(() => Role, role => role.rolePermissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'roleId' })
    role: Role;

    @ManyToOne(() => Permission, permission => permission.roles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'permissionId' })
    permission: Permission;

    @CreateDateColumn()
    createdAt: Date;
}