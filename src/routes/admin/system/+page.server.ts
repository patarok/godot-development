import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/server/database/database-connection-init';
import { AppDataSource } from '$lib/server/database/config/datasource';
import { SystemSetting } from '$lib/server/database/entities/config/SystemSetting';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    await initializeDatabase();
    const settings = await AppDataSource.getRepository(SystemSetting).find({ order: { key: 'ASC' } as any });
    return { settings };
};

export const actions: Actions = {
    update: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        await initializeDatabase();
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