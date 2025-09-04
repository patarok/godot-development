import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RolePermission } from './RolePermission';

@Entity()
@Index(['category'])
export class Permission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', unique: true })
    name: string;

    @Column({ type: 'varchar', nullable: true })
    description?: string;

    @Column({ type: 'varchar' })
    category: string;

    @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
    roles: RolePermission[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}