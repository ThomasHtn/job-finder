import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '@job-finder/shared';
import { Public } from '../auth/public.decorator.js';
import type { Env } from './env.js';
import { SEARCH_PROFILE, type SearchProfile } from './search-profile.js';

/**
 * Exposes the few settings the front needs before it can render anything.
 */
@Controller('config')
export class ConfigController {
  /**
   * Raw environment for the auth flag, search profile for the area label.
   */
  constructor(
    private readonly config: ConfigService<Env, true>,
    @Inject(SEARCH_PROFILE) private readonly profile: SearchProfile,
  ) {}

  /**
   * Read by the front at startup: tab label and whether to show the login screen.
   */
  @Public()
  @Get()
  get(): AppConfig {
    return {
      areaLabel: this.profile.area.label,
      authRequired: Boolean(this.config.get('APP_PASSWORD', { infer: true })),
    };
  }
}
