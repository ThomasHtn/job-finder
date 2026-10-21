import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../shared/prisma/prisma.service.js';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

/**
 * Controller over a database that answers, or not.
 */
function controller(databaseUp: boolean) {
  const prisma = {
    $queryRaw: vi.fn(() => (databaseUp ? Promise.resolve([1]) : Promise.reject(new Error('down')))),
  };
  const health = new HealthController(new HealthService(prisma as unknown as PrismaService));
  return { prisma, health };
}

/**
 * Response stub recording the status set by the controller.
 */
function response() {
  const status = vi.fn();
  return { status, res: { status } as never };
}

/**
 * Liveness and readiness probes.
 */
describe('HealthController', () => {
  it('reports live without touching the database', () => {
    const { prisma, health } = controller(false);

    expect(health.live()).toEqual({ status: 'UP' });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('reports ready when the database answers', async () => {
    const { status, res } = response();

    expect(await controller(true).health.ready(res)).toEqual({ status: 'UP' });
    expect(status).not.toHaveBeenCalled();
  });

  it('answers 503 DOWN when the database is gone', async () => {
    const { status, res } = response();

    expect(await controller(false).health.ready(res)).toEqual({ status: 'DOWN' });
    expect(status).toHaveBeenCalledWith(503);
  });
});
