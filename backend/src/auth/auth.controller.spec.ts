import { BadRequestException, UnauthorizedException } from '@nestjs/common';

import { describe, expect, it } from 'vitest';

import { AuthController } from './auth.controller.js';
import type { AuthService } from './auth.service.js';

/**
 * Controller over a service stub accepting "good" when a password is set.
 */
function controller(passwordSet: boolean): AuthController {
  const auth = {
    isRequired: async () => passwordSet,
    login: async (password: string) => (password === 'good' ? 'token' : null),
  } as unknown as AuthService;
  return new AuthController(auth);
}

/**
 * Responses of the sign-in route.
 */
describe('AuthController.login', () => {
  it('returns the session token on the right password', async () => {
    await expect(controller(true).login('good')).resolves.toEqual({ token: 'token' });
  });

  it('answers 401 on a wrong password', async () => {
    await expect(controller(true).login('bad')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('answers 400 on a body without a string password', async () => {
    await expect(controller(true).login(undefined)).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller(true).login(42)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('answers 400 when no password is configured', async () => {
    await expect(controller(false).login('good')).rejects.toBeInstanceOf(BadRequestException);
  });
});
