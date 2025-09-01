import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

async function main() {
  // 1) Config/lookup kinds (idempotent)
  const projectKinds = [
    { key: 'DRAFT', title: 'Draft', orderNo: 1 },
    { key: 'INQUIRY_PENDING', title: 'Inquiry Pending', orderNo: 2 },
    { key: 'ACCEPTED', title: 'Accepted', orderNo: 3 },
    { key: 'REJECTED', title: 'Rejected', orderNo: 4 },
    { key: 'PLANNING', title: 'Planning', orderNo: 5 },
    { key: 'INTAKE', title: 'Intake', orderNo: 6 },
    { key: 'IN_PROGRESS', title: 'In Progress', orderNo: 7 },
    { key: 'REVISION', title: 'Revision', orderNo: 8 },
    { key: 'COMPLETED', title: 'Completed', orderNo: 9 },
    { key: 'CANCELLED', title: 'Cancelled', orderNo: 10 },
    { key: 'ON_HOLD', title: 'On Hold', orderNo: 11 }
  ];

  const taskKinds = [
    { key: 'TODO', title: 'To Do', orderNo: 1 },
    { key: 'IN_PROGRESS', title: 'In Progress', orderNo: 2 },
    { key: 'REVIEW', title: 'Review', orderNo: 3 },
    { key: 'BLOCKED', title: 'Blocked', orderNo: 4 },
    { key: 'DONE', title: 'Done', orderNo: 5 },
    { key: 'CANCELLED', title: 'Cancelled', orderNo: 6 }
  ];

  const priorityKinds = [
    { key: 'CRITICAL', title: 'Critical', orderNo: 1 },
    { key: 'HIGH', title: 'High', orderNo: 2 },
    { key: 'MEDIUM', title: 'Medium', orderNo: 3 },
    { key: 'LOW', title: 'Low', orderNo: 4 }
  ];

  const impedimentStatuses = [
    { key: 'OPEN', title: 'Open', orderNo: 1 },
    { key: 'IN_PROGRESS', title: 'In Progress', orderNo: 2 },
    { key: 'RESOLVED', title: 'Resolved', orderNo: 3 },
    { key: 'CANCELLED', title: 'Cancelled', orderNo: 4 }
  ];

  const mainRoleTitles = [
    { key: 'CUSTOMER', title: 'Customer' },
    { key: 'CONTRIBUTOR', title: 'Contributor' }
  ];

  for (const k of projectKinds) {
    await prisma.projectStateKind.upsert({ where: { key: k.key }, create: k, update: { title: k.title, orderNo: k.orderNo } });
  }
  for (const k of taskKinds) {
    await prisma.taskStateKind.upsert({ where: { key: k.key }, create: k, update: { title: k.title, orderNo: k.orderNo } });
  }
  for (const k of priorityKinds) {
    await prisma.priorityLevelCfg.upsert({ where: { key: k.key }, create: k, update: { title: k.title, orderNo: k.orderNo } });
  }
  for (const s of impedimentStatuses) {
    await prisma.impedimentStatusCfg.upsert({ where: { key: s.key }, create: s, update: { title: s.title, orderNo: s.orderNo } });
  }
  for (const r of mainRoleTitles) {
    await prisma.mainRoleTitleCfg.upsert({ where: { key: r.key }, create: r, update: { title: r.title } });
  }

  // 2) Default states referencing kinds
  const pKinds = await prisma.projectStateKind.findMany();
  const tKinds = await prisma.taskStateKind.findMany();
  const getPK = (key: string) => pKinds.find((k) => k.key === key)!.id;
  const getTK = (key: string) => tKinds.find((k) => k.key === key)!.id;

  const projectStates = [
    { title: 'Draft', color: '#888888', orderNo: 1, isInitial: true, isFinal: false, kindId: getPK('DRAFT') },
    { title: 'In Progress', color: '#3B82F6', orderNo: 2, isInitial: false, isFinal: false, kindId: getPK('IN_PROGRESS') },
    { title: 'Completed', color: '#10B981', orderNo: 3, isInitial: false, isFinal: true, kindId: getPK('COMPLETED') }
  ];

  for (const s of projectStates) {
    await prisma.projectState.upsert({ where: { orderNo: s.orderNo }, create: s, update: { title: s.title, color: s.color, kindId: s.kindId, isInitial: s.isInitial, isFinal: s.isFinal } });
  }

  const taskStates = [
    { title: 'To Do', color: '#9CA3AF', orderNo: 1, isInitial: true, isFinal: false, kindId: getTK('TODO') },
    { title: 'In Progress', color: '#3B82F6', orderNo: 2, isInitial: false, isFinal: false, kindId: getTK('IN_PROGRESS') },
    { title: 'Done', color: '#10B981', orderNo: 3, isInitial: false, isFinal: true, kindId: getTK('DONE') }
  ];

  for (const s of taskStates) {
    await prisma.taskState.upsert({ where: { orderNo: s.orderNo }, create: s, update: { title: s.title, color: s.color, kindId: s.kindId, isInitial: s.isInitial, isFinal: s.isFinal } });
  }

  // 3) Default priorities referencing kinds
  const priKinds = await prisma.priorityLevelCfg.findMany();
  const getPrK = (key: string) => priKinds.find((k) => k.key === key)!.id;
  const priorities = [
    { title: 'Critical', color: '#EF4444', orderNo: 1, kindId: getPrK('CRITICAL') },
    { title: 'High', color: '#F59E0B', orderNo: 2, kindId: getPrK('HIGH') },
    { title: 'Medium', color: '#3B82F6', orderNo: 3, kindId: getPrK('MEDIUM') },
    { title: 'Low', color: '#10B981', orderNo: 4, kindId: getPrK('LOW') }
  ];
  for (const p of priorities) {
    await prisma.priority.upsert({ where: { orderNo: p.orderNo }, create: p, update: { title: p.title, color: p.color, kindId: p.kindId } });
  }

  // 4) Echelons
  const echelons = [
    { title: 'Junior', description: 'Entry level', orderLevel: 1 },
    { title: 'Mid', description: 'Mid level', orderLevel: 2 },
    { title: 'Senior', description: 'Senior level', orderLevel: 3 }
  ];
  for (const e of echelons) {
    await prisma.echelon.upsert({ where: { title: e.title }, create: e, update: { description: e.description, orderLevel: e.orderLevel } });
  }
  const echelonMap = new Map((await prisma.echelon.findMany()).map((e) => [e.title, e.id]));

  // 5) Roles (Admin, Consumer, Contributor)
  const mrTitles = await prisma.mainRoleTitleCfg.findMany();
  const getMainTitleId = (key: string) => mrTitles.find((r) => r.key === key)?.id || null;
  const rolesData = [
    { title: 'Admin', isMainRole: false, mainRoleTitleId: null as number | null, echelonId: echelonMap.get('Senior')!, description: 'Administrator' },
    { title: 'Consumer', isMainRole: true, mainRoleTitleId: getMainTitleId('CUSTOMER'), echelonId: echelonMap.get('Mid')!, description: 'Customer role' },
    { title: 'Contributor', isMainRole: true, mainRoleTitleId: getMainTitleId('CONTRIBUTOR'), echelonId: echelonMap.get('Mid')!, description: 'Contributor role' }
  ];
  for (const r of rolesData) {
    const existing = await prisma.role.findFirst({ where: { title: r.title } });
    if (existing) {
      await prisma.role.update({ where: { id: existing.id }, data: { isMainRole: r.isMainRole, mainRoleTitleId: r.mainRoleTitleId ?? undefined, echelonId: r.echelonId, description: r.description } });
    } else {
      await prisma.role.create({ data: r });
    }
  }
  const roles = await prisma.role.findMany();
  const roleByTitle = (t: string) => roles.find((r) => r.title === t)!.id;

  // 6) Users (argon2id hashed)
  async function hashPwd(p: string) {
    return hash(p, { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
  }
  const usersSeed = [
    { email: 'admin@example.local', username: 'admin', forename: 'Admin', surname: 'User', password: await hashPwd('admin123') },
    { email: 'consumer@example.local', username: 'consumer', forename: 'Con', surname: 'Sumer', password: await hashPwd('consumer123') },
    { email: 'contributor@example.local', username: 'contributor', forename: 'Contri', surname: 'Butor', password: await hashPwd('contrib123') }
  ];
  for (const u of usersSeed) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { username: u.username, forename: u.forename, surname: u.surname, password: u.password, isActive: true } });
    } else {
      await prisma.user.create({ data: { ...u, isActive: true } });
    }
  }
  const admin = await prisma.user.findUnique({ where: { email: 'admin@example.local' } });
  const consumer = await prisma.user.findUnique({ where: { email: 'consumer@example.local' } });
  const contributor = await prisma.user.findUnique({ where: { email: 'contributor@example.local' } });

  // 7) Assign roles to users
  async function ensureUserRole(userId: number, roleTitle: string) {
    const roleId = roleByTitle(roleTitle);
    const exists = await prisma.userRole.findFirst({ where: { userId, roleId } });
    if (!exists) await prisma.userRole.create({ data: { userId, roleId } });
  }
  if (admin) await ensureUserRole(admin.id, 'Admin');
  if (consumer) await ensureUserRole(consumer.id, 'Consumer');
  if (contributor) await ensureUserRole(contributor.id, 'Contributor');

  // 8) Tags
  const tags = [
    { id: 'tag-initial', title: 'initial', color: '#3B82F6' },
    { id: 'tag-customer', title: 'customer', color: '#10B981' },
    { id: 'tag-internal', title: 'internal', color: '#9CA3AF' }
  ];
  for (const t of tags) {
    const existing = await prisma.tag.findUnique({ where: { title: t.title } });
    if (existing) {
      await prisma.tag.update({ where: { id: existing.id }, data: { color: t.color } });
    } else {
      await prisma.tag.create({ data: t });
    }
  }

  // 9) Demo Project with initial circle, 7 segments, tasks, and assignments
  const draftState = await prisma.projectState.findUnique({ where: { orderNo: 1 } });
  const todoState = await prisma.taskState.findUnique({ where: { orderNo: 1 } });

  const project = await prisma.project.upsert({
    where: { id: 'demo-project-1' },
    update: {},
    create: {
      id: 'demo-project-1',
      title: 'Demo Project',
      description: 'A demo project seeded by prisma/seed.ts',
      projectStateId: draftState!.id,
      iterationWarnAt: 3,
      maxIterations: 5,
      estimatedBudget: 10000 as any,
      priority: 'High',
      riskLevel: 'Medium'
    }
  });

  // Create a SegmentGroupCircle
  const circle = await prisma.segmentGroupCircle.create({
    data: { orderNo: 1, title: 'Initial Workflow', isFirst: true, isActive: true }
  });

  // Link via ProjectCircle
  await prisma.projectCircle.upsert({
    where: { projectId_orderNo: { projectId: project.id, orderNo: 1 } },
    update: { circleId: circle.id, isCurrent: true },
    create: { projectId: project.id, circleId: circle.id, orderNo: 1, isCurrent: true }
  });

  const segmentTitles = [
    'Project Inquiry',
    'Accept/Reject',
    'Planning',
    'Intake (Aufbereitung)',
    'ProceedOrCancel (accommodate opposing views)',
    'Project-Revision (communication-further devel)',
    'Completion'
  ];

  // Create 7 segments with unique segmentNo per circle
  const segments = [] as { id: number; title: string }[];
  for (let i = 0; i < segmentTitles.length; i++) {
    const s = await prisma.iterationSegment.create({
      data: {
        segmentNo: i + 1,
        title: segmentTitles[i],
        segmentGroupCircleId: circle.id
      }
    });
    segments.push({ id: s.id, title: s.title });
  }

  // Create one Task per segment and connect to project (and optionally circle)
  for (const s of segments) {
    await prisma.task.create({
      data: {
        title: s.title,
        description: s.title,
        taskStateId: todoState!.id,
        projectId: project.id,
        segmentGroupCircleId: circle.id
      }
    });
  }

  // Assign participants via explicit junctions (Responsible: admin or consumer)
  if (admin && segments.length > 0) {
    for (const s of segments) {
      await prisma.segmentResponsible.upsert({
        where: { userId_iterationSegmentId: { userId: admin.id, iterationSegmentId: s.id } },
        update: {},
        create: { userId: admin.id, iterationSegmentId: s.id }
      });
    }
  }
  if (consumer && segments.length > 0) {
    for (const s of segments) {
      await prisma.segmentStakeholder.upsert({
        where: { userId_iterationSegmentId: { userId: consumer.id, iterationSegmentId: s.id } },
        update: {},
        create: { userId: consumer.id, iterationSegmentId: s.id }
      });
    }
  }
  if (contributor && segments.length > 0) {
    for (const s of segments) {
      await prisma.segmentContributor.upsert({
        where: { userId_iterationSegmentId: { userId: contributor.id, iterationSegmentId: s.id } },
        update: {},
        create: { userId: contributor.id, iterationSegmentId: s.id }
      });
    }
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
