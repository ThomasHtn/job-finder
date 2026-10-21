/**
 * Sets (or clears) the shared app password in the database and revokes every session.
 *   npm run auth:set-password -- <password>          development
 *   node dist/cli/set-password.js <password>         inside the image
 *   ... --clear                                      remove it: the app becomes open
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

import { hashPassword } from '../auth/password-hash.js';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * The new password, or --clear.
 */
const arg = process.argv[2];

/**
 * Shortest password accepted.
 */
const MIN_PASSWORD_LENGTH = 8;

if (!arg) {
  console.error('usage: set-password <password> | --clear');
  process.exit(1);
}
if (arg !== '--clear' && arg.length < MIN_PASSWORD_LENGTH) {
  console.error(`password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  process.exit(1);
}

/* The .env is only read in development; in a container the variables come from the environment. */
config({ path: '.env', quiet: true });

/**
 * Closed once the row is written.
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
});

try {
  if (arg === '--clear') {
    await prisma.appPassword.deleteMany();
  } else {
    const hash = hashPassword(arg);
    await prisma.appPassword.upsert({
      where: { id: 1 },
      create: { id: 1, hash },
      update: { hash },
    });
  }
  await prisma.session.deleteMany();
  console.log(arg === '--clear' ? 'Password cleared: the app is now open.' : 'Password set.');
} finally {
  await prisma.$disconnect();
}
