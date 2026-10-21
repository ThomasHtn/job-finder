import { type ArgumentsHost, Logger, NotFoundException } from '@nestjs/common';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiExceptionFilter } from './api-exception.filter.js';
import { INTERNAL_DETAIL } from './to-api-error.js';

/**
 * Host whose response records the status and body the filter writes.
 */
function host() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const argumentsHost = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { argumentsHost, status, json };
}

/**
 * Rendering and logging of thrown values.
 */
describe('ApiExceptionFilter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes the API error body of an HTTP exception without logging it', () => {
    const error = vi.spyOn(Logger.prototype, 'error');
    const { argumentsHost, status, json } = host();

    new ApiExceptionFilter().catch(new NotFoundException('Job 1 not found'), argumentsHost);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      status: 404,
      code: 'NOT_FOUND',
      detail: 'Job 1 not found',
    });
    expect(error).not.toHaveBeenCalled();
  });

  it('logs an unexpected failure and hides its cause from the client', () => {
    const error = vi.spyOn(Logger.prototype, 'error');
    const { argumentsHost, status, json } = host();
    const cause = new Error('database password in a message');

    new ApiExceptionFilter().catch(cause, argumentsHost);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ status: 500, code: 'INTERNAL', detail: INTERNAL_DETAIL });
    expect(error).toHaveBeenCalledWith(cause.message, cause.stack);
  });

  it('logs a thrown non-error value as text', () => {
    const error = vi.spyOn(Logger.prototype, 'error');

    new ApiExceptionFilter().catch('boom', host().argumentsHost);

    expect(error).toHaveBeenCalledWith('boom', undefined);
  });
});
