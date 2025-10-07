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
import { hash as argon2hash } from '@node-rs/argon2';

import { generateIdenteapot } from "@teapotlabs/identeapots";
// Setup minimal DOM/canvas for identeapots (Node environment)
import { JSDOM } from 'jsdom';
import { createCanvas, Image as CanvasImage } from 'canvas';

function ensureDomForIdenteapots() {
    if (typeof (globalThis as any).document !== 'undefined') return;
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    (globalThis as any).window = dom.window as any;
    (globalThis as any).document = dom.window.document as any;
    (globalThis as any).Image = CanvasImage as any;
    const realCreateElement = dom.window.document.createElement.bind(dom.window.document);
    (dom.window.document as any).createElement = function(tagName: any, options?: any) {
        if (String(tagName).toLowerCase() === 'canvas') {
            // default size; callers can override width/height after creation
            return createCanvas(256, 256) as any;
        }
        return realCreateElement(tagName, options);
    };
}
ensureDomForIdenteapots();

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

async function upsertProject(title: string, creator?: User) {
    const projectRepo = AppDataSource.getRepository(Project);
    let project = await projectRepo.findOne({ where: { title } });
    if (!project) {
        const active = await upsertProjectStatus('Active', 20, '#2b8a3e');
        project = projectRepo.create({
            title,
            projectStatus: active,
            isActive: true,
            isDone: false,
            currentIterationNumber: 0,
            iterationWarnAt: 0,
            creator: creator ?? null
        });
        project = await projectRepo.save(project);
    }
    // Ensure project has an avatar
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

async function upsertAdminUser(email: string, passwordHash: string, username = 'admin') {
    const userRepo = AppDataSource.getRepository(User);


    const emailNorm = email.trim().toLowerCase();
    let user = await userRepo.findOne({ where: [{ email: emailNorm }, { username }] });
    const adminRole = await AppDataSource.getRepository(Role).findOne({ where: { name: 'admin' } });

    if (!user) {
        user = await userRepo.save(userRepo.create({ email: emailNorm, username, password: passwordHash, isActive: true, role: adminRole }));
    }
  return user;
}

export async function seedInitialData() {
    const isMainRole = true;
    const admin = await upsertRole('admin', isMainRole);
    await upsertRole('user', isMainRole);

    const perms = [
        { name: 'admin.access', category: 'admin', description: 'Access admin area' },
        { name: 'user.manage', category: 'admin', description: 'Manage users' }
    ];
    for (const p of perms) {
        const perm = await upsertPermission(p.name, p.category, p.description);
        await linkRolePermission(admin, perm);
    }

    await upsertSystemSetting('app.title', 'Godot Development', { category: 'ui', isPublic: true });
    await upsertSystemSetting('auth.password.hash', 'argon2id', { category: 'auth' });

    const rawPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
    const passwordHash = process.env.ADMIN_PASSWORD_HASH ?? (await argon2hash(rawPassword, { memoryCost: 19456, timeCost: 2, hashLength: 32, parallelism: 1 }));
    const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
    const adminUser = await upsertAdminUser(adminEmail, passwordHash, process.env.ADMIN_USERNAME ?? 'admin');

    // Ensure admin has an avatar
    if (adminUser && !adminUser.avatarData) {
        const avatarData = await generateIdenteapot(adminEmail, { size: 128 });
        const userRepo = AppDataSource.getRepository(User);
        adminUser.avatarData = avatarData;
        await userRepo.save(adminUser);
    }

    // Seed some default projects
    const defaultProjects = [
        'Godot Development',
        'Internal Tools',
        'Marketing Website',
        'Mobile App'
    ];
    for (const title of defaultProjects) {
        await upsertProject(title, adminUser ?? undefined);
    }

    // Seed initial lookup values
    const prioritySeeds = [
        { name: 'Low', rank: 10, color: '#4dabf7' },
        { name: 'Medium', rank: 20, color: '#fab005' },
        { name: 'High', rank: 30, color: '#fa5252' },
        { name: 'Urgent', rank: 40, color: '#d6336c' }
    ];
    for (const p of prioritySeeds) await upsertPriority(p.name, p.rank, p.color);

    const projectStatusSeeds = [
        { name: 'Active', rank: 20, color: '#2b8a3e' },
        { name: 'Paused', rank: 10, color: '#868e96' },
        { name: 'Completed', rank: 5, color: '#37b24d' },
        { name: 'Archived', rank: 0, color: '#495057' }
    ];
    for (const s of projectStatusSeeds) await upsertProjectStatus(s.name, s.rank, s.color);

    const riskLevelSeeds = [
        { name: 'Low', rank: 10, color: '#40c057' },
        { name: 'Medium', rank: 20, color: '#fab005' },
        { name: 'High', rank: 30, color: '#fa5252' },
        { name: 'Critical', rank: 40, color: '#d6336c' }
    ];
    for (const r of riskLevelSeeds) await upsertRiskLevel(r.name, r.rank, r.color);

    const taskStatusSeeds = [
        { name: 'Not Started', rank: 0, color: '#868e96' },
        { name: 'In Progress', rank: 10, color: '#228be6' },
        { name: 'Blocked', rank: 20, color: '#e03131' },
        { name: 'On Hold', rank: 25, color: '#fab005' },
        { name: 'Done', rank: 30, color: '#2b8a3e' }
    ];
    for (const t of taskStatusSeeds) await upsertTaskStatus(t.name, t.rank, t.color);

    // Seed initial task types (admin-defined list used in the UI)
    const taskTypeSeeds = [
        { name: 'Table of Contents', rank: 10 },
        { name: 'Executive Summary', rank: 20 },
        { name: 'Technical Approach', rank: 30 },
        { name: 'DevOps', rank: 35 },
        { name: 'Design', rank: 40 },
        { name: 'Capabilities', rank: 50 },
        { name: 'Focus Documents', rank: 60 },
        { name: 'Narrative', rank: 70 },
        { name: 'Cover Page', rank: 80 }
    ];
    for (const tt of taskTypeSeeds) await upsertTaskType(tt.name, tt.rank);

    console.log('Seeded roles, permissions, settings, admin user, base projects, and initial lookups');
}

async function runSeeds() {
    try {
        await AppDataSource.initialize();
    }
    catch(error){
        console.log(error.message);
        console.log("Proceeding anyway.");
    }

    await seedInitialData();
    await AppDataSource.destroy();
    console.log('Seeding completed');
    process.exit(0);
}

runSeeds().catch((err) => {
    console.error(err);
    process.exit(1);
});