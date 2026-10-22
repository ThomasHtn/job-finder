import { translate } from '@jsverse/transloco';

import { ActionFailure } from './action-failure.model';
import { describeHttpError } from './api-error.utils';

/**
 * The failure as a sentence in the active language; read it in a `computed` that follows the language.
 */
export function actionFailureText(failure: ActionFailure): string {
  return translate(failure.key, { detail: describeHttpError(failure.cause) });
}
