import type { NormalizedQuery, SelectedDocument } from '@hta/shared';

import type { SourceAdapter } from './base.adapter';

const MOCK_PBAC_DOCUMENT_URL =
  'https://www.pbs.gov.au/info/industry/listing/elements/pbac-meetings/mock-pbac-public-summary-document';

const buildMockDocumentTitle = (query: NormalizedQuery): string => {
  const titleParts = [
    query.canonicalDrug ?? 'Mock drug',
    query.canonicalIndication ?? 'general indication',
  ];

  return `PBAC Public Summary Document - ${titleParts.join(' - ')}`;
};

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

    return {
      documentId: crypto.randomUUID(),
      title: buildMockDocumentTitle(query),
      sourceName: 'PBAC',
      sourceType: 'pdf',
      sourceCountry: 'AU',
      sourceUrl: MOCK_PBAC_DOCUMENT_URL,
      publishedAt: '2026-04-24T00:00:00.000Z',
    };
  }
}
