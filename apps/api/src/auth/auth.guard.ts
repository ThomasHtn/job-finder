import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Env } from '../config/env.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { secretsMatch } from './secret.js';

/**
 * Header carrying the shared password on every protected request.
 */
export const APP_TOKEN_HEADER = 'x-app-token';

/**
 * Global guard: every route needs the app token unless marked @Public()
 * or unless no password is configured at all (open local dev).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  /**
   * Reflector reads the @Public() metadata; config holds the expected password.
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * Passes public routes and open deployments; otherwise the header must match.
   */
  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const password = this.config.get('APP_PASSWORD', { infer: true });
    if (!password) return true;

    const request = context.switchToHttp().getRequest<Request>();
    if (!secretsMatch(request.headers[APP_TOKEN_HEADER], password)) {
      throw new UnauthorizedException('Invalid or missing app token');
    }
    return true;
  }
}
