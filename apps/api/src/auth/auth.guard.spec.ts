import {
  ServiceUnavailableException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import type { Env } from '../config/env.schema.js';
import { AuthGuard } from './auth.guard.js';
import type { AuthService } from './auth.service.js';

/**
 * Execution context carrying the token header, with no @Public() metadata.
 */
function context(token?: string): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ headers: token ? { 'x-app-token': token } : {} }),
    }),
  } as unknown as ExecutionContext;
}

/**
 * Guard wired to stubs: `isPublic` drives the reflector, `password` whether one is set.
 */
function guard(options: {
  nodeEnv: Env['NODE_ENV'];
  password: boolean;
  isPublic?: boolean;
}): AuthGuard {
  const reflector = {
    getAllAndOverride: () => options.isPublic ?? false,
  } as unknown as Reflector;
  const auth = {
    isRequired: async () => options.password,
    isValidToken: async (token: unknown) => token === 'good',
  } as unknown as AuthService;
  const config = { get: () => options.nodeEnv } as unknown as ConfigService<Env, true>;
  return new AuthGuard(reflector, auth, config);
}

/**
 * Access rules of the global guard, password set or not.
 */
describe('AuthGuard', () => {
  it('passes public routes', async () => {
    const open = guard({ nodeEnv: 'production', password: false, isPublic: true });
    await expect(open.canActivate(context())).resolves.toBe(true);
  });

  it('passes everything in dev when no password is set', async () => {
    await expect(
      guard({ nodeEnv: 'development', password: false }).canActivate(context()),
    ).resolves.toBe(true);
  });

  it('refuses everything in production when no password is set', async () => {
    await expect(
      guard({ nodeEnv: 'production', password: false }).canActivate(context()),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('accepts a live session token', async () => {
    await expect(
      guard({ nodeEnv: 'production', password: true }).canActivate(context('good')),
    ).resolves.toBe(true);
  });

  it('rejects a missing or stale token', async () => {
    const locked = guard({ nodeEnv: 'production', password: true });
    await expect(locked.canActivate(context())).rejects.toThrow(UnauthorizedException);
    await expect(locked.canActivate(context('stale'))).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
