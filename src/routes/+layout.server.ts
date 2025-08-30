import type { LayoutServerLoad } from './$types';

export const load = ({ locals }) => ({
    user: locals.user ? { username: locals.user.username } : null
});