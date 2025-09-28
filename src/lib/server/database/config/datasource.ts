import 'dotenv/config';
import { DataSource } from 'typeorm';

//User
import { User,
         Role,
         Permission,
         RolePermission,
         SubRoleCfg,
         SubRolePermission,
         SubRolePermissionPermission,
         UserSubRole
}
from '$lib/server/database/entities';

// Config
import { SystemSetting } from '$lib/server/database/entities';

// Session
import { Session,
         PasswordResetToken
}
from '$lib/server/database/entities';

// Task
import { Task,
         TaskTag,
         UserTask,
         Tag
}
from '$lib/server/database/entities';

// State
import {
    Priority,
    TaskState,
    ProjectState,
    RiskLevel
}
from '$lib/server/database/entities';

// Project domain
import {
    Project,
    ProjectUser,
    ProjectTag,
    ProjectCreator,
    ProjectCircle,
    ProjectAssignedUser,
    ProjectResponsibleUser
} from '$lib/server/database/entities';

// Deadlines
import { Deadline,
         DeadlineTag
}
from '$lib/server/database/entities';

// Impediments & Solutions
import { Solution,
         Impediment,
         ImpedimentMedian
}
from '$lib/server/database/entities';

// Mail
import { Mail,
         SimpleMail,
         ContractorMail,
         MailAudit,
         Attachment
}
from '$lib/server/database/entities';

console.log('Entities being registered:', [
    User, Role, Permission, RolePermission, SubRoleCfg,
    SubRolePermission, SubRolePermissionPermission, UserSubRole  // ← Check this logs
]);

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

        //User
        User,
        Role,
        Permission,
        RolePermission,
        SubRoleCfg,
        SubRolePermission,
        SubRolePermissionPermission,
        UserSubRole,

        // Config
        SystemSetting,

        // Session
        Session,
        PasswordResetToken,

        // Task
        Task,
        TaskTag,
        UserTask,
        Tag,

        // State
        Priority,
        TaskState,
        ProjectState,
        RiskLevel,

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
        ContractorMail,
        MailAudit,
        Attachment
    ],
    migrations: ['src/lib/server/database/migrations/*.ts'],
    subscribers: ['src/lib/server/database/subscribers/*.ts']
});

try {
    await AppDataSource.initialize()
} catch (error) {
    console.log(error)
}