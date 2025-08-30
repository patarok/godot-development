import type { Handle } from '@sveltejs/kit';
import { getUserByToken, initUserStore } from '$lib/server/userStorage';

export const handle: Handle = async ({ event, resolve }) => {
    await initUserStore();

    const token = event.cookies.get('session');
    const u = await getUserByToken(token);

    event.locals.user = u ? { username: u.username, token: u.token } : null;

    return resolve(event);
};