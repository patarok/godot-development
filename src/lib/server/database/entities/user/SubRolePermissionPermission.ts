import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Index,
         CreateDateColumn,
         ManyToOne,
         JoinColumn }
from 'typeorm';

import { SubRoleCfg } from './SubRoleCfg';
import { SubRolePermission } from './SubRolePermission';

//explict junction table  for recapturing the actual concept
//binding SubRoleCfg(SubRoleConfigurable) to SubRolePermission m:n
@Entity()
@Index(['subRoleCfgId', 'subRolePermissionId'], {unique: true})
export class SubRolePermissionPermission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Align to existing snake_case columns
    @Column({ type: 'uuid', name: 'subrole_cfg_id' })
    subRoleCfgId: string;

    @Column({ type: 'uuid', name: 'subrole_permission_id' })
    subRolePermissionId: string;

    @ManyToOne(() => SubRoleCfg, (src) => src.subRolePermissionPermissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'subrole_cfg_id' })
    subRoleCfg: SubRoleCfg;

    @ManyToOne(() => SubRolePermission, (srp) => srp.subrolePermissionPermissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'subrole_permission_id' })
    subRolePermission: SubRolePermission;

    @CreateDateColumn()
    createdAt: Date;
}