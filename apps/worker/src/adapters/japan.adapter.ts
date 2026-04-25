import type { NormalizedQuery, SelectedDocument } from '@hta/shared';

import { fetchText } from '../retrieval/http-client';
import type { SourceAdapter } from './base.adapter';
import { JAPAN_HTA_FIXTURE_SELECTED_DOCUMENT } from './fixtures/japan-search-result';
import { parseLatestJapanHtaSelectedDocument } from './japan.parser';

const JAPAN_HTA_RETRIEVAL_MODE =
  process.env.JAPAN_HTA_RETRIEVAL_MODE?.trim() || 'fixture';
const JAPAN_HTA_SEARCH_URL =
  'https://www.mhlw.go.jp/stf/shingi/shingi-chuo_128154.html';

export class JapanAdapter implements SourceAdapter {
  readonly source = 'japan' as const;

  supports(query: NormalizedQuery): boolean {
    return query.canonicalGeography === 'JP';
  }

  async searchLatestRelevantDocument(
    query: NormalizedQuery,
  ): Promise<SelectedDocument | null> {
    if (!this.supports(query) || query.rawQuery.trim().length === 0) {
      return null;
    }

    if (JAPAN_HTA_RETRIEVAL_MODE === 'fixture') {
      return JAPAN_HTA_FIXTURE_SELECTED_DOCUMENT;
    }

    if (JAPAN_HTA_RETRIEVAL_MODE === 'live') {
      const html = await fetchText(JAPAN_HTA_SEARCH_URL);
      return parseLatestJapanHtaSelectedDocument(html, JAPAN_HTA_SEARCH_URL);
    }

    throw new Error('Japan HTA retrieval mode is not implemented yet.');
  }
}
