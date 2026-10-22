import { bootstrapApplication } from '@angular/platform-browser';

import { hideSplash } from '@core/startup/splash.utils';

import { App } from './app/app';
import { appConfig } from './app/app.config';

/*
 * Bootstrap failures have no UI to land in: the console is the only outlet, and the start-up screen
 * must not stay up for ever over a dead page.
 */
bootstrapApplication(App, appConfig).catch((err) => {
  console.error(err);
  hideSplash(document);
});
