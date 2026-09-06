import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly config: ConfigService<Env, true>) {}

  @Public()
  @Post('login')
  login(@Body('password') password: string): { ok: true } {
    const expected = this.config.get('APP_PASSWORD', { infer: true });
    if (expected && password !== expected) {
      throw new UnauthorizedException('Wrong password');
    }
    return { ok: true };
  }
}
