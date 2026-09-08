import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { LoginThrottleGuard } from './login-throttle.guard.js';
import { Public } from './public.decorator.js';
import { secretsMatch } from './secret.js';

/**
 * Password check used by the front before it stores the token.
 */
@Controller('auth')
export class AuthController {
  /**
   * Only the environment is needed: there is no user store.
   */
  constructor(private readonly config: ConfigService<Env, true>) {}

  /**
   * Validates the shared password. Always answers when no password is
   * configured, since the guard lets everything through in that case too.
   */
  @Public()
  @UseGuards(LoginThrottleGuard)
  @Post('login')
  login(@Body('password') password: unknown): { ok: true } {
    if (typeof password !== 'string') {
      throw new BadRequestException('password must be a string');
    }
    const expected = this.config.get('APP_PASSWORD', { infer: true });
    if (expected && !secretsMatch(password, expected)) {
      throw new UnauthorizedException('Wrong password');
    }
    return { ok: true };
  }
}
