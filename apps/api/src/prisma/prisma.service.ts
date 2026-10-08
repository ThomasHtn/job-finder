import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaPg } from '@prisma/adapter-pg';

import type { Env } from '../config/env.schema.js';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Prisma client bound to the Nest lifecycle: connects on init, disconnects on shutdown.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
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
   * Opens the pool eagerly so a bad database URL fails at boot, not on the first request.
   */
  public async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * Releases the pool on graceful shutdown.
   */
  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
