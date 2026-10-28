import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

import { Icon } from '@shared/icon/icon';
import { IconButton } from '@shared/icon-button/icon-button';

/**
 * A warning triangle in the header whose tooltip says which sources are down; a press shows it on a touch screen.
 */
@Component({
  selector: 'app-health-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, IconButton],
  templateUrl: './health-alert.html',
  styleUrl: './health-alert.scss',
  host: {
    class: 'health-alert',
    '(document:pointerdown)': 'closeFromOutside($event)',
    '(document:keydown.escape)': 'open.set(false)',
  },
})
export class HealthAlert {
  /**
   * This component's element, to tell a press inside from one outside.
   */
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * e.g. "5/6 sources available - failing: APEC".
   */
  public readonly label = input.required<string>();

  /**
   * Whether a press is holding the tooltip open.
   */
  protected readonly open = signal(false);

  /**
   * Shows or hides the tooltip.
   */
  protected toggle(): void {
    this.open.update((open) => !open);
  }

  /**
   * A press anywhere else hides the tooltip.
   */
  protected closeFromOutside(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
