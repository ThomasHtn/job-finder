import { Module } from '@nestjs/common';

import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

/**
 * Liveness and readiness probes.
 */
@Module({ controllers: [HealthController], providers: [HealthService] })
export class HealthModule {}
