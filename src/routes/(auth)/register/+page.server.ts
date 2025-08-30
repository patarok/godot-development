import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { hash } from '@node-rs/argon2';
import fs from 'fs/promises';
import path from 'path';

interface User {
    username: string;
    password: string;
    token: string;
}

// File path for storing users
const USERS_FILE = path.join(process.cwd(), 'users.json');

// In-memory cache
let users = new Map<string, User>();
let isLoaded = false;

// Load users from file
async function loadUsers(): Promise<void> {
    if (isLoaded) return;

    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        const usersArray = JSON.parse(data) as Array<[string, User]>;
        users = new Map(usersArray);
    } catch (error) {
        // File doesn't exist or is invalid, start with empty Map
        users = new Map();
    }
    isLoaded = true;
}

// Save users to file
async function saveUsers(): Promise<void> {
    try {
        const usersArray = Array.from(users.entries());
        await fs.writeFile(USERS_FILE, JSON.stringify(usersArray, null, 2));
    } catch (error) {
        console.error('Failed to save users:', error);
    }
}

export const actions = {
    default: async ({ request }) => {
        // Ensure users are loaded
        await loadUsers();

        const { username, password } = Object.fromEntries(await request.formData()) as Record<string, string>;

        if (!username || !password) {
            return fail(400, {
                error: true,
                message: '<strong>Username</strong> and/or <strong>password</strong> can not be blank.'
            });
        }

        const trimmedUsername = username.trim();

        // Check if user already exists
        if (users.has(trimmedUsername)) {
            return fail(400, {
                error: true,
                message: '<strong>Username</strong> already exists.'
            });
        }

        // Hash the password
        const hashedPassword = await hash(password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1,
        });

        // Store user in memory
        users.set(trimmedUsername, {
            username: trimmedUsername,
            password: hashedPassword,
            token: crypto.randomUUID()
        });

        // Save to file
        await saveUsers();

        redirect(303, '/login');
    }
} satisfies Actions;