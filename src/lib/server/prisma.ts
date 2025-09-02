import { PrismaClient } from '@prisma/client';

// Singleton Prisma client for server
export const prisma = new PrismaClient();
