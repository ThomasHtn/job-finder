import { type ArgumentsHost, Catch, type ExceptionFilter, Logger } from '@nestjs/common';

import type { Response } from 'express';

import { toApiError } from './to-api-error.js';

/**
 * The only place that renders errors: every route answers the same body, whatever it threw.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(ApiExceptionFilter.name);

  /**
   * Writes the error body; an unexpected failure is logged with its stack first.
   */
  public catch(exception: unknown, host: ArgumentsHost): void {
    const body = toApiError(exception);
    if (body.code === 'INTERNAL') {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }
    host.switchToHttp().getResponse<Response>().status(body.status).json(body);
  }
}
