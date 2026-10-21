import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AppConfigModule } from './app-config/app-config.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { IngestionModule } from './ingestion/ingestion.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { SharedConfigModule } from './shared/config/config.module.js';
import { ApiExceptionFilter } from './shared/errors/api-exception.filter.js';
import { PrismaModule } from './shared/prisma/prisma.module.js';

/**
 * Root module: configuration, database and error rendering are global, the rest is one module per feature.
 */
@Module({
  imports: [
    SharedConfigModule,
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    AppConfigModule,
    HealthModule,
    IngestionModule,
    JobsModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
})
export class AppModule {}
