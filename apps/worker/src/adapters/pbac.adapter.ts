import type { NormalizedQuery, SelectedDocument } from '@hta/shared';

import { fetchText } from '../retrieval/http-client';
import { PBAC_FIXTURE_SELECTED_DOCUMENT } from './fixtures/pbac-search-result';
import type { SourceAdapter } from './base.adapter';

const PBAC_RETRIEVAL_MODE = process.env.PBAC_RETRIEVAL_MODE?.trim() || 'fixture';
const PBAC_SEARCH_URL =
  'https://www.pbs.gov.au/info/industry/listing/elements/pbac-meetings';

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

    if (PBAC_RETRIEVAL_MODE === 'live') {
      await fetchText(PBAC_SEARCH_URL);
      return null;
    }

    throw new Error('PBAC retrieval mode is not implemented yet.');
  }
}
