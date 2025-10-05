import { AppDataSource } from '../config/datasource';
import { Role } from '../entities/user/Role';
import { Permission } from '../entities/user/Permission';
import { User } from '../entities/user/User';
import { UserSubRole } from '../entities/user/UserSubRole';
import { RolePermission } from '../entities/user/RolePermission';
import { SystemSetting } from '../entities/config/SystemSetting';
import { Project } from '../entities/project/Project';
import { ProjectStatus } from '../entities/status/ProjectStatus';
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

    console.log('Seeded roles, permissions, settings, admin user, and base projects');
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