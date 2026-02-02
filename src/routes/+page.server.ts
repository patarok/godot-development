import { AppDataSource, UserCurrentActiveProject, Project } from '$lib/server/database';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { toPlainArray } from '$lib/utils/index';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) return { activeProject: null };

    const activeProjectRepo = AppDataSource.getRepository(UserCurrentActiveProject);
    const activeProjectRecord = await activeProjectRepo.findOne({
        where: { userId: locals.user.id },
        relations: ['project']
    });

    return {
        activeProject: activeProjectRecord ? toPlainArray([activeProjectRecord.project])[0] : null
    };
};

export const actions: Actions = {
    resetActiveProject: async ({ locals }) => {
        if (!locals.user) return fail(401);

        const activeProjectRepo = AppDataSource.getRepository(UserCurrentActiveProject);
        await activeProjectRepo.delete({ userId: locals.user.id });

        return { success: true };
    }
};
