/**
 * Body of the favourite route: the state the offer must end up in, so repeating the call is harmless.
 */
export interface FavoriteUpdate {
  /**
   * True to star the offer, false to un-star it.
   */
  isFavorite: boolean;
}
