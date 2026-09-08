import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import type { JobDetail as JobDetailDto } from '@job-finder/shared';
import { Icon } from '../../../shared/icon/icon';
import { JobsApi } from '../jobs-api';
import { Prose } from '../prose/prose';

/**
 * Hostname of a URL without "www.", or the URL itself when it does not parse.
 */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Full-page view of one offer. Opening it marks the offer as viewed server-side.
 */
@Component({
  selector: 'app-job-detail',
  imports: [DatePipe, RouterLink, Icon, Prose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-detail.html',
  styleUrl: './job-detail.scss',
})
export class JobDetail implements OnInit {
  /**
   * Bound from the :id route parameter.
   */
  readonly id = input.required<string>();

  /**
   * Offers API.
   */
  private readonly api = inject(JobsApi);

  /**
   * Ends the request with the component.
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * The offer, null until loaded.
   */
  protected readonly job = signal<JobDetailDto | null>(null);

  /**
   * Error shown instead of the offer.
   */
  protected readonly error = signal<string | null>(null);

  /**
   * True until the request settles.
   */
  protected readonly loading = signal(true);

  /**
   * Place line: remote, unknown, region-only, or town with postal code.
   */
  protected readonly place = computed(() => {
    const job = this.job();
    if (!job) return '';
    if (job.isRemote) return 'Full remote';
    if (!job.city) return 'Lieu non précisé';
    if (job.isLocationApproximate) return `${job.city} (commune non précisée)`;
    return job.postalCode ? `${job.city} (${job.postalCode})` : job.city;
  });

  /**
   * Twin listings, shown by host rather than as raw URLs.
   */
  protected readonly alternatives = computed(() =>
    (this.job()?.alternativeUrls ?? []).map((url) => ({ url, label: hostOf(url) })),
  );

  /**
   * Loads the offer once the id input is bound.
   */
  ngOnInit(): void {
    this.api
      .detail(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (job) => {
          this.job.set(job);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(
            error.status === 404
              ? 'Cette offre est introuvable.'
              : 'Impossible de charger cette offre, réessayez plus tard.',
          );
          this.loading.set(false);
        },
      });
  }

  /**
   * Stars or un-stars, updating only the flag locally.
   */
  protected toggleFavorite(): void {
    const current = this.job();
    if (!current) return;
    this.api
      .toggleFavorite(current.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => this.job.set({ ...current, isFavorite: summary.isFavorite }),
      });
  }
}
