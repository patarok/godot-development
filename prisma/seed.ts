import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Idempotent upsert helpers
async function upsertByUnique<T extends keyof PrismaClient>(model: any, where: any, create: any, update: any = {}) {
  const existing = await model.findUnique({ where });
  if (existing) return model.update({ where, data: update });
  return model.create({ data: create });
}

async function main() {
  // 1) Config/lookup kinds
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

  // main role titles
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

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
