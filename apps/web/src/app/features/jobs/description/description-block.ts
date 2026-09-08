/**
 * One rendered block of a description: bullet items, or a paragraph when `items` is empty.
 */
export interface DescriptionBlock {
  /**
   * Bullet items; empty for a paragraph.
   */
  items: string[];

  /**
   * Paragraph text; empty for a list.
   */
  text: string;

  /**
   * A line introducing what follows, so it can hug the block underneath it.
   */
  lead: boolean;
}
