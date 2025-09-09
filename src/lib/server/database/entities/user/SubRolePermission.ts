import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RolePermission } from './RolePermission';

// not a junction table, permissions distinct to subroles
@Entity()
@Index(['category'])
export class SubRolePermission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', unique: true })
    name: string;

    @Column({ type: 'varchar', nullable: true })
    description?: string;

    @Column({ type: 'varchar' })
    category: string;

    @OneToMany(() => SubRolePermissionPermission, (srpp) => srpp.subRolePermission)
    subrolePermissionPermissions: SubRolePermissionPermission[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}