import { describe, expect, it } from 'vitest';

import type { AuthService } from '../auth/auth.service.js';
import { PROFILE } from '../shared/config/search-profile.fixtures.js';
import { AppConfigController } from './app-config.controller.js';

/**
 * Settings the front reads at startup.
 */
describe('AppConfigController', () => {
  it('exposes the area label and whether a login is required', async () => {
    const auth = { isRequired: async () => true } as unknown as AuthService;

    await expect(new AppConfigController(auth, PROFILE).get()).resolves.toEqual({
      areaLabel: 'Seine-Maritime',
      authRequired: true,
    });
  });
});
