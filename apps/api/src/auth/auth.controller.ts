import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginThrottleGuard } from './login-throttle.guard.js';
import { Public } from './public.decorator.js';

/**
 * Login of the shared-password session.
 */
@Controller('auth')
export class AuthController {
  /**
   * Password and session store.
   */
  constructor(private readonly auth: AuthService) {}

  /**
   * Validates the password and returns the session token the front must send back.
   */
  @Public()
  @UseGuards(LoginThrottleGuard)
  @Post('login')
  @HttpCode(200)
  async login(@Body('password') password: unknown): Promise<{ token: string }> {
    if (typeof password !== 'string') {
      throw new BadRequestException('password must be a string');
    }
    if (!(await this.auth.isRequired())) {
      throw new BadRequestException('No password configured');
    }
    const token = await this.auth.login(password);
    if (!token) throw new UnauthorizedException('Wrong password');
    return { token };
  }
}
