import type { LayoutServerLoad } from './$types';

// ... existing code ...

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
    const user = locals.user;
    return {
        user: user
            ? {
                ...user,
                // Rolle ist ein String aus hooks.server.ts
                isAdmin: user.role === 'admin',
                // falls du Permissions noch nicht hast:
                permissions: user.permissions ?? []
            }
            : null,
        appState: cookies.get('appState') ?? 'landing'
    };
};