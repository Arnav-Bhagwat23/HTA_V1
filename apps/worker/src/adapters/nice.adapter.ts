import type { NormalizedQuery, SelectedDocument } from '@hta/shared';

import { fetchText } from '../retrieval/http-client';
import { NICE_FIXTURE_SELECTED_DOCUMENT } from './fixtures/nice-search-result';
import type { SourceAdapter } from './base.adapter';
import { parseLatestNiceSelectedDocument } from './nice.parser';

const NICE_RETRIEVAL_MODE = process.env.NICE_RETRIEVAL_MODE?.trim() || 'fixture';
const NICE_SEARCH_URL = 'https://www.nice.org.uk/guidance/published';

export class NiceAdapter implements SourceAdapter {
  readonly source = 'nice' as const;

  supports(query: NormalizedQuery): boolean {
    return query.canonicalGeography === 'UK';
  }

  async searchLatestRelevantDocument(
    query: NormalizedQuery,
  ): Promise<SelectedDocument | null> {
    if (!this.supports(query) || query.rawQuery.trim().length === 0) {
      return null;
    }

    if (NICE_RETRIEVAL_MODE === 'fixture') {
      return NICE_FIXTURE_SELECTED_DOCUMENT;
    }

    if (NICE_RETRIEVAL_MODE === 'live') {
      const html = await fetchText(NICE_SEARCH_URL);
      return parseLatestNiceSelectedDocument(html, NICE_SEARCH_URL);
    }

    throw new Error('NICE retrieval mode is not implemented yet.');
  }
}
