/**
 * Sets (or clears) the shared app password in the database and revokes every session.
 *   printf %s "$P" | npm run auth:set-password -- -  development, read from stdin
 *   printf %s "$P" | node dist/cli/set-password.js - inside the image
 *   ... <password>                                   as an argument, visible to `ps` and the history
 *   ... --clear                                      remove it: the app becomes open
 */
import { readFileSync } from 'node:fs';

import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

import { hashPassword } from '../auth/password-hash.js';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * The new password, `-` to read it from stdin, or --clear.
 */
const given = process.argv[2];

/**
 * The password itself; stdin keeps it out of the process list. Its trailing newline is dropped.
 */
const arg = given === '-' ? readFileSync(0, 'utf8').replace(/\r?\n$/, '') : given;

/**
 * Shortest password accepted.
 */
const MIN_PASSWORD_LENGTH = 8;

if (!arg) {
  console.error('usage: set-password - (password on stdin) | <password> | --clear');
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
    const hash = await hashPassword(arg);
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
