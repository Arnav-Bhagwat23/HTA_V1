import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SelectedDocument } from '@hta/shared';

const buildSelectedDocument = (): SelectedDocument => ({
  documentId: 'doc-1',
  title: 'PBAC Public Summary Document',
  sourceName: 'PBAC',
  sourceType: 'pdf',
  sourceCountry: 'AU',
  sourceUrl: 'https://example.com/pbac.pdf',
  publishedAt: '2026-04-24T00:00:00.000Z',
});

afterEach(() => {
  delete process.env.PDF_PARSER_MODE;
  vi.resetModules();
});

describe('pdf-parser', () => {
  it('mock mode returns the expected parsed document shape', async () => {
    process.env.PDF_PARSER_MODE = 'mock';
    const { parsePdfDocument } = await import('./pdf-parser');

    const result = await parsePdfDocument(buildSelectedDocument());

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

  it('live mode delegates to parsePdfBuffer and currently throws', async () => {
    process.env.PDF_PARSER_MODE = 'live';
    const { parsePdfDocument } = await import('./pdf-parser');

    await expect(
      parsePdfDocument(buildSelectedDocument()),
    ).rejects.toThrow('PDF parser live mode is not implemented yet.');
  });

  it('parsePdfBuffer currently throws for the future live parsing boundary', async () => {
    const { parsePdfBuffer } = await import('./pdf-parser');

    await expect(
      parsePdfBuffer(new Uint8Array([1, 2, 3]), buildSelectedDocument()),
    ).rejects.toThrow('PDF parser live mode is not implemented yet.');
  });
});
