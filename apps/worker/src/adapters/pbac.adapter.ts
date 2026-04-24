import type { NormalizedQuery, SelectedDocument } from '@hta/shared';

import { PBAC_FIXTURE_SELECTED_DOCUMENT } from './fixtures/pbac-search-result';
import type { SourceAdapter } from './base.adapter';

const PBAC_RETRIEVAL_MODE = process.env.PBAC_RETRIEVAL_MODE?.trim() || 'fixture';

export class PbacAdapter implements SourceAdapter {
  readonly source = 'pbac' as const;

  supports(query: NormalizedQuery): boolean {
    return query.canonicalGeography === 'AU';
  }

  async searchLatestRelevantDocument(
    query: NormalizedQuery,
  ): Promise<SelectedDocument | null> {
    if (!this.supports(query) || query.rawQuery.trim().length === 0) {
      return null;
    }

    if (PBAC_RETRIEVAL_MODE === 'fixture') {
      return PBAC_FIXTURE_SELECTED_DOCUMENT;
    }

    throw new Error('PBAC retrieval mode is not implemented yet.');
  }
}
