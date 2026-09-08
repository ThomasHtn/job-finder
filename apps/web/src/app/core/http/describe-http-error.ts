import type { HttpErrorResponse } from '@angular/common/http';
import type { Translations } from '../i18n/translations';

/**
 * Turns an HTTP failure into a message that says what actually went wrong.
 */
export function describeHttpError(error: HttpErrorResponse, text: Translations): string {
  if (error.status === 0) return text.http.unreachable;
  if (error.status >= 500) return text.http.serverError;
  return text.http.status(error.status);
}
