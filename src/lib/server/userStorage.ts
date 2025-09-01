import fs from 'fs/promises';
import path from 'path';
import { createHash, randomBytes, randomUUID } from 'crypto';

const USERS_FILE = process.env.USERS_FILE ?? path.join(process.cwd(), 'users.json');
const TMP_FILE = USERS_FILE + '.tmp';

export type StoredUser = {
    id: string;
    email: string;
    forename?: string;
    surname?: string;
    username: string;
    role: 'admin' | 'user';
    projects?: string;
    password: string; // argon2 hash
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type StoredSession = {
    id: string;
    userId: string;
    tokenHash: string;
    createdAt: string;
    expiresAt: string;
    lastUsedAt?: string;
    userAgent?: string;
    ip?: string;
    revokedAt?: string;
};

export type StoredPasswordResetToken = {
    id: string;
    userId: string;
    tokenHash: string;
    createdAt: string;
    expiresAt: string;
    usedAt?: string;
};

export type DBFile = {
    version: number;
    users: Record<string, StoredUser>; // key: userId
    usernames: Record<string, string>; // username -> userId
    emails: Record<string, string>; // normalized email -> userId
    sessions: Record<string, StoredSession>;
    passwordResetTokens: Record<string, StoredPasswordResetToken>;
};

// In-memory state
let loaded = false;
let db: DBFile = {
    version: 2,
    users: {},
    usernames: {},
    emails: {},
    sessions: {},
    passwordResetTokens: {}
};

// Minimal async mutex (serialize async calls)
let lock: Promise<void> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
    let release!: () => void;
    const next = new Promise<void>((res) => (release = res));
    const prev = lock;
    lock = lock.then(() => next).catch(() => next); // keep chain alive on errors
    return prev
        .then(fn)
        .finally(() => release());
}

function hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
}

function nowISO() {
    return new Date().toISOString();
}

async function loadOnce() {
    if (loaded) return;
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        if (parsed && parsed.version === 2) {
            db = parsed as DBFile;
            // ensure new indexes exist
            db.emails = db.emails ?? {};
            // ensure role defaults exist for users
            for (const u of Object.values(db.users)) {
                // @ts-expect-error tolerate missing role in older files
                if (!('role' in u) || (u as any).role == null) (u as any).role = 'user';
            }
        } else if (Array.isArray(parsed)) {
            // Legacy format: Array<[username, { username, password, token }]>;
            const legacy = parsed as Array<[string, { username: string; password: string; token?: string }]>;
            db = {
                version: 2,
                users: {},
                usernames: {},
                emails: {},
                sessions: {},
                passwordResetTokens: {}
            };
            for (const [, u] of legacy) {
                const id = randomUUID();
                const email = `${u.username}@local.invalid`;
                db.users[id] = {
                    id,
                    email,
                    username: u.username,
                    role: 'user',
                    password: u.password,
                    isActive: true,
                    createdAt: nowISO(),
                    updatedAt: nowISO()
                };
                db.usernames[u.username] = id;
                db.emails[email.toLowerCase()] = id;
            }
        } else if (parsed && typeof parsed === 'object') {
            // Unknown object, try to coerce minimal fields
            db = Object.assign({ version: 2, users: {}, usernames: {}, emails: {}, sessions: {}, passwordResetTokens: {} }, parsed);
            db.emails = db.emails ?? {};
        } else {
            // start fresh
        }
    } catch {
        // fresh db remains
    }
    loaded = true;
}

// Atomic write: write temp then rename
async function saveAtomic() {
    const json = JSON.stringify(db, null, 2);
    await fs.writeFile(TMP_FILE, json);
    await fs.rename(TMP_FILE, USERS_FILE);
}

export async function initUserStore() {
    await withLock(loadOnce);
}

export async function getUser(username: string): Promise<StoredUser | null> {
    await initUserStore();
    const id = db.usernames[username.trim()];
    return id ? db.users[id] ?? null : null;
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
    await initUserStore();
    const id = db.emails[email.trim().toLowerCase()];
    return id ? db.users[id] ?? null : null;
}

export async function upsertUser(newUser: { username: string; email: string; forename?: string; surname?: string; role: 'admin' | 'user'; password: string }): Promise<StoredUser> {
    return withLock(async () => {
        await loadOnce();
        const username = newUser.username.trim();
        // ensure uniqueness
        const existingId = db.usernames[username];
        const emailNorm = newUser.email.trim().toLowerCase();
        const timestamp = nowISO();
        // email uniqueness check
        const emailOwnerId = db.emails[emailNorm];
        if (emailOwnerId && emailOwnerId !== existingId) {
            throw new Error('Email already exists');
        }
        if (existingId) {
            const existing = db.users[existingId];
            existing.email = newUser.email.trim().toLowerCase();
            existing.forename = newUser.forename?.trim();
            existing.surname = newUser.surname?.trim();
            existing.role = newUser.role;
            existing.password = newUser.password;
            existing.updatedAt = timestamp;
            // update email index if changed
            const prevEmail = Object.entries(db.emails).find(([, uid]) => uid === existingId)?.[0];
            if (prevEmail && prevEmail !== emailNorm) delete db.emails[prevEmail];
            db.emails[emailNorm] = existingId;
            await saveAtomic();
            return existing;
        } else {
            const id = randomUUID();
            const user: StoredUser = {
                id,
                email: newUser.email.trim().toLowerCase(),
                forename: newUser.forename?.trim(),
                surname: newUser.surname?.trim(),
                username,
                role: newUser.role,
                password: newUser.password,
                isActive: true,
                createdAt: timestamp,
                updatedAt: timestamp
            };
            db.users[id] = user;
            db.usernames[username] = id;
            db.emails[emailNorm] = id;
            await saveAtomic();
            return user;
        }
    });
}

export async function getUserByToken(token: string | undefined | null): Promise<StoredUser | null> {
    if (!token) return null;
    await initUserStore();
    const tokenHash = hashToken(token);
    const session = Object.values(db.sessions).find(s => s.tokenHash === tokenHash && !s.revokedAt && new Date(s.expiresAt) > new Date());
    if (!session) return null;
    return db.users[session.userId] ?? null;
}

export async function setUserToken(username: string, _token?: string): Promise<string> {
    // Backward compatible wrapper to create a new session and return the raw token
    const { token } = await createSessionForUser(username);
    return token;
}

export async function createSessionForUser(
    username: string,
    meta?: { userAgent?: string; ip?: string; ttlSeconds?: number }
): Promise<{ token: string; session: StoredSession }> {
    return withLock(async () => {
        await loadOnce();
        const id = db.usernames[username.trim()];
        if (!id) throw new Error('User not found');
        const raw = randomBytes(32).toString('base64url');
        const tokenHash = hashToken(raw);
        const session: StoredSession = {
            id: randomUUID(),
            userId: id,
            tokenHash,
            createdAt: nowISO(),
            expiresAt: new Date(Date.now() + 1000 * (meta?.ttlSeconds ?? 60 * 60 * 24 * 30)).toISOString(),
            lastUsedAt: undefined,
            userAgent: meta?.userAgent,
            ip: meta?.ip,
            revokedAt: undefined
        };
        db.sessions[session.id] = session;
        await saveAtomic();
        return { token: raw, session };
    });
}

export async function revokeSession(rawTokenOrId: string): Promise<void> {
    return withLock(async () => {
        await loadOnce();
        // try by id
        if (db.sessions[rawTokenOrId]) {
            db.sessions[rawTokenOrId].revokedAt = nowISO();
        } else {
            const tokenHash = hashToken(rawTokenOrId);
            const session = Object.values(db.sessions).find(s => s.tokenHash === tokenHash);
            if (session) session.revokedAt = nowISO();
        }
        await saveAtomic();
    });
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
    return withLock(async () => {
        await loadOnce();
        for (const s of Object.values(db.sessions)) {
            if (s.userId === userId && !s.revokedAt) s.revokedAt = nowISO();
        }
        await saveAtomic();
    });
}

export async function createPasswordResetToken(usernameOrUserId: string, ttlMinutes = 30): Promise<{ token: string; expiresAt: Date } | null> {
    return withLock(async () => {
        await loadOnce();
        const userId = db.users[usernameOrUserId]?.id ?? db.usernames[usernameOrUserId];
        if (!userId) return null; // do not leak existence
        const raw = randomBytes(32).toString('base64url');
        const tokenHash = hashToken(raw);
        const id = randomUUID();
        const createdAt = new Date();
        const expiresAt = new Date(createdAt.getTime() + ttlMinutes * 60 * 1000);
        db.passwordResetTokens[id] = {
            id,
            userId,
            tokenHash,
            createdAt: createdAt.toISOString(),
            expiresAt: expiresAt.toISOString()
        };
        await saveAtomic();
        return { token: raw, expiresAt };
    });
}

export async function resetPasswordWithToken(rawToken: string, newPasswordHash: string): Promise<boolean> {
    return withLock(async () => {
        await loadOnce();
        const tokenHash = hashToken(rawToken);
        const tokenRow = Object.values(db.passwordResetTokens).find(t => t.tokenHash === tokenHash && !t.usedAt);
        if (!tokenRow) return false;
        if (new Date(tokenRow.expiresAt) <= new Date()) return false;
        const user = db.users[tokenRow.userId];
        if (!user) return false;
        user.password = newPasswordHash;
        user.updatedAt = nowISO();
        tokenRow.usedAt = nowISO();
        // revoke all sessions for user
        for (const s of Object.values(db.sessions)) {
            if (s.userId === user.id && !s.revokedAt) s.revokedAt = nowISO();
        }
        await saveAtomic();
        return true;
    });
}

export async function listUsers(): Promise<StoredUser[]> {
    await initUserStore();
    return Object.values(db.users);
}

export async function getUserById(id: string): Promise<StoredUser | null> {
    await initUserStore();
    return db.users[id] ?? null;
}

export async function updateUserById(id: string, updates: Partial<Omit<StoredUser, 'id' | 'password'>> & { email?: string; username?: string }): Promise<StoredUser | null> {
    return withLock(async () => {
        await loadOnce();
        const user = db.users[id];
        if (!user) return null;
        const timestamp = nowISO();
        // username uniqueness
        if (updates.username && updates.username !== user.username) {
            const newU = updates.username.trim();
            if (db.usernames[newU] && db.usernames[newU] !== id) throw new Error('Username already exists');
            delete db.usernames[user.username];
            db.usernames[newU] = id;
            user.username = newU;
        }
        // email uniqueness
        if (updates.email && updates.email !== user.email) {
            const newE = updates.email.trim().toLowerCase();
            const owner = db.emails[newE];
            if (owner && owner !== id) throw new Error('Email already exists');
            const prevEmail = Object.entries(db.emails).find(([, uid]) => uid === id)?.[0];
            if (prevEmail && prevEmail !== newE) delete db.emails[prevEmail];
            db.emails[newE] = id;
            user.email = newE;
        }
        if (updates.forename !== undefined) user.forename = updates.forename?.trim();
        if (updates.surname !== undefined) user.surname = updates.surname?.trim();
        if (updates.role) user.role = updates.role;
        if (updates.projects !== undefined) user.projects = updates.projects;
        if (updates.isActive !== undefined) user.isActive = updates.isActive;
        user.updatedAt = timestamp;
        await saveAtomic();
        return user;
    });
}