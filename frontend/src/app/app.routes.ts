import { Routes } from '@angular/router';

import { authGuard } from '@core/auth/auth.guards';
import { JOB_DETAIL_PATH, JOB_ID_PARAM } from '@core/jobs/jobs.constants';

/**
 * Two screens, each lazy: login, and the feed. One offer is a child of the feed, never a page on its
 * own, so opening it never unmounts the list behind it, and its deep link still works.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('@pages/login/login').then((page) => page.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('@pages/jobs/jobs').then((page) => page.JobsPage),
    children: [
      {
        path: `${JOB_DETAIL_PATH}/:${JOB_ID_PARAM}`,
        loadComponent: () =>
          import('@pages/job-detail/job-detail').then((page) => page.JobDetailPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
