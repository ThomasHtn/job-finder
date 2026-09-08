import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toDescriptionBlocks } from '../description-blocks';

/**
 * Renders a source's plain-text description as readable paragraphs and lists.
 */
@Component({
  selector: 'app-prose',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- One block per paragraph or list, in source order. -->
    @for (block of blocks(); track $index) {
      @if (block.items.length) {
        <!-- Bullet list. -->
        <ul class="prose__list">
          @for (item of block.items; track $index) {
            <li>{{ item }}</li>
          }
        </ul>
      } @else {
        <!-- Paragraph; a lead-in hugs the block below it. -->
        <p class="prose__paragraph" [class.prose__paragraph--lead]="block.lead">{{ block.text }}</p>
      }
    }
  `,
  styleUrl: './prose.scss',
})
export class Prose {
  /**
   * Raw text from the source.
   */
  readonly text = input.required<string | null>();

  /**
   * Structured blocks derived from the text.
   */
  protected readonly blocks = computed(() => toDescriptionBlocks(this.text()));
}
