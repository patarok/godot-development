import type { Actions, PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { AppDataSource, initializeDatabase, Task, Priority, TaskState, Tag, TaskTag, User } from '$lib/server/database';

function slugifyTag(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '').slice(0, 64);
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/login');
  await initializeDatabase();

  const taskRepo = AppDataSource.getRepository(Task);
  const priorityRepo = AppDataSource.getRepository(Priority);
  const stateRepo = AppDataSource.getRepository(TaskState);
  const tagRepo = AppDataSource.getRepository(Tag);

  const [tasks, priorities, states, tags] = await Promise.all([
    taskRepo.find({ order: { createdAt: 'DESC' } }),
    priorityRepo.find({ order: { rank: 'ASC', name: 'ASC' } }),
    stateRepo.find({ order: { rank: 'ASC', name: 'ASC' } }),
    tagRepo.find({ order: { name: 'ASC' } })
  ]);

  return { tasks, priorities, states, tags, user: locals.user };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { message: 'Not authenticated' });
    const form = await request.formData();
    const title = String(form.get('title') ?? '').trim();
    const description = String(form.get('description') ?? '').trim() || null;
    const isDone = form.get('isDone') === 'on';
    const priorityId = form.get('priorityId') as string | null;
    const taskStateId = form.get('taskStateId') as string | null;
    const dueDateStr = String(form.get('dueDate') ?? '').trim();
    const tagsCSV = String(form.get('tags') ?? '').trim();

    if (!title) return fail(400, { message: 'Title is required' });
    if (!dueDateStr) return fail(400, { message: 'Due date is required' });
    if (!taskStateId) return fail(400, { message: 'Task state is required' });

    // find creator user id
    const userRepo = AppDataSource.getRepository(User);
    const creator = await userRepo.findOne({ where: { email: locals.user.email } });

    const taskRepo = AppDataSource.getRepository(Task);
    const task = taskRepo.create({
      title,
      description: description ?? undefined,
      isDone,
      priority: priorityId ? ({ id: priorityId } as any) : undefined,
      taskState: { id: taskStateId } as any,
      dueDate: new Date(dueDateStr)
    });
    if (creator) (task as any).creator = creator;
    await taskRepo.save(task);

    // handle tags
    const tagRepo = AppDataSource.getRepository(Tag);
    const taskTagRepo = AppDataSource.getRepository(TaskTag);
    const tags = tagsCSV
      ? tagsCSV
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    for (const t of tags) {
      const slug = slugifyTag(t);
      let tag = await tagRepo.findOne({ where: { slug } });
      if (!tag) {
        tag = tagRepo.create({ slug, name: t });
        await tagRepo.save(tag);
      }
      const link = taskTagRepo.create({ taskId: task.id, tagId: tag.id });
      try {
        await taskTagRepo.save(link);
      } catch (_) {
        // ignore duplicates via unique index
      }
    }

    return { ok: true };
  },
  toggle: async ({ request }) => {
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    const isDone = form.get('isDone') === 'true';
    if (!id) return fail(400, { message: 'Task id required' });
    const repo = AppDataSource.getRepository(Task);
    await repo.update(id, { isDone });
    return { ok: true };
  },
  tag: async ({ request }) => {
    const form = await request.formData();
    const taskId = String(form.get('taskId') ?? '');
    const tagName = String(form.get('tag') ?? '').trim();
    if (!taskId || !tagName) return fail(400, { message: 'Task and tag required' });
    const slug = slugifyTag(tagName);
    const tagRepo = AppDataSource.getRepository(Tag);
    const taskTagRepo = AppDataSource.getRepository(TaskTag);
    let tag = await tagRepo.findOne({ where: { slug } });
    if (!tag) {
      tag = tagRepo.create({ slug, name: tagName });
      await tagRepo.save(tag);
    }
    const link = taskTagRepo.create({ taskId, tagId: tag.id });
    try {
      await taskTagRepo.save(link);
    } catch (_) {}
    return { ok: true };
  }
};
