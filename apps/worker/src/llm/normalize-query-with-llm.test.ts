import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.resetModules();
});

describe('normalizeQueryWithLlm', () => {
  it('valid structured JSON passes', async () => {
    vi.doMock('./openai-client', () => ({
      callOpenAIStructured: vi.fn().mockResolvedValue(
        JSON.stringify({
          rawQuery: 'Mock drug general indication Australia',
          canonicalDrug: 'Mock drug',
          canonicalIndication: 'General indication',
          canonicalGeography: 'AU',
          drugAliases: ['Mock drug'],
          indicationAliases: ['General indication'],
          geographyAliases: ['australia'],
          confidence: {
            drug: 0.9,
            indication: 0.8,
            geography: 1,
          },
          requiresManualUpload: false,
          warnings: [],
        }),
      ),
    }));

    const { normalizeQueryWithLlm } = await import('./normalize-query-with-llm');

    await expect(
      normalizeQueryWithLlm('Mock drug general indication Australia'),
    ).resolves.toMatchObject({
      canonicalDrug: 'Mock drug',
      canonicalIndication: 'General indication',
      canonicalGeography: 'AU',
      requiresManualUpload: false,
    });
  });

  it('invalid geography throws', async () => {
    vi.doMock('./openai-client', () => ({
      callOpenAIStructured: vi.fn().mockResolvedValue(
        JSON.stringify({
          rawQuery: 'Mock drug general indication Atlantis',
          canonicalDrug: 'Mock drug',
          canonicalIndication: 'General indication',
          canonicalGeography: 'ATLANTIS',
          drugAliases: [],
          indicationAliases: [],
          geographyAliases: [],
          confidence: {
            drug: 0.9,
            indication: 0.8,
            geography: 0.2,
          },
          requiresManualUpload: true,
          warnings: [],
        }),
      ),
    }));

    const { normalizeQueryWithLlm } = await import('./normalize-query-with-llm');

    await expect(
      normalizeQueryWithLlm('Mock drug general indication Atlantis'),
    ).rejects.toThrow();
  });

  it('bad LLM JSON throws', async () => {
    vi.doMock('./openai-client', () => ({
      callOpenAIStructured: vi.fn().mockResolvedValue('{not valid json'),
    }));

    const { normalizeQueryWithLlm } = await import('./normalize-query-with-llm');

    await expect(
      normalizeQueryWithLlm('Mock drug general indication Australia'),
    ).rejects.toThrow();
  });

  it('invalid warnings fail validation', async () => {
    vi.doMock('./openai-client', () => ({
      callOpenAIStructured: vi.fn().mockResolvedValue(
        JSON.stringify({
          rawQuery: 'Mock drug general indication Australia',
          canonicalDrug: 'Mock drug',
          canonicalIndication: 'General indication',
          canonicalGeography: 'AU',
          drugAliases: ['Mock drug'],
          indicationAliases: ['General indication'],
          geographyAliases: ['australia'],
          confidence: {
            drug: 0.9,
            indication: 0.8,
            geography: 1,
          },
          requiresManualUpload: false,
          warnings: [123],
        }),
      ),
    }));

    const { normalizeQueryWithLlm } = await import('./normalize-query-with-llm');

    await expect(
      normalizeQueryWithLlm('Mock drug general indication Australia'),
    ).rejects.toThrow();
  });
});
