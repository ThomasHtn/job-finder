import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/*
 * Bootstrap failures have no UI to land in: the console is the only outlet.
 */
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
