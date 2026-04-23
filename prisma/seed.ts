import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);

const DEFAULT_STANDARD_EMAIL = 'user@hta.local';
const DEFAULT_STANDARD_PASSWORD = 'ChangeMe123!';
const DEFAULT_ADMIN_EMAIL = 'admin@hta.local';
const DEFAULT_ADMIN_PASSWORD = 'AdminChangeMe123!';

const getEnv = (name: string, fallback: string): string => {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
};

const isUsingDefaultEnv = (name: string): boolean => {
  const value = process.env[name]?.trim();
  return !value || value.length === 0;
};

const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
};

const verifyPassword = async (
  password: string,
  storedHash: string,
): Promise<boolean> => {
  const [algorithm, salt, expectedHash] = storedHash.split(':');

  if (algorithm !== 'scrypt' || !salt || !expectedHash) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (derivedKey.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedBuffer);
};

const seedUser = async (
  email: string,
  password: string,
  role: UserRole,
): Promise<void> => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      passwordHash: true,
    },
  });

  const passwordHash =
    existingUser && (await verifyPassword(password, existingUser.passwordHash))
      ? existingUser.passwordHash
      : await hashPassword(password);

  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        role,
        isActive: true,
      },
    });

    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      isActive: true,
    },
  });
};

const main = async (): Promise<void> => {
  const standardEmail = getEnv('STANDARD_USER_EMAIL', DEFAULT_STANDARD_EMAIL);
  const standardPassword = getEnv(
    'STANDARD_USER_PASSWORD',
    DEFAULT_STANDARD_PASSWORD,
  );
  const adminEmail = getEnv('ADMIN_USER_EMAIL', DEFAULT_ADMIN_EMAIL);
  const adminPassword = getEnv('ADMIN_USER_PASSWORD', DEFAULT_ADMIN_PASSWORD);

  if (standardEmail === adminEmail) {
    throw new Error('STANDARD_USER_EMAIL and ADMIN_USER_EMAIL must be different.');
  }

  if (
    isUsingDefaultEnv('STANDARD_USER_EMAIL') ||
    isUsingDefaultEnv('STANDARD_USER_PASSWORD') ||
    isUsingDefaultEnv('ADMIN_USER_EMAIL') ||
    isUsingDefaultEnv('ADMIN_USER_PASSWORD')
  ) {
    console.warn(
      'Using one or more default seed credentials. Set STANDARD_USER_* and ADMIN_USER_* env vars for non-local environments.',
    );
  }

  await seedUser(standardEmail, standardPassword, UserRole.STANDARD);
  await seedUser(adminEmail, adminPassword, UserRole.ADMIN);

  console.log('Seeded users:');
  console.log(`- standard: ${standardEmail}`);
  console.log(`- admin: ${adminEmail}`);
};

main()
  .catch((error) => {
    console.error('Failed to seed database.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
