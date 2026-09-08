import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';

/**
 * Health probe, no provider of its own.
 */
@Module({ controllers: [HealthController] })
export class HealthModule {}
