import { describe, expect, it } from 'vitest';

import { parsePdfDocument } from './pdf-parser';

describe('parsePdfDocument', () => {
  it('returns the expected parsed document shape', async () => {
    const result = await parsePdfDocument({
      documentId: 'doc-1',
      title: 'PBAC Public Summary Document',
      sourceName: 'PBAC',
      sourceType: 'pdf',
      sourceCountry: 'AU',
      sourceUrl: 'https://example.com/pbac.pdf',
      publishedAt: '2026-04-24T00:00:00.000Z',
    });

    expect(result).toEqual({
      documentId: 'doc-1',
      sourceType: 'pdf',
      title: 'PBAC Public Summary Document',
      publishedAt: '2026-04-24T00:00:00.000Z',
      rawText: 'Mock parsed PDF text for PBAC Public Summary Document',
      metadata: {
        sourceName: 'PBAC',
        sourceUrl: 'https://example.com/pbac.pdf',
        sourceCountry: 'AU',
        parser: 'mock-pdf-parser',
      },
    });
  });
});
