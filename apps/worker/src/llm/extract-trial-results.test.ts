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

describe('extractTrialResults', () => {
  it('valid JSON passes', async () => {
    vi.doMock('./openai-client', () => ({
      callOpenAIStructured: vi.fn().mockResolvedValue(
        JSON.stringify({
          trialName: 'MOCK-301',
          phase: 'Phase 3',
          population: 'Adults with mock condition',
          comparator: 'Standard of care',
          primaryEndpoint: 'Progression-free survival',
          resultSummary: 'Mock drug improved the primary endpoint.',
        }),
      ),
    }));

    const { extractTrialResults } = await import('./extract-trial-results');

    await expect(extractTrialResults(buildParsedDocument())).resolves.toEqual({
      trialName: 'MOCK-301',
      phase: 'Phase 3',
      population: 'Adults with mock condition',
      comparator: 'Standard of care',
      primaryEndpoint: 'Progression-free survival',
      resultSummary: 'Mock drug improved the primary endpoint.',
    });
  });

  it('malformed JSON throws', async () => {
    vi.doMock('./openai-client', () => ({
      callOpenAIStructured: vi.fn().mockResolvedValue('{not valid json'),
    }));

    const { extractTrialResults } = await import('./extract-trial-results');

    await expect(extractTrialResults(buildParsedDocument())).rejects.toThrow();
  });

  it('missing fields throw', async () => {
    vi.doMock('./openai-client', () => ({
      callOpenAIStructured: vi.fn().mockResolvedValue(
        JSON.stringify({
          trialName: 'MOCK-301',
          phase: 'Phase 3',
        }),
      ),
    }));

    const { extractTrialResults } = await import('./extract-trial-results');

    await expect(extractTrialResults(buildParsedDocument())).rejects.toThrow();
  });

  it('invalid field types throw', async () => {
    vi.doMock('./openai-client', () => ({
      callOpenAIStructured: vi.fn().mockResolvedValue(
        JSON.stringify({
          trialName: 'MOCK-301',
          phase: 3,
          population: 'Adults with mock condition',
          comparator: 'Standard of care',
          primaryEndpoint: 'Progression-free survival',
          resultSummary: 'Mock drug improved the primary endpoint.',
        }),
      ),
    }));

    const { extractTrialResults } = await import('./extract-trial-results');

    await expect(extractTrialResults(buildParsedDocument())).rejects.toThrow();
  });
});
