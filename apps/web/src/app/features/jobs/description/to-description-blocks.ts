import type { DescriptionBlock } from './description-block';
import { BULLET, LEAD_IN, LEAD_IN_MAX } from './description.constants';

/**
 * Sources hand us one plain-text blob with meaningful newlines. Restore its structure so a
 * job ad reads as paragraphs and lists instead of a wall of pre-wrapped text.
 */
export function toDescriptionBlocks(text: string | null): DescriptionBlock[] {
  if (!text) return [];

  const blocks: DescriptionBlock[] = [];
  let paragraph: string[] = [];
  let items: string[] = [];

  /*
   * Consecutive lines are re-flowed: most sources hard-wrap their text at a fixed width.
   */
  const closeParagraph = (lead = false): void => {
    if (paragraph.length) blocks.push({ items: [], text: paragraph.join(' '), lead });
    paragraph = [];
  };

  /*
   * Flushes the pending bullet items as one list block.
   */
  const closeList = (): void => {
    if (items.length) blocks.push({ items, text: '', lead: false });
    items = [];
  };

  for (const raw of text.split('\n')) {
    const line = raw.trim();

    if (!line) {
      closeList();
      closeParagraph();
      continue;
    }

    if (BULLET.test(line)) {
      closeParagraph();
      items.push(line.replace(BULLET, '').trim());
      continue;
    }

    closeList();
    paragraph.push(line);
    if (LEAD_IN.test(line) && line.length <= LEAD_IN_MAX) closeParagraph(true);
  }

  closeList();
  closeParagraph();
  return blocks;
}
