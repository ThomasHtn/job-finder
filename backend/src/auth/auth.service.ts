import { Injectable } from '@nestjs/common';

import { PrismaService } from '../shared/prisma/prisma.service.js';
import { SESSION_TTL_MS } from './auth.constants.js';
import { verifyPassword } from './password-hash.js';
import { generateToken, hashToken } from './session-token.js';

/**
 * Password check and session store, both backed by the database.
 */
@Injectable()
export class AuthService {
  /**
   * Password hash and sessions live in the database, see AppPassword and Session.
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * True when a password has been set (`npm run auth:set-password`).
   */
  public async isRequired(): Promise<boolean> {
    return (await this.prisma.appPassword.count()) > 0;
  }

  /**
   * Verifies the password and opens a session; null on a wrong password.
   */
  public async login(password: unknown): Promise<string | null> {
    const stored = await this.prisma.appPassword.findUnique({ where: { id: 1 } });
    if (!stored || !(await verifyPassword(password, stored.hash))) return null;

    const token = generateToken();
    await this.prisma.session.create({
      data: {
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });
    /* Cheap housekeeping on the rare write path. */
    await this.prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    return token;
  }

  /**
   * True when the token belongs to a live session.
   */
  public async isValidToken(token: unknown): Promise<boolean> {
    if (typeof token !== 'string' || !token) return false;
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { expiresAt: true },
    });
    return session !== null && session.expiresAt > new Date();
  }
}
