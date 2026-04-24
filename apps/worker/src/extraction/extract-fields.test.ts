import { describe, expect, it } from 'vitest';

import { extractFieldsFromParsedDocument } from './extract-fields';

describe('extractFieldsFromParsedDocument', () => {
  it('returns rule-based fields with evidence', async () => {
    const result = await extractFieldsFromParsedDocument({
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

    expect(result.warnings).toEqual([]);
    expect(result.confidence).toBe(1);
    expect(result.fields).toHaveLength(2);
    expect(result.fields[0].fieldName).toBe('source_document_title');
    expect(result.fields[1].fieldName).toBe('document_text_available');
    expect(result.fields[1].value).toBe('Yes');
    expect(result.fields[0].evidence[0]).toEqual({
      documentId: 'doc-1',
      documentTitle: 'PBAC Public Summary Document',
      documentUrl: 'https://example.com/pbac.pdf',
      sourcePage: '1',
      snippet: 'Mock parsed PDF text for PBAC Public Summary Document',
      publishedAt: '2026-04-24T00:00:00.000Z',
    });
  });

  it('marks text as unavailable when parsed text is blank', async () => {
    const result = await extractFieldsFromParsedDocument({
      documentId: 'doc-2',
      sourceType: 'pdf',
      title: 'Blank Document',
      publishedAt: null,
      rawText: '   ',
      metadata: {
        sourceName: 'PBAC',
        sourceUrl: null,
        sourceCountry: 'AU',
        parser: 'pdf-parse',
      },
    });

    expect(result.fields[1]).toMatchObject({
      fieldName: 'document_text_available',
      value: 'No',
      confidence: 1,
    });
    expect(result.fields[0].evidence[0].snippet).toBeNull();
  });
});
