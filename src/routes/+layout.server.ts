import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
    const user = locals.user;
    return {
        user: user ? {
            ...user,
            isAdmin: user.role?.name === 'admin',
            permissions: user.role?.permissions || []
        } : null,
        appState: cookies.get('appState') ?? 'landing'
    };
};