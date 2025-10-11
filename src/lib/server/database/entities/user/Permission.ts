import { Entity,
         PrimaryGeneratedColumn,
         Column,
         Index,
         CreateDateColumn,
         UpdateDateColumn,
         OneToMany }
from 'typeorm';

import { RolePermission } from './RolePermission';

@Entity()
@Index(['category'])
export class Permission {
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

    @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
    roles: RolePermission[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
