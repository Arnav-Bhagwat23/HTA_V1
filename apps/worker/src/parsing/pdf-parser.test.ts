import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SelectedDocument } from '@hta/shared';

const buildSelectedDocument = (
  overrides: Partial<SelectedDocument> = {},
): SelectedDocument => ({
  documentId: 'doc-1',
  title: 'PBAC Public Summary Document',
  sourceName: 'PBAC',
  sourceType: 'pdf',
  sourceCountry: 'AU',
  sourceUrl: 'https://example.com/pbac.pdf',
  publishedAt: '2026-04-24T00:00:00.000Z',
  ...overrides,
});

afterEach(() => {
  delete process.env.PDF_PARSER_MODE;
  vi.doUnmock('../retrieval/http-client');
  vi.doUnmock('./pdf-text-extractor');
  vi.restoreAllMocks();
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

  it('live mode fetches bytes and returns parsed text output', async () => {
    process.env.PDF_PARSER_MODE = 'live';
    const fetchBinaryMock = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
    const extractPdfTextMock = vi
      .fn()
      .mockResolvedValue('Live parsed PDF text');
    vi.doMock('../retrieval/http-client', () => ({
      fetchBinary: fetchBinaryMock,
    }));
    vi.doMock('./pdf-text-extractor', () => ({
      extractPdfText: extractPdfTextMock,
    }));
    const { parsePdfDocument } = await import('./pdf-parser');

    await expect(parsePdfDocument(buildSelectedDocument())).resolves.toEqual({
      documentId: 'doc-1',
      sourceType: 'pdf',
      title: 'PBAC Public Summary Document',
      publishedAt: '2026-04-24T00:00:00.000Z',
      rawText: 'Live parsed PDF text',
      metadata: {
        sourceName: 'PBAC',
        sourceUrl: 'https://example.com/pbac.pdf',
        sourceCountry: 'AU',
        parser: 'pdf-parse',
      },
    });

    expect(fetchBinaryMock).toHaveBeenCalledWith('https://example.com/pbac.pdf');
    expect(extractPdfTextMock).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]));
  });

  it('live mode throws a clear error when sourceUrl is missing', async () => {
    process.env.PDF_PARSER_MODE = 'live';
    const { parsePdfDocument } = await import('./pdf-parser');

    await expect(
      parsePdfDocument(buildSelectedDocument({ sourceUrl: null })),
    ).rejects.toThrow('PDF parser live mode requires selectedDocument.sourceUrl.');
  });

  it('parsePdfBuffer uses the extracted text to build a ParsedDocument', async () => {
    vi.doMock('./pdf-text-extractor', () => ({
      extractPdfText: vi.fn().mockResolvedValue('Buffer parsed PDF text'),
    }));
    const { parsePdfBuffer } = await import('./pdf-parser');

    await expect(
      parsePdfBuffer(new Uint8Array([1, 2, 3]), buildSelectedDocument()),
    ).resolves.toEqual({
      documentId: 'doc-1',
      sourceType: 'pdf',
      title: 'PBAC Public Summary Document',
      publishedAt: '2026-04-24T00:00:00.000Z',
      rawText: 'Buffer parsed PDF text',
      metadata: {
        sourceName: 'PBAC',
        sourceUrl: 'https://example.com/pbac.pdf',
        sourceCountry: 'AU',
        parser: 'pdf-parse',
      },
    });
  });

  it('parsePdfBuffer parses text from the local fixture PDF', async () => {
    const { parsePdfBuffer } = await import('./pdf-parser');
    const pdfBytes = await readFile(
      path.join(process.cwd(), 'apps/worker/src/parsing/fixtures/minimal.pdf'),
    );

    const parsed = await parsePdfBuffer(pdfBytes, buildSelectedDocument());

    expect(parsed.documentId).toBe('doc-1');
    expect(parsed.sourceType).toBe('pdf');
    expect(parsed.rawText.length).toBeGreaterThan(0);
    expect(parsed.rawText).toContain('Hello HTA PDF');
    expect(parsed.metadata.parser).toBe('pdf-parse');
  });
});
