import { AppDataSource } from '../../config/datasource';
import { User } from '../../entities/user/User';
import { Role } from '../../entities/user/Role';
import { hash as argon2hash } from '@node-rs/argon2';
import { generateIdenteapot } from '@teapotlabs/identeapots';
// Setup minimal DOM/canvas for identeapots (Node environment)
import { JSDOM } from 'jsdom';
import { createCanvas, Image as CanvasImage } from 'canvas';

function ensureDomForIdenteapots() {
  if (typeof (globalThis as any).document !== 'undefined') return;
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  (globalThis as any).window = dom.window as any;
  (globalThis as any).document = dom.window.document as any;
  (globalThis as any).Image = CanvasImage as any;
  const realCreateElement = dom.window.document.createElement.bind(dom.window.document);
  (dom.window.document as any).createElement = function(tagName: any, options?: any) {
    if (String(tagName).toLowerCase() === 'canvas') {
      return createCanvas(256, 256) as any;
    }
    return realCreateElement(tagName, options);
  };
}
ensureDomForIdenteapots();

async function upsertRole(name: string, isMainRole = true) {
  const repo = AppDataSource.getRepository(Role);
  let role = await repo.findOne({ where: { name } });
  if (!role) {
    role = repo.create({ name, isMainRole });
    role = await repo.save(role);
  }
  return role;
}

type SeedUser = {
  forename: string;
  surname: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  password?: string; // plaintext (will be hashed)
  isActive?: boolean;
};

async function upsertUser(u: SeedUser) {
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);

  const email = u.email.trim().toLowerCase();
  let user = await userRepo.findOne({ where: { email } });

  const role = await roleRepo.findOne({ where: { name: u.role } });
  if (!role) throw new Error(`Role '${u.role}' not found. Seed roles before users.`);

  const rawPassword = u.password ?? 'password123';
  const passwordHash = await argon2hash(rawPassword, { memoryCost: 19456, timeCost: 2, hashLength: 32, parallelism: 1 });

  if (!user) {
    user = userRepo.create({
      email,
      forename: u.forename,
      surname: u.surname,
      username: u.username,
      password: passwordHash,
      isActive: u.isActive ?? true,
      role
    });
  } else {
    user.forename = u.forename;
    user.surname = u.surname;
    user.username = u.username;
    user.password = passwordHash; // reset to known value
    user.isActive = u.isActive ?? true;
    user.role = role;
  }

  // Ensure avatar is set (stable by email)
  if (!user.avatarData) {
    const avatarData = await generateIdenteapot(email, { size: 128 });
    user.avatarData = avatarData;
  }

  return await userRepo.save(user);
}

async function upsertAdminUserFromEnv() {
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);

  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
  const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
  const rawPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
  const passwordHashEnv = process.env.ADMIN_PASSWORD_HASH;

  const adminRole = await roleRepo.findOne({ where: { name: 'admin' } });
  if (!adminRole) throw new Error("Role 'admin' not found. Seed roles before users.");

  let user = await userRepo.findOne({ where: [{ email: adminEmail }, { username: adminUsername }], relations: ['role'] });

  if (!user) {
    const password = passwordHashEnv ? passwordHashEnv : await argon2hash(rawPassword, { memoryCost: 19456, timeCost: 2, hashLength: 32, parallelism: 1 });
    user = userRepo.create({
      email: adminEmail,
      username: adminUsername,
      forename: 'Admin',
      surname: 'User',
      password,
      isActive: true,
      role: adminRole
    });
  } else {
    // Ensure role remains admin but do not override existing password unless explicit hash provided
    if (!user.role || user.role.id !== adminRole.id) user.role = adminRole;
    if (passwordHashEnv) user.password = passwordHashEnv;
  }

  // Ensure avatar
  if (!user.avatarData) {
    const avatarData = await generateIdenteapot(adminEmail, { size: 128 });
    user.avatarData = avatarData;
  }

  await userRepo.save(user);
}

export async function seedUsers() {
  // Ensure baseline roles exist
  await upsertRole('admin', true);
  await upsertRole('user', true);
  // Ensure the primary admin user exists just like in initial_seed
  await upsertAdminUserFromEnv();

  const users: SeedUser[] = [
    { forename: 'Grace',  surname: 'Lee',      email: 'grace.lee@example.com',  username: 'glee',     role: 'admin' },
    { forename: 'Jason',  surname: 'Miller',   email: 'jason.miller@example.com', username: 'jmiller', role: 'admin' },
    { forename: 'Samuel', surname: 'Green',    email: 'samuel.green@example.com', username: 'sgreen', role: 'user' },
    { forename: 'Eddie',  surname: 'Lake',     email: 'eddie.lake@example.com',   username: 'elake',  role: 'user' },
    { forename: 'Olivia', surname: 'Martinez', email: 'olivia.martinez@example.com', username: 'omartinez', role: 'user' },
    { forename: 'Daniel', surname: 'Roberts',  email: 'daniel.roberts@example.com', username: 'droberts', role: 'user' }
  ];

  const results = [] as User[];
  for (const u of users) {
    const created = await upsertUser(u);
    results.push(created);
  }

  console.log(`Seeded ${results.length} users`);
  return results;
}

async function run() {
  try {
    await AppDataSource.initialize();
  } catch (e: any) {
    console.warn('AppDataSource already initialized or failed to init. Proceeding. Reason:', e?.message ?? e);
  }

  try {
    await seedUsers();
  } finally {
    try { await AppDataSource.destroy(); } catch {}
  }

  console.log('Users seeding completed.');
  if (typeof process !== 'undefined') process.exit(0);
}

// Execute when run directly (ts-node/ts-node-esm)
if (import.meta && (process as any)?.argv?.[1]?.includes('users_seed')) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
