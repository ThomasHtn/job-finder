import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withNavigationErrorHandler,
} from '@angular/router';

import { authInterceptor } from '@core/auth/auth.interceptor';
import { reloadOnStaleBuild } from '@core/http/stale-build.utils';
import { provideI18n } from '@core/i18n/i18n.providers';

import { routes } from './app.routes';

/**
 * Application providers; zoneless by default, so state lives in signals.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    /* Texts in the stored or browser language, loaded before the first screen. */
    provideI18n(),
    /*
     * Route and query parameters reach page inputs directly: `id` on the offer, `tab` on the feed.
     * A screen whose bundle vanished with a deployment is loaded afresh rather than left dead.
     */
    provideRouter(
      routes,
      withComponentInputBinding(),
      withNavigationErrorHandler(reloadOnStaleBuild),
    ),
    /* Same origin as the API; the session token rides on every API call. */
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
  ],
};
