import { useFrenchTexts } from '@core/i18n/i18n.fixtures';

import { actionFailureText } from './action-failure.utils';

describe('actionFailureText', () => {
  useFrenchTexts();

  it('names the action, then says what went wrong', () => {
    expect(
      actionFailureText({ key: 'feed.favoriteFailed', cause: new Error('offline') }),
    ).toContain('Impossible de modifier le favori.');
  });
});
