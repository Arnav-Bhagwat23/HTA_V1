import type { NormalizedQuery, SelectedDocument } from '@hta/shared';

import type { RoutedSourcePlan } from '../routing/source-router';

export interface SourceAdapter {
  source: RoutedSourcePlan['sourceKey'];
  supports(query: NormalizedQuery): boolean;
  searchLatestRelevantDocument(
    query: NormalizedQuery,
  ): Promise<SelectedDocument | null>;
}
