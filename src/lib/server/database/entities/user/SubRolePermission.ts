import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Index,
         CreateDateColumn,
         UpdateDateColumn,
         OneToMany }
from 'typeorm';

import { SubRolePermissionPermission } from './SubRolePermissionPermission';

// not a junction table, permissions distinct to subroles
@Entity()
@Index(['category'])
export class SubRolePermission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // we may need to define an enum to allow only certain values here f.i. > status.change, setRank
    @Column({ type: 'varchar', unique: true })
    name: string;

    @Column({ type: 'varchar', nullable: true })
    description?: string;

    @Column({ type: 'varchar' })
    category: string;

    // we may need to define an enum to allow only certain values here for optional info on rights having more granular properties f.i. -> setRank: '0-99'
    @Column({ type: 'varchar' })
    value: string;

    @OneToMany(() => SubRolePermissionPermission, (srpp) => srpp.subRolePermission)
    subrolePermissionPermissions: SubRolePermissionPermission[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
