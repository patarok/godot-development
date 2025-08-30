import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const USERS_FILE = process.env.USERS_FILE ?? path.join(process.cwd(), 'users.json');
const TMP_FILE = USERS_FILE + '.tmp';

export type StoredUser = {
    username: string;
    password: string; // hashed
    token: string;    // session token
};

// In-memory state
let loaded = false;
let users = new Map<string, StoredUser>();

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

async function loadOnce() {
    if (loaded) return;
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        const arr = JSON.parse(data) as Array<[string, StoredUser]>;
        users = new Map(arr);
    } catch {
        users = new Map();
    }
    loaded = true;
}

// Atomic write: write temp then rename
async function saveAtomic() {
    const arr = Array.from(users.entries());
    const json = JSON.stringify(arr, null, 2);
    await fs.writeFile(TMP_FILE, json);
    await fs.rename(TMP_FILE, USERS_FILE);
}

export async function initUserStore() {
    await withLock(loadOnce);
}

export async function getUser(username: string): Promise<StoredUser | null> {
    await initUserStore();
    return users.get(username.trim()) ?? null;
}

export async function getUserByToken(token: string | undefined | null): Promise<StoredUser | null> {
    if (!token) return null;
    await initUserStore();
    for (const u of users.values()) if (u.token === token) return u;
    return null;
}

export async function upsertUser(newUser: StoredUser): Promise<void> {
    await withLock(async () => {
        await loadOnce();
        users.set(newUser.username.trim(), newUser);
        await saveAtomic();
    });
}

export async function setUserToken(username: string, token?: string): Promise<string> {
    return withLock(async () => {
        await loadOnce();
        const key = username.trim();
        const u = users.get(key);
        if (!u) throw new Error('User not found');
        u.token = token ?? randomUUID();
        users.set(key, u);
        await saveAtomic();
        return u.token;
    });
}