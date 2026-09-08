import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module.js';
import { ConfigController } from './config.controller.js';
import type { Env } from './env.schema.js';
import { validateEnv } from './validate-env.js';
import { SEARCH_PROFILE } from './search-profile.js';

/**
 * Loads and validates the environment, and exposes the search profile app-wide.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      /* Single .env at the repo root; ignored in Docker where vars come from the environment. */
      envFilePath: ['../../.env'],
      validate: validateEnv,
    }),
    /* The controller reports whether a password is set. */
    AuthModule,
  ],
  controllers: [ConfigController],
  providers: [
    {
      provide: SEARCH_PROFILE,
      useFactory: (config: ConfigService<Env, true>) =>
        config.get('searchProfile', { infer: true }),
      inject: [ConfigService],
    },
  ],
  exports: [SEARCH_PROFILE],
})
export class AppConfigModule {}
