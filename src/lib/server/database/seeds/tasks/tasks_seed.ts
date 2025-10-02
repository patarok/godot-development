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
  const users = await userRepo.find();
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

type TaskSpec = {
  id: number;
  header: string;
  type: string;
  status: string;
  priority: string;
  assignedProject?: string;
  plannedSchedule: { plannedStart: Date; plannedDue: Date };
  mainAssignee?: string;
  assignedUsers?: string[];
  isActive?: boolean | string;
  created?: Date;
  updated?: Date;
  tags?: string[];
  isMeta?: boolean;
};

const genericTaskData: TaskSpec[] = [
  {
    id: 10,
    header: 'Onboarding new hires',
    type: 'HR',
    status: 'In Process',
    priority: 'Medium',
    assignedProject: 'Talent Management',
    plannedSchedule: { plannedStart: new Date('2025-01-03T09:00:00Z'), plannedDue: new Date('2025-01-31T18:00:00Z') },
    mainAssignee: 'Angela Morris',
    assignedUsers: ['Uma Collins', 'Victor Perez'],
    isActive: true,
    created: new Date('2025-01-02T09:15:00Z'),
    updated: new Date('2025-01-15T10:30:00Z'),
    tags: ['hr', 'onboarding', 'training']
  },
  {
    id: 11,
    header: 'Cloud infrastructure cost review',
    type: 'Finance/DevOps',
    status: 'In Process',
    priority: 'High',
    assignedProject: 'AWS Optimization',
    plannedSchedule: { plannedStart: new Date('2025-01-12T10:00:00Z'), plannedDue: new Date('2025-01-28T16:00:00Z') },
    mainAssignee: 'Daniel Roberts',
    assignedUsers: ['Wendy Hughes', 'Xavier Murphy'],
    isActive: true,
    created: new Date('2025-01-07T12:10:00Z'),
    updated: new Date('2025-01-13T15:25:00Z'),
    tags: ['aws', 'cost', 'cloud'],
    isMeta: true
  },
  {
    id: 12,
    header: 'Refactor authentication module',
    type: 'Backend',
    status: 'Not Started',
    priority: 'Critical',
    assignedProject: 'Security Update',
    plannedSchedule: { plannedStart: new Date('2025-01-18T09:00:00Z'), plannedDue: new Date('2025-01-27T18:00:00Z') },
    mainAssignee: 'Grace Lee',
    assignedUsers: ['Zachary Lee', 'Alan Kim'],
    isActive: true,
    created: new Date('2025-01-09T08:00:00Z'),
    updated: new Date('2025-01-09T08:00:00Z'),
    tags: ['auth', 'security', 'backend']
  },
  {
    id: 13,
    header: 'Prepare investor presentation',
    type: 'Business',
    status: 'In Review',
    priority: 'High',
    assignedProject: 'Funding Round B',
    plannedSchedule: { plannedStart: new Date('2025-01-05T10:00:00Z'), plannedDue: new Date('2025-01-15T17:00:00Z') },
    mainAssignee: 'Olivia Martinez',
    assignedUsers: ['Brian Clark', 'David Clark'],
    isActive: true,
    created: new Date('2025-01-04T14:20:00Z'),
    updated: new Date('2025-01-14T11:40:00Z'),
    tags: ['investors', 'presentation', 'pitchdeck']
  },
  {
    id: 16,
    header: 'Sprint retrospective',
    type: 'Agile',
    status: 'Completed',
    priority: 'Medium',
    assignedProject: 'Sprint 21',
    plannedSchedule: { plannedStart: new Date('2025-01-01T09:00:00Z'), plannedDue: new Date('2025-01-07T16:00:00Z') },
    mainAssignee: 'Jason Miller',
    assignedUsers: ['Karen Scott', 'Leo Carter'],
    isActive: false,
    created: new Date('2024-12-28T12:00:00Z'),
    updated: new Date('2025-01-07T16:10:00Z'),
    tags: ['agile', 'scrum', 'retrospective']
  }
];

const genericTaskDataShort: TaskSpec[] = [
  {
    id: 1,
    header: 'Cover page',
    type: 'Cover page',
    status: 'In Process',
    priority: 'low prio',
    assignedProject: 'I am at least 18 :) ',
    plannedSchedule: { plannedStart: new Date('2025-01-15T08:00:00Z'), plannedDue: new Date('2025-01-25T17:00:00Z') },
    mainAssignee: 'Eddie Lake',
    assignedUsers: ['Frodo', 'Bilbo', 'Gandalf', 'Gollum Gollum'],
    isActive: 'false',
    created: new Date('2025-01-06T09:15:00Z'),
    updated: new Date('2025-01-06T09:15:00Z'),
    tags: ['schmurgul', 'furgul', 'gurgul', 'liebesgruesseausmordor'],
    isMeta: true
  },
  {
    id: 2,
    header: 'Set up CI/CD pipeline',
    type: 'DevOps',
    status: 'Not Started',
    priority: 'High',
    assignedProject: 'Platform Revamp',
    plannedSchedule: { plannedStart: new Date('2025-01-16T09:00:00Z'), plannedDue: new Date('2025-01-26T18:00:00Z') },
    mainAssignee: 'Samuel Green',
    assignedUsers: ['Clara Moore', 'Ethan Lewis'],
    isActive: true,
    created: new Date('2025-01-10T10:00:00Z'),
    updated: new Date('2025-01-10T10:00:00Z'),
    tags: ['devops', 'ci', 'cd']
  }
];

function coerceBool(v: boolean | string | undefined): boolean {
  if (typeof v === 'string') return v.toLowerCase() !== 'false';
  return v !== false;
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

export async function seedTasks() {
  const taskRepo = AppDataSource.getRepository(Task);
  const taskTagRepo = AppDataSource.getRepository(TaskTag);
  const userTaskRepo = AppDataSource.getRepository(UserTask);

  const creatorFallback = await findAnyAdmin();

  const allSpecs = [...genericTaskDataShort, ...genericTaskData];
  for (const spec of allSpecs) {
    const status = await upsertTaskStatus(spec.status, statusRank(spec.status));
    const priority = await upsertPriority(spec.priority, priorityRank(spec.priority));
    const project = spec.assignedProject ? await upsertProject(spec.assignedProject) : null;

    const isDone = /completed|done|closed/i.test(spec.status);
    const startDate = spec.created ?? spec.plannedSchedule.plannedStart ?? new Date();
    const dueDate = spec.plannedSchedule?.plannedDue ?? new Date();
    const doneDate = spec.updated ?? dueDate;

    const mainAssignee = await findUserByFullName(spec.mainAssignee ?? undefined);

    const task = taskRepo.create({
      title: spec.header,
      description: spec.type ? `Type: ${spec.type}` : undefined,
      creator: creatorFallback ?? undefined,
      taskStatus: status,
      priority,
      project: project ?? undefined,
      user: mainAssignee ?? undefined,
      isDone,
      hasSegmentGroupCircle: false,
      isActive: coerceBool(spec.isActive),
      isMeta: spec.isMeta === true,
      startDate,
      plannedStartDate: spec.plannedSchedule?.plannedStart ?? startDate,
      dueDate,
      doneDate
    });

    const saved = await taskRepo.save(task);

    // Tags
    const tagNames = spec.tags ?? [];
    for (const t of tagNames) {
      const tag = await upsertTag(t);
      try {
        await taskTagRepo.save(taskTagRepo.create({ taskId: saved.id, tagId: tag.id }));
      } catch {}
    }

    // Assigned users (including mainAssignee for convenience)
    const names = [spec.mainAssignee, ...(spec.assignedUsers ?? [])].filter(Boolean) as string[];
    const linkedUserIds = new Set<string>();
    for (const name of names) {
      const u = await findUserByFullName(name);
      if (u && !linkedUserIds.has(u.id)) {
        linkedUserIds.add(u.id);
        try {
          await userTaskRepo.save(userTaskRepo.create({ userId: u.id, taskId: saved.id }));
        } catch {}
      }
    }
  }

  console.log(`Seeded tasks: ${allSpecs.length}`);
}

async function run() {
  try {
    await AppDataSource.initialize();
  } catch (e: any) {
    console.warn('AppDataSource already initialized or failed to init. Proceeding. Reason:', e?.message ?? e);
  }

  try {
    await seedTasks();
  } finally {
    try { await AppDataSource.destroy(); } catch {}
  }

  console.log('Tasks seeding completed.');
  if (typeof process !== 'undefined') process.exit(0);
}

// Execute when run directly
if (import.meta && (process as any)?.argv?.[1]?.includes('tasks_seed')) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
