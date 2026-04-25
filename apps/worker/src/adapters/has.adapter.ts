import type { NormalizedQuery, SelectedDocument } from '@hta/shared';

import { fetchText } from '../retrieval/http-client';
import type { SourceAdapter } from './base.adapter';
import { HAS_FIXTURE_SELECTED_DOCUMENT } from './fixtures/has-search-result';
import { parseLatestHasSelectedDocument } from './has.parser';

const HAS_RETRIEVAL_MODE = process.env.HAS_RETRIEVAL_MODE?.trim() || 'fixture';
const HAS_SEARCH_URL = 'https://www.has-sante.fr/jcms/fc_2875171/fr/recherche';

export class HasAdapter implements SourceAdapter {
  readonly source = 'has' as const;

  supports(query: NormalizedQuery): boolean {
    return query.canonicalGeography === 'FR';
  }

  async searchLatestRelevantDocument(
    query: NormalizedQuery,
  ): Promise<SelectedDocument | null> {
    if (!this.supports(query) || query.rawQuery.trim().length === 0) {
      return null;
    }

    if (HAS_RETRIEVAL_MODE === 'fixture') {
      return HAS_FIXTURE_SELECTED_DOCUMENT;
    }

    if (HAS_RETRIEVAL_MODE === 'live') {
      const html = await fetchText(HAS_SEARCH_URL);
      return parseLatestHasSelectedDocument(html, HAS_SEARCH_URL);
    }

    throw new Error('HAS retrieval mode is not implemented yet.');
  }
}
