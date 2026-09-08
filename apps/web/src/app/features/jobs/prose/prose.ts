import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toDescriptionBlocks } from '../description/to-description-blocks';

/**
 * Renders a source's plain-text description as readable paragraphs and lists.
 */
@Component({
  selector: 'app-prose',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './prose.html',
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
