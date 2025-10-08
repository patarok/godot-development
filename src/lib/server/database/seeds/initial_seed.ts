import { AppDataSource } from '../config/datasource';
import { Role } from '../entities/user/Role';
import { Permission } from '../entities/user/Permission';
import { User } from '../entities/user/User';
import { UserSubRole } from '../entities/user/UserSubRole';
import { RolePermission } from '../entities/user/RolePermission';
import { SystemSetting } from '../entities/config/SystemSetting';
import { Project } from '../entities/project/Project';
import { ProjectStatus } from '../entities/status/ProjectStatus';
import { Priority } from '../entities/status/Priority';
import { TaskStatus } from '../entities/status/TaskStatus';
import { RiskLevel } from '../entities/status/RiskLevel';
import { TaskType } from '../entities/status/TaskType';
import { ProjectAssignedUser } from '../entities/project/ProjectAssignedUser';
import { ProjectResponsibleUser } from '../entities/project/ProjectResponsibleUser';
import { Task } from '../entities/task/Task'; // Added Task entity
import { ProjectTask } from '../entities/project/ProjectTask'; // Added ProjectTask entity
import { hash as argon2hash } from '@node-rs/argon2';
import { generateIdenteapot } from '@teapotlabs/identeapots';
import { JSDOM } from 'jsdom';
import { createCanvas, Image as CanvasImage } from 'canvas';

// Setup minimal DOM/canvas for identeapots (Node environment)
function ensureDomForIdenteapots() {
    if (typeof (globalThis as any).document !== 'undefined') return;
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    (globalThis as any).window = dom.window as any;
    (globalThis as any).document = dom.window.document as any;
    (globalThis as any).Image = CanvasImage as any;
    const realCreateElement = dom.window.document.createElement.bind(dom.window.document);
    (dom.window.document as any).createElement = function (tagName: any, options?: any) {
        if (String(tagName).toLowerCase() === 'canvas') {
            return createCanvas(256, 256) as any;
        }
        return realCreateElement(tagName, options);
    };
}
ensureDomForIdenteapots();

// Existing upsert functions (unchanged)
async function upsertProjectStatus(name: string, rank?: number, color?: string) {
    const repo = AppDataSource.getRepository(ProjectStatus);
    let row = await repo.findOne({ where: { name } });
    if (!row) {
        row = repo.create({ name, rank: rank ?? 0, color });
        row = await repo.save(row);
    }
    return row;
}

async function upsertTaskStatus(name: string, rank?: number, color?: string) {
    const repo = AppDataSource.getRepository(TaskStatus);
    let row = await repo.findOne({ where: { name } });
    if (!row) {
        row = repo.create({ name, rank: rank ?? 0, color });
        row = await repo.save(row);
    }
    return row;
}

async function upsertPriority(name: string, rank?: number, color?: string) {
    const repo = AppDataSource.getRepository(Priority);
    let row = await repo.findOne({ where: { name } });
    if (!row) {
        row = repo.create({ name, rank: rank ?? 0, color });
        row = await repo.save(row);
    }
    return row;
}

async function upsertRiskLevel(name: string, rank?: number, color?: string) {
    const repo = AppDataSource.getRepository(RiskLevel);
    let row = await repo.findOne({ where: { name } });
    if (!row) {
        row = repo.create({ name, rank: rank ?? 0, color });
        row = await repo.save(row);
    }
    return row;
}

async function upsertTaskType(name: string, rank?: number, color?: string) {
    const repo = AppDataSource.getRepository(TaskType);
    let row = await repo.findOne({ where: { name } });
    if (!row) {
        row = repo.create({ name, rank: rank ?? 0, color });
        row = await repo.save(row);
    }
    return row;
}

async function upsertProject(
    title: string,
    creator?: User,
    options?: {
        description?: string;
        projectStatus?: ProjectStatus;
        priority?: Priority;
        riskLevel?: RiskLevel;
        isDone?: boolean;
        isActive?: boolean;
        currentIterationNumber?: number;
        iterationWarnAt?: number;
        maxIterations?: number;
        estimatedBudget?: number;
        actualCost?: number;
        estimatedHours?: number;
        actualHours?: number;
        startDate?: Date;
        endDate?: Date;
        actualStartDate?: Date;
        actualEndDate?: Date;
        mainResponsible?: User;
    }
) {
    const projectRepo = AppDataSource.getRepository(Project);
    let project = await projectRepo.findOne({ where: { title } });
    if (!project) {
        const active = options?.projectStatus ?? (await upsertProjectStatus('Active', 20, '#2b8a3e'));
        project = projectRepo.create({
            title,
            description: options?.description ?? null,
            projectStatus: active,
            priority: options?.priority ?? null,
            riskLevel: options?.riskLevel ?? null,
            isActive: options?.isActive ?? true,
            isDone: options?.isDone ?? false,
            currentIterationNumber: options?.currentIterationNumber ?? 0,
            iterationWarnAt: options?.iterationWarnAt ?? 0,
            maxIterations: options?.maxIterations ?? null,
            estimatedBudget: options?.estimatedBudget ?? null,
            actualCost: options?.actualCost ?? null,
            estimatedHours: options?.estimatedHours ?? null,
            actualHours: options?.actualHours ?? null,
            startDate: options?.startDate ?? null,
            endDate: options?.endDate ?? null,
            actualStartDate: options?.actualStartDate ?? null,
            actualEndDate: options?.actualEndDate ?? null,
            mainResponsible: options?.mainResponsible ?? null,
            creator: creator ?? null
        });
        project = await projectRepo.save(project);
    }
    if (project && !project.avatarData) {
        const avatarData = await generateIdenteapot(project.id ?? title, { size: 128 });
        project.avatarData = avatarData;
        project = await projectRepo.save(project);
    }
    return project;
}

async function upsertRole(name: string, isMain: boolean = false) {
    const repo = AppDataSource.getRepository(Role);
    let role = await repo.findOne({ where: { name } });
    if (!role) role = await repo.save(repo.create({ name, isMainRole: isMain }));
    return role;
}

async function upsertPermission(name: string, category: string, description?: string) {
    const repo = AppDataSource.getRepository(Permission);
    let perm = await repo.findOne({ where: { name } });
    if (!perm) perm = await repo.save(repo.create({ name, category, description }));
    return perm;
}

async function linkRolePermission(role: Role, perm: Permission) {
    const repo = AppDataSource.getRepository(RolePermission);
    const exists = await repo.findOne({ where: { roleId: role.id, permissionId: perm.id } });
    if (!exists) await repo.save(repo.create({ roleId: role.id, permissionId: perm.id }));
}

async function upsertSystemSetting(key: string, value: string, opts?: { description?: string; category?: string; isPublic?: boolean }) {
    const repo = AppDataSource.getRepository(SystemSetting);
    let s = await repo.findOne({ where: { key } });
    if (!s) s = repo.create({ key, value, description: opts?.description, category: opts?.category, isPublic: !!opts?.isPublic });
    else {
        s.value = value;
        if (opts?.description !== undefined) s.description = opts.description;
        if (opts?.category !== undefined) s.category = opts.category;
        if (opts?.isPublic !== undefined) s.isPublic = opts.isPublic;
    }
    await repo.save(s);
}

async function upsertUser(
    email: string,
    username: string,
    passwordHash: string,
    role: Role,
    forename?: string,
    surname?: string
) {
    const userRepo = AppDataSource.getRepository(User);
    const emailNorm = email.trim().toLowerCase();
    let user = await userRepo.findOne({ where: [{ email: emailNorm }, { username }] });

    if (!user) {
        user = await userRepo.save(
            userRepo.create({
                email: emailNorm,
                username,
                password: passwordHash,
                isActive: true,
                role,
                forename: forename ?? null,
                surname: surname ?? null
            })
        );
    }

    if (user && !user.avatarData) {
        const avatarData = await generateIdenteapot(emailNorm, { size: 128 });
        user.avatarData = avatarData;
        await userRepo.save(user);
    }

    return user;
}

async function assignUserToProject(userId: string, projectId: string) {
    const repo = AppDataSource.getRepository(ProjectAssignedUser);
    const exists = await repo.findOne({ where: { userId, projectId } });
    if (!exists) {
        await repo.save(repo.create({ userId, projectId }));
    }
}

async function assignResponsibleUserToProject(userId: string, projectId: string) {
    const repo = AppDataSource.getRepository(ProjectResponsibleUser);
    const exists = await repo.findOne({ where: { userId, projectId } });
    if (!exists) {
        await repo.save(repo.create({ userId, projectId }));
    }
}

// New function to upsert tasks
async function upsertTask(
    title: string,
    creator: User,
    options: {
        description?: string;
        taskStatus: TaskStatus;
        priority?: Priority | null;
        taskType?: TaskType | null;
        user?: User | null;
        actualHours?: number | null;
        dueDate: Date;
        plannedStartDate: Date;
        startDate?: Date;
        doneDate?: Date | null;
        isDone?: boolean;
        isActive?: boolean;
        isMeta?: boolean;
        parent?: Task | null;
    }
) {
    const taskRepo = AppDataSource.getRepository(Task);
    let task = await taskRepo.findOne({ where: { title } });
    if (!task) {
        task = taskRepo.create({
            title,
            description: options.description ?? null,
            taskStatus: options.taskStatus,
            priority: options.priority ?? null,
            taskType: options.taskType ?? null,
            creator: creator,
            user: options.user ?? null,
            actualHours: options.actualHours ?? null,
            dueDate: options.dueDate,
            plannedStartDate: options.plannedStartDate,
            startDate: options.startDate ?? new Date(),
            doneDate: options.doneDate ?? null,
            isDone: options.isDone ?? false,
            isActive: options.isActive ?? true,
            isMeta: options.isMeta ?? false,
            parent: options.parent ?? null,
            hasSegmentGroupCircle: false
        });
        task = await taskRepo.save(task);
    }
    return task;
}

// New function to link tasks to projects
async function assignTaskToProject(taskId: string, projectId: string) {
    const repo = AppDataSource.getRepository(ProjectTask);
    const exists = await repo.findOne({ where: { taskId, projectId } });
    if (!exists) {
        await repo.save(repo.create({ taskId, projectId }));
    }
}

export async function seedInitialData() {
    const isMainRole = true;
    const adminRole = await upsertRole('admin', isMainRole);
    const userRole = await upsertRole('user', isMainRole);

    const perms = [
        { name: 'admin.access', category: 'admin', description: 'Access admin area' },
        { name: 'user.manage', category: 'admin', description: 'Manage users' }
    ];
    for (const p of perms) {
        const perm = await upsertPermission(p.name, p.category, p.description);
        await linkRolePermission(adminRole, perm);
    }

    await upsertSystemSetting('app.title', 'Godot Development', { category: 'ui', isPublic: true });
    await upsertSystemSetting('auth.password.hash', 'argon2id', { category: 'auth' });

    const rawPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
    const passwordHash = process.env.ADMIN_PASSWORD_HASH ?? (await argon2hash(rawPassword, { memoryCost: 19456, timeCost: 2, hashLength: 32, parallelism: 1 }));

    const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
    const adminUser = await upsertUser(adminEmail, process.env.ADMIN_USERNAME ?? 'admin', passwordHash, adminRole);

    const secondAdminUser = await upsertUser(
        'sarah.wilson@example.com',
        'swilson',
        await argon2hash('admin123', { memoryCost: 19456, timeCost: 2, hashLength: 32, parallelism: 1 }),
        adminRole,
        'Sarah',
        'Wilson'
    );

    const regularUser1 = await upsertUser(
        'michael.chen@example.com',
        'mchen',
        await argon2hash('user123', { memoryCost: 19456, timeCost: 2, hashLength: 32, parallelism: 1 }),
        userRole,
        'Michael',
        'Chen'
    );

    const regularUser2 = await upsertUser(
        'emma.thompson@example.com',
        'ethompson',
        await argon2hash('user123', { memoryCost: 19456, timeCost: 2, hashLength: 32, parallelism: 1 }),
        userRole,
        'Emma',
        'Thompson'
    );

    const prioritySeeds = [
        { name: 'Low', rank: 10, color: '#4dabf7' },
        { name: 'Medium', rank: 20, color: '#fab005' },
        { name: 'High', rank: 30, color: '#fa5252' },
        { name: 'Urgent', rank: 40, color: '#d6336c' }
    ];
    const priorities: Priority[] = [];
    for (const p of prioritySeeds) {
        priorities.push(await upsertPriority(p.name, p.rank, p.color));
    }

    const projectStatusSeeds = [
        { name: 'Active', rank: 20, color: '#2b8a3e' },
        { name: 'Paused', rank: 10, color: '#868e96' },
        { name: 'Completed', rank: 5, color: '#37b24d' },
        { name: 'Archived', rank: 0, color: '#495057' }
    ];
    const statuses: ProjectStatus[] = [];
    for (const s of projectStatusSeeds) {
        statuses.push(await upsertProjectStatus(s.name, s.rank, s.color));
    }

    const riskLevelSeeds = [
        { name: 'Low', rank: 10, color: '#40c057' },
        { name: 'Medium', rank: 20, color: '#fab005' },
        { name: 'High', rank: 30, color: '#fa5252' },
        { name: 'Critical', rank: 40, color: '#d6336c' }
    ];
    const riskLevels: RiskLevel[] = [];
    for (const r of riskLevelSeeds) {
        riskLevels.push(await upsertRiskLevel(r.name, r.rank, r.color));
    }

    const taskStatusSeeds = [
        { name: 'Not Started', rank: 0, color: '#868e96' },
        { name: 'In Progress', rank: 10, color: '#228be6' },
        { name: 'Blocked', rank: 20, color: '#e03131' },
        { name: 'On Hold', rank: 25, color: '#fab005' },
        { name: 'Done', rank: 30, color: '#2b8a3e' }
    ];
    const taskStatuses: TaskStatus[] = [];
    for (const t of taskStatusSeeds) {
        taskStatuses.push(await upsertTaskStatus(t.name, t.rank, t.color));
    }

    const taskTypeSeeds = [
        { name: 'Table of Contents', rank: 10 },
        { name: 'Executive Summary', rank: 20 },
        { name: 'Technical Approach', rank: 30 },
        { name: 'DevOps', rank: 35 },
        { name: 'Design', rank: 40 },
        { name: 'Capabilities', rank: 50 },
        { name: 'Focus Documents', rank: 60 },
        { name: 'Narrative', rank: 70 },
        { name: 'Cover Page', rank: 80 },
        { name: 'Cover page', rank: 85 },
        { name: 'HR', rank: 90 },
        { name: 'Backend', rank: 100 },
        { name: 'Business', rank: 110 },
        { name: 'Agile', rank: 120 },
        { name: 'Feature', rank: 130 },
        { name: 'Chore', rank: 140 },
        { name: 'Bug', rank: 150 },
        { name: 'Frontend', rank: 160 },
        { name: 'Finance/DevOps', rank: 170 }
    ];
    const taskTypes: TaskType[] = [];
    for (const tt of taskTypeSeeds) {
        taskTypes.push(await upsertTaskType(tt.name, tt.rank));
    }

    const now = new Date();
    const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const godotProject = await upsertProject('Godot Development', adminUser, {
        description: 'Core development of the Godot game engine, including new features, bug fixes, and performance improvements for the 4.x release cycle.',
        projectStatus: statuses[0],
        priority: priorities[3],
        riskLevel: riskLevels[1],
        isActive: true,
        isDone: false,
        currentIterationNumber: 3,
        maxIterations: 15,
        iterationWarnAt: 12,
        estimatedBudget: 250000,
        actualCost: 180000,
        estimatedHours: 3500,
        actualHours: 2400,
        startDate: daysAgo(120),
        endDate: daysFromNow(270),
        actualStartDate: daysAgo(115),
        actualEndDate: null,
        mainResponsible: adminUser
    });

    const internalToolsProject = await upsertProject('Internal Tools', adminUser, {
        description: 'Development and maintenance of internal productivity tools, including project management dashboards, automation scripts, and team collaboration features.',
        projectStatus: statuses[0],
        priority: priorities[1],
        riskLevel: riskLevels[0],
        isActive: true,
        isDone: false,
        currentIterationNumber: 2,
        maxIterations: 10,
        iterationWarnAt: 8,
        estimatedBudget: 85000,
        actualCost: 62000,
        estimatedHours: 1200,
        actualHours: 900,
        startDate: daysAgo(90),
        endDate: daysFromNow(180),
        actualStartDate: daysAgo(88),
        actualEndDate: null,
        mainResponsible: secondAdminUser
    });

    const marketingProject = await upsertProject('Marketing Website', adminUser, {
        description: 'Complete redesign and modernization of the company marketing website with improved SEO, responsive design, and integration with analytics platforms.',
        projectStatus: statuses[2],
        priority: priorities[2],
        riskLevel: riskLevels[0],
        isActive: false,
        isDone: true,
        currentIterationNumber: 8,
        maxIterations: 8,
        iterationWarnAt: 6,
        estimatedBudget: 120000,
        actualCost: 135000,
        estimatedHours: 1800,
        actualHours: 2100,
        startDate: daysAgo(180),
        endDate: daysAgo(30),
        actualStartDate: daysAgo(178),
        actualEndDate: daysAgo(25),
        mainResponsible: regularUser1
    });

    const mobileAppProject = await upsertProject('Mobile App', adminUser, {
        description: 'Cross-platform mobile application for iOS and Android, featuring real-time synchronization, offline mode, and push notifications for enhanced user engagement.',
        projectStatus: statuses[0],
        priority: priorities[2],
        riskLevel: riskLevels[2],
        isActive: true,
        isDone: false,
        currentIterationNumber: 5,
        maxIterations: 12,
        iterationWarnAt: 10,
        estimatedBudget: 420000,
        actualCost: 310000,
        estimatedHours: 4800,
        actualHours: 3600,
        startDate: daysAgo(150),
        endDate: daysFromNow(210),
        actualStartDate: daysAgo(145),
        actualEndDate: null,
        mainResponsible: secondAdminUser
    });

    // Seed tasks for projects
    const godotTasks = [
        {
            title: 'Implement new rendering pipeline',
            description: 'Develop and integrate a new rendering pipeline for Godot 4.x to improve performance.',
            taskStatus: taskStatuses.find((ts) => ts.name === 'In Progress')!,
            priority: priorities.find((p) => p.name === 'High')!,
            taskType: taskTypes.find((tt) => tt.name === 'Feature')!,
            user: adminUser,
            actualHours: 120,
            dueDate: daysFromNow(30),
            plannedStartDate: daysAgo(10),
            isDone: false,
            isActive: true,
            isMeta: false
        },
        {
            title: 'Fix physics engine bugs',
            description: 'Address reported issues in the physics engine for the 4.x release.',
            taskStatus: taskStatuses.find((ts) => ts.name === 'Blocked')!,
            priority: priorities.find((p) => p.name === 'Urgent')!,
            taskType: taskTypes.find((tt) => tt.name === 'Bug')!,
            user: regularUser1,
            actualHours: 50,
            dueDate: daysFromNow(15),
            plannedStartDate: daysAgo(20),
            isDone: false,
            isActive: true,
            isMeta: false
        }
    ];

    const internalToolsTasks = [
        {
            title: 'Develop project dashboard',
            description: 'Create a dashboard for project overview and metrics tracking.',
            taskStatus: taskStatuses.find((ts) => ts.name === 'Not Started')!,
            priority: priorities.find((p) => p.name === 'Medium')!,
            taskType: taskTypes.find((tt) => tt.name === 'Frontend')!,
            user: secondAdminUser,
            actualHours: null,
            dueDate: daysFromNow(60),
            plannedStartDate: daysFromNow(5),
            isDone: false,
            isActive: true,
            isMeta: false
        }
    ];

    const marketingTasks = [
        {
            title: 'Design homepage layout',
            description: 'Create a responsive homepage design with modern UI/UX principles.',
            taskStatus: taskStatuses.find((ts) => ts.name === 'Done')!,
            priority: priorities.find((p) => p.name === 'High')!,
            taskType: taskTypes.find((tt) => tt.name === 'Design')!,
            user: regularUser2,
            actualHours: 80,
            dueDate: daysAgo(35),
            plannedStartDate: daysAgo(60),
            startDate: daysAgo(60),
            doneDate: daysAgo(35),
            isDone: true,
            isActive: false,
            isMeta: false
        }
    ];

    const mobileAppTasks = [
        {
            title: 'Implement push notifications',
            description: 'Add push notification support for iOS and Android.',
            taskStatus: taskStatuses.find((ts) => ts.name === 'In Progress')!,
            priority: priorities.find((p) => p.name === 'High')!,
            taskType: taskTypes.find((tt) => tt.name === 'Feature')!,
            user: regularUser2,
            actualHours: 100,
            dueDate: daysFromNow(45),
            plannedStartDate: daysAgo(30),
            isDone: false,
            isActive: true,
            isMeta: false
        },
        {
            title: 'Optimize offline mode',
            description: 'Improve data synchronization for offline mode functionality.',
            taskStatus: taskStatuses.find((ts) => ts.name === 'Not Started')!,
            priority: priorities.find((p) => p.name === 'Medium')!,
            taskType: taskTypes.find((tt) => tt.name === 'Feature')!,
            user: regularUser1,
            actualHours: null,
            dueDate: daysFromNow(90),
            plannedStartDate: daysFromNow(10),
            isDone: false,
            isActive: true,
            isMeta: false
        }
    ];

    // Create and link tasks to projects
    for (const taskData of godotTasks) {
        const task = await upsertTask(taskData.title, adminUser, taskData);
        await assignTaskToProject(task.id, godotProject.id);
    }

    for (const taskData of internalToolsTasks) {
        const task = await upsertTask(taskData.title, secondAdminUser, taskData);
        await assignTaskToProject(task.id, internalToolsProject.id);
    }

    for (const taskData of marketingTasks) {
        const task = await upsertTask(taskData.title, regularUser1, taskData);
        await assignTaskToProject(task.id, marketingProject.id);
    }

    for (const taskData of mobileAppTasks) {
        const task = await upsertTask(taskData.title, secondAdminUser, taskData);
        await assignTaskToProject(task.id, mobileAppProject.id);
    }

    // Assign users to projects (unchanged)
    await assignUserToProject(adminUser.id, godotProject.id);
    await assignUserToProject(secondAdminUser.id, godotProject.id);
    await assignUserToProject(regularUser1.id, godotProject.id);
    await assignUserToProject(regularUser2.id, godotProject.id);
    await assignResponsibleUserToProject(adminUser.id, godotProject.id);
    await assignResponsibleUserToProject(secondAdminUser.id, godotProject.id);

    await assignUserToProject(secondAdminUser.id, internalToolsProject.id);
    await assignUserToProject(regularUser1.id, internalToolsProject.id);
    await assignResponsibleUserToProject(secondAdminUser.id, internalToolsProject.id);

    await assignUserToProject(regularUser1.id, marketingProject.id);
    await assignUserToProject(regularUser2.id, marketingProject.id);
    await assignResponsibleUserToProject(regularUser1.id, marketingProject.id);

    await assignUserToProject(adminUser.id, mobileAppProject.id);
    await assignUserToProject(secondAdminUser.id, mobileAppProject.id);
    await assignUserToProject(regularUser1.id, mobileAppProject.id);
    await assignUserToProject(regularUser2.id, mobileAppProject.id);
    await assignResponsibleUserToProject(secondAdminUser.id, mobileAppProject.id);
    await assignResponsibleUserToProject(regularUser2.id, mobileAppProject.id);

    console.log('Seeded roles, permissions, settings, users, enhanced projects with assignments, initial lookups, and tasks');
}

// async function runSeeds() {
//     try {
//         await AppDataSource.initialize();
//     } catch (error) {
//         console.log(error.message);
//         console.log('Proceeding anyway.');
//     }
//
//     await seedInitialData();
//     await AppDataSource.destroy();
//     console.log('Seeding completed');
//     process.exit(0);
// }

async function runSeeds() {
    try {
        await AppDataSource.initialize();
    } catch (error) {
        console.error('Failed to initialize DataSource:', error);
        process.exit(1);
    }

    try {
        await seedInitialData();
    } finally {
        await AppDataSource.destroy();
    }
    console.log('Seeding completed');
    process.exit(0);
}

runSeeds().catch((err) => {
    console.error(err);
    process.exit(1);
});