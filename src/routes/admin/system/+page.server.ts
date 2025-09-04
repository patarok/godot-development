import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { AppDataSource, SystemSetting } from '$lib/server/database';
import { toPlainArray } from '$lib/utils';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');

    const settings = await AppDataSource.getRepository(SystemSetting).find({ order: { key: 'ASC' } });

    const plainSettings = toPlainArray(settings);

    return { plainSettings };
};

export const actions: Actions = {
    update: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });

        const fd = await request.formData();

        const key = String(fd.get('key') ?? '');
        const value = String(fd.get('value') ?? '');
        if (!key) return fail(400, { message: 'Missing key' });

        const repo = AppDataSource.getRepository(SystemSetting);

        let s = await repo.findOne({ where: { key } });

        if (!s) s = repo.create({ key, value });
        else s.value = value;

        await repo.save(s);
        return { message: 'Saved' };
    }
};