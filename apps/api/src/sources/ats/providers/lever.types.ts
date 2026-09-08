/**
 * The fields read from one Lever posting.
 */
export interface LeverJob {
  id: string;
  text: string;
  country?: string;
  workplaceType?: string;
  createdAt?: number;
  hostedUrl: string;
  descriptionPlain?: string;
  additionalPlain?: string;
  categories?: { location?: string; commitment?: string };
}
