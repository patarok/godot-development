import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { AppDataSource, SystemSetting, Priority, TaskState, initializeDatabase } from '$lib/server/database';
import { toPlainArray } from '$lib/utils';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    // Optional: require admin
    if (locals.user.role !== 'admin') throw error(403, 'Forbidden');
    await initializeDatabase();

    const settings = await AppDataSource.getRepository(SystemSetting).find({ order: { key: 'ASC' } });
    const priorities = await AppDataSource.getRepository(Priority).find({ order: { rank: 'ASC', name: 'ASC' } });
    const taskStates = await AppDataSource.getRepository(TaskState).find({ order: { rank: 'ASC', name: 'ASC' } });

    return { plainSettings: toPlainArray(settings), priorities: toPlainArray(priorities), taskStates: toPlainArray(taskStates) };
};

export const actions: Actions = {
    update: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });

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
    },
    create_priority: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });
        const fd = await request.formData();
        const name = String(fd.get('name') ?? '').trim();
        const rank = Number(fd.get('rank') ?? 0) || 0;
        const color = (fd.get('color') as string | null) || null;
        const description = (fd.get('description') as string | null) || null;
        if (!name) return fail(400, { message: 'Priority name required' });
        const repo = AppDataSource.getRepository(Priority);
        try {
            const p = repo.create({ name, rank, color: color || null, description: description || null });
            await repo.save(p);
        } catch (e) {
            return fail(400, { message: 'Priority name must be unique' });
        }
        return { message: 'Priority created' };
    },
    update_priority: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });
        const fd = await request.formData();
        const id = String(fd.get('id') ?? '');
        const name = String(fd.get('name') ?? '').trim();
        const rank = Number(fd.get('rank') ?? 0) || 0;
        const color = (fd.get('color') as string | null) || null;
        const description = (fd.get('description') as string | null) || null;
        if (!id || !name) return fail(400, { message: 'Missing id or name' });
        const repo = AppDataSource.getRepository(Priority);
        try {
            await repo.update(id, { name, rank, color: color || null, description: description || null });
        } catch (e) {
            return fail(400, { message: 'Priority update failed (unique name?)' });
        }
        return { message: 'Priority updated' };
    },
    delete_priority: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });
        const fd = await request.formData();
        const id = String(fd.get('id') ?? '');
        if (!id) return fail(400, { message: 'Missing id' });
        const repo = AppDataSource.getRepository(Priority);
        await repo.delete(id);
        return { message: 'Priority deleted' };
    },
    create_task_state: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });
        const fd = await request.formData();
        const name = String(fd.get('name') ?? '').trim();
        const rank = Number(fd.get('rank') ?? 0) || 0;
        const color = (fd.get('color') as string | null) || null;
        const description = (fd.get('description') as string | null) || null;
        if (!name) return fail(400, { message: 'Task state name required' });
        const repo = AppDataSource.getRepository(TaskState);
        try {
            const s = repo.create({ name, rank, color: color || null, description: description || null });
            await repo.save(s);
        } catch (e) {
            return fail(400, { message: 'Task state name must be unique' });
        }
        return { message: 'Task state created' };
    },
    update_task_state: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });
        const fd = await request.formData();
        const id = String(fd.get('id') ?? '');
        const name = String(fd.get('name') ?? '').trim();
        const rank = Number(fd.get('rank') ?? 0) || 0;
        const color = (fd.get('color') as string | null) || null;
        const description = (fd.get('description') as string | null) || null;
        if (!id || !name) return fail(400, { message: 'Missing id or name' });
        const repo = AppDataSource.getRepository(TaskState);
        try {
            await repo.update(id, { name, rank, color: color || null, description: description || null });
        } catch (e) {
            return fail(400, { message: 'Task state update failed (unique name?)' });
        }
        return { message: 'Task state updated' };
    },
    delete_task_state: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });
        const fd = await request.formData();
        const id = String(fd.get('id') ?? '');
        if (!id) return fail(400, { message: 'Missing id' });
        const repo = AppDataSource.getRepository(TaskState);
        try {
            await repo.delete(id);
        } catch (e) {
            return fail(400, { message: 'Cannot delete state in use' });
        }
        return { message: 'Task state deleted' };
    }
};