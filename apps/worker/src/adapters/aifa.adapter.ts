import type { NormalizedQuery, SelectedDocument } from '@hta/shared';

import { fetchText } from '../retrieval/http-client';
import type { SourceAdapter } from './base.adapter';
import { AIFA_FIXTURE_SELECTED_DOCUMENT } from './fixtures/aifa-search-result';
import { parseLatestAifaSelectedDocument } from './aifa.parser';

const AIFA_RETRIEVAL_MODE = process.env.AIFA_RETRIEVAL_MODE?.trim() || 'fixture';
const AIFA_SEARCH_URL = 'https://www.aifa.gov.it/web/guest/ricerca';

export class AifaAdapter implements SourceAdapter {
  readonly source = 'aifa' as const;

  supports(query: NormalizedQuery): boolean {
    return query.canonicalGeography === 'IT';
  }

  async searchLatestRelevantDocument(
    query: NormalizedQuery,
  ): Promise<SelectedDocument | null> {
    if (!this.supports(query) || query.rawQuery.trim().length === 0) {
      return null;
    }

    if (AIFA_RETRIEVAL_MODE === 'fixture') {
      return AIFA_FIXTURE_SELECTED_DOCUMENT;
    }

    if (AIFA_RETRIEVAL_MODE === 'live') {
      const html = await fetchText(AIFA_SEARCH_URL);
      return parseLatestAifaSelectedDocument(html, AIFA_SEARCH_URL);
    }

    throw new Error('AIFA retrieval mode is not implemented yet.');
  }
}
