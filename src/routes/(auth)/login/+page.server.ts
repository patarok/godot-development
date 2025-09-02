import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { verify } from '@node-rs/argon2';
import { prisma } from '$lib/server/prisma';
import { randomBytes, createHash } from 'crypto';

function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

export const actions = {
  default: async ({ cookies, request }) => {
    const { username, password } = Object.fromEntries(await request.formData()) as Record<string, string>;

    if (!username || !password) {
      return fail(400, { error: true, message: '<strong>Username</strong> and/or <strong>password</strong> can not be blank.' });
    }

    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) {
      return fail(400, { error: true, message: 'User not exists.' });
    }

    const validPassword = await verify(user.password, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1
    });

    if (!validPassword) {
      return fail(400, { error: true, message: 'You have entered invalid credentials.' });
    }

    // Create new session
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30); // 30 days

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        createdAt: now,
        expiresAt
      }
    });

    cookies.set('session', rawToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30
    });

    redirect(302, '/');
  }
} satisfies Actions;