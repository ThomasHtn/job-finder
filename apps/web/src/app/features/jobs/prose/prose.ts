import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toDescriptionBlocks } from '../description-blocks';

/** Renders a source's plain-text description as readable paragraphs and lists. */
@Component({
  selector: 'app-prose',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (block of blocks(); track $index) {
      @if (block.items.length) {
        <ul class="prose__list">
          @for (item of block.items; track $index) {
            <li>{{ item }}</li>
          }
        </ul>
      } @else {
        <p class="prose__paragraph" [class.prose__paragraph--lead]="block.lead">{{ block.text }}</p>
      }
    }
  `,
  styleUrl: './prose.scss',
})
export class Prose {
  readonly text = input.required<string | null>();

  protected readonly blocks = computed(() => toDescriptionBlocks(this.text()));
}
