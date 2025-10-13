import { AppDataSource } from '../config/datasource';
import { Role } from '../entities/user/Role';
import { Permission } from '../entities/user/Permission';
import { User } from '../entities/user/User';
import { RolePermission } from '../entities/user/RolePermission';
import { SubRoleCfg } from '../entities/user/SubRoleCfg';
import { SubRolePermission } from '../entities/user/SubRolePermission';
import { SubRolePermissionPermission } from '../entities/user/SubRolePermissionPermission';
import { SystemSetting } from '../entities/config/SystemSetting';
import { Priority } from '../entities/status/Priority';
import { ProjectStatus } from '../entities/status/ProjectStatus';
import { TaskStatus } from '../entities/status/TaskStatus';
import { TaskType } from '../entities/status/TaskType';
import { RiskLevel } from '../entities/status/RiskLevel';
import { Project } from '../entities/project/Project';
import { Task } from '../entities/task/Task';
import { ProjectTask } from '../entities/project/ProjectTask';
import { hash as argon2hash } from '@node-rs/argon2';
import { generateIdenteapot } from '@teapotlabs/identeapots';
import { JSDOM } from 'jsdom';
import { createCanvas, Image as CanvasImage } from 'canvas';

// Setup minimal DOM/canvas for identeapots
function ensureDomForIdenteapots() {
    if (typeof (globalThis as any).document !== 'undefined') return;
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    (globalThis as any).window = dom.window as any;
    (globalThis as any).document = dom.window.document as any;
    (globalThis as any).Image = CanvasImage as any;
    const realCreateElement = dom.window.document.createElement.bind(dom.window.document);
    (dom.window.document as any).createElement = function (tagName: any, options?: any) {
        if (String(tagName).toLowerCase() === 'canvas') return createCanvas(256, 256) as any;
        return realCreateElement(tagName, options);
    };
}
ensureDomForIdenteapots();

// Helper functions
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
    }
    return perm;
}

async function linkRolePermission(role: Role, perm: Permission) {
    const repo = AppDataSource.getRepository(RolePermission);
    const exists = await repo.findOne({ where: { roleId: role.id, permissionId: perm.id } });
    if (!exists) await repo.save(repo.create({ roleId: role.id, permissionId: perm.id }));
}

async function upsertSubRoleCfg(title: string, companyJobTitle: string, companyJobRole: string, color?: string | null, description?: string | null) {
    const repo = AppDataSource.getRepository(SubRoleCfg);
    let sr = await repo.findOne({ where: { title } });
    if (!sr) sr = await repo.save(repo.create({ title, companyJobTitle, companyJobRole, color: color ?? null, description: description ?? null }));
    return sr;
}

async function upsertSubRolePermission(name: string, category: string, value: string, description?: string | null) {
    const repo = AppDataSource.getRepository(SubRolePermission);
    let perm = await repo.findOne({ where: { name } });
    if (!perm) perm = await repo.save(repo.create({ name, category, value, description: description ?? null }));
    return perm;
}

async function linkSubRoleCfgPermission(subRoleCfgId: string, subRolePermissionId: string) {
    const repo = AppDataSource.getRepository(SubRolePermissionPermission);
    const exists = await repo.findOne({ where: { subRoleCfgId, subRolePermissionId } });
    if (!exists) await repo.save(repo.create({ subRoleCfgId, subRolePermissionId }));
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

async function upsertPriority(name: string, rank?: number, color?: string) {
    const repo = AppDataSource.getRepository(Priority);
    let row = await repo.findOne({ where: { name } });
    if (!row) row = await repo.save(repo.create({ name, rank: rank ?? 0, color }));
    return row;
}

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

async function upsertTaskType(name: string, rank?: number, color?: string) {
    const repo = AppDataSource.getRepository(TaskType);
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

async function upsertUser(email: string, username: string, passwordHash: string, role: Role, forename?: string, surname?: string) {
    const userRepo = AppDataSource.getRepository(User);
    const emailNorm = email.trim().toLowerCase();
    let user = await userRepo.findOne({ where: [{ email: emailNorm }, { username }] });
    if (!user) {
        user = await userRepo.save(userRepo.create({
            email: emailNorm, username, password: passwordHash, isActive: true, role,
            forename: forename ?? null, surname: surname ?? null
        }));
    }
    if (user && !user.avatarData) {
        const avatarData = await generateIdenteapot(emailNorm, { size: 128 });
        user.avatarData = avatarData;
        await userRepo.save(user);
    }
    return user;
}

async function upsertProject(title: string, creator: User, options?: {
    description?: string; projectStatus?: ProjectStatus; priority?: Priority;
    riskLevel?: RiskLevel; isDone?: boolean; isActive?: boolean;
    estimatedBudget?: number; startDate?: Date; endDate?: Date;
}) {
    const projectRepo = AppDataSource.getRepository(Project);
    let project = await projectRepo.findOne({ where: { title } });
    if (!project) {
        project = projectRepo.create({
            title, description: options?.description ?? null,
            projectStatus: options?.projectStatus ?? null, priority: options?.priority ?? null,
            riskLevel: options?.riskLevel ?? null, isActive: options?.isActive ?? true,
            isDone: options?.isDone ?? false, creator,
            estimatedBudget: options?.estimatedBudget ?? null,
            startDate: options?.startDate ?? null, endDate: options?.endDate ?? null
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

async function upsertTask(title: string, creator: User, options: {
    description?: string; taskStatus: TaskStatus; priority?: Priority | null;
    taskType?: TaskType | null; user?: User | null; dueDate: Date;
    plannedStartDate: Date; isDone?: boolean; isActive?: boolean;
}) {
    const taskRepo = AppDataSource.getRepository(Task);
    let task = await taskRepo.findOne({ where: { title } });
    if (!task) {
        task = taskRepo.create({
            title, description: options.description ?? null, taskStatus: options.taskStatus,
            priority: options.priority ?? null, taskType: options.taskType ?? null,
            creator, user: options.user ?? null, dueDate: options.dueDate,
            plannedStartDate: options.plannedStartDate, startDate: new Date(),
            isDone: options.isDone ?? false, isActive: options.isActive ?? true,
            isMeta: false, hasSegmentGroupCircle: false
        });
        task = await taskRepo.save(task);
    }
    return task;
}

async function assignTaskToProject(taskId: string, projectId: string) {
    const repo = AppDataSource.getRepository(ProjectTask);
    const exists = await repo.findOne({ where: { taskId, projectId } });
    if (!exists) await repo.save(repo.create({ taskId, projectId }));
}

export async function seedInitialData() {
    // Main roles
    const ownerRole = await upsertRole('owner', true);
    const adminRole = await upsertRole('admin', true);
    const controllerRole = await upsertRole('controller', true);
    const userRole = await upsertRole('user', true);

    // Main-level permissions
    const mainPermSpecs = [
        { name: 'admin.access', category: 'admin', value: '[admin.access.allow]', description: 'Access admin area' },
        { name: 'user.manage', category: 'admin', value: '[user.manage.allow]', description: 'Manage users (non-admin governance)' },
        { name: 'settings.view', category: 'settings', value: '[settings.view.allow]', description: 'View system settings' },
        { name: 'settings.edit', category: 'settings', value: '[settings.edit.allow]', description: 'Edit system settings' },
        { name: 'logs.export', category: 'logs', value: '[logs.export.allow]', description: 'Export system logs' },
        { name: 'user.subrole.assign', category: 'user', value: '[user.subrole.assign.allow]', description: 'Assign subroles to users' },
        { name: 'user.role.admin.assign', category: 'user', value: '[user.role.admin.assign.allow]', description: 'Assign admin main role to users' },
        { name: 'user.create.admin', category: 'user', value: '[user.create.admin.allow]', description: 'Create users with admin main role' },
        { name: 'subrole.administrator.assign', category: 'subrole', value: '[subrole.administrator.assign.allow]', description: 'Assign Administrator subrole' },
        { name: 'subrole.project_manager.assign', category: 'subrole', value: '[subrole.project_manager.assign.allow]', description: 'Assign Project Manager subrole' },
        { name: 'controller.readonly', category: 'controller', value: '[controller.readonly.enforce]', description: 'Enforce read-only mode' }
    ];
    const mainPerms: Record<string, Permission> = {};
    for (const p of mainPermSpecs) {
        mainPerms[p.name] = await upsertPermission(p.name, p.category, p.value, p.description);
    }

    // Link main-level permissions to roles
    for (const perm of Object.values(mainPerms)) await linkRolePermission(ownerRole, perm);
    const adminAllowed = ['admin.access', 'user.manage', 'settings.view', 'settings.edit', 'logs.export', 'user.subrole.assign', 'subrole.administrator.assign', 'subrole.project_manager.assign'];
    for (const name of adminAllowed) await linkRolePermission(adminRole, mainPerms[name]);
    await linkRolePermission(controllerRole, mainPerms['controller.readonly']);

    // System settings
    await upsertSystemSetting('app.title', 'Godot Development', { category: 'ui', isPublic: true });
    await upsertSystemSetting('auth.password.hash', 'argon2id', { category: 'auth' });

    // Priorities
    await upsertPriority('Low', 10, '#4dabf7');
    await upsertPriority('Medium', 20, '#fab005');
    await upsertPriority('High', 30, '#fa5252');
    await upsertPriority('Urgent', 40, '#d6336c');

    // Project statuses
    await upsertProjectStatus('Active', 20, '#2b8a3e');
    await upsertProjectStatus('Paused', 10, '#868e96');
    await upsertProjectStatus('Completed', 5, '#37b24d');
    await upsertProjectStatus('Archived', 0, '#495057');

    // Risk levels
    await upsertRiskLevel('Low', 10, '#40c057');
    await upsertRiskLevel('Medium', 20, '#fab005');
    await upsertRiskLevel('High', 30, '#fa5252');
    await upsertRiskLevel('Critical', 40, '#d6336c');

    // Task statuses
    await upsertTaskStatus('Not Started', 0, '#868e96');
    await upsertTaskStatus('In Progress', 10, '#228be6');
    await upsertTaskStatus('Blocked', 20, '#e03131');
    await upsertTaskStatus('On Hold', 25, '#fab005');
    await upsertTaskStatus('Done', 30, '#2b8a3e');

    // Task types
    const taskTypeNames = ['Table of Contents', 'Executive Summary', 'Technical Approach', 'DevOps', 'Design', 'Capabilities', 'Focus Documents', 'Narrative', 'Cover Page', 'HR', 'Backend', 'Business', 'Agile', 'Feature', 'Chore', 'Bug', 'Frontend', 'Finance/DevOps'];
    for (let i = 0; i < taskTypeNames.length; i++) {
        await upsertTaskType(taskTypeNames[i], (i + 1) * 10);
    }

    // SubRoles
    const subRoleSeeds = [
        { title: 'Project Manager', companyJobTitle: 'Manager', companyJobRole: 'Project Manager', color: '#845EF7', description: 'Leads projects and coordinates the team' },
        { title: 'Engineer', companyJobTitle: 'Engineer', companyJobRole: 'Backend Developer', color: '#228BE6', description: 'Builds and maintains backend services' },
        { title: 'Frontend Engineer', companyJobTitle: 'Engineer', companyJobRole: 'Frontend Developer', color: '#15AABF', description: 'Implements UI and interactions' },
        { title: 'QA Specialist', companyJobTitle: 'Quality Assurance', companyJobRole: 'QA', color: '#FAB005', description: 'Tests and verifies quality' },
        { title: 'Designer', companyJobTitle: 'Designer', companyJobRole: 'Product Designer', color: '#E64980', description: 'Designs product experiences' },
        { title: 'DevOps', companyJobTitle: 'Engineer', companyJobRole: 'DevOps', color: '#40C057', description: 'Manages CI/CD and infrastructure' },
        { title: 'Reviewer', companyJobTitle: 'Analyst', companyJobRole: 'Reviewer', color: '#2F9E44', description: 'Reviews content and outcomes' },
        { title: 'Stakeholder', companyJobTitle: 'Stakeholder', companyJobRole: 'Stakeholder', color: '#1098AD', description: 'Has visibility on progress and status' },
        { title: 'Contributor Customer', companyJobTitle: 'Customer', companyJobRole: 'Contributor', color: '#96F2D7', description: 'Customer providing contributions' },
        { title: 'Contributor 3rd-party', companyJobTitle: 'External', companyJobRole: 'Contributor', color: '#66D9E8', description: 'External 3rd party contributor' },
        { title: 'Contributor Contractor', companyJobTitle: 'Contractor', companyJobRole: 'Contributor', color: '#FFD43B', description: 'Contractor performing work' },
        { title: 'Customer Reviewer', companyJobTitle: 'Customer', companyJobRole: 'Reviewer', color: '#FFD8A8', description: 'Customer reviewing outputs' },
        { title: 'Customer Redactor', companyJobTitle: 'Customer', companyJobRole: 'Redactor', color: '#FFC9C9', description: 'Customer editing content/documents' },
        { title: 'Customer Contributor', companyJobTitle: 'Customer', companyJobRole: 'Contributor', color: '#A9E34B', description: 'Customer contributing content' },
        { title: 'Administrator', companyJobTitle: 'Administrator', companyJobRole: 'Administrator', color: '#1C7ED6', description: 'Platform administrator (paired with admin main role)' }
    ];
    const subRoles: Record<string, SubRoleCfg> = {};
    for (const s of subRoleSeeds) {
        subRoles[s.title] = await upsertSubRoleCfg(s.title, s.companyJobTitle, s.companyJobRole, s.color, s.description);
    }

    // SubRolePermissions
    const subRolePermSeeds = [
        { name: 'project_view', category: 'project', value: '[project.view.allow]', description: 'View projects' },
        { name: 'project_create', category: 'project', value: '[project.create.allow]', description: 'Create new projects' },
        { name: 'project_edit', category: 'project', value: '[project.edit.allow]', description: 'Edit project details' },
        { name: 'project_delete', category: 'project', value: '[project.delete.allow]', description: 'Delete projects' },
        { name: 'project_status_change', category: 'project', value: '[project.status.change.allow]', description: 'Change project status' },
        { name: 'task_view', category: 'task', value: '[task.view.allow]', description: 'View tasks' },
        { name: 'task_create', category: 'task', value: '[task.create.allow]', description: 'Create tasks' },
        { name: 'task_edit', category: 'task', value: '[task.edit.allow]', description: 'Edit tasks' },
        { name: 'task_assign', category: 'task', value: '[task.assign.allow]', description: 'Assign tasks to users' },
        { name: 'task_status_change', category: 'task', value: '[task.status.change.allow]', description: 'Change task status' },
        { name: 'task_delete', category: 'task', value: '[task.delete.allow]', description: 'Delete tasks' },
        { name: 'task_project_assign', category: 'task', value: '[task.project.assign.allow]', description: 'Assign tasks to projects' },
        { name: 'task_create_without_project', category: 'task', value: '[task.create.without_project.allow]', description: 'Create tasks without a project' },
        { name: 'mail_send', category: 'mail', value: '[mail.send.allow]', description: 'Send mails' },
        { name: 'mail_review', category: 'mail', value: '[mail.review.allow]', description: 'Review incoming mails' },
        { name: 'document_access', category: 'document', value: '[document.access.allow]', description: 'Access documents' },
        { name: 'document_create', category: 'document', value: '[document.create.allow]', description: 'Create documents' },
        { name: 'document_download', category: 'document', value: '[document.download.allow]', description: 'Download documents' },
        { name: 'impediment_access', category: 'impediment', value: '[impediment.access.allow]', description: 'Access impediments' },
        { name: 'impediment_create', category: 'impediment', value: '[impediment.create.allow]', description: 'Create impediments' },
        { name: 'impediment_review', category: 'impediment', value: '[impediment.review.allow]', description: 'Review impediments' },
        { name: 'impediment_edit', category: 'impediment', value: '[impediment.edit.allow]', description: 'Edit impediments' },
        { name: 'stats_view', category: 'stats', value: '[stats.view.allow]', description: 'View statistics' },
        { name: 'stats_export', category: 'stats', value: '[stats.export.allow]', description: 'Export statistics' },
        { name: 'notes_export', category: 'notes', value: '[notes.export.allow]', description: 'Export notes' },
        { name: 'tasks_group_export_with_notes', category: 'tasks', value: '[tasks.group.export_with_notes.allow]', description: 'Export a group of tasks with notes' },
        { name: 'risk_view', category: 'risk', value: '[risk.view.allow]', description: 'View risk levels' },
        { name: 'risk_edit', category: 'risk', value: '[risk.edit.allow]', description: 'Edit risk levels' },
        { name: 'report_view', category: 'report', value: '[report.view.allow]', description: 'View reports and analytics' }
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

    // Assign permissions to subroles
    await assignPermsByName('Project Manager', ['project_view', 'project_create', 'project_edit', 'project_delete', 'project_status_change', 'task_view', 'task_create', 'task_edit', 'task_assign', 'task_status_change', 'task_delete', 'task_project_assign', 'task_create_without_project', 'mail_send', 'mail_review', 'document_access', 'document_create', 'document_download', 'impediment_access', 'impediment_create', 'impediment_edit', 'impediment_review', 'risk_view', 'report_view', 'stats_view', 'stats_export', 'notes_export', 'tasks_group_export_with_notes']);
    await assignPermsByName('Engineer', ['project_view', 'task_view', 'task_create', 'task_edit', 'task_status_change', 'task_assign', 'task_project_assign', 'document_access', 'document_download', 'impediment_access', 'impediment_create']);
    await assignPermsByName('Frontend Engineer', ['project_view', 'task_view', 'task_create', 'task_edit', 'task_status_change', 'task_project_assign', 'document_access', 'document_download']);
    await assignPermsByName('QA Specialist', ['project_view', 'task_view', 'task_status_change', 'impediment_access', 'impediment_review', 'report_view', 'stats_view', 'notes_export']);
    await assignPermsByName('Designer', ['project_view', 'task_view', 'task_create', 'task_edit', 'document_access', 'document_create', 'document_download']);
    await assignPermsByName('DevOps', ['project_view', 'task_view', 'task_assign', 'task_project_assign', 'document_access', 'document_download', 'report_view', 'stats_view']);
    await assignPermsByName('Reviewer', ['project_view', 'task_view', 'mail_review', 'document_access', 'document_download', 'impediment_access', 'impediment_review', 'report_view', 'stats_view', 'notes_export']);
    await assignPermsByName('Stakeholder', ['project_view', 'task_view', 'document_access', 'document_download', 'impediment_access', 'report_view', 'stats_view']);
    await assignPermsByName('Contributor Contractor', ['project_view', 'task_view', 'task_create', 'task_edit', 'document_access', 'document_create', 'document_download', 'impediment_access', 'impediment_create']);
    await assignPermsByName('Contributor 3rd-party', ['project_view', 'task_view', 'document_access', 'document_download']);
    await assignPermsByName('Contributor Customer', ['project_view', 'task_view', 'document_access', 'document_create', 'document_download']);
    await assignPermsByName('Customer Reviewer', ['project_view', 'task_view', 'document_access', 'document_download', 'mail_review', 'impediment_access', 'impediment_review', 'stats_view']);
    await assignPermsByName('Customer Redactor', ['project_view', 'task_view', 'document_access', 'document_create', 'document_download']);
    await assignPermsByName('Customer Contributor', ['project_view', 'task_view', 'document_access', 'document_create', 'document_download']);

    // Minimal users
    const rawOwnerPwd = process.env.ADMIN_PASSWORD ?? 'admin123';
    const ownerPwdHash = process.env.ADMIN_PASSWORD_HASH ?? (await argon2hash(rawOwnerPwd, { memoryCost: 19456, timeCost: 2, hashLength: 32, parallelism: 1 }));
    const userPwdHash = await argon2hash('user123', { memoryCost: 19456, timeCost: 2, hashLength: 32, parallelism: 1 });

    const ownerUser = await upsertUser((process.env.ADMIN_EMAIL ?? 'owner@example.com').toLowerCase(), process.env.ADMIN_USERNAME ?? 'owner', ownerPwdHash, ownerRole, 'System', 'Owner');
    const adminUser = await upsertUser('admin@example.com', 'admin', ownerPwdHash, adminRole, 'Admin', 'User');
    const testUser = await upsertUser('test@example.com', 'testuser', userPwdHash, userRole, 'Test', 'User');

    // Minimal project + tasks
    const now = new Date();
    const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);
    
    const exampleProject = await upsertProject('Example Project', ownerUser, {
        description: 'Example project for testing',
        projectStatus: await AppDataSource.getRepository(ProjectStatus).findOne({ where: { name: 'Active' } }) ?? undefined,
        priority: await AppDataSource.getRepository(Priority).findOne({ where: { name: 'Medium' } }) ?? undefined,
        riskLevel: await AppDataSource.getRepository(RiskLevel).findOne({ where: { name: 'Low' } }) ?? undefined,
        isActive: true, isDone: false,
        estimatedBudget: 10000, startDate: now, endDate: daysFromNow(90)
    });

    const taskStatus = await AppDataSource.getRepository(TaskStatus).findOne({ where: { name: 'Not Started' } });
    const priority = await AppDataSource.getRepository(Priority).findOne({ where: { name: 'Medium' } });
    const taskType = await AppDataSource.getRepository(TaskType).findOne({ where: { name: 'Feature' } });

    if (taskStatus) {
        const task1 = await upsertTask('Example Task 1', ownerUser, {
            description: 'First example task', taskStatus, priority, taskType,
            user: testUser, dueDate: daysFromNow(30), plannedStartDate: now,
            isDone: false, isActive: true
        });
        await assignTaskToProject(task1.id, exampleProject.id);

        const task2 = await upsertTask('Example Task 2', adminUser, {
            description: 'Second example task', taskStatus, priority, taskType,
            user: adminUser, dueDate: daysFromNow(45), plannedStartDate: now,
            isDone: false, isActive: true
        });
        await assignTaskToProject(task2.id, exampleProject.id);

        const task3 = await upsertTask('Example Task 3', ownerUser, {
            description: 'Third example task', taskStatus, priority, taskType,
            user: ownerUser, dueDate: daysFromNow(60), plannedStartDate: now,
            isDone: false, isActive: true
        });
        await assignTaskToProject(task3.id, exampleProject.id);
    }

    console.log('Seeded base configuration: roles, subroles, permissions, priorities, statuses, types, risk levels, minimal users, and example project with tasks');
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
    console.log('Base seeding completed');
    process.exit(0);
}

runSeeds().catch((err) => {
    console.error(err);
    process.exit(1);
});