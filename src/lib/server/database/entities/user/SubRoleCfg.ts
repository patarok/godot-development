import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Index,
         CreateDateColumn,
         UpdateDateColumn,
         OneToMany }
from 'typeorm';

import { UserSubRole } from "./UserSubRole";
import { SubRolePermissionPermission } from "./SubRolePermissionPermission";

// this means SubRoleConfigurable
/**
 * Priority lookup table for tasks.
 * - UUID primary key
 * - name: unique textual name (e.g., Low, Medium, High)
 * - rank: numeric ordering (lower is more important); not unique
 * - color: optional hex or token for UI
 * - description: optional
 */
@Entity()
@Index(['title'], { unique: true })
export class SubRoleCfg {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 64 })
    title: string;

    @Column({ type: 'varchar', length: 2048, nullable: true })
    description: string | null;

    @Column({ type: 'varchar', length: 16, nullable: true })
    color?: string | null;

    @Column({ type: 'varchar', length: 64 })
    companyJobTitle: string;

    @Column({ type: 'varchar', length: 512 })
    companyJobRole: string;

    @OneToMany(() => UserSubRole, (usr) => usr.subRoleCfg)
    userSubRoles: UserSubRole[];

    @OneToMany(() => SubRolePermissionPermission, (srpp) => srpp.subRoleCfg)
    subRolePermissionPermissions: SubRolePermissionPermission[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
