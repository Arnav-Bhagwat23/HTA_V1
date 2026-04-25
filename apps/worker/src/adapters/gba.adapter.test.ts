import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NormalizedQuery } from '@hta/shared';

import { GBA_FIXTURE_SELECTED_DOCUMENT } from './fixtures/gba-search-result';

const buildQuery = (
  overrides: Partial<NormalizedQuery> = {},
): NormalizedQuery => ({
  rawQuery: 'mock oncology assessment germany',
  canonicalDrug: null,
  canonicalIndication: null,
  canonicalGeography: 'DE',
  drugAliases: [],
  indicationAliases: [],
  geographyAliases: ['germany'],
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
  delete process.env.GBA_RETRIEVAL_MODE;
  vi.resetModules();
});

describe('GbaAdapter', () => {
  it('supports returns true for DE', async () => {
    process.env.GBA_RETRIEVAL_MODE = 'fixture';
    const { GbaAdapter } = await import('./gba.adapter');

    expect(new GbaAdapter().supports(buildQuery())).toBe(true);
  });

  it('fixture mode returns GBA_FIXTURE_SELECTED_DOCUMENT', async () => {
    process.env.GBA_RETRIEVAL_MODE = 'fixture';
    const { GbaAdapter } = await import('./gba.adapter');

    await expect(
      new GbaAdapter().searchLatestRelevantDocument(buildQuery()),
    ).resolves.toEqual(GBA_FIXTURE_SELECTED_DOCUMENT);
  });

  it('live mode calls fetchText and returns null when no candidate exists', async () => {
    process.env.GBA_RETRIEVAL_MODE = 'live';
    const fetchTextMock = vi.fn().mockResolvedValue('<html><body>No PDFs here</body></html>');
    vi.doMock('../retrieval/http-client', () => ({
      fetchText: fetchTextMock,
    }));
    const { GbaAdapter } = await import('./gba.adapter');

    await expect(
      new GbaAdapter().searchLatestRelevantDocument(buildQuery()),
    ).resolves.toBeNull();

    expect(fetchTextMock).toHaveBeenCalledWith(
      'https://www.g-ba.de/bewertungsverfahren/nutzenbewertung/',
    );
  });

  it('non-fixture non-live mode throws not implemented', async () => {
    process.env.GBA_RETRIEVAL_MODE = 'unsupported';
    const { GbaAdapter } = await import('./gba.adapter');

    await expect(
      new GbaAdapter().searchLatestRelevantDocument(buildQuery()),
    ).rejects.toThrow('G-BA retrieval mode is not implemented yet.');
  });

  it('empty query returns null', async () => {
    process.env.GBA_RETRIEVAL_MODE = 'fixture';
    const { GbaAdapter } = await import('./gba.adapter');

    await expect(
      new GbaAdapter().searchLatestRelevantDocument(
        buildQuery({ rawQuery: '   ' }),
      ),
    ).resolves.toBeNull();
  });
});
