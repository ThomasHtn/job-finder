import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../generated/prisma/client.js';
import type { Env } from '../config/env.schema.js';

/**
 * Prisma client bound to the Nest lifecycle. The pool opens on the first query, so a bad database
 * URL shows on /readyz rather than at boot; it is released on shutdown.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  /**
   * Prisma 7 takes the connection through a driver adapter rather than the schema.
   */
  constructor(config: ConfigService<Env, true>) {
    super({
      adapter: new PrismaPg({
        connectionString: config.get('DATABASE_URL', { infer: true }),
      }),
    });
  }

  /**
   * Releases the pool on graceful shutdown.
   */
  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
