import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import {
  AppDataSource,
  initializeDatabase,
  Task,
  Priority,
  Project,
  TaskStatus,
  Tag,
  TaskTag,
  User,
  UserTask,
  TimeEntry,
  ProjectUser,
  TaskType
} from '$lib/server/database';
import { toPlainArray } from '$lib/utils/index';
import { In, Between } from 'typeorm';

function slugifyTag(s: string) {
  return s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '')
      .slice(0, 64);
}

// Type helpers: embed selected type into description as `Type: <value> | rest`
function extractTypeFromDescription(desc?: string | null): string {
  if (!desc) return '';
  const m = desc.match(/\bType:\s*([^|\n\r]+)/i);
  return (m?.[1]?.trim() ?? '');
}
function stripTypeInDescription(desc?: string | null): string {
  if (!desc) return '';
  return desc
    .replace(/^\s*Type:\s*[^|\n\r]+\s*\|\s*/i, '')
    .replace(/^\s*Type:\s*[^|\n\r]+\s*/i, '')
    .trim();
}
function withTypeInDescription(type: string, rest: string): string {
  const cleanRest = (rest ?? '').trim();
  const t = (type ?? '').trim();
  if (!t && !cleanRest) return '';
  if (!t) return cleanRest;
  if (!cleanRest) return `Type: ${t}`;
  return `Type: ${t} | ${cleanRest}`;
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) return redirect(302, '/login');
  await initializeDatabase();

  const taskRepo = AppDataSource.getRepository(Task);
  const projectRepo = AppDataSource.getRepository(Project);
  const priorityRepo = AppDataSource.getRepository(Priority);
  const stateRepo = AppDataSource.getRepository(TaskStatus);
  const tagRepo = AppDataSource.getRepository(Tag);
  const userRepo = AppDataSource.getRepository(User);
  const taskTagRepo = AppDataSource.getRepository(TaskTag);
  const typeRepo = AppDataSource.getRepository(TaskType);


  const genericTaskDataShort = [
    {
      id: 1,
      header: "Cover page",
      type: "Cover page",
      status: "In Process",
      priority: "low prio",
      assignedProject: "I am at least 18 :) ",
      plannedSchedule: {
        plannedStart: new Date("2025-01-15T08:00:00Z"),
        plannedDue: new Date("2025-01-25T17:00:00Z")
      },
      mainAssignee: "Eddie Lake",
      assignedUsers: [ "Frodo", "Bilbo", "Gandalf", "Gollum Gollum" ],
      isActive: 'false',
      created: new Date("2025-01-06T09:15:00Z"),
      updated: new Date("2025-01-06T09:15:00Z"),
      tags: [ "schmurgul", "furgul", "gurgul", "liebesgruesseausmordor" ]
    },
    {
      id: 2,
      header: "Set up CI/CD pipeline",
      type: "DevOps",
      status: "Not Started",
      priority: "Medium",
      assignedProject: "Internal Tools",
      plannedSchedule: {
        plannedStart: new Date("2025-01-15T08:00:00Z"),
        plannedDue: new Date("2025-01-25T17:00:00Z")
      },
      mainAssignee: "David Clark",
      assignedUsers: ["Eve Turner", "Frank Harris"],
      isActive: true,
      created: new Date("2025-01-06T09:15:00Z"),
      updated: new Date("2025-01-06T09:15:00Z"),
      tags: ["automation", "deployment", "github-actions"]
    },
    ];


  const dropExamples = [
    {
      data: {id: 'development-tasks', title: 'Development Tasks', description: 'Technical implementation tasks'},
      nesteds: [
        {id: 'setup-project', title: 'Setup Project', description: 'Initialize repository and configure tools'},
        {id: 'create-components', title: 'Create Components', description: 'Build reusable UI components'},
      ],
    },
    {
      data: {id: 'design-tasks', title: 'Design Tasks', description: 'UI/UX design related tasks'},
      nesteds: [
        {id: 'color-palette', title: 'Color Palette', description: 'Define brand colors and variants'},
        {id: 'typography', title: 'Typography', description: 'Select and implement fonts'},
      ],
    },
  ];

  // Load tasks with relations
  const tasks = await taskRepo.find({
    order: { createdAt: 'DESC' },
    relations: { taskStatus: true, priority: true, creator: true, user: true, parent: true, taskType: true }
  });

  // Load tags per task
  const taskIds = tasks.map(t => t.id);
  const tagsByTask: Record<string, { id: string; slug: string; name: string }[]> = {};

  if (taskIds.length) {
    const links = await taskTagRepo.find({ where: { taskId: In(taskIds) }, relations: { tag: true } });
    for (const link of links) {
      (tagsByTask[link.taskId] ||= []).push({ id: link.tag.id, slug: link.tag.slug, name: link.tag.name });
    }
  }

  const [projects, priorities, states, tags, users, types] = await Promise.all([
    projectRepo.find({ where: { isActive: true }, order: { title: 'ASC' } }),
    priorityRepo.find({ order: { rank: 'ASC', name: 'ASC' } }),
    stateRepo.find({ order: { rank: 'ASC', name: 'ASC' } }),
    tagRepo.find({ order: { name: 'ASC' } }),
    userRepo.find({ order: { email: 'ASC' }, relations: { role: true, subRoles: { subRoleCfg: true } } }),
    typeRepo.find({ order: { rank: 'ASC', name: 'ASC' } })
  ]);

  // Build assigned users by task via UserTask links
  const usersByTask: Record<string, string[]> = {};
  const userIdsByTask: Record<string, string[]> = {};
  if (taskIds.length) {
    const userTaskRepo = AppDataSource.getRepository(UserTask);
    const links = await userTaskRepo.find({ where: { taskId: In(taskIds) }, relations: { user: true } });
    for (const link of links as any[]) {
      const u = link.user as any;
      const name = `${(u?.forename ?? '').trim()} ${(u?.surname ?? '').trim()}`.trim() || u?.email || '';
      if (!usersByTask[link.taskId]) usersByTask[link.taskId] = [];
      if (!userIdsByTask[link.taskId]) userIdsByTask[link.taskId] = [];
      if (name) usersByTask[link.taskId].push(name);
      if (u?.id) userIdsByTask[link.taskId].push(u.id);
    }
  }

  // Aggregate time entries per task by day (last 14 days)
  const timeSeriesByTask: Record<string, { date: Date; minutes: number }[]> = {};
  if (taskIds.length) {
    const timeRepo = AppDataSource.getRepository(TimeEntry);
    const now = new Date();
    // Create a UTC window: from start of day -59 days to start of next day (exclusive)
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - 59); // 60 days window

    const entries = await timeRepo.find({
      where: {
        taskId: In(taskIds),
        startedAt: Between(start, end)
      }
    });

    const bucket: Record<string, Record<string, number>> = {};
    const dayKey = (d: Date) => new Date(d).toISOString().slice(0, 10); // YYYY-MM-DD

    for (const e of entries) {
      const key = dayKey(e.startedAt);
      const minutes = (e.minutes ?? (e.endedAt ? Math.max(0, Math.round((new Date(e.endedAt).getTime() - new Date(e.startedAt).getTime()) / 60000)) : 0)) || 0;
      if (!bucket[e.taskId]) bucket[e.taskId] = {};
      bucket[e.taskId][key] = (bucket[e.taskId][key] ?? 0) + minutes;
    }

    for (const tid of Object.keys(bucket)) {
      const perDay = bucket[tid];
      const series = Object.keys(perDay)
        .sort()
        .map((dk) => ({ date: new Date(dk + 'T00:00:00Z'), minutes: perDay[dk] }));
      timeSeriesByTask[tid] = series;
    }
  }

  // Helpers local to this page for mapping domain -> table row shape
  function fullNameOrEmail(u?: any): string {
    if (!u) return '';
    const name = `${(u.forename ?? '').trim()} ${(u.surname ?? '').trim()}`.trim();
    return name || u.email || '';
  }
  function extractTypeFromDescription(desc?: string | null): string {
    if (!desc) return '';
    const m = desc.match(/\bType:\s*([^|\n\r]+)/i);
    return (m?.[1]?.trim() ?? '');
  }

  // Build project -> userIds map for available users
  const projectIds = Array.from(new Set(tasks.map(t => t.projectId).filter(Boolean))) as string[];
  const projectUsersMap: Record<string, Set<string>> = {};
  if (projectIds.length) {
    const puRepo = AppDataSource.getRepository(ProjectUser);
    const pus = await puRepo.find({ where: { projectId: In(projectIds) } });
    for (const pu of pus) {
      (projectUsersMap[pu.projectId] ||= new Set<string>()).add(pu.userId);
    }
  }

  function projectUserInfo(u: any) {
    return {
      id: u.id,
      email: u.email,
      forename: u.forename ?? null,
      surname: u.surname ?? null,
      username: u.username ?? null,
      roleName: u.role?.name ?? null,
      subroles: Array.isArray(u.subRoles) ? u.subRoles.map((sr: any) => sr?.subRoleCfg?.title).filter(Boolean) : [],
      avatarData: u.avatarData ?? null,
      fullName: `${(u.forename ?? '').trim()} ${(u.surname ?? '').trim()}`.trim() || u.username || u.email
    };
  }

  console.log("Tasks on SERVER FILE before MAP:", tasks);
  // Projected rows for the task table (kept here per page-owner request)
  const tasksProjected = tasks.map((t, idx) => {
    const avSet = t.projectId ? (projectUsersMap[t.projectId] ?? null) : null;
    const availableUsers = (avSet ? users.filter((u: any) => avSet.has(u.id)) : users).map(projectUserInfo);
    return {
      // Use a numeric, table-friendly id while we still have UUIDs in the entity
      id: idx + 1,
      taskUuid: t.id,
      header: t.title,
      type: t.taskType?.name ?? 'foo',
      description: t.description ?? '',
      status: t.taskStatus?.name ?? '',
      priority: t.priority?.name ?? '',
      assignedProject: t.project?.title ?? '',
      projectId: t.projectId ?? null,
      plannedSchedule: {
        plannedStart: t.plannedStartDate ?? undefined,
        plannedDue: t.dueDate ?? undefined,
      },
      mainAssignee: fullNameOrEmail(t.user),
      mainAssigneeId: t.user?.id ?? null,
      assignedUsers: usersByTask[t.id] ?? [],
      assignedUserIds: userIdsByTask[t.id] ?? [],
      availableUsers,
      isActive: !!t.isActive,
      created: t.createdAt,
      updated: t.updatedAt,
      tags: (tagsByTask[t.id] ?? []).map((x) => x.name),
      timeSeriesDaily: timeSeriesByTask[t.id] ?? [],
    };
  });

  //debugger;
  return {
    dropContainerItems: dropExamples,
    tasksProjected,
    projects: toPlainArray(projects),
    priorities: toPlainArray(priorities),
    states: toPlainArray(states),
    tags: toPlainArray(tags),
    users: toPlainArray(users),
    types: toPlainArray(types),
    user: locals.user,
    mTasks: toPlainArray(tasks)
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { message: 'Not authenticated' });

    const form = await request.formData();
    const title = String(form.get('title') ?? '').trim();
    const description = String(form.get('description') ?? '').trim() || null;
    const isDone = form.get('isDone') === 'on';
    const priorityId = String(form.get('priorityId') ?? null);
    const taskStatusId = String(form.get('taskStatusId') ?? '');
    const dueDateStr = String(form.get('dueDate') ?? '').trim();
    const plannedStartDateStr = String(form.get('plannedStartDate') ?? '').trim();
    const isActive = form.get('isActive') ? form.get('isActive') === 'on' : true;
    const isMeta = form.get('isMeta') === 'on';
    const parentTaskId = String(form.get('parentTaskId') ?? null);
    const tagsCSV = String(form.get('tags') ?? '').trim();

    if (!title) return fail(400, { message: 'Title is required' });
    if (!plannedStartDateStr) return fail(400, { message: 'Planned start date is required' });
    if (!dueDateStr) return fail(400, { message: 'Due date is required' });
    if (!taskStatusId) return fail(400, { message: 'Task state is required' });

    await initializeDatabase();

    const userRepo = AppDataSource.getRepository(User);
    const creator = await userRepo.findOne({ where: { email: locals.user.email } });

    const taskRepo = AppDataSource.getRepository(Task);
    const task = taskRepo.create({
      title,
      description: description ?? undefined,
      isDone,
      isActive,
      isMeta,
      priority: priorityId ? ({ id: priorityId } as any) : undefined,
      taskStatus: { id: taskStatusId } as any,
      plannedStartDate: new Date(plannedStartDateStr),
      dueDate: new Date(dueDateStr),
      parent: parentTaskId ? ({ id: parentTaskId } as any) : undefined,
      creator: creator ?? undefined
    });

    await taskRepo.save(task);

    // handle tags
    const tagRepo = AppDataSource.getRepository(Tag);
    const taskTagRepo = AppDataSource.getRepository(TaskTag);
    const tags = tagsCSV ? tagsCSV.split(',').map(t => t.trim()).filter(Boolean) : [];

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

    return { success: true, message: 'Task created' };
  },

  // Update action for inline task editing from task-data-table-cell-viewer.svelte
  update: async ({ request }) => {
    await initializeDatabase();
    const form = await request.formData();

    // const idRaw = String(form.get('taskUuid') ?? form.get('id') ?? '').trim();
    // if (!idRaw) return fail(400, { message: 'Task id required' });

    const idRaw = String(form.get('taskUuid') ?? form.get('id') ?? '').trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idRaw);
    if (!isUuid) return fail(400, { message: 'Invalid task id (expected UUID)' });

    const header = String(form.get('header') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();
    const typeSelected = String(form.get('type') ?? '').trim();
    const typeId = String(form.get('typeId') ?? '').trim();
    const statusName = String(form.get('status') ?? '').trim();
    const priorityName = String(form.get('priority') ?? '').trim();
    const assignedProjectId = String(form.get('assignedProject') ?? '').trim();
    const plannedStartStr = String(form.get('plannedStart') ?? '').trim();
    const plannedDueStr = String(form.get('plannedDue') ?? '').trim();
    const mainAssigneeEmail = String(form.get('mainAssignee') ?? '').trim();
    const assignedUsersCSV = String(form.get('assignedUsers') ?? '').trim();
    const isActiveRaw = form.get('isActive');
    const tagsCSV = String(form.get('tags') ?? '').trim();

    // New ID-based fields
    const projectIdNew = String(form.get('projectId') ?? form.get('assignedProject') ?? '').trim();
    const mainAssigneeId = String(form.get('mainAssigneeId') ?? '').trim();
    let assignedUserIds: string[] = [];
    const repeatedIds = form.getAll('assignedUserIds[]');
    if (repeatedIds && repeatedIds.length) {
      assignedUserIds = repeatedIds.map(v => String(v)).filter(Boolean);
    } else {
      const assignedUserIdsJson = String(form.get('assignedUserIdsJson') ?? '').trim();
      if (assignedUserIdsJson) {
        try { assignedUserIds = JSON.parse(assignedUserIdsJson); } catch {}
      }
    }

    const taskRepo = AppDataSource.getRepository(Task);
    const statusRepo = AppDataSource.getRepository(TaskStatus);
    const priorityRepo = AppDataSource.getRepository(Priority);
    const typeRepo = AppDataSource.getRepository(TaskType);
    const userRepo = AppDataSource.getRepository(User);
    const taskTagRepo = AppDataSource.getRepository(TaskTag);
    const tagRepo = AppDataSource.getRepository(Tag);
    const userTaskRepo = AppDataSource.getRepository(UserTask);

    const task = await taskRepo.findOne({ where: { id: idRaw } });
    if (!task) return fail(404, { message: 'Task not found' });

    if (header) task.title = header;
    // Store description without any legacy "Type:" prefix
    {
      const restOnly = stripTypeInDescription(description);
      task.description = (restOnly || null) as any;
    }

    if (isActiveRaw !== null) {
      const v = String(isActiveRaw);
      task.isActive = v === 'on' || v === 'true' || v === '1';
    }

    if (statusName) {
      const st = await statusRepo.findOne({ where: { name: statusName } });
      if (st) task.taskStatus = st;
    }

    if (priorityName) {
      const pr = await priorityRepo.findOne({ where: { name: priorityName } });
      task.priority = pr ?? null as any;
    }

    // Task type by ID (preferred) or by name (fallback)
    if (typeId && uuidRe.test(typeId)) {
      const tt = await typeRepo.findOne({ where: { id: typeId } });
      task.taskType = tt ?? null as any;
    } else if (typeSelected) {
      const tt = await typeRepo.findOne({ where: { name: typeSelected } });
      if (tt) task.taskType = tt;
    }

    // Project can be blank; prefer explicit projectIdNew when provided
    const projectField = projectIdNew || assignedProjectId;
    if (projectField === '') {
      task.projectId = null as any;
    } else if (projectField) {
      task.projectId = projectField;
    }

    if (plannedStartStr) {
      const d = new Date(plannedStartStr);
      if (!isNaN(d.getTime())) task.plannedStartDate = d;
    }
    if (plannedDueStr) {
      const d = new Date(plannedDueStr);
      if (!isNaN(d.getTime())) task.dueDate = d;
    }

    // Main assignee by ID (preferred) or email (fallback)
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (mainAssigneeId && uuidRe.test(mainAssigneeId)) {
      const u = await userRepo.findOne({ where: { id: mainAssigneeId } });
      task.user = u ?? null as any;
    } else if (mainAssigneeEmail) {
      const u = await userRepo.findOne({ where: { email: mainAssigneeEmail } });
      task.user = u ?? null as any;
    }

    await taskRepo.save(task);

    // Sync tags if provided
    if (tagsCSV.length) {
      const desiredTags = tagsCSV.split(',').map(s => s.trim()).filter(Boolean);
      const desiredSlugs = new Set(desiredTags.map(slugifyTag));

      const existingLinks = await taskTagRepo.find({ where: { taskId: task.id }, relations: { tag: true } });
      const existingBySlug = new Map(existingLinks.map(l => [l.tag.slug, l] as const));

      // Add missing
      for (const name of desiredTags) {
        const slug = slugifyTag(name);
        if (!existingBySlug.has(slug)) {
          let tag = await tagRepo.findOne({ where: { slug } });
          if (!tag) {
            tag = tagRepo.create({ slug, name });
            await tagRepo.save(tag);
          }
          await taskTagRepo.save(taskTagRepo.create({ taskId: task.id, tagId: tag.id }));
        }
      }
      // Remove extras
      for (const [slug, link] of existingBySlug) {
        if (!desiredSlugs.has(slug)) {
          await taskTagRepo.remove(link);
        }
      }
    }

    // Sync assigned users by IDs (preferred) or fallback to CSV emails
    if (assignedUserIds.length) {
      const desiredIds = new Set(assignedUserIds);
      const existingLinks = await userTaskRepo.find({ where: { taskId: task.id } });
      const existingIds = new Set(existingLinks.map(l => l.userId));

      for (const uid of desiredIds) {
        if (!existingIds.has(uid)) {
          await userTaskRepo.save(userTaskRepo.create({ userId: uid, taskId: task.id }));
        }
      }
      for (const link of existingLinks) {
        if (!desiredIds.has(link.userId)) {
          await userTaskRepo.remove(link);
        }
      }
    } else if (assignedUsersCSV.length) {
      const desiredEmails = assignedUsersCSV.split(',').map(s => s.trim()).filter(Boolean);
      const users = await userRepo.find({ where: { email: In(desiredEmails) } });
      const desiredIds = new Set(users.map(u => u.id));

      const existingLinks = await userTaskRepo.find({ where: { taskId: task.id } });
      const existingIds = new Set(existingLinks.map(l => l.userId));

      // Add missing links
      for (const uid of desiredIds) {
        if (!existingIds.has(uid)) {
          await userTaskRepo.save(userTaskRepo.create({ userId: uid, taskId: task.id }));
        }
      }
      // Remove extra links
      for (const link of existingLinks) {
        if (!desiredIds.has(link.userId)) {
          await userTaskRepo.remove(link);
        }
      }
    }

    return { success: true, message: 'Task updated' };
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
