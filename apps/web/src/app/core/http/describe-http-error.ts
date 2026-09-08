import type { HttpErrorResponse } from '@angular/common/http';

/**
 * Turns an HTTP failure into a message that says what actually went wrong.
 */
export function describeHttpError(error: HttpErrorResponse): string {
  if (error.status === 0) return "L'API est-elle démarrée ?";
  if (error.status >= 500) return 'Le serveur a rencontré une erreur, réessayez plus tard.';
  return `Erreur ${error.status}.`;
}
