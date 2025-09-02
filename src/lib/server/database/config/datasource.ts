import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../entities/user/User';
import { Role } from '../entities/user/Role';
import { Permission } from '../entities/user/Permission';
import { UserRole } from '../entities/user/UserRole';
import { RolePermission } from '../entities/user/RolePermission';
import { Session } from '../entities/session/Session';
import { PasswordResetToken } from '../entities/session/PasswordResetToken';
import { SystemSetting } from '../entities/config/SystemSetting';

const DATABASE_URL = process.env.DATABASE_URL as string | undefined;
const NODE_ENV = (process.env.NODE_ENV || 'development').toLowerCase();

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: DATABASE_URL,
    synchronize: NODE_ENV === 'development',
    logging: NODE_ENV === 'development',
    entities: [
        User, Role, Permission, UserRole, RolePermission, Session, PasswordResetToken, SystemSetting
    ],
    migrations: ['src/lib/server/database/migrations/*.ts'],
    subscribers: ['src/lib/server/database/subscribers/*.ts']
});