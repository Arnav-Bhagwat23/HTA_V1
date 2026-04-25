import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NormalizedQuery } from '@hta/shared';

import { AIFA_FIXTURE_SELECTED_DOCUMENT } from './fixtures/aifa-search-result';

const buildQuery = (
  overrides: Partial<NormalizedQuery> = {},
): NormalizedQuery => ({
  rawQuery: 'mock oncology assessment italy',
  canonicalDrug: null,
  canonicalIndication: null,
  canonicalGeography: 'IT',
  drugAliases: [],
  indicationAliases: [],
  geographyAliases: ['italy'],
  confidence: {
    drug: 0,
    indication: 0,
    geography: 1,
  },
  requiresManualUpload: false,
  warnings: [],
  ...overrides,
});

afterEach(() => {
  delete process.env.AIFA_RETRIEVAL_MODE;
  vi.resetModules();
});

describe('AifaAdapter', () => {
  it('supports returns true for IT', async () => {
    process.env.AIFA_RETRIEVAL_MODE = 'fixture';
    const { AifaAdapter } = await import('./aifa.adapter');

    expect(new AifaAdapter().supports(buildQuery())).toBe(true);
  });

  it('fixture mode returns AIFA_FIXTURE_SELECTED_DOCUMENT', async () => {
    process.env.AIFA_RETRIEVAL_MODE = 'fixture';
    const { AifaAdapter } = await import('./aifa.adapter');

    await expect(
      new AifaAdapter().searchLatestRelevantDocument(buildQuery()),
    ).resolves.toEqual(AIFA_FIXTURE_SELECTED_DOCUMENT);
  });

  it('live mode calls fetchText and returns null when no candidate exists', async () => {
    process.env.AIFA_RETRIEVAL_MODE = 'live';
    const fetchTextMock = vi.fn().mockResolvedValue('<html><body>No PDFs here</body></html>');
    vi.doMock('../retrieval/http-client', () => ({
      fetchText: fetchTextMock,
    }));
    const { AifaAdapter } = await import('./aifa.adapter');

    await expect(
      new AifaAdapter().searchLatestRelevantDocument(buildQuery()),
    ).resolves.toBeNull();

    expect(fetchTextMock).toHaveBeenCalledWith(
      'https://www.aifa.gov.it/web/guest/ricerca',
    );
  });

  it('non-fixture non-live mode throws not implemented', async () => {
    process.env.AIFA_RETRIEVAL_MODE = 'unsupported';
    const { AifaAdapter } = await import('./aifa.adapter');

    await expect(
      new AifaAdapter().searchLatestRelevantDocument(buildQuery()),
    ).rejects.toThrow('AIFA retrieval mode is not implemented yet.');
  });

  it('empty query returns null', async () => {
    process.env.AIFA_RETRIEVAL_MODE = 'fixture';
    const { AifaAdapter } = await import('./aifa.adapter');

    await expect(
      new AifaAdapter().searchLatestRelevantDocument(
        buildQuery({ rawQuery: '   ' }),
      ),
    ).resolves.toBeNull();
  });
});
