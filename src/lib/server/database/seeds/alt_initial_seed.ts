import { AppDataSource } from '../config/datasource';
import { Role } from '../entities/user/Role';
import { Permission } from '../entities/user/Permission';
import { User } from '../entities/user/User';
import { UserSubRole } from '../entities/user/UserSubRole';
import { RolePermission } from '../entities/user/RolePermission';
import { SubRoleCfg } from '../entities/user/SubRoleCfg';
import { SubRolePermission } from '../entities/user/SubRolePermission';
import { SubRolePermissionPermission } from '../entities/user/SubRolePermissionPermission';
import { SystemSetting } from '../entities/config/SystemSetting';
import { Project } from '../entities/project/Project';
import { ProjectLog } from '../entities/project/ProjectLog';
import { ProjectStatus } from '../entities/status/ProjectStatus';
import { Priority } from '../entities/status/Priority';
import { TaskStatus } from '../entities/status/TaskStatus';
import { RiskLevel } from '../entities/status/RiskLevel';
import { TaskType } from '../entities/status/TaskType';
import { ProjectAssignedUser } from '../entities/project/ProjectAssignedUser';
import { ProjectResponsibleUser } from '../entities/project/ProjectResponsibleUser';
import { Task } from '../entities/task/Task';
import { TaskLog } from '../entities/task/TaskLog';
import { ProjectTask } from '../entities/project/ProjectTask';
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

// Lookups upserts
async function upsertProjectStatus(name: string, rank?: number, color?: string) {
    const repo = AppDataSource.getRepository(ProjectStatus);
    let row = await repo.findOne({ where: { name } });
    if (!row) row = await repo.save(repo.create({ name, rank: rank ?? 0, color }));
    return row;
}

async function upsertTaskStatus(name: string, rank?: number, color?: string) {
    const repo = AppDataSource.getRepository(TaskStatus);
    let row = await repo.findOne({ where: { name } });
    if (!row) row = await repo.save(repo.create({ name, rank: rank ?? 0, color }));
    return row;
}

async function upsertPriority(name: string, rank?: number, color?: string) {
    const repo = AppDataSource.getRepository(Priority);
    let row = await repo.findOne({ where: { name } });
    if (!row) row = await repo.save(repo.create({ name, rank: rank ?? 0, color }));
    return row;
}

async function upsertRiskLevel(name: string, rank?: number, color?: string) {
    const repo = AppDataSource.getRepository(RiskLevel);
    let row = await repo.findOne({ where: { name } });
    if (!row) row = await repo.save(repo.create({ name, rank: rank ?? 0, color }));
    return row;
}

async function upsertTaskType(name: string, rank?: number, color?: string) {
    const repo = AppDataSource.getRepository(TaskType);
    let row = await repo.findOne({ where: { name } });
    if (!row) row = await repo.save(repo.create({ name, rank: rank ?? 0, color }));
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

// Main roles, main permissions
async function upsertRole(name: string, isMain: boolean = false) {
    const repo = AppDataSource.getRepository(Role);
    let role = await repo.findOne({ where: { name } });
    if (!role) role = await repo.save(repo.create({ name, isMainRole: isMain }));
    return role;
}

async function upsertPermission(name: string, category: string, value: string, description?: string) {
    const repo = AppDataSource.getRepository(Permission);
    let perm = await repo.findOne({ where: { name } });
    if (!perm) {
        perm = await repo.save(repo.create({ name, category, value, description: description ?? null }));
    } else {
        // keep updates idempotent
        let changed = false;
        if (perm.category !== category) { perm.category = category; changed = true; }
        if (perm.value !== value) { perm.value = value; changed = true; }
        if ((perm.description ?? null) !== (description ?? null)) { perm.description = description ?? null; changed = true; }
        if (changed) perm = await repo.save(perm);
    }
    return perm;
}

async function linkRolePermission(role: Role, perm: Permission) {
    const repo = AppDataSource.getRepository(RolePermission);
    const exists = await repo.findOne({ where: { roleId: role.id, permissionId: perm.id } });
    if (!exists) await repo.save(repo.create({ roleId: role.id, permissionId: perm.id }));
}

// Subroles + subrole permissions
async function upsertSubRoleCfg(
    title: string,
    companyJobTitle: string,
    companyJobRole: string,
    color?: string | null,
    description?: string | null
) {
    const repo = AppDataSource.getRepository(SubRoleCfg);
    let sr = await repo.findOne({ where: { title } });
    if (!sr) {
        sr = repo.create({ title, companyJobTitle, companyJobRole, color: color ?? null, description: description ?? null });
        sr = await repo.save(sr);
    }
    return sr;
}

async function upsertSubRolePermission(name: string, category: string, value: string, description?: string | null) {
    const repo = AppDataSource.getRepository(SubRolePermission);
    let perm = await repo.findOne({ where: { name } });
    if (!perm) {
        perm = repo.create({ name, category, value, description: description ?? null });
        perm = await repo.save(perm);
    } else {
        let changed = false;
        if (perm.category !== category) { perm.category = category; changed = true; }
        if (perm.value !== value) { perm.value = value; changed = true; }
        if ((perm.description ?? null) !== (description ?? null)) { perm.description = description ?? null; changed = true; }
        if (changed) perm = await repo.save(perm);
    }
    return perm;
}

async function linkSubRoleCfgPermission(subRoleCfgId: string, subRolePermissionId: string) {
    const repo = AppDataSource.getRepository(SubRolePermissionPermission);
    const exists = await repo.findOne({ where: { subRoleCfgId, subRolePermissionId } });
    if (!exists) await repo.save(repo.create({ subRoleCfgId, subRolePermissionId }));
}

async function assignSubRoleToUser(userId: string, subRoleCfgId: string) {
    const repo = AppDataSource.getRepository(UserSubRole);
    const exists = await repo.findOne({ where: { userId, subRoleCfgId } });
    if (!exists) await repo.save(repo.create({ userId, subRoleCfgId }));
}

// Users
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

// Tasks linking
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

async function assignUserToProject(userId: string, projectId: string) {
    const repo = AppDataSource.getRepository(ProjectAssignedUser);
    const exists = await repo.findOne({ where: { userId, projectId } });
    if (!exists) await repo.save(repo.create({ userId, projectId }));
}

async function assignResponsibleUserToProject(userId: string, projectId: string) {
    const repo = AppDataSource.getRepository(ProjectResponsibleUser);
    const exists = await repo.findOne({ where: { userId, projectId } });
    if (!exists) await repo.save(repo.create({ userId, projectId }));
}

async function assignTaskToProject(taskId: string, projectId: string) {
    const repo = AppDataSource.getRepository(ProjectTask);
    const exists = await repo.findOne({ where: { taskId, projectId } });
    if (!exists) await repo.save(repo.create({ taskId, projectId }));
}

async function logProjectActivity(userId: string, projectId: string, action: string, message?: string) {
    try {
        const repo = AppDataSource.getRepository(ProjectLog);
        await repo.save(repo.create({ userId, projectId, action, message: message ?? null }));
    } catch {
        // best-effort: ignore errors during seeding
    }
}

async function logTaskActivity(userId: string, taskId: string, action: string, message?: string) {
    try {
        const repo = AppDataSource.getRepository(TaskLog);
        await repo.save(repo.create({ userId, taskId, action, message: message ?? null }));
    } catch {
        // best-effort
    }
}

export async function seedInitialData() {
    // Main roles
    const ownerRole = await upsertRole('owner', true);
    const adminRole = await upsertRole('admin', true);
    const controllerRole = await upsertRole('controller', true);
    const userRole = await upsertRole('user', true);

    // Main-level permissions (governance/admin/safety)
    const mainPermSpecs = [
        { name: 'admin.access',              category: 'admin',     value: '[admin.access.allow]',                 description: 'Access admin area' },
        { name: 'user.manage',               category: 'admin',     value: '[user.manage.allow]',                  description: 'Manage users (non-admin governance)' },
        { name: 'settings.view',             category: 'settings',  value: '[settings.view.allow]',                description: 'View system settings' },
        { name: 'settings.edit',             category: 'settings',  value: '[settings.edit.allow]',                description: 'Edit system settings' },
        { name: 'logs.export',               category: 'logs',      value: '[logs.export.allow]',                  description: 'Export system logs' },
        { name: 'user.subrole.assign',       category: 'user',      value: '[user.subrole.assign.allow]',          description: 'Assign subroles to users' },
        { name: 'user.role.admin.assign',    category: 'user',      value: '[user.role.admin.assign.allow]',       description: 'Assign admin main role to users' },
        { name: 'user.create.admin',         category: 'user',      value: '[user.create.admin.allow]',            description: 'Create users with admin main role' },
        { name: 'subrole.administrator.assign',   category: 'subrole',   value: '[subrole.administrator.assign.allow]', description: 'Assign Administrator subrole' },
        { name: 'subrole.project_manager.assign', category: 'subrole',   value: '[subrole.project_manager.assign.allow]', description: 'Assign Project Manager subrole' },
        { name: 'controller.readonly',       category: 'controller',value: '[controller.readonly.enforce]',        description: 'Enforce read-only mode' }
    ];
    const mainPerms: Record<string, Permission> = {};
    for (const p of mainPermSpecs) {
        mainPerms[p.name] = await upsertPermission(p.name, p.category, p.value, p.description);
    }

    // Link main-level permissions to main roles
    // Owner:
    for (const perm of Object.values(mainPerms)) await linkRolePermission(ownerRole, perm);

    // Admin: almost all but no owner-level governance
    const adminAllowed = [
        'admin.access',
        'user.manage',
        'settings.view',
        'settings.edit',
        'logs.export',
        'user.subrole.assign',
        'subrole.administrator.assign',
        'subrole.project_manager.assign'
    ];
    for (const name of adminAllowed) await linkRolePermission(adminRole, mainPerms[name]);

    // Controller: only readonly flag (no admin access)
    await linkRolePermission(controllerRole, mainPerms['controller.readonly']);

    // User: no main-level permissions linked by default

    // Basic settings
    await upsertSystemSetting('app.title', 'Godot Development', { category: 'ui', isPublic: true });
    await upsertSystemSetting('auth.password.hash', 'argon2id', { category: 'auth' });

    // Users
    const rawOwnerPwd = process.env.ADMIN_PASSWORD ?? 'admin123';
    const ownerPwdHash = process.env.ADMIN_PASSWORD_HASH ?? (await argon2hash(rawOwnerPwd, { memoryCost: 19456, timeCost: 2, hashLength: 32, parallelism: 1 }));
    const userPwdHash = await argon2hash('user123', { memoryCost: 19456, timeCost: 2, hashLength: 32, parallelism: 1 });

    const ownerUser = await upsertUser((process.env.ADMIN_EMAIL ?? 'owner@example.com').toLowerCase(), process.env.ADMIN_USERNAME ?? 'owner', ownerPwdHash, ownerRole, 'System', 'Owner');
    const adminUser = await upsertUser('admin.jane@example.com', 'adminjane', ownerPwdHash, adminRole, 'Jane', 'Admin');
    const controllerUser = await upsertUser('c.audit@example.com', 'caudit', userPwdHash, controllerRole, 'Casey', 'Audit');

    const user1 = await upsertUser('michael.chen@example.com', 'mchen', userPwdHash, userRole, 'Michael', 'Chen');
    const user2 = await upsertUser('emma.thompson@example.com', 'ethompson', userPwdHash, userRole, 'Emma', 'Thompson');

    // Additional users
    const stakeholderUser = await upsertUser('paul.stakeholder@example.com', 'pstakeholder', userPwdHash, userRole, 'Paul', 'Stakeholder');
    const contractorUser = await upsertUser('jack.contractor@example.com', 'jcontractor', userPwdHash, userRole, 'Jack', 'Contractor');
    const thirdPartyUser = await upsertUser('lina.vendor@example.com', 'lvendor', userPwdHash, userRole, 'Lina', 'Vendor');
    const customerContributorUser = await upsertUser('chloe.customer@example.com', 'ccustomer', userPwdHash, userRole, 'Chloe', 'Customer');
    const customerReviewerUser = await upsertUser('ryan.customer.reviewer@example.com', 'rcreviewer', userPwdHash, userRole, 'Ryan', 'CustReviewer');
    const customerRedactorUser = await upsertUser('mia.customer.redactor@example.com', 'mcredactor', userPwdHash, userRole, 'Mia', 'CustRedactor');

    // Lookups
    const priorities: Priority[] = [];
    for (const p of [
        { name: 'Low', rank: 10, color: '#4dabf7' },
        { name: 'Medium', rank: 20, color: '#fab005' },
        { name: 'High', rank: 30, color: '#fa5252' },
        { name: 'Urgent', rank: 40, color: '#d6336c' }
    ]) priorities.push(await upsertPriority(p.name, p.rank, p.color));

    const projectStatuses: ProjectStatus[] = [];
    for (const s of [
        { name: 'Active', rank: 20, color: '#2b8a3e' },
        { name: 'Paused', rank: 10, color: '#868e96' },
        { name: 'Completed', rank: 5, color: '#37b24d' },
        { name: 'Archived', rank: 0, color: '#495057' }
    ]) projectStatuses.push(await upsertProjectStatus(s.name, s.rank, s.color));

    const riskLevels: RiskLevel[] = [];
    for (const r of [
        { name: 'Low', rank: 10, color: '#40c057' },
        { name: 'Medium', rank: 20, color: '#fab005' },
        { name: 'High', rank: 30, color: '#fa5252' },
        { name: 'Critical', rank: 40, color: '#d6336c' }
    ]) riskLevels.push(await upsertRiskLevel(r.name, r.rank, r.color));

    const taskStatuses: TaskStatus[] = [];
    for (const t of [
        { name: 'Not Started', rank: 0, color: '#868e96' },
        { name: 'In Progress', rank: 10, color: '#228be6' },
        { name: 'Blocked', rank: 20, color: '#e03131' },
        { name: 'On Hold', rank: 25, color: '#fab005' },
        { name: 'Done', rank: 30, color: '#2b8a3e' }
    ]) taskStatuses.push(await upsertTaskStatus(t.name, t.rank, t.color));

    const taskTypes: TaskType[] = [];
    for (const tt of [
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
    ]) taskTypes.push(await upsertTaskType(tt.name, tt.rank));

    // Projects
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
    const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

    const godotProject = await upsertProject('Godot Development', ownerUser, {
        description: 'Core development of the Godot game engine, including new features, bug fixes, and performance improvements for the 4.x release cycle.',
        projectStatus: projectStatuses[0],
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
        mainResponsible: ownerUser
    });
    await logProjectActivity(ownerUser.id, godotProject.id, 'project.seed.create', `title="${godotProject.title}"`);
    await logProjectActivity(adminUser.id, godotProject.id, 'project.mainResponsible.set', `userId=${ownerUser.id}`);


    const internalToolsProject = await upsertProject('Internal Tools', adminUser, {
        description: 'Development and maintenance of internal productivity tools, including project management dashboards, automation scripts, and team collaboration features.',
        projectStatus: projectStatuses[0],
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
        mainResponsible: adminUser
    });
    await logProjectActivity(adminUser.id, internalToolsProject.id, 'project.seed.create', `title="${internalToolsProject.title}"`);
    await logProjectActivity(adminUser.id, internalToolsProject.id, 'project.mainResponsible.set', `userId=${adminUser.id}`);


    const marketingProject = await upsertProject('Marketing Website', adminUser, {
        description: 'Complete redesign and modernization of the company marketing website.',
        projectStatus: projectStatuses[2],
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
        mainResponsible: user1
    });
    await logProjectActivity(adminUser.id, marketingProject.id, 'project.seed.create', `title="${marketingProject.title}"`);
    await logProjectActivity(adminUser.id, marketingProject.id, 'project.mainResponsible.set', `userId=${user1.id}`);


    const mobileAppProject = await upsertProject('Mobile App', adminUser, {
        description: 'Cross-platform mobile application for iOS and Android.',
        projectStatus: projectStatuses[0],
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
        mainResponsible: adminUser
    });
    await logProjectActivity(adminUser.id, mobileAppProject.id, 'project.seed.create', `title="${mobileAppProject.title}"`);
    await logProjectActivity(adminUser.id, mobileAppProject.id, 'project.mainResponsible.set', `userId=${adminUser.id}`);

    // Sample tasks
    for (const td of [
        {
            title: 'Implement new rendering pipeline',
            description: 'Develop and integrate a new rendering pipeline for Godot 4.x to improve performance.',
            taskStatus: taskStatuses.find((ts) => ts.name === 'In Progress')!,
            priority: priorities.find((p) => p.name === 'High')!,
            taskType: taskTypes.find((tt) => tt.name === 'Feature')!,
            user: ownerUser,
            actualHours: 120,
            dueDate: daysFromNow(30),
            plannedStartDate: daysAgo(10),
            isDone: false, isActive: true, isMeta: false
        },
        {
            title: 'Fix physics engine bugs',
            description: 'Address reported issues in the physics engine for the 4.x release.',
            taskStatus: taskStatuses.find((ts) => ts.name === 'Blocked')!,
            priority: priorities.find((p) => p.name === 'Urgent')!,
            taskType: taskTypes.find((tt) => tt.name === 'Bug')!,
            user: user1,
            actualHours: 50,
            dueDate: daysFromNow(15),
            plannedStartDate: daysAgo(20),
            isDone: false, isActive: true, isMeta: false
        }
    ]) {
        const t = await upsertTask(td.title, ownerUser, td);
        await logTaskActivity(td.user?.id ?? ownerUser.id, t.id, 'task.seed.create', `title="${t.title}"`);
        await assignTaskToProject(t.id, godotProject.id);
        await logProjectActivity(td.user?.id ?? ownerUser.id, godotProject.id, 'project.task.add', `taskId=${t.id}`);
    }

    for (const td of [
        {
            title: 'Develop project dashboard',
            description: 'Create a dashboard for project overview and metrics tracking.',
            taskStatus: taskStatuses.find((ts) => ts.name === 'Not Started')!,
            priority: priorities.find((p) => p.name === 'Medium')!,
            taskType: taskTypes.find((tt) => tt.name === 'Frontend')!,
            user: adminUser,
            actualHours: null,
            dueDate: daysFromNow(60),
            plannedStartDate: daysFromNow(5),
            isDone: false, isActive: true, isMeta: false
        }
    ]) {
        const t = await upsertTask(td.title, adminUser, td);
        await logTaskActivity(td.user?.id ?? adminUser.id, t.id, 'task.seed.create', `title="${t.title}"`);
        await assignTaskToProject(t.id, internalToolsProject.id);
        await logProjectActivity(td.user?.id ?? adminUser.id, internalToolsProject.id, 'project.task.add', `taskId=${t.id}`);
    }

    for (const td of [
        {
            title: 'Design homepage layout',
            description: 'Responsive homepage design with modern UI/UX.',
            taskStatus: taskStatuses.find((ts) => ts.name === 'Done')!,
            priority: priorities.find((p) => p.name === 'High')!,
            taskType: taskTypes.find((tt) => tt.name === 'Design')!,
            user: user2,
            actualHours: 80,
            dueDate: daysAgo(35),
            plannedStartDate: daysAgo(60),
            startDate: daysAgo(60),
            doneDate: daysAgo(35),
            isDone: true, isActive: false, isMeta: false
        }
    ]) {
        const t = await upsertTask(td.title, user2, td);
        await logTaskActivity(td.user?.id ?? user2.id, t.id, 'task.seed.create', `title="${t.title}"`);
        await assignTaskToProject(t.id, marketingProject.id);
        await logProjectActivity(td.user?.id ?? user2.id, marketingProject.id, 'project.task.add', `taskId=${t.id}`);
    }

    for (const td of [
        {
            title: 'Implement push notifications',
            description: 'Add push notification support for iOS and Android.',
            taskStatus: taskStatuses.find((ts) => ts.name === 'In Progress')!,
            priority: priorities.find((p) => p.name === 'High')!,
            taskType: taskTypes.find((tt) => tt.name === 'Feature')!,
            user: user2,
            actualHours: 100,
            dueDate: daysFromNow(45),
            plannedStartDate: daysAgo(30),
            isDone: false, isActive: true, isMeta: false
        },
        {
            title: 'Optimize offline mode',
            description: 'Improve data synchronization for offline mode functionality.',
            taskStatus: taskStatuses.find((ts) => ts.name === 'Not Started')!,
            priority: priorities.find((p) => p.name === 'Medium')!,
            taskType: taskTypes.find((tt) => tt.name === 'Feature')!,
            user: user1,
            actualHours: null,
            dueDate: daysFromNow(90),
            plannedStartDate: daysFromNow(10),
            isDone: false, isActive: true, isMeta: false
        }
    ]) {
        const t = await upsertTask(td.title, adminUser, td);
        await logTaskActivity(td.user?.id ?? adminUser.id, t.id, 'task.seed.create', `title="${t.title}"`);
        await assignTaskToProject(t.id, mobileAppProject.id);
        await logProjectActivity(td.user?.id ?? adminUser.id, mobileAppProject.id, 'project.task.add', `taskId=${t.id}`);
    }

    // Project user assignments
    await assignUserToProject(ownerUser.id, godotProject.id);
    await logProjectActivity(adminUser.id, godotProject.id, 'project.assigned.add', `userId=${ownerUser.id}`);
    await assignUserToProject(adminUser.id, godotProject.id);
    await logProjectActivity(adminUser.id, godotProject.id, 'project.assigned.add', `userId=${adminUser.id}`);
    await assignUserToProject(user1.id, godotProject.id);
    await logProjectActivity(adminUser.id, godotProject.id, 'project.assigned.add', `userId=${user1.id}`);
    await assignUserToProject(user2.id, godotProject.id);
    await logProjectActivity(adminUser.id, godotProject.id, 'project.assigned.add', `userId=${user2.id}`);
    await assignResponsibleUserToProject(ownerUser.id, godotProject.id);
    await logProjectActivity(adminUser.id, godotProject.id, 'project.responsible.add', `userId=${ownerUser.id}`);
    await assignResponsibleUserToProject(adminUser.id, godotProject.id);
    await logProjectActivity(adminUser.id, godotProject.id, 'project.responsible.add', `userId=${adminUser.id}`);

    await assignUserToProject(adminUser.id, internalToolsProject.id);
    await logProjectActivity(adminUser.id, internalToolsProject.id, 'project.assigned.add', `userId=${adminUser.id}`);
    await assignUserToProject(user1.id, internalToolsProject.id);
    await logProjectActivity(adminUser.id, internalToolsProject.id, 'project.assigned.add', `userId=${user1.id}`);
    await assignResponsibleUserToProject(adminUser.id, internalToolsProject.id);
    await logProjectActivity(adminUser.id, internalToolsProject.id, 'project.responsible.add', `userId=${adminUser.id}`);

    await assignUserToProject(user1.id, marketingProject.id);
    await logProjectActivity(adminUser.id, marketingProject.id, 'project.assigned.add', `userId=${user1.id}`);
    await assignUserToProject(user2.id, marketingProject.id);
    await logProjectActivity(adminUser.id, marketingProject.id, 'project.assigned.add', `userId=${user2.id}`);
    await assignResponsibleUserToProject(user1.id, marketingProject.id);
    await logProjectActivity(adminUser.id, marketingProject.id, 'project.responsible.add', `userId=${user1.id}`);

    await assignUserToProject(ownerUser.id, mobileAppProject.id);
    await logProjectActivity(adminUser.id, mobileAppProject.id, 'project.assigned.add', `userId=${ownerUser.id}`);
    await assignUserToProject(adminUser.id, mobileAppProject.id);
    await logProjectActivity(adminUser.id, mobileAppProject.id, 'project.assigned.add', `userId=${adminUser.id}`);
    await assignUserToProject(user1.id, mobileAppProject.id);
    await logProjectActivity(adminUser.id, mobileAppProject.id, 'project.assigned.add', `userId=${user1.id}`);
    await assignUserToProject(user2.id, mobileAppProject.id);
    await logProjectActivity(adminUser.id, mobileAppProject.id, 'project.assigned.add', `userId=${user2.id}`);
    await assignResponsibleUserToProject(adminUser.id, mobileAppProject.id);
    await logProjectActivity(adminUser.id, mobileAppProject.id, 'project.responsible.add', `userId=${adminUser.id}`);
    await assignResponsibleUserToProject(user2.id, mobileAppProject.id);
    await logProjectActivity(adminUser.id, mobileAppProject.id, 'project.responsible.add', `userId=${user2.id}`);

    // SubRoles
    const subRoleSeeds = [
        // Operational (internal)
        { title: 'Project Manager', companyJobTitle: 'Manager', companyJobRole: 'Project Manager', color: '#845EF7', description: 'Leads projects and coordinates the team' },
        { title: 'Engineer', companyJobTitle: 'Engineer', companyJobRole: 'Backend Developer', color: '#228BE6', description: 'Builds and maintains backend services' },
        { title: 'Frontend Engineer', companyJobTitle: 'Engineer', companyJobRole: 'Frontend Developer', color: '#15AABF', description: 'Implements UI and interactions' },
        { title: 'QA Specialist', companyJobTitle: 'Quality Assurance', companyJobRole: 'QA', color: '#FAB005', description: 'Tests and verifies quality' },
        { title: 'Designer', companyJobTitle: 'Designer', companyJobRole: 'Product Designer', color: '#E64980', description: 'Designs product experiences' },
        { title: 'DevOps', companyJobTitle: 'Engineer', companyJobRole: 'DevOps', color: '#40C057', description: 'Manages CI/CD and infrastructure' },

        // Oversight
        { title: 'Reviewer', companyJobTitle: 'Analyst', companyJobRole: 'Reviewer', color: '#2F9E44', description: 'Reviews content and outcomes' },
        { title: 'Stakeholder', companyJobTitle: 'Stakeholder', companyJobRole: 'Stakeholder', color: '#1098AD', description: 'Has visibility on progress and status' },

        // External/customer variants
        { title: 'Contributor Customer', companyJobTitle: 'Customer', companyJobRole: 'Contributor', color: '#96F2D7', description: 'Customer providing contributions' },
        { title: 'Contributor 3rd-party', companyJobTitle: 'External', companyJobRole: 'Contributor', color: '#66D9E8', description: 'External 3rd party contributor' },
        { title: 'Contributor Contractor', companyJobTitle: 'Contractor', companyJobRole: 'Contributor', color: '#FFD43B', description: 'Contractor performing work' },
        { title: 'Customer Reviewer', companyJobTitle: 'Customer', companyJobRole: 'Reviewer', color: '#FFD8A8', description: 'Customer reviewing outputs' },
        { title: 'Customer Redactor', companyJobTitle: 'Customer', companyJobRole: 'Redactor', color: '#FFC9C9', description: 'Customer editing content/documents' },
        { title: 'Customer Contributor', companyJobTitle: 'Customer', companyJobRole: 'Contributor', color: '#A9E34B', description: 'Customer contributing content' },

        // Administrative subrole (optional; governance is at main-level now)
        { title: 'Administrator', companyJobTitle: 'Administrator', companyJobRole: 'Administrator', color: '#1C7ED6', description: 'Platform administrator (paired with admin main role)' }
    ];
    const subRoles: Record<string, SubRoleCfg> = {};
    for (const s of subRoleSeeds) {
        subRoles[s.title] = await upsertSubRoleCfg(s.title, s.companyJobTitle, s.companyJobRole, s.color, s.description);
    }

    // SubRolePermissions (operational only; governance moved to main-level)
    const subRolePermSeeds = [
        // Project
        { name: 'project_view',          category: 'project',   value: '[project.view.allow]',                description: 'View projects' },
        { name: 'project_create',        category: 'project',   value: '[project.create.allow]',              description: 'Create new projects' },
        { name: 'project_edit',          category: 'project',   value: '[project.edit.allow]',                description: 'Edit project details' },
        { name: 'project_delete',        category: 'project',   value: '[project.delete.allow]',              description: 'Delete projects' },
        { name: 'project_status_change', category: 'project',   value: '[project.status.change.allow]',       description: 'Change project status' },

        // Task
        { name: 'task_view',                  category: 'task',      value: '[task.view.allow]',                      description: 'View tasks' },
        { name: 'task_create',                category: 'task',      value: '[task.create.allow]',                    description: 'Create tasks' },
        { name: 'task_edit',                  category: 'task',      value: '[task.edit.allow]',                      description: 'Edit tasks' },
        { name: 'task_assign',                category: 'task',      value: '[task.assign.allow]',                    description: 'Assign tasks to users' },
        { name: 'task_status_change',         category: 'task',      value: '[task.status.change.allow]',             description: 'Change task status' },
        { name: 'task_delete',                category: 'task',      value: '[task.delete.allow]',                    description: 'Delete tasks' },
        { name: 'task_project_assign',        category: 'task',      value: '[task.project.assign.allow]',            description: 'Assign tasks to projects' },
        { name: 'task_create_without_project',category: 'task',      value: '[task.create.without_project.allow]',    description: 'Create tasks without a project' },

        // Mail
        { name: 'mail_send',                  category: 'mail',      value: '[mail.send.allow]',                      description: 'Send mails' },
        { name: 'mail_review',                category: 'mail',      value: '[mail.review.allow]',                    description: 'Review incoming mails' },

        // Documents
        { name: 'document_access',            category: 'document',  value: '[document.access.allow]',                description: 'Access documents' },
        { name: 'document_create',            category: 'document',  value: '[document.create.allow]',                description: 'Create documents' },
        { name: 'document_download',          category: 'document',  value: '[document.download.allow]',              description: 'Download documents' },

        // Impediments
        { name: 'impediment_access',          category: 'impediment',value: '[impediment.access.allow]',              description: 'Access impediments' },
        { name: 'impediment_create',          category: 'impediment',value: '[impediment.create.allow]',              description: 'Create impediments' },
        { name: 'impediment_review',          category: 'impediment',value: '[impediment.review.allow]',              description: 'Review impediments' },
        { name: 'impediment_edit',            category: 'impediment',value: '[impediment.edit.allow]',                description: 'Edit impediments' },

        // Reporting & statistics
        { name: 'stats_view',                 category: 'stats',     value: '[stats.view.allow]',                     description: 'View statistics' },
        { name: 'stats_export',               category: 'stats',     value: '[stats.export.allow]',                   description: 'Export statistics' },
        { name: 'notes_export',               category: 'notes',     value: '[notes.export.allow]',                   description: 'Export notes' },
        { name: 'tasks_group_export_with_notes', category: 'tasks',  value: '[tasks.group.export_with_notes.allow]',  description: 'Export a group of tasks with notes' },

        // Risk/reports (kept operational)
        { name: 'risk_view',                  category: 'risk',      value: '[risk.view.allow]',                      description: 'View risk levels' },
        { name: 'risk_edit',                  category: 'risk',      value: '[risk.edit.allow]',                      description: 'Edit risk levels' },
        { name: 'report_view',                category: 'report',    value: '[report.view.allow]',                    description: 'View reports and analytics' }
    ];
    const subRolePerms: Record<string, SubRolePermission> = {};
    for (const p of subRolePermSeeds) {
        subRolePerms[p.name] = await upsertSubRolePermission(p.name, p.category, p.value, p.description);
    }

    async function assignPermsByName(subRoleTitle: string, names: string[]) {
        const sr = subRoles[subRoleTitle];
        if (!sr) return;
        for (const nm of names) {
            const perm = subRolePerms[nm];
            if (perm) await linkSubRoleCfgPermission(sr.id, perm.id);
        }
    }

    // Subrole permission assignments
    await assignPermsByName('Project Manager', [
        'project_view', 'project_create', 'project_edit', 'project_delete', 'project_status_change',
        'task_view', 'task_create', 'task_edit', 'task_assign', 'task_status_change', 'task_delete',
        'task_project_assign', 'task_create_without_project',
        'mail_send', 'mail_review',
        'document_access', 'document_create', 'document_download',
        'impediment_access', 'impediment_create', 'impediment_edit', 'impediment_review',
        'risk_view',
        'report_view',
        'stats_view', 'stats_export',
        'notes_export', 'tasks_group_export_with_notes'
    ]);

    await assignPermsByName('Engineer', [
        'project_view',
        'task_view', 'task_create', 'task_edit', 'task_status_change', 'task_assign', 'task_project_assign',
        'document_access', 'document_download',
        'impediment_access', 'impediment_create'
    ]);

    await assignPermsByName('Frontend Engineer', [
        'project_view',
        'task_view', 'task_create', 'task_edit', 'task_status_change', 'task_project_assign',
        'document_access', 'document_download'
    ]);

    await assignPermsByName('QA Specialist', [
        'project_view',
        'task_view', 'task_status_change',
        'impediment_access', 'impediment_review',
        'report_view', 'stats_view', 'notes_export'
    ]);

    await assignPermsByName('Designer', [
        'project_view',
        'task_view', 'task_create', 'task_edit',
        'document_access', 'document_create', 'document_download'
    ]);

    await assignPermsByName('DevOps', [
        'project_view',
        'task_view', 'task_assign', 'task_project_assign',
        'document_access', 'document_download',
        'report_view', 'stats_view'
    ]);

    await assignPermsByName('Reviewer', [
        'project_view', 'task_view',
        'mail_review',
        'document_access', 'document_download',
        'impediment_access', 'impediment_review',
        'report_view', 'stats_view', 'notes_export'
    ]);

    await assignPermsByName('Stakeholder', [
        'project_view', 'task_view',
        'document_access', 'document_download',
        'impediment_access',
        'report_view', 'stats_view'
    ]);

    await assignPermsByName('Contributor Contractor', [
        'project_view',
        'task_view', 'task_create', 'task_edit',
        'document_access', 'document_create', 'document_download',
        'impediment_access', 'impediment_create'
    ]);

    await assignPermsByName('Contributor 3rd-party', [
        'project_view', 'task_view',
        'document_access', 'document_download'
    ]);

    await assignPermsByName('Contributor Customer', [
        'project_view', 'task_view',
        'document_access', 'document_create', 'document_download'
    ]);

    await assignPermsByName('Customer Reviewer', [
        'project_view', 'task_view',
        'document_access', 'document_download',
        'mail_review',
        'impediment_access', 'impediment_review',
        'stats_view'
    ]);

    await assignPermsByName('Customer Redactor', [
        'project_view', 'task_view',
        'document_access', 'document_create', 'document_download'
    ]);

    await assignPermsByName('Customer Contributor', [
        'project_view', 'task_view',
        'document_access', 'document_create', 'document_download'
    ]);

    // Assign subroles to users
    await assignSubRoleToUser(ownerUser.id, subRoles['Project Manager'].id); // optional
    await assignSubRoleToUser(adminUser.id, subRoles['Administrator'].id);
    await assignSubRoleToUser(adminUser.id, subRoles['Project Manager'].id);

    await assignSubRoleToUser(user1.id, subRoles['Engineer'].id);
    await assignSubRoleToUser(user1.id, subRoles['Contributor Contractor'].id);

    await assignSubRoleToUser(user2.id, subRoles['Frontend Engineer'].id);
    await assignSubRoleToUser(user2.id, subRoles['Designer'].id);
    await assignSubRoleToUser(user2.id, subRoles['Reviewer'].id);

    await assignSubRoleToUser(stakeholderUser.id, subRoles['Stakeholder'].id);
    await assignSubRoleToUser(contractorUser.id, subRoles['Contributor Contractor'].id);
    await assignSubRoleToUser(thirdPartyUser.id, subRoles['Contributor 3rd-party'].id);
    await assignSubRoleToUser(customerContributorUser.id, subRoles['Customer Contributor'].id);
    await assignSubRoleToUser(customerReviewerUser.id, subRoles['Customer Reviewer'].id);
    await assignSubRoleToUser(customerRedactorUser.id, subRoles['Customer Redactor'].id);

    console.log('Seeded main roles, main permissions, role-permissions, users, projects, tasks, subroles, subrole-permissions, and assignments');
}

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