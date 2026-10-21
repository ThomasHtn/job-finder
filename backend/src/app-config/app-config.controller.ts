import { Controller, Get, Inject } from '@nestjs/common';

import type { AppConfig } from '@job-finder/contract';

import { AuthService } from '../auth/auth.service.js';
import { SEARCH_PROFILE, type SearchProfile } from '../shared/config/search-profile.js';
import { Public } from '../shared/security/public.decorator.js';

/**
 * Exposes the few settings the front needs before it can render anything.
 */
@Controller('config')
export class AppConfigController {
  /**
   * Auth service for the login flag, search profile for the area label.
   */
  constructor(
    private readonly auth: AuthService,
    @Inject(SEARCH_PROFILE) private readonly profile: SearchProfile,
  ) {}

  /**
   * Read by the front at startup: tab label and whether to show the login screen.
   */
  @Public()
  @Get()
  public async get(): Promise<AppConfig> {
    return {
      areaLabel: this.profile.area.label,
      authRequired: await this.auth.isRequired(),
    };
  }
}
