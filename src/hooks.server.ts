import type { Handle } from '@sveltejs/kit';
import { getUserByToken, initUserStore } from '$lib/server/userStorage';

export const handle: Handle = async ({ event, resolve }) => {
    await initUserStore();

    const token = event.cookies.get('session');
    const u = await getUserByToken(token);

   	event.locals.user = u ? { username: u.username, email: u.email, forename: u.forename, surname: u.surname, role: u.role } : null;

    return resolve(event);
};