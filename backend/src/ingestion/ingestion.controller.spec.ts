import { ConflictException } from '@nestjs/common';

import { describe, expect, it } from 'vitest';

import { emptySummary } from './empty-summary.js';
import { IngestionController } from './ingestion.controller.js';
import type { IngestionService } from './ingestion.service.js';

/**
 * Controller on a service answering the given run result.
 */
function controller(result: ReturnType<typeof emptySummary> | null): IngestionController {
  return new IngestionController({ run: async () => result } as unknown as IngestionService);
}

/**
 * Manual trigger.
 */
describe('IngestionController.run', () => {
  it('returns the summary of the run', async () => {
    expect(await controller(emptySummary()).run()).toEqual(emptySummary());
  });

  it('answers 409 while another run is in progress', async () => {
    await expect(controller(null).run()).rejects.toThrow(ConflictException);
  });
});
