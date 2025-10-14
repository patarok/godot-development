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
import { TimeEntry } from '../entities/task/TimeEntry';
import { TaskDependency, DependencyPolicy } from '../entities/task/TaskDependency';
import { TaskAssignedUser } from '../entities/task/TaskAssignedUser';
import { TaskResponsibleUser } from '../entities/task/TaskResponsibleUser';
import { TaskCurrentUser } from '../entities/task/TaskCurrentUser';

// Mail domain entities
import { Mail } from '../entities/mail/Mail';
import { SimpleMail } from '../entities/mail/SimpleMail';
import { ContractorMail } from '../entities/mail/ContractorMail';
import { Attachment } from '../entities/mail/Attachment';
import { MailAudit } from '../entities/mail/MailAudit';

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

// Utilities and deterministic pseudo-random for reproducible seeds
const now = new Date();
const dayMs = 86400000;
const daysAgo = (d: number) => new Date(now.getTime() - d * dayMs);
const daysFromNow = (d: number) => new Date(now.getTime() + d * dayMs);
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

let rndState = 1337;
function srand(seed: number) { rndState = seed >>> 0; }
function rand() {
    let x = rndState;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    rndState = x >>> 0;
    return rndState / 0xffffffff;
}
function choice<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length) % arr.length]; }
function between(min: number, max: number): number { return Math.floor(min + rand() * (max - min + 1)); }

// Parameterization via env vars
const DEMO_SEED = {
    projectCount: Number.parseInt(process.env.DEMO_PROJECT_COUNT ?? '') || 13,
    tasksMin: Number.parseInt(process.env.DEMO_TASKS_PER_PROJECT_MIN ?? '') || 28,
    tasksMax: Number.parseInt(process.env.DEMO_TASKS_PER_PROJECT_MAX ?? '') || 36,
    teamMin: Number.parseInt(process.env.DEMO_TEAM_MIN ?? '') || 9,
    teamMax: Number.parseInt(process.env.DEMO_TEAM_MAX ?? '') || 16,
    epicsPerProject: Number.parseInt(process.env.DEMO_EPICS_PER_PROJECT ?? '') || 3,
    epicChildrenMin: Number.parseInt(process.env.DEMO_EPIC_CHILDREN_MIN ?? '') || 6,
    epicChildrenMax: Number.parseInt(process.env.DEMO_EPIC_CHILDREN_MAX ?? '') || 8,
    mailPerContractor: Number.parseInt(process.env.DEMO_MAIL_PER_CONTRACTOR ?? '') || 4,
    mailQueueCount: Number.parseInt(process.env.DEMO_MAIL_QUEUE_COUNT ?? '') || 40,
};

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

// Settings
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

// Users
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

// Task helpers
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

async function ensureTaskAssignedUser(taskId: string, userId: string) {
    const repo = AppDataSource.getRepository(TaskAssignedUser);
    const exists = await repo.findOne({ where: { taskId, userId } });
    if (!exists) await repo.save(repo.create({ taskId, userId }));
}
async function ensureTaskResponsibleUser(taskId: string, userId: string) {
    const repo = AppDataSource.getRepository(TaskResponsibleUser);
    const exists = await repo.findOne({ where: { taskId, userId } });
    if (!exists) await repo.save(repo.create({ taskId, userId }));
}
async function ensureTaskCurrentUser(taskId: string, userId: string) {
    const repo = AppDataSource.getRepository(TaskCurrentUser);
    const exists = await repo.findOne({ where: { taskId, userId } });
    if (!exists) await repo.save(repo.create({ taskId, userId }));
}
async function ensureTaskDependency(predecessorTaskId: string, successorTaskId: string, policy?: DependencyPolicy) {
    const repo = AppDataSource.getRepository(TaskDependency);
    let dep = await repo.findOne({ where: { predecessorTaskId, successorTaskId } });
    if (!dep) {
        dep = repo.create({ predecessorTaskId, successorTaskId, policy: policy ?? DependencyPolicy.FinishToStart });
        await repo.save(dep);
    }
}
async function addTimeEntry(taskId: string, userId: string, startedAt: Date, minutes?: number | null, endedAt?: Date | null, note?: string | null) {
    const repo = AppDataSource.getRepository(TimeEntry);
    const te = repo.create({ taskId, userId, startedAt, endedAt: endedAt ?? null, minutes: minutes ?? null, note: note ?? null });
    await repo.save(te);
}

async function logProjectActivity(userId: string, projectId: string, action: string, message?: string) {
    try {
        const repo = AppDataSource.getRepository(ProjectLog);
        await repo.save(repo.create({ userId, projectId, action, message: message ?? null }));
    } catch {}
}
async function logTaskActivity(userId: string, taskId: string, action: string, message?: string) {
    try {
        const repo = AppDataSource.getRepository(TaskLog);
        await repo.save(repo.create({ userId, taskId, action, message: message ?? null }));
    } catch {}
}

// Mail helpers
async function upsertMailQueue(
    sender: string,
    recipient: string,
    subject: string,
    category: 'system' | 'business',
    type: 'templateMail' | 'readyMail',
    bodyText?: string | null,
    bodyHtml?: string | null,
    attachments?: { filename: string; path: string }[] | null,
    status?: 'pending' | 'sent' | 'error',
    templatePayload?: Record<string, any> | null
) {
    const repo = AppDataSource.getRepository(Mail);
    let m = await repo.findOne({ where: { sender, recipient, subject } });
    if (!m) {
        m = repo.create({
            sender,
            recipient,
            subject,
            category,
            type,
            bodyText: bodyText ?? null,
            bodyHtml: bodyHtml ?? null,
            attachments: attachments ?? null,
            templatePayload: templatePayload ?? null,
            status: status ?? 'pending',
            attempts: status === 'error' ? 1 : 0,
            lastError: status === 'error' ? 'Simulated delivery error' : null,
            sentAt: status === 'sent' ? daysAgo(between(0, 10)) : null
        });
        m = await repo.save(m);
    }
    return m;
}

async function upsertSimpleMail(
    sender: string,
    recipient: string,
    subject: string,
    bodyText?: string | null,
    bodyHtml?: string | null,
    cc?: string | null,
    attachmentsList?: string | null,
    status?: 'sent' | 'error' | 'received',
    sentAt?: Date | null
) {
    const repo = AppDataSource.getRepository(SimpleMail);
    let m = await repo.findOne({ where: { sender, recipient, subject } });
    if (!m) {
        m = repo.create({
            sender,
            recipient,
            subject: subject ?? null,
            bodyText: bodyText ?? null,
            bodyHtml: bodyHtml ?? null,
            cc: cc ?? null,
            attachmentsList: attachmentsList ?? null,
            status: status ?? 'sent',
            sentAt: sentAt ?? null
        });
        m = await repo.save(m);
    }
    return m;
}

async function upsertContractorMailWithArtifacts(
    contractorUser: User,
    subject: string,
    sender: string,
    recipientsCsv: string,
    bodyText?: string | null,
    bodyHtml?: string | null,
    status?: string | null
) {
    const repo = AppDataSource.getRepository(ContractorMail);
    let mail = await repo.findOne({ where: { subject: subject, sender: sender } });
    if (!mail) {
        mail = repo.create({
            contractorId: contractorUser.id,
            subject,
            sender,
            recipients: recipientsCsv,
            bodyText: bodyText ?? null,
            bodyHtml: bodyHtml ?? null,
            sentAt: rand() < 0.6 ? daysAgo(between(1, 12)) : null,
            retentionUntil: rand() < 0.4 ? daysFromNow(between(60, 365)) : null,
            legalHold: rand() < 0.1,
            storedHash: rand() < 0.5 ? Math.random().toString(36).slice(2) : null,
            signedHash: rand() < 0.4 ? Math.random().toString(36).slice(2) : null,
            archivePath: rand() < 0.4 ? `/archives/${contractorUser.username}/${Date.now()}_${Math.random().toString(36).slice(2)}.eml` : null,
            status: (status ?? 'queued') as any
        });
        mail = await repo.save(mail);

        // Attachments
        const attRepo = AppDataSource.getRepository(Attachment);
        const attCount = between(0, 3);
        for (let i = 0; i < attCount; i++) {
            const att = attRepo.create({
                mailId: mail.id,
                title: `SeedAttachment_${i + 1}.pdf`,
                contentType: 'application/pdf',
                size: between(10_000, 500_000),
                storagePath: `/blob/seed/${mail.id}/att_${i + 1}.pdf`,
                sha256Hash: Math.random().toString(16).slice(2).padEnd(64, '0')
            });
            await attRepo.save(att);
        }

        // Audits
        const auditRepo = AppDataSource.getRepository(MailAudit);
        await auditRepo.save(auditRepo.create({
            mailId: mail.id,
            action: 'created',
            performedBy: contractorUser.email,
            meta: { seed: true }
        }));
        if (rand() < 0.5) {
            await auditRepo.save(auditRepo.create({
                mailId: mail.id,
                action: 'updated',
                performedBy: 'system',
                meta: { reason: 'auto-index' }
            }));
        }
        if (mail.archivePath && rand() < 0.5) {
            await auditRepo.save(auditRepo.create({
                mailId: mail.id,
                action: 'archived',
                performedBy: 'archiver@system',
                meta: { path: mail.archivePath }
            }));
        }
    }
    return mail;
}

export async function seedInitialData() {
    srand(20251013);

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
    for (const perm of Object.values(mainPerms)) await linkRolePermission(ownerRole, perm);
    const adminAllowed = [
        'admin.access', 'user.manage', 'settings.view', 'settings.edit', 'logs.export',
        'user.subrole.assign', 'subrole.administrator.assign', 'subrole.project_manager.assign'
    ];
    for (const name of adminAllowed) await linkRolePermission(adminRole, mainPerms[name]);
    await linkRolePermission(controllerRole, mainPerms['controller.readonly']);

    // Settings
    await upsertSystemSetting('app.title', 'Godot Development', { category: 'ui', isPublic: true });
    await upsertSystemSetting('auth.password.hash', 'argon2id', { category: 'auth' });
    await upsertSystemSetting('demo.seed.version', 'v3-large-demo-mails-epics', { category: 'demo', isPublic: false });

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

    // SubRoles and permissions
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

    const subRolePermSeeds = [
        { name: 'project_view',          category: 'project',   value: '[project.view.allow]',                description: 'View projects' },
        { name: 'project_create',        category: 'project',   value: '[project.create.allow]',              description: 'Create new projects' },
        { name: 'project_edit',          category: 'project',   value: '[project.edit.allow]',                description: 'Edit project details' },
        { name: 'project_delete',        category: 'project',   value: '[project.delete.allow]',              description: 'Delete projects' },
        { name: 'project_status_change', category: 'project',   value: '[project.status.change.allow]',       description: 'Change project status' },
        { name: 'task_view',                  category: 'task',      value: '[task.view.allow]',                      description: 'View tasks' },
        { name: 'task_create',                category: 'task',      value: '[task.create.allow]',                    description: 'Create tasks' },
        { name: 'task_edit',                  category: 'task',      value: '[task.edit.allow]',                      description: 'Edit tasks' },
        { name: 'task_assign',                category: 'task',      value: '[task.assign.allow]',                    description: 'Assign tasks to users' },
        { name: 'task_status_change',         category: 'task',      value: '[task.status.change.allow]',             description: 'Change task status' },
        { name: 'task_delete',                category: 'task',      value: '[task.delete.allow]',                    description: 'Delete tasks' },
        { name: 'task_project_assign',        category: 'task',      value: '[task.project.assign.allow]',            description: 'Assign tasks to projects' },
        { name: 'task_create_without_project',category: 'task',      value: '[task.create.without_project.allow]',    description: 'Create tasks without a project' },
        { name: 'mail_send',                  category: 'mail',      value: '[mail.send.allow]',                      description: 'Send mails' },
        { name: 'mail_review',                category: 'mail',      value: '[mail.review.allow]',                    description: 'Review incoming mails' },
        { name: 'document_access',            category: 'document',  value: '[document.access.allow]',                description: 'Access documents' },
        { name: 'document_create',            category: 'document',  value: '[document.create.allow]',                description: 'Create documents' },
        { name: 'document_download',          category: 'document',  value: '[document.download.allow]',              description: 'Download documents' },
        { name: 'impediment_access',          category: 'impediment',value: '[impediment.access.allow]',              description: 'Access impediments' },
        { name: 'impediment_create',          category: 'impediment',value: '[impediment.create.allow]',              description: 'Create impediments' },
        { name: 'impediment_review',          category: 'impediment',value: '[impediment.review.allow]',              description: 'Review impediments' },
        { name: 'impediment_edit',            category: 'impediment',value: '[impediment.edit.allow]',                description: 'Edit impediments' },
        { name: 'stats_view',                 category: 'stats',     value: '[stats.view.allow]',                     description: 'View statistics' },
        { name: 'stats_export',               category: 'stats',     value: '[stats.export.allow]',                   description: 'Export statistics' },
        { name: 'notes_export',               category: 'notes',     value: '[notes.export.allow]',                   description: 'Export notes' },
        { name: 'tasks_group_export_with_notes', category: 'tasks',  value: '[tasks.group.export_with_notes.allow]',  description: 'Export a group of tasks with notes' },
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
    await assignPermsByName('Project Manager', [
        'project_view', 'project_create', 'project_edit', 'project_delete', 'project_status_change',
        'task_view', 'task_create', 'task_edit', 'task_assign', 'task_status_change', 'task_delete',
        'task_project_assign', 'task_create_without_project',
        'mail_send', 'mail_review',
        'document_access', 'document_create', 'document_download',
        'impediment_access', 'impediment_create', 'impediment_edit', 'impediment_review',
        'risk_view', 'report_view',
        'stats_view', 'stats_export', 'notes_export', 'tasks_group_export_with_notes'
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

    // Users
    const rawOwnerPwd = process.env.ADMIN_PASSWORD ?? 'admin123';
    const ownerPwdHash = process.env.ADMIN_PASSWORD_HASH ?? (await argon2hash(rawOwnerPwd, { memoryCost: 19456, timeCost: 2, hashLength: 32, parallelism: 1 }));
    const userPwdHash = await argon2hash('user123', { memoryCost: 19456, timeCost: 2, hashLength: 32, parallelism: 1 });

    const ownerUser = await upsertUser((process.env.ADMIN_EMAIL ?? 'owner@example.com').toLowerCase(), process.env.ADMIN_USERNAME ?? 'owner', ownerPwdHash, ownerRole, 'System', 'Owner');

    const adminSpecs = [
        ['admin.jane@example.com', 'adminjane', 'Jane', 'Admin'],
        ['admin.john@example.com', 'adminjohn', 'John', 'Admin'],
        ['admin.lucas@example.com', 'adminlucas', 'Lucas', 'Admin'],
        ['admin.sophia@example.com', 'adminsophia', 'Sophia', 'Admin']
    ];
    const controllerSpecs = [
        ['c.audit@example.com', 'caudit', 'Casey', 'Audit'],
        ['c.review@example.com', 'creview', 'Riley', 'Review'],
        ['c.inspector@example.com', 'cinspect', 'Jordan', 'Inspector'],
        ['c.readonly@example.com', 'creadonly', 'Taylor', 'Readonly'],
        ['c.reports@example.com', 'creports', 'Morgan', 'Reports'],
        ['c.security@example.com', 'csecurity', 'Avery', 'Security']
    ];
    const adminUsers: User[] = [];
    for (const [email, username, fn, ln] of adminSpecs) adminUsers.push(await upsertUser(email, username, ownerPwdHash, userRole /* keep governance at main role link */, fn, ln));
    // Grant admin main role via RolePermission links already; but we can set role=admin directly if preferred:
    for (let i = 0; i < adminUsers.length; i++) adminUsers[i].role = adminRole;

    const controllerUsers: User[] = [];
    for (const [email, username, fn, ln] of controllerSpecs) controllerUsers.push(await upsertUser(email, username, userPwdHash, controllerRole, fn, ln));

    const engineeringNames = [
        ['michael.chen@example.com', 'mchen', 'Michael', 'Chen'],
        ['emma.thompson@example.com', 'ethompson', 'Emma', 'Thompson'],
        ['li.wang@example.com', 'lwang', 'Li', 'Wang'],
        ['sofia.rodriguez@example.com', 'srodriguez', 'Sofia', 'Rodriguez'],
        ['noah.khan@example.com', 'nkhan', 'Noah', 'Khan'],
        ['olivia.martin@example.com', 'omartin', 'Olivia', 'Martin'],
        ['ethan.nguyen@example.com', 'enguyen', 'Ethan', 'Nguyen'],
        ['ava.patel@example.com', 'apatel', 'Ava', 'Patel'],
        ['isabella.garcia@example.com', 'igarcia', 'Isabella', 'Garcia'],
        ['mia.lee@example.com', 'mlee', 'Mia', 'Lee'],
        ['jackson.smith@example.com', 'jsmith', 'Jackson', 'Smith'],
        ['amelia.jones@example.com', 'ajones', 'Amelia', 'Jones'],
        ['benjamin.brown@example.com', 'bbrown', 'Benjamin', 'Brown'],
        ['charlotte.davis@example.com', 'cdavis', 'Charlotte', 'Davis'],
        ['daniel.miller@example.com', 'dmiller', 'Daniel', 'Miller'],
        ['harper.wilson@example.com', 'hwilson', 'Harper', 'Wilson'],
        ['henry.moore@example.com', 'hmoore', 'Henry', 'Moore'],
        ['ella.taylor@example.com', 'etaylor', 'Ella', 'Taylor'],
        ['lucas.anderson@example.com', 'landerson', 'Lucas', 'Anderson'],
        ['grace.thomas@example.com', 'gthomas', 'Grace', 'Thomas']
    ];
    const externalNames = [
        ['paul.stakeholder@example.com', 'pstakeholder', 'Paul', 'Stakeholder'],
        ['jack.contractor@example.com', 'jcontractor', 'Jack', 'Contractor'],
        ['lina.vendor@example.com', 'lvendor', 'Lina', 'Vendor'],
        ['chloe.customer@example.com', 'ccustomer', 'Chloe', 'Customer'],
        ['ryan.customer.reviewer@example.com', 'rcreviewer', 'Ryan', 'CustReviewer'],
        ['mia.customer.redactor@example.com', 'mcredactor', 'Mia', 'CustRedactor'],
        ['zara.customer@example.com', 'zcustomer', 'Zara', 'Customer'],
        ['omar.partner@example.com', 'opartner', 'Omar', 'Partner'],
        ['nina.client@example.com', 'nclient', 'Nina', 'Client'],
        ['felix.auditor@example.com', 'fauditor', 'Felix', 'Auditor']
    ];
    const users: User[] = [];
    for (const n of engineeringNames) users.push(await upsertUser(n[0], n[1], userPwdHash, userRole, n[2], n[3]));
    for (const n of externalNames) users.push(await upsertUser(n[0], n[1], userPwdHash, userRole, n[2], n[3]));
    const allUsers = [ownerUser, ...adminUsers, ...controllerUsers, ...users];

    // Assign subroles to users (varied)
    async function grant(user: User, ...titles: string[]) {
        for (const t of titles) await assignSubRoleToUser(user.id, subRoles[t].id);
    }
    await grant(ownerUser, 'Project Manager');
    for (const a of adminUsers) await grant(a, 'Administrator', 'Project Manager');
    for (const c of controllerUsers) await grant(c, 'Reviewer');
    for (let i = 0; i < users.length; i++) {
        const u = users[i];
        const r = i % 10;
        if (r === 0 || r === 5) await grant(u, 'Engineer');
        if (r === 1 || r === 6) await grant(u, 'Frontend Engineer');
        if (r === 2 || r === 7) await grant(u, 'Designer');
        if (r === 3) await grant(u, 'QA Specialist');
        if (r === 4) await grant(u, 'DevOps');
        if (r === 8) await grant(u, 'Stakeholder');
        if (r === 9) await grant(u, 'Contributor Contractor');
    }
    for (const u of users) {
        if ((u.email ?? '').includes('customer') && rand() < 0.5) await grant(u, 'Customer Contributor');
        if ((u.email ?? '').includes('reviewer')) await grant(u, 'Customer Reviewer');
        if ((u.email ?? '').includes('redactor')) await grant(u, 'Customer Redactor');
        if ((u.email ?? '').includes('vendor')) await grant(u, 'Contributor 3rd-party');
    }

    // Helper lookups
    const byPriority = (name: string) => priorities.find((p) => p.name === name)!;
    const byTaskStatus = (name: string) => taskStatuses.find((s) => s.name === name)!;
    const byTaskType = (name: string) => taskTypes.find((t) => t.name === name)!;
    const byRisk = (name: string) => riskLevels.find((r) => r.name === name)!;
    const statusActive = projectStatuses.find((s) => s.name === 'Active')!;
    const statusCompleted = projectStatuses.find((s) => s.name === 'Completed')!;
    const statusPaused = projectStatuses.find((s) => s.name === 'Paused')!;

    // Curated projects (includes Finance/Support domains)
    type ProjectSeed = {
        title: string;
        description: string;
        status: ProjectStatus;
        priority?: Priority | null;
        risk?: RiskLevel | null;
        budget?: number | null;
        estHours?: number | null;
        actHours?: number | null;
        startDaysAgo: number;
        endInDays: number | null;
        currentIteration?: number;
        maxIterations?: number | null;
        warnAt?: number;
        mainResponsible?: User;
    };

    const curated: ProjectSeed[] = [
        {
            title: 'Godot Development',
            description: 'Core development of the Godot game engine 4.x: features, fixes, performance.',
            status: statusActive,
            priority: byPriority('Urgent'),
            risk: byRisk('Medium'),
            budget: 250000, estHours: 3500, actHours: 2400,
            startDaysAgo: 120, endInDays: 270,
            currentIteration: 3, maxIterations: 15, warnAt: 12,
            mainResponsible: ownerUser
        },
        {
            title: 'Internal Tools',
            description: 'Dashboards, automation scripts, collab features for internal productivity.',
            status: statusActive,
            priority: byPriority('Medium'), risk: byRisk('Low'),
            budget: 85000, estHours: 1200, actHours: 900,
            startDaysAgo: 90, endInDays: 180,
            currentIteration: 2, maxIterations: 10, warnAt: 8,
            mainResponsible: choice(adminUsers)
        },
        {
            title: 'Marketing Website',
            description: 'Modernize the marketing website: redesign and content refresh.',
            status: statusCompleted,
            priority: byPriority('High'), risk: byRisk('Low'),
            budget: 120000, estHours: 1800, actHours: 2100,
            startDaysAgo: 180, endInDays: -30,
            currentIteration: 8, maxIterations: 8, warnAt: 6,
            mainResponsible: choice(users)
        },
        {
            title: 'Mobile App',
            description: 'Cross-platform mobile app for iOS and Android with offline sync.',
            status: statusActive,
            priority: byPriority('High'), risk: byRisk('High'),
            budget: 420000, estHours: 4800, actHours: 3600,
            startDaysAgo: 150, endInDays: 210,
            currentIteration: 5, maxIterations: 12, warnAt: 10,
            mainResponsible: choice(adminUsers)
        },
        // Finance
        {
            title: 'Finance System Modernization',
            description: 'General ledger consolidation, AP/AR workflows, and audit automation.',
            status: statusActive,
            priority: byPriority('Urgent'), risk: byRisk('High'),
            budget: 780000, estHours: 7000, actHours: 2200,
            startDaysAgo: 60, endInDays: 420, currentIteration: 2, warnAt: 8,
            mainResponsible: choice(adminUsers)
        },
        {
            title: 'Invoicing Automation',
            description: 'Automate invoice creation, delivery, dunning, and reconciliation.',
            status: statusActive,
            priority: byPriority('High'), risk: byRisk('Medium'),
            budget: 260000, estHours: 2200, actHours: 800,
            startDaysAgo: 45, endInDays: 280, currentIteration: 1, warnAt: 6,
            mainResponsible: choice(users)
        },
        {
            title: 'Forecasting & Budgeting',
            description: 'Rolling forecasts, scenario modeling, and department budgeting.',
            status: statusPaused,
            priority: byPriority('Medium'), risk: byRisk('Medium'),
            budget: 190000, estHours: 1800, actHours: 600,
            startDaysAgo: 40, endInDays: 300, currentIteration: 1, warnAt: 6,
            mainResponsible: choice(users)
        },
        // Support
        {
            title: 'Customer Support Platform',
            description: 'Integrate ticketing, chat, knowledge base, and CSAT analytics.',
            status: statusActive,
            priority: byPriority('High'), risk: byRisk('Medium'),
            budget: 330000, estHours: 3000, actHours: 1100,
            startDaysAgo: 55, endInDays: 320, currentIteration: 1, warnAt: 5,
            mainResponsible: choice(users)
        },
        {
            title: 'Ticket Routing Optimization',
            description: 'ML-based routing to reduce first response and resolution times.',
            status: statusActive,
            priority: byPriority('High'), risk: byRisk('Medium'),
            budget: 210000, estHours: 2000, actHours: 650,
            startDaysAgo: 70, endInDays: 300, currentIteration: 1, warnAt: 5,
            mainResponsible: choice(controllerUsers)
        },
        {
            title: 'Knowledge Base Refresh',
            description: 'Revamp articles, structure, localization, and usage analytics.',
            status: statusActive,
            priority: byPriority('Medium'), risk: byRisk('Low'),
            budget: 120000, estHours: 1500, actHours: 550,
            startDaysAgo: 30, endInDays: 200, currentIteration: 1, warnAt: 4,
            mainResponsible: choice(users)
        },
        // Security/Infra
        {
            title: 'Security Hardening',
            description: 'Zero trust rollout, SSO federation, audits, and threat modeling.',
            status: statusActive,
            priority: byPriority('Urgent'), risk: byRisk('High'),
            budget: 240000, estHours: 2100, actHours: 1200,
            startDaysAgo: 110, endInDays: 200, currentIteration: 2, warnAt: 6,
            mainResponsible: choice(controllerUsers)
        },
        {
            title: 'Observability Upgrade',
            description: 'Unified logging/metrics/tracing stack and SLO dashboards.',
            status: statusActive,
            priority: byPriority('High'), risk: byRisk('Medium'),
            budget: 180000, estHours: 1900, actHours: 800,
            startDaysAgo: 100, endInDays: 150, currentIteration: 2, warnAt: 6,
            mainResponsible: choice(users)
        },
        {
            title: 'AI Assistant R&D',
            description: 'Prototype AI assistant for support and internal knowledge.',
            status: statusActive,
            priority: byPriority('High'), risk: byRisk('Medium'),
            budget: 300000, estHours: 2600, actHours: 900,
            startDaysAgo: 50, endInDays: 365, currentIteration: 1, warnAt: 5,
            mainResponsible: choice(users)
        }
    ];

    // Expand to reach DEMO project count if needed
    while (curated.length < DEMO_SEED.projectCount) {
        const idx = curated.length + 1;
        curated.push({
            title: `Support Ops Project #${idx}`,
            description: 'Auto-generated support operations improvement project.',
            status: statusActive,
            priority: byPriority(idx % 3 === 0 ? 'Urgent' : 'High'),
            risk: byRisk(idx % 4 === 0 ? 'High' : 'Medium'),
            budget: 100000 + (idx * 5000),
            estHours: 1500 + (idx * 20),
            actHours: 300 + (idx * 10),
            startDaysAgo: 20 + (idx % 60),
            endInDays: 200 + (idx % 120),
            currentIteration: 1,
            maxIterations: 10,
            warnAt: 6,
            mainResponsible: choice(allUsers)
        });
    }

    // Create projects
    const seededProjects: Project[] = [];
    for (const cp of curated) {
        const p = await upsertProject(cp.title, ownerUser, {
            description: cp.description,
            projectStatus: cp.status,
            priority: cp.priority ?? null,
            riskLevel: cp.risk ?? null,
            isActive: cp.status.name !== 'Archived' && cp.status.name !== 'Completed',
            isDone: cp.status.name === 'Completed',
            currentIterationNumber: cp.currentIteration ?? 0,
            iterationWarnAt: cp.warnAt ?? 0,
            maxIterations: cp.maxIterations ?? null,
            estimatedBudget: cp.budget ?? null,
            actualCost: cp.budget ? Math.round((cp.budget * (0.5 + rand() * 0.6)) * 100) / 100 : null,
            estimatedHours: cp.estHours ?? null,
            actualHours: cp.actHours ?? null,
            startDate: daysAgo(cp.startDaysAgo),
            endDate: cp.endInDays != null ? (cp.endInDays >= 0 ? daysFromNow(cp.endInDays) : daysAgo(Math.abs(cp.endInDays))) : null,
            actualStartDate: daysAgo(Math.max(cp.startDaysAgo - between(0, 5), 1)),
            actualEndDate: cp.status.name === 'Completed' ? daysAgo(clamp(Math.abs(cp.endInDays ?? 0) - between(0, 3), 1, 9999)) : null,
            mainResponsible: cp.mainResponsible ?? null
        });
        seededProjects.push(p);
        await logProjectActivity(cp.mainResponsible?.id ?? ownerUser.id, p.id, 'project.seed.create', `title="${p.title}"`);
        if (cp.mainResponsible) await logProjectActivity(cp.mainResponsible.id, p.id, 'project.mainResponsible.set', `userId=${cp.mainResponsible.id}`);
    }

    // Build project teams, tasks (epics/subtasks), logs, time entries, dependencies
    const statusesCycle = [byTaskStatus('Not Started'), byTaskStatus('In Progress'), byTaskStatus('Blocked'), byTaskStatus('On Hold'), byTaskStatus('Done')];
    const prioritiesCycle = [byPriority('Low'), byPriority('Medium'), byPriority('High'), byPriority('Urgent')];

    for (let pi = 0; pi < seededProjects.length; pi++) {
        const project = seededProjects[pi];

        // Team
        const team: User[] = [];
        const teamSize = clamp(DEMO_SEED.teamMin + (pi % (DEMO_SEED.teamMax - DEMO_SEED.teamMin + 1)), DEMO_SEED.teamMin, DEMO_SEED.teamMax);
        const lead = choice([...adminUsers, ownerUser, ...users]);
        team.push(lead);
        for (let k = 0; k < teamSize - 1; k++) team.push(choice(allUsers));
        const uniqueTeam = Array.from(new Map(team.map(u => [u.id, u])).values());

        for (const u of uniqueTeam) {
            await assignUserToProject(u.id, project.id);
            await logProjectActivity(u.id, project.id, 'project.assigned.add', `userId=${u.id}`);
        }
        const responsibles = [choice(uniqueTeam), choice(uniqueTeam), ...(rand() < 0.4 ? [choice(uniqueTeam)] : [])];
        for (const ru of responsibles) {
            await assignResponsibleUserToProject(ru.id, project.id);
            await logProjectActivity(ru.id, project.id, 'project.responsible.add', `userId=${ru.id}`);
        }

        // Target tasks
        const span = Math.max(0, DEMO_SEED.tasksMax - DEMO_SEED.tasksMin);
        const taskTarget = DEMO_SEED.tasksMin + (pi % (span + 1));

        // EPICs
        const epics: Task[] = [];
        const epicCount = DEMO_SEED.epicsPerProject;
        for (let e = 0; e < epicCount; e++) {
            const status = statusesCycle[(pi + e) % statusesCycle.length];
            const prio = prioritiesCycle[(e + pi) % prioritiesCycle.length];
            const epicTitle = `${project.title}: EPIC #${e + 1}`;
            const creator = choice(uniqueTeam);
            const plannedStart = daysAgo(between(15, 90));
            const due = daysFromNow(between(60, 180));
            const epicTask = await upsertTask(epicTitle, creator, {
                description: `High-level epic #${e + 1} for ${project.title}.`,
                taskStatus: status,
                priority: prio,
                taskType: byTaskType('Feature'),
                user: choice(uniqueTeam),
                actualHours: between(20, 60),
                plannedStartDate: plannedStart,
                startDate: daysAgo(between(5, 30)),
                dueDate: due,
                doneDate: status.name === 'Done' ? daysAgo(between(1, 5)) : null,
                isDone: status.name === 'Done',
                isActive: status.name !== 'Done',
                isMeta: true,
                parent: null
            });
            epics.push(epicTask);
            await assignTaskToProject(epicTask.id, project.id);
            await logProjectActivity(creator.id, project.id, 'project.task.add', `taskId=${epicTask.id}`);
            await logTaskActivity(creator.id, epicTask.id, 'task.seed.create', `title="${epicTask.title}"`);
        }

        // Children tasks under epics
        const projectTasks: Task[] = [...epics];
        for (const epic of epics) {
            const childrenCount = between(DEMO_SEED.epicChildrenMin, DEMO_SEED.epicChildrenMax);
            for (let i = 0; i < childrenCount; i++) {
                const ttype = choice(taskTypes);
                const status = statusesCycle[(pi + i) % statusesCycle.length];
                const prio = prioritiesCycle[(i + pi) % prioritiesCycle.length];
                const assignee = choice(uniqueTeam);
                const creator = choice(uniqueTeam);
                const plannedStart = daysAgo(between(10, 60));
                const due = daysFromNow(between(20, 120));
                const isDone = status.name === 'Done';
                const startDate = daysAgo(between(1, 30));
                const doneDate = isDone ? daysAgo(between(0, 10)) : null;
                const actualHours = isDone ? between(4, 30) : (rand() < 0.4 ? between(1, 10) : null);
                const t = await upsertTask(
                    `${project.title}: ${ttype.name} - ${epic.title.split(': ')[1]} - Task ${i + 1}`,
                    creator,
                    {
                        description: `${ttype.name} child for ${epic.title}.`,
                        taskStatus: status,
                        priority: prio,
                        taskType: ttype,
                        user: assignee,
                        actualHours,
                        plannedStartDate: plannedStart,
                        startDate,
                        dueDate: due,
                        doneDate,
                        isDone,
                        isActive: status.name !== 'Done',
                        isMeta: false,
                        parent: epic
                    }
                );
                projectTasks.push(t);
                await assignTaskToProject(t.id, project.id);
                await logProjectActivity(creator.id, project.id, 'project.task.add', `taskId=${t.id}`);
                await logTaskActivity(creator.id, t.id, 'task.seed.create', `title="${t.title}"`);
                await ensureTaskAssignedUser(t.id, assignee.id);
                await ensureTaskResponsibleUser(t.id, choice(responsibles).id);
                if (rand() < 0.25) await ensureTaskCurrentUser(t.id, assignee.id);
                // Time entries
                const entries = between(isDone ? 2 : 1, isDone ? 5 : 3);
                for (let ei = 0; ei < entries; ei++) {
                    const start = new Date((t.startDate ?? startDate).getTime() + (ei * between(4, 36)) * 3600000);
                    const minutes = 30 + (ei * 15) + between(0, 45);
                    const note = ei % 2 === 0 ? 'Focused work' : 'Review/standup';
                    await addTimeEntry(t.id, choice(uniqueTeam).id, start, minutes, null, note);
                }
            }
        }

        // Additional flat tasks to reach target
        const remaining = Math.max(0, taskTarget - projectTasks.length);
        for (let ti = 0; ti < remaining; ti++) {
            const status = statusesCycle[(pi + ti) % statusesCycle.length];
            const prio = prioritiesCycle[(ti + pi) % prioritiesCycle.length];
            const ttype = taskTypes[(ti * 7 + pi) % taskTypes.length];
            const assignee = choice(uniqueTeam);
            const creator = choice(uniqueTeam);
            const plannedStartShift = between(-30, 30);
            const plannedStart = plannedStartShift >= 0 ? daysFromNow(plannedStartShift) : daysAgo(Math.abs(plannedStartShift));
            const durationDays = clamp(5 + (ti % 20) + between(-2, 5), 1, 60);
            const due = new Date(plannedStart.getTime() + durationDays * dayMs);
            const isDone = status.name === 'Done';
            const startedShift = between(-3, 3);
            const startDate = new Date(plannedStart.getTime() + startedShift * dayMs);
            const doneDate = isDone ? new Date(due.getTime() - between(0, 3) * dayMs) : null;
            const actualHours = isDone ? 4 + (ti % 20) + between(0, 8) : (ti % 5 === 0 ? between(1, 8) : null);
            const t = await upsertTask(
                `${project.title}: ${ttype.name} #${ti + 1}`,
                creator,
                {
                    description: `${ttype.name} work item ${ti + 1} for ${project.title}.` + (status.name === 'Blocked' ? ' Waiting on dependency.' : ''),
                    taskStatus: status,
                    priority: prio,
                    taskType: ttype,
                    user: assignee,
                    actualHours,
                    plannedStartDate: plannedStart,
                    startDate,
                    dueDate: due,
                    doneDate,
                    isDone,
                    isActive: status.name !== 'Done',
                    isMeta: false,
                    parent: null
                }
            );
            projectTasks.push(t);
            await assignTaskToProject(t.id, project.id);
            await logProjectActivity(creator.id, project.id, 'project.task.add', `taskId=${t.id}`);
            await logTaskActivity(creator.id, t.id, 'task.seed.create', `title="${t.title}"`);
            await ensureTaskAssignedUser(t.id, assignee.id);
            await ensureTaskResponsibleUser(t.id, choice(responsibles).id);
            if (rand() < 0.25) await ensureTaskCurrentUser(t.id, assignee.id);
            // Time entries
            const entries = between(isDone ? 2 : 1, isDone ? 6 : 3);
            for (let ei = 0; ei < entries; ei++) {
                const start = new Date(startDate.getTime() + (ei * between(4, 48)) * 3600000);
                const minutes = 30 + (ei * 10) + between(0, 60);
                const note = ei % 2 === 0 ? 'Work session' : 'Review/meeting';
                await addTimeEntry(t.id, choice(uniqueTeam).id, start, minutes, null, note);
            }
            if (status.name === 'In Progress') {
                await logTaskActivity(assignee.id, t.id, 'task.status.update', 'status=In Progress');
            } else if (status.name === 'Blocked') {
                await logTaskActivity(assignee.id, t.id, 'task.status.update', 'status=Blocked');
            } else if (status.name === 'On Hold') {
                await logTaskActivity(assignee.id, t.id, 'task.status.update', 'status=On Hold');
            } else if (status.name === 'Done') {
                await logTaskActivity(assignee.id, t.id, 'task.status.update', 'status=Done');
                await logTaskActivity(assignee.id, t.id, 'task.complete', `hours=${actualHours ?? 0}`);
            }
        }

        // Dependencies
        for (let i = 1; i < projectTasks.length; i++) {
            const pred = projectTasks[i - 1];
            const succ = projectTasks[i];
            await ensureTaskDependency(pred.id, succ.id, i % 3 === 0 ? DependencyPolicy.StartToStart : DependencyPolicy.FinishToStart);
        }
        for (let i = 0; i < projectTasks.length; i += 5) {
            const a = projectTasks[i];
            const b = projectTasks[(i + 3) % projectTasks.length];
            if (a.id !== b.id) await ensureTaskDependency(a.id, b.id, DependencyPolicy.FinishToStart);
        }
    }

    // MAIL SEEDING
    // 1) Queue Mail (mails table)
    const sampleSenders = ['no-reply@corp.example', 'billing@corp.example', 'support@corp.example', 'noreply@system.example'];
    const sampleRecipients = allUsers.slice(0, 30).map(u => u.email ?? `${u.username}@example.com`);
    for (let i = 0; i < DEMO_SEED.mailQueueCount; i++) {
        const sender = choice(sampleSenders);
        const recipient = choice(sampleRecipients);
        const subj = `[SEED-QUEUE] ${i % 5 === 0 ? 'Invoice' : i % 5 === 1 ? 'Password Reset' : i % 5 === 2 ? 'Status Update' : i % 5 === 3 ? 'Weekly Digest' : 'Alert'} #${i + 1}`;
        const status: 'pending' | 'sent' | 'error' = i % 7 === 0 ? 'error' : (i % 3 === 0 ? 'sent' : 'pending');
        const category: 'system' | 'business' = i % 2 === 0 ? 'system' : 'business';
        const type: 'templateMail' | 'readyMail' = i % 2 === 0 ? 'templateMail' : 'readyMail';
        await upsertMailQueue(
            sender,
            recipient,
            subj,
            category,
            type,
            status === 'error' ? null : `Plain text for ${subj}`,
            status === 'error' ? null : `<p>HTML for <b>${subj}</b></p>`,
            rand() < 0.3 ? [{ filename: 'attachment.txt', path: `/blob/mail/${i}/attachment.txt` }] : null,
            status,
            type === 'templateMail' ? { name: 'TemplateX', vars: { idx: i } } : null
        );
    }

    // 2) SimpleMail
    for (let i = 0; i < 30; i++) {
        const sender = choice(sampleSenders);
        const recipient = choice(sampleRecipients);
        const subj = `[SEED-SIMPLE] Notice #${i + 1}`;
        const status: 'sent' | 'error' | 'received' = i % 9 === 0 ? 'error' : (i % 4 === 0 ? 'received' : 'sent');
        await upsertSimpleMail(
            sender, recipient, subj,
            `Text body for ${subj}`,
            `<p>HTML body for ${subj}</p>`,
            rand() < 0.2 ? 'cc.manager@corp.example' : null,
            rand() < 0.25 ? 'fileA.pdf;fileB.png' : null,
            status,
            status === 'sent' ? daysAgo(between(1, 20)) : null
        );
    }

    // 3) ContractorMail + Attachments + MailAudit
    const contractorCandidates = users.filter(u =>
        (u.email?.includes('contractor') || u.email?.includes('vendor') || u.email?.includes('partner')) && u.email
    );
    for (const c of contractorCandidates) {
        const count = DEMO_SEED.mailPerContractor;
        for (let i = 0; i < count; i++) {
            const subj = `[SEED-CONTRACTOR] Update ${i + 1} for ${c.username}`;
            const sender = `${c.username}@partner.example`;
            const recips = `${c.email}; pm@corp.example; legal@corp.example`;
            await upsertContractorMailWithArtifacts(
                c,
                subj,
                sender,
                recips,
                `Contractor text for ${subj}`,
                `<p>Contractor <b>HTML</b> for ${subj}</p>`,
                i % 3 === 0 ? 'archived' : (i % 2 === 0 ? 'sent' : 'queued')
            );
        }
    }

    console.log('Seeded large demo: roles, permissions, users with subroles, projects with epics/subtasks, assignments, dependencies, time entries, and mails (queue/simple/contractor).');
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