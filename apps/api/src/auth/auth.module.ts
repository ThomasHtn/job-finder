import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { LoginThrottleGuard } from './login-throttle.guard.js';

/**
 * Registers the global token guard and the login route.
 */
@Module({
  controllers: [AuthController],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }, LoginThrottleGuard],
})
export class AuthModule {}
