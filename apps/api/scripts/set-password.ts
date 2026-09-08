import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/auth/password-hash.js';

/**
 * Sets (or clears) the shared app password in the database and revokes every session.
 *   npm run auth:set-password -- <password>      set it (at least 8 characters)
 *   npm run auth:set-password -- --clear         remove it: the app becomes open
 */
config({ path: '../../.env', quiet: true });

const MIN_LENGTH = 8;
const arg = process.argv[2];

if (!arg) {
  console.error('usage: set-password <password> | --clear');
  process.exit(1);
}
if (arg !== '--clear' && arg.length < MIN_LENGTH) {
  console.error(`password must be at least ${MIN_LENGTH} characters`);
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
});

try {
  if (arg === '--clear') {
    await prisma.appPassword.deleteMany();
    console.log('Password cleared: the app is now open.');
  } else {
    const hash = hashPassword(arg);
    await prisma.appPassword.upsert({
      where: { id: 1 },
      create: { id: 1, hash },
      update: { hash },
    });
    console.log('Password set.');
  }
  await prisma.session.deleteMany();
} finally {
  await prisma.$disconnect();
}
