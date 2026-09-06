/** One rendered block of a description: bullet items, or a paragraph when `items` is empty. */
export interface DescriptionBlock {
  items: string[];
  text: string;
  /** A line introducing what follows, so it can hug the block underneath it. */
  lead: boolean;
}

const BULLET = /^[-–—•*▪>]\s+/;
/** A short line ending in a colon introduces what follows: it stands on its own. */
const LEAD_IN = /:$/;
const LEAD_IN_MAX = 90;

/**
 * Sources hand us one plain-text blob with meaningful newlines. Restore its structure so a
 * job ad reads as paragraphs and lists instead of a wall of pre-wrapped text.
 */
export function toDescriptionBlocks(text: string | null): DescriptionBlock[] {
  if (!text) return [];

  const blocks: DescriptionBlock[] = [];
  let paragraph: string[] = [];
  let items: string[] = [];

  const closeParagraph = (lead = false): void => {
    // Consecutive lines are re-flowed: most sources hard-wrap their text at a fixed width.
    if (paragraph.length) blocks.push({ items: [], text: paragraph.join(' '), lead });
    paragraph = [];
  };
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
