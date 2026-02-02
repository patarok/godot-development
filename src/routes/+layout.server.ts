import type { LayoutServerLoad } from './$types';
import { 
    AppDataSource, 
    Project, 
    Priority, 
    TaskStatus, 
    User, 
    TaskType, 
    Task 
} from '$lib/server/database';
import { toPlainArray } from '$lib/utils/index';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
    const user = locals.user;
    
    let lookups = {};
    if (user) {
        const [projects, priorities, states, users, types, metaTasks] = await Promise.all([
            AppDataSource.getRepository(Project).find({ where: { isActive: true }, order: { title: 'ASC' } }),
            AppDataSource.getRepository(Priority).find({ order: { rank: 'ASC', name: 'ASC' } }),
            AppDataSource.getRepository(TaskStatus).find({ order: { rank: 'ASC', name: 'ASC' } }),
            AppDataSource.getRepository(User).find({ order: { email: 'ASC' } }),
            AppDataSource.getRepository(TaskType).find({ order: { rank: 'ASC', name: 'ASC' } }),
            AppDataSource.getRepository(Task).find({ 
                where: { isMeta: true }, 
                order: { title: 'ASC' },
                select: { id: true, title: true } 
            })
        ]);

        lookups = {
            projects: toPlainArray(projects),
            priorities: toPlainArray(priorities),
            states: toPlainArray(states),
            users: toPlainArray(users),
            types: toPlainArray(types),
            metaTasks: toPlainArray(metaTasks)
        };
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