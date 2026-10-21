import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../shared/prisma/prisma.service.js';
import { SESSION_TTL_MS } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import { hashPassword } from './password-hash.js';
import { hashToken } from './session-token.js';

/**
 * The password every stub stores when one is set.
 */
const PASSWORD = 's3cret-long';

/**
 * Service over a Prisma stand-in: `password` decides whether a hash is stored, `session` what the
 * session lookup answers.
 */
function build(options: { password: boolean; session?: { expiresAt: Date } | null }) {
  const stored = options.password ? { id: 1, hash: hashPassword(PASSWORD) } : null;
  const prisma = {
    appPassword: {
      count: vi.fn(async () => (stored ? 1 : 0)),
      findUnique: vi.fn(async () => stored),
    },
    session: {
      create: vi.fn(async () => ({})),
      deleteMany: vi.fn(async () => ({ count: 0 })),
      findUnique: vi.fn(async () => options.session ?? null),
    },
  };
  return { service: new AuthService(prisma as unknown as PrismaService), prisma };
}

/**
 * Password check and session lifecycle.
 */
describe('AuthService', () => {
  it('requires a login only once a password is stored', async () => {
    await expect(build({ password: false }).service.isRequired()).resolves.toBe(false);
    await expect(build({ password: true }).service.isRequired()).resolves.toBe(true);
  });

  it('opens a session storing only the hash of the token it returns', async () => {
    const { service, prisma } = build({ password: true });
    const before = Date.now();

    const token = await service.login(PASSWORD);

    expect(token).toMatch(/^[0-9a-f]{64}$/);
    const [[{ data }]] = prisma.session.create.mock.calls as unknown as [
      [{ data: { tokenHash: string; expiresAt: Date } }],
    ];
    expect(data.tokenHash).toBe(hashToken(token!));
    expect(data.expiresAt.getTime()).toBeGreaterThanOrEqual(before + SESSION_TTL_MS);
    expect(prisma.session.deleteMany).toHaveBeenCalledTimes(1);
  });

  it('refuses a wrong password or a missing one without opening a session', async () => {
    const wrong = build({ password: true });
    await expect(wrong.service.login('nope')).resolves.toBeNull();
    expect(wrong.prisma.session.create).not.toHaveBeenCalled();

    const none = build({ password: false });
    await expect(none.service.login(PASSWORD)).resolves.toBeNull();
  });

  it('accepts a live session token only', async () => {
    const live = build({ password: true, session: { expiresAt: new Date(Date.now() + 60_000) } });
    await expect(live.service.isValidToken('token')).resolves.toBe(true);
    expect(live.prisma.session.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenHash: hashToken('token') } }),
    );

    const expired = build({ password: true, session: { expiresAt: new Date(Date.now() - 1) } });
    await expect(expired.service.isValidToken('token')).resolves.toBe(false);

    const unknown = build({ password: true, session: null });
    await expect(unknown.service.isValidToken('token')).resolves.toBe(false);
  });

  it('rejects an empty or non-string token without a lookup', async () => {
    const { service, prisma } = build({ password: true });

    await expect(service.isValidToken('')).resolves.toBe(false);
    await expect(service.isValidToken(undefined)).resolves.toBe(false);
    await expect(service.isValidToken(['token'])).resolves.toBe(false);
    expect(prisma.session.findUnique).not.toHaveBeenCalled();
  });
});
