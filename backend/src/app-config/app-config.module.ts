import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { AppConfigController } from './app-config.controller.js';

/**
 * Public settings the front reads before rendering: area label and whether to show the login.
 */
@Module({
  imports: [AuthModule],
  controllers: [AppConfigController],
})
export class AppConfigModule {}
