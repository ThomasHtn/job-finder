import { BadRequestException } from '@nestjs/common';

import { describe, expect, it, vi } from 'vitest';

import { JobsController } from './jobs.controller.js';
import type { JobsService } from './jobs.service.js';

/**
 * Controller over a service stub recording the favourite calls.
 */
function build() {
  const jobs = { setFavorite: vi.fn(async () => ({ id: 'job-1', isFavorite: true })) };
  return { controller: new JobsController(jobs as unknown as JobsService), jobs };
}

/**
 * Validation of the favourite route.
 */
describe('JobsController.setFavorite', () => {
  it('passes the asked state to the service', async () => {
    const { controller, jobs } = build();

    await controller.setFavorite('job-1', false);

    expect(jobs.setFavorite).toHaveBeenCalledWith('job-1', false);
  });

  it('answers 400 unless the body holds a boolean', () => {
    const { controller, jobs } = build();

    expect(() => controller.setFavorite('job-1', undefined)).toThrow(BadRequestException);
    expect(() => controller.setFavorite('job-1', 'true')).toThrow(BadRequestException);
    expect(jobs.setFavorite).not.toHaveBeenCalled();
  });
});
