import { Injectable } from '@nestjs/common';

import { PrismaService } from '../shared/prisma/prisma.service.js';

/**
 * Checks the one dependency worth probing: the database.
 */
@Injectable()
export class HealthService {
  /**
   * The shared database client.
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * True when the database answers a trivial query.
   */
  public async isDatabaseUp(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
