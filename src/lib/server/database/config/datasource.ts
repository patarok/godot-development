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
import { Task } from '../entities/task/Task';
import { TaskTag } from '../entities/task/TaskTag';
import { UserTask } from '../entities/task/UserTask';
import { Tag } from '../entities/task/Tag';
import { Priority } from '../entities/state/Priority';
import { TaskState } from '../entities/state/TaskState';
import { ProjectState } from '../entities/state/ProjectState';

const DATABASE_URL = process.env.DATABASE_URL as string | undefined;
const NODE_ENV = (process.env.NODE_ENV || 'development').toLowerCase();
const DROP_SCHEMA = process.env.DROP_SCHEMA === '1';

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: DATABASE_URL,
    synchronize: NODE_ENV === 'development',
    dropSchema: DROP_SCHEMA && NODE_ENV === 'development',
    logging: NODE_ENV === 'development',
    entities: [
        User, Role, Permission, UserRole, RolePermission,
        Session, PasswordResetToken,
        SystemSetting,
        Task, TaskTag, UserTask, Tag,
        Priority, TaskState, ProjectState
    ],
    migrations: ['src/lib/server/database/migrations/*.ts'],
    subscribers: ['src/lib/server/database/subscribers/*.ts']
});