import type { Handle } from '@sveltejs/kit';
import { createHash } from 'crypto';
import { AppDataSource, initializeDatabase, Session, User } from '$lib/server/database';
import { IsNull } from 'typeorm';

function sha256(s: string) {
    return createHash('sha256').update(s).digest('hex');
}

// avoid handle call for resource calls in production: CDN, other alternatives?
export const handle: Handle = async ({ event, resolve }) => {
    if (process.env.DEBUG_HOOKS === '1') debugger;
    await initializeDatabase();

    const token = event.cookies.get('session');
    if (!token) {
        event.locals.user = null;
        return resolve(event);
    }

    const tokenHash = sha256(token);
    const sessionRepo = AppDataSource.getRepository(Session);
    const session = await sessionRepo.findOne({
        where: { tokenHash, revokedAt: IsNull() },
        relations: ['user', 'user.role']
    });

    if (!session || session.expiresAt <= new Date()) {
        event.locals.user = null;
        return resolve(event);
    }

    const user = session.user as User;

    // Determine admin status based on the user's role
    const isAdmin = !!user.role && user.role.isMainRole === true && user.role.name === 'admin';

    event.locals.user = {
        username: user.username ?? user.email,
        email: user.email,
        forename: user.forename,
        surname: user.surname,
        name: user.username ?? user.forename + ' ' + user.surname,
        role: isAdmin ? 'admin' : 'user',
        token: token,
        isAdmin
    };

    return resolve(event);
};
