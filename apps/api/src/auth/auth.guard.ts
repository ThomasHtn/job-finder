import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Env } from '../config/env.schema.js';
import { AuthService } from './auth.service.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

/**
 * Header carrying the session token on every protected request.
 */
export const APP_TOKEN_HEADER = 'x-app-token';

/**
 * Global guard: every route needs a live session unless marked @Public().
 * With no password set the app is open in dev, and refused once deployed:
 * a forgotten `auth:set-password` must not silently publish the whole API.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  /**
   * Deployed run, where an app without a password is a misconfiguration.
   */
  private readonly isDeployed: boolean;

  /**
   * Reflector reads the @Public() metadata; the service checks the session.
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
    config: ConfigService<Env, true>,
  ) {
    this.isDeployed = config.get('NODE_ENV', { infer: true }) === 'production';
  }

  /**
   * Passes public routes and open dev; otherwise the token must match a session.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    if (!(await this.auth.isRequired())) {
      if (!this.isDeployed) return true;
      throw new ServiceUnavailableException(
        'No app password configured, see auth:set-password',
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (!(await this.auth.isValidToken(request.headers[APP_TOKEN_HEADER]))) {
      throw new UnauthorizedException('Invalid or missing app token');
    }
    return true;
  }
}
