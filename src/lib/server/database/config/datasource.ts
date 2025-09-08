import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../entities/user/User.ts';
import { Role } from '../entities/user/Role.ts';
import { Permission } from '../entities/user/Permission.ts';
import { UserRole } from '../entities/user/UserRole.ts';
import { RolePermission } from '../entities/user/RolePermission.ts';
import { Session } from '../entities/session/Session.ts';
import { PasswordResetToken } from '../entities/session/PasswordResetToken.ts';
import { SystemSetting } from '../entities/config/SystemSetting.ts';
import { Task } from '../entities/task/Task.ts';
import { TaskTag } from '../entities/task/TaskTag.ts';
import { UserTask } from '../entities/task/UserTask.ts';
import { Tag } from '../entities/task/Tag.ts';
import { Priority } from '../entities/state/Priority.ts';
import { TaskState } from '../entities/state/TaskState.ts';
import { ProjectState } from '../entities/state/ProjectState.ts';
import { RiskLevel } from '../entities/state/RiskLevel.ts';
// Project domain
import { Project } from '../entities/project/Project.ts';
import { ProjectUser } from '../entities/project/ProjectUser.ts';
import { ProjectTag } from '../entities/project/ProjectTag.ts';
import { ProjectCreator } from '../entities/project/ProjectCreator.ts';
import { ProjectCircle } from '../entities/project/ProjectCircle.ts';
import { ProjectAssignedUser } from '../entities/project/ProjectAssignedUser.ts';
import { ProjectResponsibleUser } from '../entities/project/ProjectResponsibleUser.ts';
// Deadlines
import { Deadline } from '../entities/deadline/Deadline.ts';
import { DeadlineTag } from '../entities/deadline/DeadlineTag.ts';
// Impediments & Solutions
import { Solution } from '../entities/impediment/Solution.ts';
import { Impediment } from '../entities/impediment/Impediment.ts';
import { ImpedimentMedian } from '../entities/impediment/ImpedimentMedian.ts';
// Mail
import { Mail } from '../entities/mail/Mail.ts';
import { SimpleMail } from "../entities/mail/SimpleMail";
import { ContractorMail } from "../entities/mail/SimpleMail";

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
        Priority, TaskState, ProjectState, RiskLevel,
        // Project domain
        Project,
        ProjectUser,
        ProjectTag,
        ProjectCreator,
        ProjectCircle,
        ProjectAssignedUser,
        ProjectResponsibleUser,
        // Deadlines
        Deadline,
        DeadlineTag,
        // Impediments & Solutions
        Solution,
        Impediment,
        ImpedimentMedian,
        // Mail
        Mail,
        SimpleMail,
        ContractorMail
    ],
    migrations: ['src/lib/server/database/migrations/*.ts'],
    subscribers: ['src/lib/server/database/subscribers/*.ts']
});
