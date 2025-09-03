// src/lib/server/services/authService.ts
import { randomBytes, createHash } from 'crypto';
import { AppDataSource } from '../database/config/datasource';
import { User } from '../database/entities/user/User';
import { Session } from '../database/entities/session/Session';
import { PasswordResetToken } from '../database/entities/session/PasswordResetToken';
import { Role } from '../database/entities/user/Role';           // NEW
import { UserRole } from '../database/entities/user/UserRole';   // NEW
import pkg from '@node-rs/argon2';
const { hash: argon2hash, verify: argon2verify, argon2id } = pkg;

function sha256(s: string) { return createHash('sha256').update(s).digest('hex'); }

export async function findUserByEmail(email: string) {
    return AppDataSource.getRepository(User).findOne({ where: { email: email.trim().toLowerCase() } });
}
export async function findUserByUsername(username: string) {
    return AppDataSource.getRepository(User).findOne({ where: { username: username.trim() } });
}

export async function registerUser(input: { email: string; username?: string; forename?: string; surname?: string; password: string }) {
    if (process.env.DEBUG_AUTH === '1') debugger;
    const repo = AppDataSource.getRepository(User);
    const email = input.email.trim().toLowerCase();
    const username = input.username?.trim() ?? email;
    const existing = await repo.findOne({ where: [{ email }, { username }] });
    if (existing) throw new Error('User already exists');
    const password = await argon2hash(input.password, { algorithm: argon2id, memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
    return repo.save(repo.create({ email, username, forename: input.forename?.trim(), surname: input.surname?.trim(), password, isActive: true }));
}

export async function createSession(userId: number, meta?: { userAgent?: string; ip?: string; ttlSeconds?: number }) {
    if (process.env.DEBUG_AUTH === '1') debugger;
    const repo = AppDataSource.getRepository(Session);
    const raw = randomBytes(32).toString('base64url');
    const now = new Date();
    const ttl = meta?.ttlSeconds ?? 60 * 60 * 24 * 30;
    const session = repo.create({ userId, tokenHash: sha256(raw), createdAt: now, expiresAt: new Date(now.getTime() + ttl * 1000), userAgent: meta?.userAgent, ip: meta?.ip });
    await repo.save(session);
    return { token: raw, session };
}

export async function loginWithPassword(identifier: string, password: string, meta?: { userAgent?: string; ip?: string; ttlSeconds?: number }) {
    const userRepo = AppDataSource.getRepository(User);
    const where = identifier.includes('@') ? { email: identifier.trim().toLowerCase() } : { username: identifier.trim() };
    const user = await userRepo.findOne({ where });
    if (!user || !user.isActive) return null;
    const ok = await argon2verify(user.password, password);
    if (!ok) return null;
    return createSession(user.id, meta);
}

export async function revokeSession(rawOrId: string) {
    const repo = AppDataSource.getRepository(Session);
    const s = await repo.findOne({ where: { id: rawOrId } });
    if (s) { s.revokedAt = new Date(); await repo.save(s); return; }
    const found = await repo.findOne({ where: { tokenHash: sha256(rawOrId) } });
    if (found) { found.revokedAt = new Date(); await repo.save(found); }
}

export async function revokeAllSessionsForUser(userId: number) {
    const repo = AppDataSource.getRepository(Session);
    const sessions = await repo.find({ where: { userId, revokedAt: null } as any });
    for (const s of sessions) s.revokedAt = new Date();
    if (sessions.length) await repo.save(sessions);
}

export async function issuePasswordReset(usernameOrEmail: string, ttlMinutes = 30) {
    const user = usernameOrEmail.includes('@') ? await findUserByEmail(usernameOrEmail) : await findUserByUsername(usernameOrEmail);
    if (!user) return null;
    const repo = AppDataSource.getRepository(PasswordResetToken);
    const raw = randomBytes(32).toString('base64url');
    const now = new Date();
    await repo.save(repo.create({ userId: user.id, tokenHash: sha256(raw), createdAt: now, expiresAt: new Date(now.getTime() + ttlMinutes * 60 * 1000) }));
    return { token: raw, expiresAt: new Date(now.getTime() + ttlMinutes * 60 * 1000), user };
}

export async function resetPasswordWithToken(rawToken: string, newPassword: string) {
    const prRepo = AppDataSource.getRepository(PasswordResetToken);
    const userRepo = AppDataSource.getRepository(User);
    const prt = await prRepo.findOne({ where: { tokenHash: sha256(rawToken), usedAt: null } as any });
    if (!prt || prt.expiresAt <= new Date()) return false;
    const user = await userRepo.findOne({ where: { id: prt.userId } });
    if (!user) return false;
    user.password = await argon2hash(newPassword, { algorithm: argon2id, memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
    await userRepo.save(user);
    prt.usedAt = new Date();
    await prRepo.save(prt);
    await revokeAllSessionsForUser(user.id);
    return true;
}

// NEW: ensure a role exists (created on-the-fly if missing)
export async function ensureRole(name: string): Promise<Role> {
    const roleRepo = AppDataSource.getRepository(Role);
    let role = await roleRepo.findOne({ where: { name } });
    if (!role) {
        role = roleRepo.create({ name });
        role = await roleRepo.save(role);
    }
    return role;
}

// NEW: link a user to a role via UserRole (idempotent)
export async function assignRoleToUser(userId: number, roleName: 'user' | 'admin'): Promise<void> {
    const role = await ensureRole(roleName);
    const urRepo = AppDataSource.getRepository(UserRole);
    const existing = await urRepo.findOne({ where: { userId, roleId: role.id } as any });
    if (!existing) {
        await urRepo.save(urRepo.create({ userId, roleId: role.id }));
    }
}