import type { LayoutServerLoad } from './$types';
import { getLookupData } from '$lib/server/database/lookup-cache';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
    const user = locals.user;

    let lookups = {};
    if (user) {
        lookups = await getLookupData();
    }

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
        appState: cookies.get('appState') ?? 'landing',
        ...lookups
    };
};
