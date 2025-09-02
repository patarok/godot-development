// import type { Handle } from '@sveltejs/kit';
// import { getUserByToken, initUserStore } from '$lib/server/userStorage';
//
// export const handle: Handle = async ({ event, resolve }) => {
//     await initUserStore();
//
//     const token = event.cookies.get('session');
//     const u = await getUserByToken(token);
//
//    	event.locals.user = u ? { username: u.username, email: u.email, forename: u.forename, surname: u.surname, role: u.role } : null;
//
//     return resolve(event);
// };
//
// import { initializeDatabase } from '$lib/server/database';
// import type { Handle } from '@sveltejs/kit';
//
// export const handle: Handle = async ({ event, resolve }) => {
//     // Initialize database connection
//     await initializeDatabase();
//
//     return resolve(event);
// };

import 'reflect-metadata';
import type { Handle } from '@sveltejs/kit';
import { createHash } from 'crypto';
import { AppDataSource } from '$lib/server/database/config/datasource';
import { initializeDatabase } from '$lib/server/database/database-connection-init';
import { Session } from '$lib/server/database/entities/session/Session';
import { User } from '$lib/server/database/entities/user/User';
import { UserRole } from '$lib/server/database/entities/user/UserRole';

function sha256(s: string) { return createHash('sha256').update(s).digest('hex'); }

export const handle: Handle = async ({ event, resolve }) => {
    await initializeDatabase();

    const token = event.cookies.get('session');
    if (token) {
        const tokenHash = sha256(token);
        const repo = AppDataSource.getRepository(Session);
        const session = await repo.findOne({ where: { tokenHash, revokedAt: null }, relations: ['user'] });
        if (session && session.expiresAt > new Date()) {
            const u = session.user as User;
            // Determine role: mark admin if user has 'admin' role assigned
            const urRepo = AppDataSource.getRepository(UserRole);
            const userRoles = await urRepo.find({ where: { userId: u.id } as any, relations: ['role'] });
            const isAdmin = userRoles.some((ur) => (ur as any).role?.name === 'admin');
            event.locals.user = {
                username: u.username ?? u.email,
                email: u.email,
                forename: u.forename,
                surname: u.surname,
                role: isAdmin ? 'admin' : 'user'
            };
        } else {
            event.locals.user = null;
        }
    } else {
        event.locals.user = null;
    }

    return resolve(event);
};