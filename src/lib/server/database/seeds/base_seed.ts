 import { AppDataSource } from '../index';
import { Role } from '../entities/user/Role';
import { Permission } from '../entities/user/Permission';
import { User } from '../entities/user/User';
import { RolePermission } from '../entities/user/RolePermission';
import { SystemSetting } from '../entities/config/SystemSetting';
import { hash as argon2hash } from '@node-rs/argon2';

async function upsertRole(name: string) {
    const repo = AppDataSource.getRepository(Role);
    let role = await repo.findOne({ where: { name } });
    if (!role) role = await repo.save(repo.create({ name }));
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
    const userRoleRepo = AppDataSource.getRepository(UserRole);

    const emailNorm = email.trim().toLowerCase();
    let user = await userRepo.findOne({ where: [{ email: emailNorm }, { username }] });
    if (!user) {
        user = await userRepo.save(userRepo.create({ email: emailNorm, username, password: passwordHash, isActive: true }));
    }

    const adminRole = await AppDataSource.getRepository(Role).findOne({ where: { name: 'admin' } });
    if (adminRole) {
        const has = await userRoleRepo.findOne({ where: { userId: user.id, roleId: adminRole.id } });
        if (!has) await userRoleRepo.save(userRoleRepo.create({ userId: user.id, roleId: adminRole.id }));
    }

    return user;
}

export async function seedInitialData() {
    const admin = await upsertRole('admin');
    await upsertRole('user');

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
    await upsertAdminUser(adminEmail, passwordHash, process.env.ADMIN_USERNAME ?? 'admin');

    console.log('Seeded roles, permissions, settings, and admin user');
}

async function runSeeds() {
    await AppDataSource.initialize();
    await seedInitialData();
    await AppDataSource.destroy();
    console.log('Seeding completed');
    process.exit(0);
}

runSeeds().catch((err) => {
    console.error(err);
    process.exit(1);
});