import type { Actions, PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import {
  AppDataSource,
  initializeDatabase,
  Project,
  Priority,
  ProjectStatus,
  RiskLevel,
  User,
  Task,
  ProjectAssignedUser,
  ProjectResponsibleUser,
  ProjectTask,
  TaskAssignedUser,
  TaskResponsibleUser,
  TaskCurrentUser,
  TaskLog,
  ProjectLog,
  TaskStatus,
  TaskType
} from '$lib/server/database';
import { toPlainArray } from '$lib/utils/index';
import { In } from 'typeorm';
import { logProjectActivity } from '$lib/server/services/projectLogService';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) return redirect(302, '/login');
  await initializeDatabase();

  const projectRepo = AppDataSource.getRepository(Project);
  const priorityRepo = AppDataSource.getRepository(Priority);
  const statusRepo = AppDataSource.getRepository(ProjectStatus);
  const userRepo = AppDataSource.getRepository(User);
  const taskRepo = AppDataSource.getRepository(Task);

  // Load projects with relations (omit taskLinks; we'll fetch root tasks via CTE)
  const projects = await projectRepo.find({
    order: { createdAt: 'DESC' },
    relations: {
      projectStatus: true,
      priority: true,
      riskLevel: true,
      creator: true,
      mainResponsible: true,
      assignedUserLinks: true,
      responsibleUserLinks: true
    }
  });

  const projectIds = projects.map((p) => p.id);

  // Load junctions: assigned and responsible users per project
  const [assignedLinks, responsibleLinks] = projectIds.length
      ? await Promise.all([
        AppDataSource.getRepository(ProjectAssignedUser).find({
          where: { projectId: In(projectIds) },
          relations: { user: true }
        }),
        AppDataSource.getRepository(ProjectResponsibleUser).find({
          where: { projectId: In(projectIds) },
          relations: { user: true }
        })
      ])
      : [[], []];

  const assignedByProject: Record<string, Array<{ id: string; email: string }>> = {};
  const responsibleByProject: Record<string, Array<{ id: string; email: string }>> = {};
  for (const link of assignedLinks as any[]) {
    const list = (assignedByProject[link.projectId] ||= []);
    list.push({ id: link.user.id, email: link.user.email });
  }
  for (const link of responsibleLinks as any[]) {
    const list = (responsibleByProject[link.projectId] ||= []);
    list.push({ id: link.user.id, email: link.user.email });
  }

  // Build project <-> tasks maps using ProjectTask
  const ptRepo = AppDataSource.getRepository(ProjectTask);
  const ptRows = projectIds.length
    ? await ptRepo.find({ where: { projectId: In(projectIds) } })
    : [];

  const taskIdsAll: string[] = [];
  const tasksByProject = new Map<string, Set<string>>();     // projectId -> taskIds
  const projectsByTask = new Map<string, Set<string>>();     // taskId -> projectIds
  for (const row of ptRows) {
    (tasksByProject.get(row.projectId) ?? tasksByProject.set(row.projectId, new Set()).get(row.projectId)!).add(row.taskId);
    (projectsByTask.get(row.taskId) ?? projectsByTask.set(row.taskId, new Set()).get(row.taskId)!).add(row.projectId);
    taskIdsAll.push(row.taskId);
  }

  // Load Task "open" state (isDone=false) for filtering "assignedToOpenTasksInProject"
  const openTaskIds = new Set<string>();
  if (taskIdsAll.length) {
    const taskRows = await AppDataSource.getRepository(Task).find({
      where: { id: In(taskIdsAll) },
      select: ['id', 'isDone']
    });
    for (const t of taskRows) if (!t.isDone) openTaskIds.add(t.id);
  }

  // Load task-level links and logs in batches
  const [taskAssignedLinks, taskResponsibleLinks, taskCurrentLinks, taskLogs] = taskIdsAll.length
    ? await Promise.all([
        AppDataSource.getRepository(TaskAssignedUser).find({
          where: { taskId: In(taskIdsAll) }, relations: { user: true }
        }),
        AppDataSource.getRepository(TaskResponsibleUser).find({
          where: { taskId: In(taskIdsAll) }, relations: { user: true }
        }),
        AppDataSource.getRepository(TaskCurrentUser).find({
          where: { taskId: In(taskIdsAll) }, relations: { user: true }
        }),
        AppDataSource.getRepository(TaskLog).find({
          where: { taskId: In(taskIdsAll) }
        })
      ])
    : [[], [], [], []];

  // Load project-level logs (modifications/admin actions)
  const projectLogs = projectIds.length
    ? await AppDataSource.getRepository(ProjectLog).find({
        where: { projectId: In(projectIds) }
      })
    : [];

  // Prepare per-project user flags
  type Flags = {
    projectAssigned?: boolean;
    projectResponsible?: boolean;
    modifiedProject?: boolean;
    modifiedTasksInProject?: boolean;
    currentlyWorksOnTasksInProject?: boolean;
    assignedToOpenTasksInProject?: boolean;
  };
  const flagsByProjectUser = new Map<string, Map<string, Flags>>(); // projectId -> (userId -> flags)

  function markFlag(projectId: string, userId: string, key: keyof Flags) {
    const perProject = flagsByProjectUser.get(projectId) ?? new Map<string, Flags>();
    const f = perProject.get(userId) ?? {};
    f[key] = true;
    perProject.set(userId, f);
    flagsByProjectUser.set(projectId, perProject);
  }

  // 1) Project-level: already loaded assigned/responsible users
  for (const p of projects) {
    const pid = p.id as string;
    for (const u of assignedByProject[pid] ?? []) markFlag(pid, u.id, 'projectAssigned');
    for (const u of responsibleByProject[pid] ?? []) markFlag(pid, u.id, 'projectResponsible');
  }

  // 2) Task-level links mapped back to projects
  // assigned users on tasks
  for (const link of taskAssignedLinks as any[]) {
    const taskId: string = link.taskId;
    const userId: string = link.user?.id ?? link.userId;
    const projSet = projectsByTask.get(taskId);
    if (!userId || !projSet) continue;
    for (const pid of projSet) {
      if (openTaskIds.has(taskId)) markFlag(pid, userId, 'assignedToOpenTasksInProject');
    }
  }
  // responsible users on tasks
  for (const link of taskResponsibleLinks as any[]) {
    const taskId: string = link.taskId;
    const userId: string = link.user?.id ?? link.userId;
    const projSet = projectsByTask.get(taskId);
    if (!userId || !projSet) continue;
    for (const pid of projSet) {
      if (openTaskIds.has(taskId)) markFlag(pid, userId, 'assignedToOpenTasksInProject');
    }
  }
  // current workers
  for (const link of taskCurrentLinks as any[]) {
    const taskId: string = link.taskId;
    const userId: string = link.user?.id ?? link.userId;
    const projSet = projectsByTask.get(taskId);
    if (!userId || !projSet) continue;
    for (const pid of projSet) {
      markFlag(pid, userId, 'currentlyWorksOnTasksInProject');
    }
  }

  // 3) Logs
  // task logs -> modifiedTasksInProject
  for (const row of taskLogs as any[]) {
    const taskId: string = row.taskId;
    const userId: string = row.userId;
    const projSet = projectsByTask.get(taskId);
    if (!userId || !projSet) continue;
    for (const pid of projSet) markFlag(pid, userId, 'modifiedTasksInProject');
  }
  // project logs -> modifiedProject
  for (const row of projectLogs as any[]) {
    const pid: string = row.projectId;
    const userId: string = row.userId;
    if (pid && userId) markFlag(pid, userId, 'modifiedProject');
  }

  // 4) Fetch the involved users' info in one query
  const allUserIds = new Set<string>();
  for (const [pid, perProject] of flagsByProjectUser) for (const uid of perProject.keys()) allUserIds.add(uid);
  for (const pid of projectIds) {
    for (const u of assignedByProject[pid] ?? []) allUserIds.add(u.id);
    for (const u of responsibleByProject[pid] ?? []) allUserIds.add(u.id);
  }

  const allUsersInfo = allUserIds.size
    ? await AppDataSource.getRepository(User).find({
        where: { id: In([...allUserIds]) },
        select: ['id', 'email', 'username', 'forename', 'surname', 'avatarData'] as any
      })
    : [];
  const userInfoMap = new Map<string, any>();
  for (const u of allUsersInfo) userInfoMap.set(u.id, {
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: (u.username ?? [u.forename, u.surname].filter(Boolean).join(' ')) || u.email,
    avatarData: (u as any).avatarData ?? null
  });

  // 5) Assemble involvedUsers per project
  const involvedUsersByProject: Record<string, Array<any>> = {};
  for (const pid of projectIds) {
    const out: Array<any> = [];
    const seen = new Set<string>();
    const perProject = flagsByProjectUser.get(pid) ?? new Map<string, Flags>();

    // Ensure project-level users are included even if no logs/links
    const includeUser = (userId: string, updater?: (f: Flags) => void) => {
      const f = perProject.get(userId) ?? {};
      if (updater) updater(f);
      perProject.set(userId, f);
    };
    for (const u of assignedByProject[pid] ?? []) includeUser(u.id, (f) => { f.projectAssigned = true; });
    for (const u of responsibleByProject[pid] ?? []) includeUser(u.id, (f) => { f.projectResponsible = true; });

    for (const [uid, flags] of perProject) {
      const info = userInfoMap.get(uid);
      if (!info || seen.has(uid)) continue;
      out.push({ ...info, flags });
      seen.add(uid);
    }
    involvedUsersByProject[pid] = out;
  }

  // Fetch only the top-most parent (root) tasks per project via a recursive CTE.
  // Order by priority rank (0 = lowest, higher = higher priority) descending, then title.
  let rootTasksByProject: Record<
      string,
      Array<{
        id: string;
        title: string;
        status: { id: string; name: string } | null;
        priority: { id: string; name: string; rank: number | null } | null;
        parent: null;
      }>
  > = {};

  if (projectIds.length) {
    const rows = await AppDataSource.query(
        `
      WITH RECURSIVE chain AS (
        SELECT
          pt.project_id,
          pt.task_id AS start_task_id,
          t.id         AS current_id,
          t.parent_task_id,
          ARRAY[t.id]  AS path
        FROM project_task pt
        JOIN task t ON t.id = pt.task_id
        WHERE pt.project_id = ANY($1::uuid[])
        UNION ALL
        SELECT
          c.project_id,
          c.start_task_id,
          t2.id        AS current_id,
          t2.parent_task_id,
          c.path || t2.id
        FROM chain c
        JOIN task t2 ON t2.id = c.parent_task_id
        WHERE NOT t2.id = ANY(c.path)
      ),
      roots AS (
        SELECT DISTINCT project_id, current_id AS root_id
        FROM chain
        WHERE parent_task_id IS NULL
      )
      SELECT
        r.project_id,
        t.id,
        t.title,
        ts.id    AS status_id,
        ts.name  AS status_name,
        pr.id    AS priority_id,
        pr.name  AS priority_name,
        pr.rank  AS priority_rank
      FROM roots r
      JOIN task t ON t.id = r.root_id
      LEFT JOIN task_status ts ON ts.id = t.task_status_id
      LEFT JOIN priority pr    ON pr.id = t.priority_id
      ORDER BY r.project_id, pr.rank DESC NULLS LAST, t.title ASC
      `,
        [projectIds]
    );

    for (const r of rows as any[]) {
      const list = (rootTasksByProject[r.project_id] ||= []);
      list.push({
        id: r.id,
        title: r.title,
        status: r.status_id ? { id: r.status_id, name: r.status_name } : null,
        priority: r.priority_id
            ? { id: r.priority_id, name: r.priority_name, rank: r.priority_rank ?? null }
            : null,
        parent: null
      });
    }
  }

  // Also load selectable lists
  const [priorities, states, riskLevels, users, allTasks, taskStates, taskTypes] = await Promise.all([
    priorityRepo.find({ order: { rank: 'ASC', name: 'ASC' } }),
    statusRepo.find({ order: { rank: 'ASC', name: 'ASC' } }),
    AppDataSource.getRepository(RiskLevel).find({ order: { rank: 'ASC', name: 'ASC' } }),
    userRepo.find({ order: { email: 'ASC' } }),
    taskRepo.find({ order: { createdAt: 'DESC' }, select: { id: true, title: true, isMeta: true } as any }),
    AppDataSource.getRepository(TaskStatus).find({ order: { rank: 'ASC', name: 'ASC' } }),
    AppDataSource.getRepository(TaskType).find({ order: { rank: 'ASC', name: 'ASC' } })
  ]);

  const plainProjects = toPlainArray(projects).map((p: any) => ({
    ...p,
    tasks: rootTasksByProject[p.id] ?? [],
    assignedUsers: assignedByProject[p.id] ?? [],
    responsibleUsers: responsibleByProject[p.id] ?? [],
    involvedUsers: involvedUsersByProject[p.id] ?? []
  }));

  const metaTasks = allTasks.filter((t: any) => t.isMeta === true);

  return {
    projects: plainProjects,
    priorities: toPlainArray(priorities),
    states: toPlainArray(states),
    riskLevels: toPlainArray(riskLevels),
    users: toPlainArray(users),
    tasks: toPlainArray(allTasks),
    taskStates: toPlainArray(taskStates),
    taskPriorities: toPlainArray(priorities),
    taskTypes: toPlainArray(taskTypes),
    metaTasks: toPlainArray(metaTasks),
    user: locals.user
  };
};

// FOR CREATE:
// // After: await projectRepo.save(project);
// import { logProjectActivity } from '$lib/server/services/projectLogService';
// // ...
// if (locals.user) {
//   await logProjectActivity(
//     locals.user.id,
//     project.id,
//     'project.create',
//     `title="${title}" statusId=${projectStatusId} priorityId=${priorityId ?? 'null'}`
//   );
// }

// FOR LINK TASK TO PROJECT(addTask)
// // Change signature to receive locals
// addTask: async ({ request, locals }) => {
//   // ... after you save the junction row:
//   if (!exists) {
//     await ptRepo.save(ptRepo.create({ projectId, taskId }));
//     if (locals.user) {
//       await logProjectActivity(locals.user.id, projectId, 'project.task.add', `taskId=${taskId}`);
//     }
//   }
//   // ...
// }

// REMOVE TASK:
// removeTask: async ({ request, locals }) => {
//   // ... after delete:
//   await ptRepo.delete({ projectId, taskId } as any);
//   if (locals.user) {
//     await logProjectActivity(locals.user.id, projectId, 'project.task.remove', `taskId=${taskId}`);
//   }
//   // ...
// }

// ADD ASSIGNED USER:
// addAssignedUser: async ({ request, locals }) => {
//   // ... after save:
//   if (!existing) {
//     await repo.save(repo.create({ projectId, userId }));
//     if (locals.user) {
//       await logProjectActivity(locals.user.id, projectId, 'project.assigned.add', `userId=${userId}`);
//     }
//   }
//   // ...
// },

// REMOVE ASSIGNED USER:
// removeAssignedUser: async ({ request, locals }) => {
//   // ... after delete:
//   await repo.delete({ projectId, userId } as any);
//   if (locals.user) {
//     await logProjectActivity(locals.user.id, projectId, 'project.assigned.remove', `userId=${userId}`);
//   }
//   // ...
// }

// ADD RESPONSIBLE USER:
// addResponsibleUser: async ({ request, locals }) => {
//   // ... after save:
//   if (!existing) {
//     await repo.save(repo.create({ projectId, userId }));
//     if (locals.user) {
//       await logProjectActivity(locals.user.id, projectId, 'project.responsible.add', `userId=${userId}`);
//     }
//   }
//   // ...
// },

// REMOVE RESPONSIBLE USER:
// removeResponsibleUser: async ({ request, locals }) => {
//   // ... after delete:
//   await repo.delete({ projectId, userId } as any);
//   if (locals.user) {
//     await logProjectActivity(locals.user.id, projectId, 'project.responsible.remove', `userId=${userId}`);
//   }
//   // ...
// }

// SET MAIN RESPONSIBLE:
// setMainResponsible: async ({ request, locals }) => {
//   // ... after update:
//   await repo.update(projectId, { mainResponsible: userId ? ({ id: userId } as any) : null } as any);
//   if (locals.user) {
//     await logProjectActivity(
//       locals.user.id,
//       projectId,
//       'project.mainResponsible.set',
//       `userId=${userId || 'null'}`
//     );
//   }
//   // ...
// }

// missing for REMOVE TASK?

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { message: 'Not authenticated' });
    await initializeDatabase();

    const form = await request.formData();
    const title = String(form.get('title') ?? '').trim();
    const description = String(form.get('description') ?? '').trim() || null;
    const projectStatusId = (form.get('projectStatusId') as string) || null;
    const priorityId = (form.get('priorityId') as string) || null;
    const isActive = form.get('isActive') ? form.get('isActive') === 'on' : true;

    const isDone = form.get('isDone') ? form.get('isDone') === 'on' : false;
    const currentIterationNumber = form.get('currentIterationNumber') ? Number(form.get('currentIterationNumber')) : 0;
    const iterationWarnAt = form.get('iterationWarnAt') ? Number(form.get('iterationWarnAt')) : 0;
    const maxIterations = form.get('maxIterations') ? Number(form.get('maxIterations')) : null;
    const estimatedBudget = form.get('estimatedBudget') ? Number(form.get('estimatedBudget')) : null;
    const actualCost = form.get('actualCost') ? Number(form.get('actualCost')) : null;
    const estimatedHours = form.get('estimatedHours') ? Number(form.get('estimatedHours')) : null;
    const actualHours = form.get('actualHours') ? Number(form.get('actualHours')) : null;
    const startDateStr = String(form.get('startDate') ?? '').trim();
    const endDateStr = String(form.get('endDate') ?? '').trim();
    const actualStartDateStr = String(form.get('actualStartDate') ?? '').trim();
    const actualEndDateStr = String(form.get('actualEndDate') ?? '').trim();
    const riskLevelId = (form.get('riskLevelId') as string) || null;

    const mainResponsibleId = (form.get('mainResponsibleId') as string) || null;
    const assignedUserIds = (form.getAll('assignedUserIds') as string[]).filter(Boolean);
    const responsibleUserIds = (form.getAll('responsibleUserIds') as string[]).filter(Boolean);

    if (!title) return fail(400, { message: 'Title is required' });
    if (!projectStatusId) return fail(400, { message: 'Project state is required' });

    const userRepo = AppDataSource.getRepository(User);
    const creator = await userRepo.findOne({ where: { email: locals.user.email } });

    const projectRepo = AppDataSource.getRepository(Project);
    const project = projectRepo.create({
      title,
      description: description ?? undefined,
      projectStatus: { id: projectStatusId } as any,
      priority: priorityId ? ({ id: priorityId } as any) : undefined,
      isActive,
      isDone,
      currentIterationNumber,
      iterationWarnAt,
      maxIterations: maxIterations ?? undefined,
      estimatedBudget: estimatedBudget ?? undefined,
      actualCost: actualCost ?? undefined,
      estimatedHours: estimatedHours ?? undefined,
      actualHours: actualHours ?? undefined,
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
      actualStartDate: actualStartDateStr ? new Date(actualStartDateStr) : undefined,
      actualEndDate: actualEndDateStr ? new Date(actualEndDateStr) : undefined,
      riskLevel: riskLevelId ? ({ id: riskLevelId } as any) : undefined
    });
    if (creator) {
      (project as any).creator = creator;
      // default mainResponsible to creator if none provided
      if (!mainResponsibleId) {
        (project as any).mainResponsible = creator;
      }
    }
    if (mainResponsibleId) (project as any).mainResponsible = { id: mainResponsibleId } as any;

    await projectRepo.save(project);

    try { await logProjectActivity(locals.user.id, project.id, 'project.create', `title="${title}" statusId=${projectStatusId}`); } catch {}

    // Initialize junctions for assigned and responsible users
    if (assignedUserIds.length) {
      const assignedRepo = AppDataSource.getRepository(ProjectAssignedUser);
      for (const uid of assignedUserIds) {
        const exists = await assignedRepo.findOne({ where: { projectId: project.id, userId: uid } });
        if (!exists) await assignedRepo.save(assignedRepo.create({ projectId: project.id, userId: uid }));
      }
    }
    if (responsibleUserIds.length) {
      const respRepo = AppDataSource.getRepository(ProjectResponsibleUser);
      for (const uid of responsibleUserIds) {
        const exists = await respRepo.findOne({ where: { projectId: project.id, userId: uid } });
        if (!exists) await respRepo.save(respRepo.create({ projectId: project.id, userId: uid }));
      }
    }

    return redirect(303, '/projects');
  },

  update: async ({ request, locals }) => {
    await initializeDatabase();
    const form = await request.formData();

    const idRaw = String(form.get('projectId') ?? form.get('id') ?? '').trim();
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(idRaw)) return fail(400, { message: 'Invalid project id (expected UUID)' });

    const title = String(form.get('title') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();

    const statusName = String(form.get('status') ?? '').trim();
    const projectStatusId = String(form.get('projectStatusId') ?? '').trim();

    const priorityName = String(form.get('priority') ?? '').trim();
    const priorityId = String(form.get('priorityId') ?? '').trim();

    const riskLevelId = String(form.get('riskLevelId') ?? '').trim();

    const isActiveRaw = form.get('isActive');
    const isDoneRaw = form.get('isDone');

    const currentIterationNumberStr = String(form.get('currentIterationNumber') ?? '').trim();
    const iterationWarnAtStr = String(form.get('iterationWarnAt') ?? '').trim();
    const maxIterationsStr = String(form.get('maxIterations') ?? '').trim();
    const estimatedBudgetStr = String(form.get('estimatedBudget') ?? '').trim();
    const actualCostStr = String(form.get('actualCost') ?? '').trim();
    const estimatedHoursStr = String(form.get('estimatedHours') ?? '').trim();
    const actualHoursStr = String(form.get('actualHours') ?? '').trim();

    const startDateStr = String(form.get('startDate') ?? '').trim();
    const endDateStr = String(form.get('endDate') ?? '').trim();
    const actualStartDateStr = String(form.get('actualStartDate') ?? '').trim();
    const actualEndDateStr = String(form.get('actualEndDate') ?? '').trim();

    const mainResponsibleId = String(form.get('mainResponsibleId') ?? '').trim();

    // Assigned and responsible users arrays
    let assignedUserIds: string[] = [];
    let responsibleUserIds: string[] = [];
    const assignedRepeated = form.getAll('assignedUserIds[]');
    const responsibleRepeated = form.getAll('responsibleUserIds[]');
    if (assignedRepeated && assignedRepeated.length) assignedUserIds = assignedRepeated.map(v => String(v)).filter(Boolean);
    if (responsibleRepeated && responsibleRepeated.length) responsibleUserIds = responsibleRepeated.map(v => String(v)).filter(Boolean);

    const projectRepo = AppDataSource.getRepository(Project);
    const statusRepo = AppDataSource.getRepository(ProjectStatus);
    const priorityRepo = AppDataSource.getRepository(Priority);
    const riskRepo = AppDataSource.getRepository(RiskLevel);
    const userRepo = AppDataSource.getRepository(User);
    const assignedRepo = AppDataSource.getRepository(ProjectAssignedUser);
    const responsibleRepo = AppDataSource.getRepository(ProjectResponsibleUser);

    const project = await projectRepo.findOne({ where: { id: idRaw } });
    if (!project) return fail(404, { message: 'Project not found' });

    const msgBits: string[] = [];

    if (title) { project.title = title; msgBits.push(`title="${title}"`); }
    if (description.length || description === '') { project.description = (description || null) as any; }

    // Status by ID (preferred) or by name fallback
    if (projectStatusId && uuidRe.test(projectStatusId)) {
      const st = await statusRepo.findOne({ where: { id: projectStatusId } });
      if (st) { project.projectStatus = st; msgBits.push(`statusId=${projectStatusId}`); }
    } else if (statusName) {
      const st = await statusRepo.findOne({ where: { name: statusName } });
      if (st) { project.projectStatus = st; msgBits.push(`status="${statusName}"`); }
    }

    // Priority by ID or name
    if (priorityId && uuidRe.test(priorityId)) {
      const pr = await priorityRepo.findOne({ where: { id: priorityId } });
      project.priority = pr ?? null as any;
      if (pr) msgBits.push(`priorityId=${priorityId}`);
    } else if (priorityName) {
      const pr = await priorityRepo.findOne({ where: { name: priorityName } });
      project.priority = pr ?? null as any;
      if (pr) msgBits.push(`priority="${priorityName}"`);
    }

    // Risk level
    if (riskLevelId && uuidRe.test(riskLevelId)) {
      const rl = await riskRepo.findOne({ where: { id: riskLevelId } });
      project.riskLevel = rl ?? null as any;
      if (rl) msgBits.push(`riskLevelId=${riskLevelId}`);
    }

    // Booleans
    if (isActiveRaw !== null) {
      const v = String(isActiveRaw);
      project.isActive = v === 'on' || v === 'true' || v === '1';
      msgBits.push(`isActive=${project.isActive}`);
    }
    if (isDoneRaw !== null) {
      const v = String(isDoneRaw);
      project.isDone = v === 'on' || v === 'true' || v === '1';
      msgBits.push(`isDone=${project.isDone}`);
    }

    // Numbers
    const toNum = (s: string) => (s ? Number(s) : NaN);
    const n1 = toNum(currentIterationNumberStr); if (!isNaN(n1)) { project.currentIterationNumber = n1; msgBits.push(`currentIterationNumber=${n1}`); }
    const n2 = toNum(iterationWarnAtStr); if (!isNaN(n2)) { project.iterationWarnAt = n2; msgBits.push(`iterationWarnAt=${n2}`); }
    const n3 = toNum(maxIterationsStr); if (!isNaN(n3)) { (project as any).maxIterations = n3; msgBits.push(`maxIterations=${n3}`); }
    const n4 = toNum(estimatedBudgetStr); if (!isNaN(n4)) { (project as any).estimatedBudget = n4; msgBits.push(`estimatedBudget=${n4}`); }
    const n5 = toNum(actualCostStr); if (!isNaN(n5)) { (project as any).actualCost = n5; msgBits.push(`actualCost=${n5}`); }
    const n6 = toNum(estimatedHoursStr); if (!isNaN(n6)) { (project as any).estimatedHours = n6; msgBits.push(`estimatedHours=${n6}`); }
    const n7 = toNum(actualHoursStr); if (!isNaN(n7)) { (project as any).actualHours = n7; msgBits.push(`actualHours=${n7}`); }

    // Dates
    const parseDate = (s: string) => { const d = new Date(s); return isNaN(d.getTime()) ? null : d; };
    const d1 = parseDate(startDateStr); if (d1) { project.startDate = d1; msgBits.push(`startDate=${startDateStr}`); }
    const d2 = parseDate(endDateStr); if (d2) { project.endDate = d2; msgBits.push(`endDate=${endDateStr}`); }
    const d3 = parseDate(actualStartDateStr); if (d3) { project.actualStartDate = d3; msgBits.push(`actualStartDate=${actualStartDateStr}`); }
    const d4 = parseDate(actualEndDateStr); if (d4) { project.actualEndDate = d4; msgBits.push(`actualEndDate=${actualEndDateStr}`); }

    // Main responsible
    if (mainResponsibleId && uuidRe.test(mainResponsibleId)) {
      const u = await userRepo.findOne({ where: { id: mainResponsibleId } });
      project.mainResponsible = u ?? null as any;
      msgBits.push(`mainResponsibleId=${mainResponsibleId}`);
    }

    await projectRepo.save(project);

    try {
      await logProjectActivity(locals.user?.id ?? '', project.id, 'project.update', msgBits.join(' | ') || undefined);
    } catch {}

    // Sync assigned user links if provided
    if (assignedUserIds.length) {
      const desired = new Set(assignedUserIds);
      const existing = await assignedRepo.find({ where: { projectId: project.id } });
      const existingSet = new Set(existing.map(l => l.userId));

      for (const uid of desired) {
        if (!existingSet.has(uid)) {
          await assignedRepo.save(assignedRepo.create({ projectId: project.id, userId: uid }));
          try { await logProjectActivity(locals.user?.id ?? '', project.id, 'project.assigned.add', `userId=${uid}`); } catch {}
        }
      }
      for (const link of existing) {
        if (!desired.has(link.userId)) {
          await assignedRepo.remove(link);
          try { await logProjectActivity(locals.user?.id ?? '', project.id, 'project.assigned.remove', `userId=${link.userId}`); } catch {}
        }
      }
    }

    // Sync responsible user links if provided
    if (responsibleUserIds.length) {
      const desired = new Set(responsibleUserIds);
      const existing = await responsibleRepo.find({ where: { projectId: project.id } });
      const existingSet = new Set(existing.map(l => l.userId));

      for (const uid of desired) {
        if (!existingSet.has(uid)) {
          await responsibleRepo.save(responsibleRepo.create({ projectId: project.id, userId: uid }));
          try { await logProjectActivity(locals.user?.id ?? '', project.id, 'project.responsible.add', `userId=${uid}`); } catch {}
        }
      }
      for (const link of existing) {
        if (!desired.has(link.userId)) {
          await responsibleRepo.remove(link);
          try { await logProjectActivity(locals.user?.id ?? '', project.id, 'project.responsible.remove', `userId=${link.userId}`); } catch {}
        }
      }
    }

    return { success: true, message: 'Project updated' };
  },

  addTask: async ({ request, locals }) => {
    await initializeDatabase();
    const form = await request.formData();
    const projectId = String(form.get('projectId') ?? '');
    const taskId = String(form.get('taskId') ?? '');
    if (!projectId || !taskId) return fail(400, { message: 'Project and Task are required' });

    // ensure project exists (optional minimal check)
    const projectRepo = AppDataSource.getRepository(Project);
    const project = await projectRepo.findOne({ where: { id: projectId } });
    if (!project) return fail(404, { message: 'Project not found' });

    // Create link in junction table (replace old task.projectId update)
    const ptRepo = AppDataSource.getRepository(ProjectTask);
    const exists = await ptRepo.findOne({ where: { projectId, taskId } });
    if (!exists) {
      await ptRepo.save(ptRepo.create({ projectId, taskId }));
      try { await logProjectActivity(locals.user?.id ?? '', projectId, 'project.task.add', `taskId=${taskId}`); } catch {}
    }

    return redirect(303, '/projects');
  },

  addAssignedUser: async ({ request, locals }) => {
    await initializeDatabase();
    const form = await request.formData();
    const projectId = String(form.get('projectId') ?? '');
    const userId = String(form.get('userId') ?? '');
    if (!projectId || !userId) return fail(400, { message: 'Project and User are required' });
    const repo = AppDataSource.getRepository(ProjectAssignedUser);
    const existing = await repo.findOne({ where: { projectId, userId } });
    if (!existing) {
      await repo.save(repo.create({ projectId, userId }));
      try { await logProjectActivity(locals.user?.id ?? '', projectId, 'project.assigned.add', `userId=${userId}`); } catch {}
    }
    return redirect(303, '/projects');
  },

  removeAssignedUser: async ({ request, locals }) => {
    await initializeDatabase();
    const form = await request.formData();
    const projectId = String(form.get('projectId') ?? '');
    const userId = String(form.get('userId') ?? '');
    if (!projectId || !userId) return fail(400, { message: 'Project and User are required' });
    const repo = AppDataSource.getRepository(ProjectAssignedUser);
    await repo.delete({ projectId, userId } as any);
    try { await logProjectActivity(locals.user?.id ?? '', projectId, 'project.assigned.remove', `userId=${userId}`); } catch {}
    return redirect(303, '/projects');
  },

  addResponsibleUser: async ({ request, locals }) => {
    await initializeDatabase();
    const form = await request.formData();
    const projectId = String(form.get('projectId') ?? '');
    const userId = String(form.get('userId') ?? '');
    if (!projectId || !userId) return fail(400, { message: 'Project and User are required' });
    const repo = AppDataSource.getRepository(ProjectResponsibleUser);
    const existing = await repo.findOne({ where: { projectId, userId } });
    if (!existing) {
      await repo.save(repo.create({ projectId, userId }));
      try { await logProjectActivity(locals.user?.id ?? '', projectId, 'project.responsible.add', `userId=${userId}`); } catch {}
    }
    return redirect(303, '/projects');
  },

  removeResponsibleUser: async ({ request, locals }) => {
    await initializeDatabase();
    const form = await request.formData();
    const projectId = String(form.get('projectId') ?? '');
    const userId = String(form.get('userId') ?? '');
    if (!projectId || !userId) return fail(400, { message: 'Project and User are required' });
    const repo = AppDataSource.getRepository(ProjectResponsibleUser);
    await repo.delete({ projectId, userId } as any);
    try { await logProjectActivity(locals.user?.id ?? '', projectId, 'project.responsible.remove', `userId=${userId}`); } catch {}
    return redirect(303, '/projects');
  },

  setMainResponsible: async ({ request, locals }) => {
    await initializeDatabase();
    const form = await request.formData();
    const projectId = String(form.get('projectId') ?? '');
    const userId = String(form.get('userId') ?? '');
    if (!projectId) return fail(400, { message: 'Project required' });
    const repo = AppDataSource.getRepository(Project);
    await repo.update(projectId, { mainResponsible: userId ? ({ id: userId } as any) : null } as any);
    try { await logProjectActivity(locals.user?.id ?? '', projectId, 'project.mainResponsible.set', `userId=${userId || 'null'}`); } catch {}
    return redirect(303, '/projects');
  },

  removeTask: async ({ request, locals }) => {
    await initializeDatabase();
    const form = await request.formData();
    const projectId = String(form.get('projectId') ?? '');
    const taskId = String(form.get('taskId') ?? '');
    if (!projectId || !taskId) return fail(400, { message: 'Project and Task are required' });

    // Remove link from junction table (replace old task.projectId = null)
    const ptRepo = AppDataSource.getRepository(ProjectTask);
    await ptRepo.delete({ projectId, taskId } as any);
    try { await logProjectActivity(locals.user?.id ?? '', projectId, 'project.task.remove', `taskId=${taskId}`); } catch {}

    return redirect(303, '/projects');
  }
};