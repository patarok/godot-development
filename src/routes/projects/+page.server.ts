import type { Actions, PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { AppDataSource, initializeDatabase, Project, Priority, ProjectStatus, RiskLevel, User, Task, ProjectAssignedUser, ProjectResponsibleUser } from '$lib/server/database';
import { toPlainArray } from '$lib/utils/index';
import { In } from 'typeorm';


export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) return redirect(302, '/login');
  await initializeDatabase();

  const projectRepo = AppDataSource.getRepository(Project);
  const priorityRepo = AppDataSource.getRepository(Priority);
  const statusRepo = AppDataSource.getRepository(ProjectStatus);
  const userRepo = AppDataSource.getRepository(User);
  const taskRepo = AppDataSource.getRepository(Task);

  // Load projects with relations
  const projects = await projectRepo.find({
    order: { createdAt: 'DESC' },
    relations: { projectStatus: true, priority: true, riskLevel: true, creator: true, mainResponsible: true, assignedUserLinks: true, responsibleUserLinks: true }
  });

  // Load tasks belonging to these projects
  const projectIds = projects.map((p) => p.id);
  let tasksByProject: Record<string, Array<{ id: string; title: string }>> = {};
  if (projectIds.length) {
    const tasks = await taskRepo.find({ where: { projectId: In(projectIds) }, select: { id: true, title: true, projectId: true } as any });
    for (const t of tasks as any[]) {
      const list = (tasksByProject[t.projectId] ||= []);
      list.push({ id: t.id, title: t.title });
    }
  }

  // Load junctions: assigned and responsible users per project
  const [assignedLinks, responsibleLinks] = projectIds.length
    ? await Promise.all([
        AppDataSource.getRepository(ProjectAssignedUser).find({ where: { projectId: In(projectIds) }, relations: { user: true } }),
        AppDataSource.getRepository(ProjectResponsibleUser).find({ where: { projectId: In(projectIds) }, relations: { user: true } })
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

  // Also load selectable lists
  const [priorities, states, riskLevels, users, allTasks] = await Promise.all([
    priorityRepo.find({ order: { rank: 'ASC', name: 'ASC' } }),
    statusRepo.find({ order: { rank: 'ASC', name: 'ASC' } }),
    AppDataSource.getRepository(RiskLevel).find({ order: { rank: 'ASC', name: 'ASC' } }),
    userRepo.find({ order: { email: 'ASC' } }),
    taskRepo.find({ order: { createdAt: 'DESC' }, select: { id: true, title: true, projectId: true } as any })
  ]);


  const plainProjects = toPlainArray(projects).map((p: any) => ({
    ...p,
    tasks: tasksByProject[p.id] ?? [],
    assignedUsers: assignedByProject[p.id] ?? [],
    responsibleUsers: responsibleByProject[p.id] ?? []
  }));

  return {
    projects: plainProjects,
    priorities: toPlainArray(priorities),
    states: toPlainArray(states),
    riskLevels: toPlainArray(riskLevels),
    users: toPlainArray(users),
    tasks: toPlainArray(allTasks),
    user: locals.user
  };
};

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

  addTask: async ({ request }) => {
    await initializeDatabase();
    const form = await request.formData();
    const projectId = String(form.get('projectId') ?? '');
    const taskId = String(form.get('taskId') ?? '');
    if (!projectId || !taskId) return fail(400, { message: 'Project and Task are required' });

    const taskRepo = AppDataSource.getRepository(Task);
    // ensure project exists (optional minimal check)
    const projectRepo = AppDataSource.getRepository(Project);
    const project = await projectRepo.findOne({ where: { id: projectId } });
    if (!project) return fail(404, { message: 'Project not found' });

    await taskRepo.update(taskId, { projectId });
    return redirect(303, '/projects');
  },

  addAssignedUser: async ({ request }) => {
    await initializeDatabase();
    const form = await request.formData();
    const projectId = String(form.get('projectId') ?? '');
    const userId = String(form.get('userId') ?? '');
    if (!projectId || !userId) return fail(400, { message: 'Project and User are required' });
    const repo = AppDataSource.getRepository(ProjectAssignedUser);
    const existing = await repo.findOne({ where: { projectId, userId } });
    if (!existing) {
      await repo.save(repo.create({ projectId, userId }));
    }
    return redirect(303, '/projects');
  },

  removeAssignedUser: async ({ request }) => {
    await initializeDatabase();
    const form = await request.formData();
    const projectId = String(form.get('projectId') ?? '');
    const userId = String(form.get('userId') ?? '');
    if (!projectId || !userId) return fail(400, { message: 'Project and User are required' });
    const repo = AppDataSource.getRepository(ProjectAssignedUser);
    await repo.delete({ projectId, userId } as any);
    return redirect(303, '/projects');
  },

  addResponsibleUser: async ({ request }) => {
    await initializeDatabase();
    const form = await request.formData();
    const projectId = String(form.get('projectId') ?? '');
    const userId = String(form.get('userId') ?? '');
    if (!projectId || !userId) return fail(400, { message: 'Project and User are required' });
    const repo = AppDataSource.getRepository(ProjectResponsibleUser);
    const existing = await repo.findOne({ where: { projectId, userId } });
    if (!existing) {
      await repo.save(repo.create({ projectId, userId }));
    }
    return redirect(303, '/projects');
  },

  removeResponsibleUser: async ({ request }) => {
    await initializeDatabase();
    const form = await request.formData();
    const projectId = String(form.get('projectId') ?? '');
    const userId = String(form.get('userId') ?? '');
    if (!projectId || !userId) return fail(400, { message: 'Project and User are required' });
    const repo = AppDataSource.getRepository(ProjectResponsibleUser);
    await repo.delete({ projectId, userId } as any);
    return redirect(303, '/projects');
  },

  setMainResponsible: async ({ request }) => {
    await initializeDatabase();
    const form = await request.formData();
    const projectId = String(form.get('projectId') ?? '');
    const userId = String(form.get('userId') ?? '');
    if (!projectId) return fail(400, { message: 'Project required' });
    const repo = AppDataSource.getRepository(Project);
    await repo.update(projectId, { mainResponsible: userId ? ({ id: userId } as any) : null } as any);
    return redirect(303, '/projects');
  },


  removeTask: async ({ request }) => {
    await initializeDatabase();
    const form = await request.formData();
    const taskId = String(form.get('taskId') ?? '');
    if (!taskId) return fail(400, { message: 'Task is required' });
    const taskRepo = AppDataSource.getRepository(Task);
    await taskRepo.update(taskId, { projectId: null as any });
    return redirect(303, '/projects');
  }
};
