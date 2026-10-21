import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { appConfig } from './app/app.config';

/*
 * Bootstrap failures have no UI to land in: the console is the only outlet.
 */
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
