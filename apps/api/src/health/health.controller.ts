import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Shape of the health payload.
 */
interface HealthReport {
  /**
   * "ok" or "degraded".
   */
  status: string;

  /**
   * "up" or "down".
   */
  database: string;
}

/**
 * Liveness endpoint for Docker and uptime monitors.
 */
@Controller('health')
export class HealthController {
  /**
   * The database is the only dependency worth probing.
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public on purpose: a monitor must not need the app password.
   */
  @Public()
  @Get()
  async check(): Promise<HealthReport> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch {
      return { status: 'degraded', database: 'down' };
    }
  }
}
