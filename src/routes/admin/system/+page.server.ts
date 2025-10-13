import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { In } from 'typeorm';
import {
    AppDataSource,
    SystemSetting,
    Priority,
    TaskStatus,
    ProjectStatus,
    RiskLevel,
    SubRoleCfg,
    SubRolePermission,               // <-- add
    SubRolePermissionPermission,     // <-- add
    initializeDatabase
} from '$lib/server/database';
import { toPlainArray } from '$lib/utils/index';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    // Optional: require admin
    if (locals.user.role !== 'admin') throw error(403, 'Forbidden');
    await initializeDatabase();

    const settings = await AppDataSource.getRepository(SystemSetting).find({ order: { key: 'ASC' } });
    const priorities = await AppDataSource.getRepository(Priority).find({ order: { rank: 'ASC', name: 'ASC' } });
    const taskStatuses = await AppDataSource.getRepository(TaskStatus).find({ order: { rank: 'ASC', name: 'ASC' } });
    const projectStatuses = await AppDataSource.getRepository(ProjectStatus).find({ order: { rank: 'ASC', name: 'ASC' } });
    const subRoles = await AppDataSource.getRepository(SubRoleCfg).find({ order: { title: 'ASC' } });
    const subRolePermissions = await AppDataSource
        .getRepository(SubRolePermission)
        .find({ order: { category: 'ASC', name: 'ASC' } });
    const subRolePermissionAssignments = await AppDataSource
        .getRepository(SubRolePermissionPermission)
        .find();
    const riskLevels = await AppDataSource.getRepository(RiskLevel).find({ order: { rank: 'ASC', name: 'ASC' } });
       return { plainSettings: toPlainArray(settings),
                priorities: toPlainArray(priorities),
                taskStatuses: toPlainArray(taskStatuses),
                projectStatuses: toPlainArray(projectStatuses),
                riskLevels: toPlainArray(riskLevels),
                subRoles: toPlainArray(subRoles),
                subRolePermissions: toPlainArray(subRolePermissions),
                subRolePermissionAssignments: toPlainArray(subRolePermissionAssignments)
       };
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
    create_subrole: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });

        const fd = await request.formData();
        const title = String(fd.get('title') ?? '').trim();
        const companyJobTitle = String(fd.get('companyJobTitle') ?? '').trim();
        const companyJobRole = String(fd.get('companyJobRole') ?? '').trim();
        const color = (fd.get('color') as string | null) || null;
        const description = (fd.get('description') as string | null) || null;

        if (!title) return fail(400, { message: 'SubRole title required' });
        if (!companyJobTitle) return fail(400, { message: 'Company job title required' });
        if (!companyJobRole) return fail(400, { message: 'Company job role required' });

        const repo = AppDataSource.getRepository(SubRoleCfg);
        try {
            const sr = repo.create({ title, companyJobTitle, companyJobRole, color: color || null, description: description || null });
            await repo.save(sr);
        } catch (e) {
            return fail(400, { message: 'SubRole title must be unique' });
        }
        return { message: 'SubRole created' };
    },
    update_subrole: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });

        const fd = await request.formData();
        const id = String(fd.get('id') ?? '');
        const title = String(fd.get('title') ?? '').trim();
        const companyJobTitle = String(fd.get('companyJobTitle') ?? '').trim();
        const companyJobRole = String(fd.get('companyJobRole') ?? '').trim();
        const color = (fd.get('color') as string | null) || null;
        const description = (fd.get('description') as string | null) || null;

        if (!id || !title) return fail(400, { message: 'Missing id or title' });
        if (!companyJobTitle) return fail(400, { message: 'Company job title required' });
        if (!companyJobRole) return fail(400, { message: 'Company job role required' });

        const repo = AppDataSource.getRepository(SubRoleCfg);
        try {
            await repo.update(id, { title, companyJobTitle, companyJobRole, color: color || null, description: description || null });
        } catch (e) {
            return fail(400, { message: 'SubRole update failed (unique title?)' });
        }
        return { message: 'SubRole updated' };
    },
    delete_subrole: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });

        const fd = await request.formData();
        const id = String(fd.get('id') ?? '');
        if (!id) return fail(400, { message: 'Missing id' });

        const repo = AppDataSource.getRepository(SubRoleCfg);
        try {
            await repo.delete(id);
        } catch (e) {
            return fail(400, { message: 'Cannot delete sub role in use' });
        }
        return { message: 'SubRole deleted' };
    },
    // Create SubRolePermission
    create_subrole_permission: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });

        const fd = await request.formData();
        const name = String(fd.get('name') ?? '').trim();
        const category = String(fd.get('category') ?? '').trim();
        const value = String(fd.get('value') ?? '').trim();
        const description = (fd.get('description') as string | null) || null;

        if (!name) return fail(400, { message: 'Permission name required' });
        if (!category) return fail(400, { message: 'Permission category required' });
        if (!value) return fail(400, { message: 'Permission value required' });

        const repo = AppDataSource.getRepository(SubRolePermission);
        try {
            const p = repo.create({ name, category, value, description: description || null });
            await repo.save(p);
        } catch (e) {
            return fail(400, { message: 'Permission name must be unique' });
        }
        return { message: 'Permission created' };
    },

    // Update SubRolePermission
    update_subrole_permission: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });

        const fd = await request.formData();
        const id = String(fd.get('id') ?? '').trim();
        const name = String(fd.get('name') ?? '').trim();
        const category = String(fd.get('category') ?? '').trim();
        const value = String(fd.get('value') ?? '').trim();
        const description = (fd.get('description') as string | null) || null;

        if (!id || !name) return fail(400, { message: 'Missing id or name' });
        if (!category) return fail(400, { message: 'Permission category required' });
        if (!value) return fail(400, { message: 'Permission value required' });

        const repo = AppDataSource.getRepository(SubRolePermission);
        try {
            await repo.update(id, { name, category, value, description: description || null });
        } catch (e) {
            return fail(400, { message: 'Permission update failed (unique name?)' });
        }
        return { message: 'Permission updated' };
    },
    delete_subrole_permission: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });

        const fd = await request.formData();
        const id = String(fd.get('id') ?? '').trim();
        if (!id) return fail(400, { message: 'Missing id' });

        const repo = AppDataSource.getRepository(SubRolePermission);
        try {
            await repo.delete(id); // junction table has onDelete: 'CASCADE'
        } catch (e) {
            return fail(400, { message: 'Cannot delete permission in use' });
        }
        return { message: 'Permission deleted' };
    },
    set_subrole_permissions: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });

        const fd = await request.formData();
        const subRoleCfgId = String(fd.get('subRoleCfgId') ?? '').trim();
        if (!subRoleCfgId) return fail(400, { message: 'Missing subRoleCfgId' });

        const permissionIds = fd.getAll('permissionIds').map((v) => String(v)).filter(Boolean);

        const repo = AppDataSource.getRepository(SubRolePermissionPermission);

        // existing assignments
        const existing = await repo.find({ where: { subRoleCfgId } });
        const existingIds = new Set(existing.map((e) => e.subRolePermissionId));
        const desiredIds = new Set(permissionIds);

        const toAdd = [...desiredIds].filter((id) => !existingIds.has(id));
        const toRemove = [...existingIds].filter((id) => !desiredIds.has(id));

        if (toAdd.length) {
            const rows = toAdd.map((pid) => repo.create({ subRoleCfgId, subRolePermissionId: pid }));
            await repo.save(rows);
        }

        if (toRemove.length) {
            await repo.delete({ subRoleCfgId, subRolePermissionId: In(toRemove) });
        }

        return { message: 'Permissions updated' };
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
        const repo = AppDataSource.getRepository(TaskStatus);
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
        const repo = AppDataSource.getRepository(TaskStatus);
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
        const repo = AppDataSource.getRepository(TaskStatus);
        try {
            await repo.delete(id);
        } catch (e) {
            return fail(400, { message: 'Cannot delete state in use' });
        }
        return { message: 'Task state deleted' };
    },
    // Project States CRUD
    create_project_state: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });
        const fd = await request.formData();
        const name = String(fd.get('name') ?? '').trim();
        const rank = Number(fd.get('rank') ?? 0) || 0;
        const color = (fd.get('color') as string | null) || null;
        const description = (fd.get('description') as string | null) || null;
        if (!name) return fail(400, { message: 'Project state name required' });
        const repo = AppDataSource.getRepository(ProjectStatus);
        try {
            const s = repo.create({ name, rank, color: color || null, description: description || null });
            await repo.save(s);
        } catch (e) {
            return fail(400, { message: 'Project state name must be unique' });
        }
        return { message: 'Project state created' };
    },
    update_project_state: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });
        const fd = await request.formData();
        const id = String(fd.get('id') ?? '');
        const name = String(fd.get('name') ?? '').trim();
        const rank = Number(fd.get('rank') ?? 0) || 0;
        const color = (fd.get('color') as string | null) || null;
        const description = (fd.get('description') as string | null) || null;
        if (!id || !name) return fail(400, { message: 'Missing id or name' });
        const repo = AppDataSource.getRepository(ProjectStatus);
        try {
            await repo.update(id, { name, rank, color: color || null, description: description || null });
        } catch (e) {
            return fail(400, { message: 'Project state update failed (unique name?)' });
        }
        return { message: 'Project state updated' };
    },
    delete_project_state: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });
        const fd = await request.formData();
        const id = String(fd.get('id') ?? '');
        if (!id) return fail(400, { message: 'Missing id' });
        const repo = AppDataSource.getRepository(ProjectStatus);
        try {
            await repo.delete(id);
        } catch (e) {
            return fail(400, { message: 'Cannot delete project state in use' });
        }
        return { message: 'Project state deleted' };
    },
    // Risk Levels CRUD
    create_risk_level: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });
        const fd = await request.formData();
        const name = String(fd.get('name') ?? '').trim();
        const rank = Number(fd.get('rank') ?? 0) || 0;
        const color = (fd.get('color') as string | null) || null;
        const description = (fd.get('description') as string | null) || null;
        if (!name) return fail(400, { message: 'Risk level name required' });
        const repo = AppDataSource.getRepository(RiskLevel);
        try {
            const r = repo.create({ name, rank, color: color || null, description: description || null, isActive: true });
            await repo.save(r);
        } catch (e) {
            return fail(400, { message: 'Risk level name must be unique' });
        }
        return { message: 'Risk level created' };
    },
    update_risk_level: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });
        const fd = await request.formData();
        const id = String(fd.get('id') ?? '');
        const name = String(fd.get('name') ?? '').trim();
        const rank = Number(fd.get('rank') ?? 0) || 0;
        const color = (fd.get('color') as string | null) || null;
        const description = (fd.get('description') as string | null) || null;
        const isActive = fd.get('isActive') ? true : false;
        if (!id || !name) return fail(400, { message: 'Missing id or name' });
        const repo = AppDataSource.getRepository(RiskLevel);
        try {
            await repo.update(id, { name, rank, color: color || null, description: description || null, isActive });
        } catch (e) {
            return fail(400, { message: 'Risk level update failed (unique name?)' });
        }
        return { message: 'Risk level updated' };
    },
    delete_risk_level: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Unauthorized' });
        if (locals.user.role !== 'admin') return fail(403, { message: 'Forbidden' });
        const fd = await request.formData();
        const id = String(fd.get('id') ?? '');
        if (!id) return fail(400, { message: 'Missing id' });
        const repo = AppDataSource.getRepository(RiskLevel);
        try {
            await repo.delete(id);
        } catch (e) {
            return fail(400, { message: 'Cannot delete risk level in use' });
        }
        return { message: 'Risk level deleted' };
    }
};
