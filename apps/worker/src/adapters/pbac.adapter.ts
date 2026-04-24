import type { NormalizedQuery, SelectedDocument } from '@hta/shared';

import type { SourceAdapter } from './base.adapter';

export class PbacAdapter implements SourceAdapter {
  readonly source = 'pbac' as const;

  supports(query: NormalizedQuery): boolean {
    return query.canonicalGeography === 'AU';
  }

  async searchLatestRelevantDocument(
    _query: NormalizedQuery,
  ): Promise<SelectedDocument | null> {
    return null;
  }
}
