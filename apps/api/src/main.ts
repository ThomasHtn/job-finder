import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { AuthService } from './auth/auth.service.js';
import type { Env } from './config/env.schema.js';

/**
 * Builds the Nest application, applies the HTTP hardening and starts listening.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService<Env, true>);

  /* Standard security headers; the API only serves JSON, so no CSP tuning is needed. */
  app.use(helmet());
  /* One trusted hop: the front nginx, which rewrites X-Forwarded-For to the real client. */
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }).split(','),
  });
  app.enableShutdownHooks();

  if (
    config.get('NODE_ENV', { infer: true }) === 'production' &&
    !(await app.get(AuthService).isRequired())
  ) {
    Logger.error(
      'No app password set: every route answers 503. Run `docker compose exec api npm run auth:set-password -- "<password>"`.',
      'Bootstrap',
    );
  }

  const port = config.get('PORT', { infer: true });
  await app.listen(port, '0.0.0.0');
  Logger.log(`API listening on port ${port}`, 'Bootstrap');
}

await bootstrap();
