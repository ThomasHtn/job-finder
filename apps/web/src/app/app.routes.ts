import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

/**
 * Three screens, all lazy: login, the feed, and one offer.
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
  },
  {
    path: 'offres/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/jobs/job-detail/job-detail').then((m) => m.JobDetail),
  },
  { path: '**', redirectTo: '' },
];
