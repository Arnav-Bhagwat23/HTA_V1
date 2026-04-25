import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.resetModules();
});

describe('normalizeQueryWithFallback', () => {
  it('uses LLM normalization when it succeeds', async () => {
    vi.doMock('../llm/normalize-query-with-llm', () => ({
      normalizeQueryWithLlm: vi.fn().mockResolvedValue({
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
    }));

    const { normalizeQueryWithFallback } = await import('./normalize-query');

    await expect(
      normalizeQueryWithFallback('Mock drug general indication Australia'),
    ).resolves.toMatchObject({
      canonicalDrug: 'Mock drug',
      canonicalIndication: 'General indication',
      canonicalGeography: 'AU',
    });
  }, 15000);

  it('falls back to rule-based normalization if LLM fails', async () => {
    vi.doMock('../llm/normalize-query-with-llm', () => ({
      normalizeQueryWithLlm: vi.fn().mockRejectedValue(
        new Error('LLM unavailable'),
      ),
    }));

    const { normalizeQueryWithFallback } = await import('./normalize-query');

    await expect(
      normalizeQueryWithFallback('Mock drug general indication Australia'),
    ).resolves.toMatchObject({
      canonicalGeography: 'AU',
      requiresManualUpload: false,
    });
  });
});
