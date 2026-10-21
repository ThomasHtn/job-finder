import {
  BadRequestException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import { describe, expect, it } from 'vitest';

import { INTERNAL_DETAIL, toApiError } from './to-api-error.js';

/**
 * Error body of every thrown value.
 */
describe('toApiError', () => {
  it.each([
    [new BadRequestException('password must be a string'), 400, 'BAD_REQUEST'],
    [new UnauthorizedException('Wrong password'), 401, 'UNAUTHORIZED'],
    [new NotFoundException('Job 1 not found'), 404, 'NOT_FOUND'],
    [
      new HttpException('Too many login attempts', HttpStatus.TOO_MANY_REQUESTS),
      429,
      'TOO_MANY_REQUESTS',
    ],
    [new ServiceUnavailableException('Down for maintenance'), 503, 'UNAVAILABLE'],
    [new HttpException('Gone', HttpStatus.GONE), 410, 'BAD_REQUEST'],
  ])('maps %s to its status and code', (exception, status, code) => {
    expect(toApiError(exception)).toEqual({ status, code, detail: exception.message });
  });

  it('keeps the code a thrower chose', () => {
    const exception = new ServiceUnavailableException({
      code: 'NO_PASSWORD',
      message: 'No password',
    });

    expect(toApiError(exception)).toMatchObject({ status: 503, code: 'NO_PASSWORD' });
  });

  it('ignores an unknown chosen code', () => {
    const exception = new BadRequestException({ code: 'WHATEVER', message: 'Bad' });

    expect(toApiError(exception).code).toBe('BAD_REQUEST');
  });

  it('hides the cause of an unexpected failure', () => {
    expect(toApiError(new Error('connection string with a password'))).toEqual({
      status: 500,
      code: 'INTERNAL',
      detail: INTERNAL_DETAIL,
    });
    expect(toApiError(new InternalServerErrorException('stack details'))).toEqual({
      status: 500,
      code: 'INTERNAL',
      detail: INTERNAL_DETAIL,
    });
  });
});
