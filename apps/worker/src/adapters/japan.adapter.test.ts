import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NormalizedQuery } from '@hta/shared';

import { JAPAN_HTA_FIXTURE_SELECTED_DOCUMENT } from './fixtures/japan-search-result';

const buildQuery = (
  overrides: Partial<NormalizedQuery> = {},
): NormalizedQuery => ({
  rawQuery: 'mock oncology assessment japan',
  canonicalDrug: null,
  canonicalIndication: null,
  canonicalGeography: 'JP',
  drugAliases: [],
  indicationAliases: [],
  geographyAliases: ['japan'],
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
  delete process.env.JAPAN_HTA_RETRIEVAL_MODE;
  vi.resetModules();
});

describe('JapanAdapter', () => {
  it('supports returns true for JP', async () => {
    process.env.JAPAN_HTA_RETRIEVAL_MODE = 'fixture';
    const { JapanAdapter } = await import('./japan.adapter');

    expect(new JapanAdapter().supports(buildQuery())).toBe(true);
  });

  it('fixture mode returns JAPAN_HTA_FIXTURE_SELECTED_DOCUMENT', async () => {
    process.env.JAPAN_HTA_RETRIEVAL_MODE = 'fixture';
    const { JapanAdapter } = await import('./japan.adapter');

    await expect(
      new JapanAdapter().searchLatestRelevantDocument(buildQuery()),
    ).resolves.toEqual(JAPAN_HTA_FIXTURE_SELECTED_DOCUMENT);
  });

  it('live mode calls fetchText and returns null when no candidate exists', async () => {
    process.env.JAPAN_HTA_RETRIEVAL_MODE = 'live';
    const fetchTextMock = vi.fn().mockResolvedValue('<html><body>No PDFs here</body></html>');
    vi.doMock('../retrieval/http-client', () => ({
      fetchText: fetchTextMock,
    }));
    const { JapanAdapter } = await import('./japan.adapter');

    await expect(
      new JapanAdapter().searchLatestRelevantDocument(buildQuery()),
    ).resolves.toBeNull();

    expect(fetchTextMock).toHaveBeenCalledWith(
      'https://www.mhlw.go.jp/stf/shingi/shingi-chuo_128154.html',
    );
  });

  it('non-fixture non-live mode throws not implemented', async () => {
    process.env.JAPAN_HTA_RETRIEVAL_MODE = 'unsupported';
    const { JapanAdapter } = await import('./japan.adapter');

    await expect(
      new JapanAdapter().searchLatestRelevantDocument(buildQuery()),
    ).rejects.toThrow('Japan HTA retrieval mode is not implemented yet.');
  });

  it('empty query returns null', async () => {
    process.env.JAPAN_HTA_RETRIEVAL_MODE = 'fixture';
    const { JapanAdapter } = await import('./japan.adapter');

    await expect(
      new JapanAdapter().searchLatestRelevantDocument(
        buildQuery({ rawQuery: '   ' }),
      ),
    ).resolves.toBeNull();
  });
});
