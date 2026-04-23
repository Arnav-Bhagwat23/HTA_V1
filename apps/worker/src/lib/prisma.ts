import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as typeof globalThis & {
  prismaWorker?: PrismaClient;
};

export const prisma =
  globalForPrisma.prismaWorker ??
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaWorker = prisma;
}
