import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { AppDataSource, initializeDatabase, Task, Priority, TaskState, Tag, TaskTag, User } from '$lib/server/database';
import { toPlainArray } from '$lib/utils/index';
import { In } from 'typeorm';

function slugifyTag(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '').slice(0, 64);
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) return redirect(302, '/login');
  await initializeDatabase();

  const taskRepo = AppDataSource.getRepository(Task);
  const priorityRepo = AppDataSource.getRepository(Priority);
  const stateRepo = AppDataSource.getRepository(TaskState);
  const tagRepo = AppDataSource.getRepository(Tag);
  const userRepo = AppDataSource.getRepository(User);
  const taskTagRepo = AppDataSource.getRepository(TaskTag);

  // Load tasks with common relations
  const tasks = await taskRepo.find({
    order: { createdAt: 'DESC' },
    relations: { taskState: true, priority: true, creator: true, user: true, parent: true }
  });

  // Load tags per task
  const taskIds = tasks.map((t) => t.id);
  let tagsByTask: Record<string, Array<{ id: string; slug: string; name: string }>> = {};
  if (taskIds.length) {
    const links = await taskTagRepo.find({ where: { taskId: In(taskIds) }, relations: { tag: true } });
    for (const link of links) {
      const list = (tagsByTask[link.taskId] ||= []);
      list.push({ id: link.tag.id, slug: link.tag.slug, name: link.tag.name });
    }
  }

  const [priorities, states, tags, users] = await Promise.all([
    priorityRepo.find({ order: { rank: 'ASC', name: 'ASC' } }),
    stateRepo.find({ order: { rank: 'ASC', name: 'ASC' } }),
    tagRepo.find({ order: { name: 'ASC' } }),
    userRepo.find({ order: { email: 'ASC' } })
  ]);

  const plainTasks = toPlainArray(tasks).map((t: any) => ({ ...t, tags: tagsByTask[t.id] ?? [] }));

  return {
    tasks: plainTasks,
    priorities: toPlainArray(priorities),
    states: toPlainArray(states),
    tags: toPlainArray(tags),
    users: toPlainArray(users),
    user: locals.user
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { message: 'Not authenticated' });
    const form = await request.formData();
    const title = String(form.get('title') ?? '').trim();
    const description = String(form.get('description') ?? '').trim() || null;
    const isDone = form.get('isDone') === 'on';
    const priorityId = (form.get('priorityId') as string) || null;
    const taskStateId = (form.get('taskStateId') as string) || null;
    const dueDateStr = String(form.get('dueDate') ?? '').trim();
    const startDateStr = String(form.get('startDate') ?? '').trim();
    const isActive = form.get('isActive') ? form.get('isActive') === 'on' : true;

    const userId = (form.get('userId') as string) || null;
    const parentTaskId = (form.get('parentTaskId') as string) || null;
    const tagsCSV = String(form.get('tags') ?? '').trim();

    if (!title) return fail(400, { message: 'Title is required' });
    if (!dueDateStr) return fail(400, { message: 'Due date is required' });
    if (!taskStateId) return fail(400, { message: 'Task state is required' });

    await initializeDatabase();

    const userRepo = AppDataSource.getRepository(User);
    const creator = await userRepo.findOne({ where: { email: locals.user.email } });

    const taskRepo = AppDataSource.getRepository(Task);
    const task = taskRepo.create({
      title,
      description: description ?? undefined,
      isDone,
      priority: priorityId ? ({ id: priorityId } as any) : undefined,
      taskState: { id: taskStateId } as any,
      dueDate: new Date(dueDateStr),
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      isActive,
      user: userId ? ({ id: userId } as any) : undefined,
      parent: parentTaskId ? ({ id: parentTaskId } as any) : undefined
    });
    if (creator) (task as any).creator = creator;
    await taskRepo.save(task);

    // handle tags
    const tagRepo = AppDataSource.getRepository(Tag);
    const taskTagRepo = AppDataSource.getRepository(TaskTag);
    const tags = tagsCSV ? tagsCSV.split(',').map((t) => t.trim()).filter(Boolean) : [];

    for (const t of tags) {
      const slug = slugifyTag(t);
      let tag = await tagRepo.findOne({ where: { slug } });
      if (!tag) {
        tag = tagRepo.create({ slug, name: t });
        await tagRepo.save(tag);
      }
      const existing = await taskTagRepo.findOne({ where: { taskId: task.id, tagId: tag.id } });
      if (!existing) {
        await taskTagRepo.save(taskTagRepo.create({ taskId: task.id, tagId: tag.id }));
      }
    }

    // Return a result for runes/reactivity
    return { success: true, message: 'Task created' };
  },
  toggle: async ({ request }) => {
    await initializeDatabase();
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    const isDone = form.get('isDone') === 'true';
    if (!id) return fail(400, { message: 'Task id required' });
    const repo = AppDataSource.getRepository(Task);
    await repo.update(id, { isDone });
    return { success: true, message: 'Task updated' };
  },
  tag: async ({ request }) => {
    await initializeDatabase();
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
    const existing = await taskTagRepo.findOne({ where: { taskId, tagId: tag.id } });
    if (!existing) {
      await taskTagRepo.save(taskTagRepo.create({ taskId, tagId: tag.id }));
    }
    return { success: true, message: 'Tag added' };
  }
};
