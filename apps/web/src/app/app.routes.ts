import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

/**
 * Two screens: login, and the feed. One offer is a child of the feed, never a page of its own,
 * so opening it never unmounts the list behind it.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/jobs/job-list/job-list').then((m) => m.JobList),
    children: [
      {
        path: 'offres/:id',
        loadComponent: () =>
          import('./features/jobs/job-detail/job-detail').then((m) => m.JobDetail),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
