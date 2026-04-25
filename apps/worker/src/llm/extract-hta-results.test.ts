import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ParsedDocument } from '@hta/shared';

const buildParsedDocument = (
  overrides: Partial<ParsedDocument> = {},
): ParsedDocument => ({
  documentId: 'doc-1',
  sourceType: 'pdf',
  title: 'Mock HTA document',
  publishedAt: '2026-04-25T00:00:00.000Z',
  rawText: 'Mock parsed document text',
  metadata: {
    sourceName: 'Mock Source',
    sourceUrl: 'https://example.com/mock.pdf',
    sourceCountry: 'AU',
    parser: 'mock-pdf-parser',
  },
  ...overrides,
});

afterEach(() => {
  vi.resetModules();
});

describe('extractHtaResults', () => {
  it('valid JSON passes', async () => {
    vi.doMock('./openai-client', () => ({
      callOpenAI: vi.fn().mockResolvedValue(
        JSON.stringify({
          drugName: 'Mock drug',
          indication: 'General indication',
          country: 'Australia',
          htaDecision: 'Recommended',
          decisionDate: '2026-04-25',
          restrictionDetails: null,
        }),
      ),
    }));

    const { extractHtaResults } = await import('./extract-hta-results');

    await expect(extractHtaResults(buildParsedDocument())).resolves.toEqual({
      drugName: 'Mock drug',
      indication: 'General indication',
      country: 'Australia',
      htaDecision: 'Recommended',
      decisionDate: '2026-04-25',
      restrictionDetails: null,
    });
  });

  it('malformed JSON throws', async () => {
    vi.doMock('./openai-client', () => ({
      callOpenAI: vi.fn().mockResolvedValue('{not valid json'),
    }));

    const { extractHtaResults } = await import('./extract-hta-results');

    await expect(extractHtaResults(buildParsedDocument())).rejects.toThrow();
  });

  it('invalid htaDecision throws', async () => {
    vi.doMock('./openai-client', () => ({
      callOpenAI: vi.fn().mockResolvedValue(
        JSON.stringify({
          drugName: 'Mock drug',
          indication: 'General indication',
          country: 'Australia',
          htaDecision: 'Approved',
          decisionDate: '2026-04-25',
          restrictionDetails: null,
        }),
      ),
    }));

    const { extractHtaResults } = await import('./extract-hta-results');

    await expect(extractHtaResults(buildParsedDocument())).rejects.toThrow();
  });

  it('missing fields throw', async () => {
    vi.doMock('./openai-client', () => ({
      callOpenAI: vi.fn().mockResolvedValue(
        JSON.stringify({
          drugName: 'Mock drug',
          indication: 'General indication',
          htaDecision: 'Recommended',
        }),
      ),
    }));

    const { extractHtaResults } = await import('./extract-hta-results');

    await expect(extractHtaResults(buildParsedDocument())).rejects.toThrow();
  });
});
