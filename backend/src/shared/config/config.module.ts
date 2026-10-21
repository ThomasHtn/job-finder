import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import type { Env } from './env.schema.js';
import { SEARCH_PROFILE, type SearchProfile } from './search-profile.js';
import { validateEnv } from './validate-env.js';

/**
 * Loads and validates the environment, and exposes the search profile app-wide.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      /* The backend's own .env in development; in Docker the variables come from the environment. */
      envFilePath: ['.env'],
      validate: validateEnv,
    }),
  ],
  providers: [
    {
      provide: SEARCH_PROFILE,
      useFactory: (config: ConfigService<Env, true>): SearchProfile =>
        config.get<SearchProfile>('searchProfile'),
      inject: [ConfigService],
    },
  ],
  exports: [SEARCH_PROFILE],
})
export class SharedConfigModule {}
