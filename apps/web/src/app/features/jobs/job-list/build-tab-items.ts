import type { JobCounts } from '@job-finder/shared';

import type { Translations } from '@core/i18n/translations';

import type { JobTabItem } from '../job-tabs/job-tab-item';
import { SOURCES_TAB } from '../shell-tab';

/**
 * The tab strip entries: where they lead, how they read, how many offers they hold.
 * The on-site tab is named after the configured area, a placeholder until it is known.
 */
export function buildTabItems(
  text: Translations,
  areaLabel: string | null,
  counts: JobCounts,
): JobTabItem[] {
  return [
    {
      tab: 'local',
      label: areaLabel ?? text.tabs.areaPlaceholder,
      count: counts.local,
      icon: 'pin',
    },
    { tab: 'remote', label: text.tabs.remote, count: counts.remote, icon: 'remote' },
    { tab: 'favorites', label: text.tabs.favorites, count: counts.favorites, icon: 'star' },
    { tab: SOURCES_TAB, label: text.tabs.sources, count: null, icon: 'pulse' },
  ];
}
