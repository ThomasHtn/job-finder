import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

/**
 * Header carrying the session token on every protected request.
 */
export const APP_TOKEN_HEADER = 'x-app-token';

/**
 * Global guard: every route needs a live session unless marked @Public()
 * or unless no password has been set at all (open local dev).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  /**
   * Reflector reads the @Public() metadata; the service checks the session.
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  /**
   * Passes public routes and open deployments; otherwise the token must match a session.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    if (!(await this.auth.isRequired())) return true;

    const request = context.switchToHttp().getRequest<Request>();
    if (!(await this.auth.isValidToken(request.headers[APP_TOKEN_HEADER]))) {
      throw new UnauthorizedException('Invalid or missing app token');
    }
    return true;
  }
}
