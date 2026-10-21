import { Controller, Get, HttpStatus, Res } from '@nestjs/common';

import type { Response } from 'express';

import { Public } from '../shared/security/public.decorator.js';
import { HealthService } from './health.service.js';
import type { ProbeReport } from './health.types.js';

/**
 * Probes for Docker and uptime-kuma, outside the /api prefix and public on purpose:
 * a monitor must not need the app password.
 */
@Controller()
export class HealthController {
  /**
   * Knows whether the database answers.
   */
  constructor(private readonly health: HealthService) {}

  /**
   * The process answers: never touches the database, so a Postgres outage does not restart the API.
   */
  @Public()
  @Get('livez')
  public live(): ProbeReport {
    return { status: 'UP' };
  }

  /**
   * The API can serve: 503 while the database is unreachable, so the status code alone tells it.
   */
  @Public()
  @Get('readyz')
  public async ready(@Res({ passthrough: true }) response: Response): Promise<ProbeReport> {
    if (await this.health.isDatabaseUp()) return { status: 'UP' };
    response.status(HttpStatus.SERVICE_UNAVAILABLE);
    return { status: 'DOWN' };
  }
}
