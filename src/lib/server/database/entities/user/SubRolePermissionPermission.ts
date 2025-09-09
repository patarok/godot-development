import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SubRoleCfg } from '../config/SubRoleCfg';
import { Permission } from './Permission';

@Entity()
@Index(['subRoleId'])
@Index(['permissionId'])
@Index(['roleId', 'permissionId'], { unique: true })
export class SubRolePermissionPermission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Align to existing snake_case columns
    @Column({ type: 'uuid', name: 'subrole_id' })
    roleId: string;

    @Column({ type: 'uuid', name: 'permission_id' })
    permissionId: string;

    @ManyToOne(() => SubRoleCfg, src => src.subRolePermissionPermissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'subrole_cfg_id' })
    subRoleCfg: SubRoleCfg;

    @ManyToOne(() => SubRolePermission, srp => srp.subroles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'subrole_permission_id' })
    subRolePermission: SubRolePermission;

    @CreateDateColumn()
    createdAt: Date;
}