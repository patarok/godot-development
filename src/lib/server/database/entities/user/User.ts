import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    JoinColumn
} from 'typeorm';
import { UserRole } from './UserRole';
import { SubRoleCfg } from './SubRoleCfg';
import { Session } from '../session/Session';
import { PasswordResetToken } from '../session/PasswordResetToken';
import {UserSubRole} from "$lib/server/database";

@Entity()
@Index(['email'])
@Index(['username'])
@Index(['isActive'])
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    forename?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    surname?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    username?: string;

    @Column({ type: 'varchar', length: 255 })
    password: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @ManyToOne(() => Role, (role) => role.users)
    role: Role;

    @OneToMany(() => UserSubRole, (usr) => usr.user)
    subRoles: UserSubRole[];

    @OneToMany(() => Session, (session) => session.user)
    sessions: Session[];

    @OneToMany(() => PasswordResetToken, (prt) => prt.user)
    passwordResetTokens: PasswordResetToken[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}