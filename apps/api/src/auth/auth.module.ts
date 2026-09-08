import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { LoginThrottleGuard } from './login-throttle.guard.js';

/**
 * Registers the global session guard and the login route.
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: AuthGuard }, LoginThrottleGuard],
  exports: [AuthService],
})
export class AuthModule {}
