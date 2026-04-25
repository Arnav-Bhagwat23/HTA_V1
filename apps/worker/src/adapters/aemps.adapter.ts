import type { NormalizedQuery, SelectedDocument } from '@hta/shared';

import { fetchText } from '../retrieval/http-client';
import type { SourceAdapter } from './base.adapter';
import { AEMPS_FIXTURE_SELECTED_DOCUMENT } from './fixtures/aemps-search-result';
import { parseLatestAempsSelectedDocument } from './aemps.parser';

const AEMPS_RETRIEVAL_MODE = process.env.AEMPS_RETRIEVAL_MODE?.trim() || 'fixture';
const AEMPS_SEARCH_URL =
  'https://www.aemps.gob.es/medicamentos-de-uso-humano/informes-publicos-de-evaluacion/';

export class AempsAdapter implements SourceAdapter {
  readonly source = 'aemps' as const;

  supports(query: NormalizedQuery): boolean {
    return query.canonicalGeography === 'ES';
  }

  async searchLatestRelevantDocument(
    query: NormalizedQuery,
  ): Promise<SelectedDocument | null> {
    if (!this.supports(query) || query.rawQuery.trim().length === 0) {
      return null;
    }

    if (AEMPS_RETRIEVAL_MODE === 'fixture') {
      return AEMPS_FIXTURE_SELECTED_DOCUMENT;
    }

    if (AEMPS_RETRIEVAL_MODE === 'live') {
      const html = await fetchText(AEMPS_SEARCH_URL);
      return parseLatestAempsSelectedDocument(html, AEMPS_SEARCH_URL);
    }

    throw new Error('AEMPS retrieval mode is not implemented yet.');
  }
}
