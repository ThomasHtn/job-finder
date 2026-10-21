import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Placeholder of a list or panel holding nothing, or of an error replacing it; the actions, if any,
 * are projected buttons. Usage: `<app-empty-state [title]="..." [hint]="..."><button app-button>...</button></app-empty-state>`.
 */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  host: { class: 'empty-state' },
})
export class EmptyState {
  /**
   * What the reader sees, or what went wrong.
   */
  public readonly title = input.required<string>();

  /**
   * What to do about it, when there is something to say.
   */
  public readonly hint = input<string | null>(null);
}
