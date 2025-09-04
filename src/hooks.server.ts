import type { Handle } from '@sveltejs/kit';
import { createHash } from 'crypto';
import { AppDataSource, initializeDatabase, Session, User, UserRole } from '$lib/server/database';
import { IsNull } from 'typeorm';

function sha256(s: string) { return createHash('sha256').update(s).digest('hex'); }

// avoid handle call for resource calls in production: CDN, other alternatives?
export const handle: Handle = async ({ event, resolve }) => {
    if (process.env.DEBUG_HOOKS === '1') debugger;
    await initializeDatabase();

    const token = event.cookies.get('session');
    if (token) {
        const tokenHash = sha256(token);
        const repo = AppDataSource.getRepository(Session);
        const session = await repo.findOne({ where: { tokenHash, revokedAt: IsNull() }, relations: ['user'] });
        if (session && session.expiresAt > new Date()) {
            const u = session.user as User;
            // Determine role: mark admin if user has 'admin' role assigned
            const urRepo = AppDataSource.getRepository(UserRole);
            const userRoles = await urRepo.find({ where: { userId: u.id }, relations: ['role'] });
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