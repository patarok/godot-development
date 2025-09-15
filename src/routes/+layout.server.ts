import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, cookies }) => {
    return {
        user: locals.user,
        appState: cookies.get('appState') ?? 'landing'  // Always returns a string
    };
};
