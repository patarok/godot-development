import { AppDataSource } from '../../config/datasource';
import {
  Task,
  TaskStatus,
  Priority,
  Tag,
  TaskTag,
  Project,
  ProjectStatus,
  User,
  UserTask,
  Role
} from '../../entities';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function upsertTaskStatus(name: string, rank?: number, color?: string) {
  const repo = AppDataSource.getRepository(TaskStatus);
  let row = await repo.findOne({ where: { name } });
  if (!row) {
    row = repo.create({ name, rank: rank ?? 0, color });
    row = await repo.save(row);
  }
  return row;
}

async function upsertPriority(name: string, rank?: number, color?: string) {
  const repo = AppDataSource.getRepository(Priority);
  let row = await repo.findOne({ where: { name } });
  if (!row) {
    row = repo.create({ name, rank: rank ?? 0, color });
    row = await repo.save(row);
  }
  return row;
}

async function upsertProjectStatus(name: string, rank?: number, color?: string) {
  const repo = AppDataSource.getRepository(ProjectStatus);
  let row = await repo.findOne({ where: { name } });
  if (!row) {
    row = repo.create({ name, rank: rank ?? 0, color });
    row = await repo.save(row);
  }
  return row;
}

async function upsertProject(title: string) {
  const projectRepo = AppDataSource.getRepository(Project);
  let project = await projectRepo.findOne({ where: { title } });
  if (!project) {
    const active = await upsertProjectStatus('Active', 20, '#2b8a3e');
    project = projectRepo.create({
      title,
      projectStatus: active,
      isActive: true,
      isDone: false,
      currentIterationNumber: 0,
      iterationWarnAt: 0
    });
    project = await projectRepo.save(project);
  }
  return project;
}

async function upsertTag(name: string) {
  const repo = AppDataSource.getRepository(Tag);
  const slug = slugify(name);
  let row = await repo.findOne({ where: { slug } });
  if (!row) {
    row = repo.create({ slug, name });
    row = await repo.save(row);
  }
  return row;
}

async function findUserByFullName(fullName: string | undefined | null): Promise<User | null> {
  if (!fullName) return null;
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find({ relations: ['role'] });
  const norm = (s: string) => s.trim().toLowerCase();
  const target = norm(fullName);
  const found = users.find(u => {
    const fn = u.forename ? norm(u.forename) : '';
    const sn = u.surname ? norm(u.surname) : '';
    const combined = (fn + ' ' + sn).trim();
    return combined === target;
  });
  return found ?? null;
}

async function findAnyAdmin(): Promise<User | null> {
  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);
  const adminRole = await roleRepo.findOne({ where: { name: 'admin' } });
  if (!adminRole) return await userRepo.findOne({ where: {}, take: 1 }) as any;
  const admin = await userRepo.findOne({ where: { role: { id: adminRole.id } }, relations: ['role'] });
  return admin ?? (await userRepo.findOne({ where: {}, take: 1 })) ?? null;
}

function statusRank(name: string): number {
  const map: Record<string, number> = {
    'Not Started': 10,
    'In Process': 20,
    'In Review': 30,
    'Completed': 40,
    'Blocked': 50,
    'On Hold': 60
  };
  return map[name] ?? 0;
}

function priorityRank(name: string): number {
  const map: Record<string, number> = {
    'Critical': 1,
    'High': 2,
    'Medium': 3,
    'Low': 4,
    'low prio': 5
  };
  return map[name] ?? 0;
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export async function seedTasksExtended() {
  const taskRepo = AppDataSource.getRepository(Task);
  const taskTagRepo = AppDataSource.getRepository(TaskTag);
  const userTaskRepo = AppDataSource.getRepository(UserTask);

  // Ensure common statuses and priorities exist
  const statuses = ['Not Started', 'In Process', 'In Review', 'Completed', 'Blocked', 'On Hold'];
  const priorities = ['Critical', 'High', 'Medium', 'Low', 'low prio'];
  for (const s of statuses) await upsertTaskStatus(s, statusRank(s));
  for (const p of priorities) await upsertPriority(p, priorityRank(p));

  const projects = [
    'Platform Revamp', 'Security Update', 'Talent Management', 'Funding Round B',
    'Sprint 21', 'AWS Optimization', 'Customer Success', 'Mobile App 2.0'
  ];

  const tagPool = [
    'devops', 'security', 'backend', 'frontend', 'docs', 'research', 'ui', 'ux',
    'performance', 'bug', 'feature', 'cleanup', 'infra', 'cloud', 'agile', 'ops'
  ];

  const knownAssignees = [
    'Grace Lee', 'Jason Miller', 'Samuel Green', 'Eddie Lake', 'Olivia Martinez', 'Daniel Roberts'
  ];

  const creatorFallback = await findAnyAdmin();
  const baseDate = new Date('2025-01-10T09:00:00Z');

  // 1) Create 8 meta tasks first (parents)
  const metaSpecs = Array.from({ length: 8 }).map((_, i) => {
    const title = `Epic ${i + 1}: Meta coordination task`;
    const status = i % 2 === 0 ? 'In Process' : 'Not Started';
    const priority = i % 3 === 0 ? 'High' : 'Medium';
    const plannedStart = addDays(baseDate, i * 2);
    const plannedDue = addDays(baseDate, i * 2 + 10);
    const created = addDays(plannedStart, -1);
    const updated = addDays(plannedStart, 1);
    return {
      title,
      description: 'Type: MetaTask',
      status,
      priority,
      projectTitle: projects[i % projects.length],
      mainAssigneeName: knownAssignees[i % knownAssignees.length],
      plannedStart,
      plannedDue,
      created,
      updated,
      tags: ['meta', 'coordination', tagPool[i % tagPool.length]]
    } as const;
  });

  const savedMetaTasks: Task[] = [];
  for (const spec of metaSpecs) {
    const status = await upsertTaskStatus(spec.status, statusRank(spec.status));
    const priority = await upsertPriority(spec.priority, priorityRank(spec.priority));
    const project = await upsertProject(spec.projectTitle);
    const isDone = /completed|done|closed/i.test(spec.status);

    const mainAssignee = await findUserByFullName(spec.mainAssigneeName);

    const task = taskRepo.create({
      title: spec.title,
      description: spec.description,
      creator: creatorFallback ?? undefined,
      taskStatus: status,
      priority,
      project,
      user: mainAssignee ?? undefined,
      isDone,
      hasSegmentGroupCircle: false,
      isActive: true,
      isMeta: true,
      startDate: spec.created,
      plannedStartDate: spec.plannedStart,
      dueDate: spec.plannedDue,
      doneDate: spec.updated
    });

    const saved = await taskRepo.save(task);
    savedMetaTasks.push(saved);

    for (const t of spec.tags) {
      const tag = await upsertTag(t);
      try { await taskTagRepo.save(taskTagRepo.create({ taskId: saved.id, tagId: tag.id })); } catch {}
    }

    if (mainAssignee) {
      try { await userTaskRepo.save(userTaskRepo.create({ userId: mainAssignee.id, taskId: saved.id })); } catch {}
    }
  }

  // 2) Create 32 regular tasks, with 16 children pointing to metas (2 per meta)
  const regularCount = 32;
  const savedRegularTasks: Task[] = [];

  for (let i = 0; i < regularCount; i++) {
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const projectTitle = projects[i % projects.length];

    const plannedStart = addDays(baseDate, 1 + i);
    const plannedDue = addDays(baseDate, 6 + i);
    const created = addDays(plannedStart, -1);
    const updated = addDays(plannedStart, 2);

    const statusRow = await upsertTaskStatus(status, statusRank(status));
    const priorityRow = await upsertPriority(priority, priorityRank(priority));
    const projectRow = await upsertProject(projectTitle);

    const mainAssigneeName = knownAssignees[i % knownAssignees.length];
    const mainAssignee = await findUserByFullName(mainAssigneeName);

    const isDone = /completed|done|closed/i.test(status);

    // First 16 get a parent (2 children per meta)
    const parent: Task | undefined = i < 16 ? savedMetaTasks[i % savedMetaTasks.length] : undefined;

    const task = taskRepo.create({
      title: `Task ${i + 1}: ${projectTitle}`,
      description: `Type: ${i % 2 === 0 ? 'Feature' : 'Chore'} | Auto-generated`,
      creator: creatorFallback ?? undefined,
      taskStatus: statusRow,
      priority: priorityRow,
      project: projectRow,
      user: mainAssignee ?? undefined,
      parent: parent,
      isDone,
      hasSegmentGroupCircle: false,
      isActive: i % 7 !== 0, // some inactive
      startDate: created,
      plannedStartDate: plannedStart,
      dueDate: plannedDue,
      doneDate: updated
    });

    const saved = await taskRepo.save(task);
    savedRegularTasks.push(saved);

    // Assign 2 random-ish tags
    const tag1 = tagPool[(i * 3) % tagPool.length];
    const tag2 = tagPool[(i * 3 + 5) % tagPool.length];
    for (const t of new Set([tag1, tag2])) {
      const tag = await upsertTag(t);
      try { await taskTagRepo.save(taskTagRepo.create({ taskId: saved.id, tagId: tag.id })); } catch {}
    }

    // Add assignedUsers: the next two user names in rotation
    const extra1 = knownAssignees[(i + 1) % knownAssignees.length];
    const extra2 = knownAssignees[(i + 2) % knownAssignees.length];
    for (const nm of new Set([mainAssigneeName, extra1, extra2])) {
      const u = await findUserByFullName(nm);
      if (!u) continue;
      try { await userTaskRepo.save(userTaskRepo.create({ userId: u.id, taskId: saved.id })); } catch {}
    }
  }

  console.log(`Seeded meta tasks: ${savedMetaTasks.length}`);
  const childrenWithParents = savedRegularTasks.filter((_, i) => i < 16).length;
  console.log(`Regular tasks: ${savedRegularTasks.length} (with parent: ${childrenWithParents})`);
  console.log(`Total tasks inserted by extended seeder: ${savedMetaTasks.length + savedRegularTasks.length}`);
}

async function run() {
  try {
    await AppDataSource.initialize();
  } catch (e: any) {
    console.warn('AppDataSource already initialized or failed to init. Proceeding. Reason:', e?.message ?? e);
  }

  try {
    await seedTasksExtended();
  } finally {
    try { await AppDataSource.destroy(); } catch {}
  }

  console.log('Extended tasks seeding completed.');
  if (typeof process !== 'undefined') process.exit(0);
}

// Execute when run directly
if (import.meta && (process as any)?.argv?.[1]?.includes('tasks_seed_extended')) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
