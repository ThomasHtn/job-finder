/**
 * The fields read from one EURES vacancy.
 */
export interface EuresJob {
  id: string;
  title: string;
  description?: string;
  creationDate?: number;
  positionOfferingCode?: string;
  employer?: { name?: string | null };
}
