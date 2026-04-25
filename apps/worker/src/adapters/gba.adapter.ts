import type { NormalizedQuery, SelectedDocument } from '@hta/shared';

import { fetchText } from '../retrieval/http-client';
import type { SourceAdapter } from './base.adapter';
import { GBA_FIXTURE_SELECTED_DOCUMENT } from './fixtures/gba-search-result';
import { parseLatestGbaSelectedDocument } from './gba.parser';

const GBA_RETRIEVAL_MODE = process.env.GBA_RETRIEVAL_MODE?.trim() || 'fixture';
const GBA_SEARCH_URL = 'https://www.g-ba.de/bewertungsverfahren/nutzenbewertung/';

export class GbaAdapter implements SourceAdapter {
  readonly source = 'gba' as const;

  supports(query: NormalizedQuery): boolean {
    return query.canonicalGeography === 'DE';
  }

  async searchLatestRelevantDocument(
    query: NormalizedQuery,
  ): Promise<SelectedDocument | null> {
    if (!this.supports(query) || query.rawQuery.trim().length === 0) {
      return null;
    }

    if (GBA_RETRIEVAL_MODE === 'fixture') {
      return GBA_FIXTURE_SELECTED_DOCUMENT;
    }

    if (GBA_RETRIEVAL_MODE === 'live') {
      const html = await fetchText(GBA_SEARCH_URL);
      return parseLatestGbaSelectedDocument(html, GBA_SEARCH_URL);
    }

    throw new Error('G-BA retrieval mode is not implemented yet.');
  }
}
