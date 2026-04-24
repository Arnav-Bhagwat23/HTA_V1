import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NormalizedQuery } from '@hta/shared';

import { NICE_FIXTURE_SELECTED_DOCUMENT } from './fixtures/nice-search-result';

const buildQuery = (
  overrides: Partial<NormalizedQuery> = {},
): NormalizedQuery => ({
  rawQuery: 'mock oncology appraisal united kingdom',
  canonicalDrug: null,
  canonicalIndication: null,
  canonicalGeography: 'UK',
  drugAliases: [],
  indicationAliases: [],
  geographyAliases: ['united kingdom'],
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
  delete process.env.NICE_RETRIEVAL_MODE;
  vi.resetModules();
});

describe('NiceAdapter', () => {
  it('supports returns true for UK', async () => {
    process.env.NICE_RETRIEVAL_MODE = 'fixture';
    const { NiceAdapter } = await import('./nice.adapter');

    expect(new NiceAdapter().supports(buildQuery())).toBe(true);
  });

  it('fixture mode returns NICE_FIXTURE_SELECTED_DOCUMENT', async () => {
    process.env.NICE_RETRIEVAL_MODE = 'fixture';
    const { NiceAdapter } = await import('./nice.adapter');

    await expect(
      new NiceAdapter().searchLatestRelevantDocument(buildQuery()),
    ).resolves.toEqual(NICE_FIXTURE_SELECTED_DOCUMENT);
  });

  it('live mode calls fetchText and returns null when no candidate exists', async () => {
    process.env.NICE_RETRIEVAL_MODE = 'live';
    const fetchTextMock = vi.fn().mockResolvedValue('<html><body>No PDFs here</body></html>');
    vi.doMock('../retrieval/http-client', () => ({
      fetchText: fetchTextMock,
    }));
    const { NiceAdapter } = await import('./nice.adapter');

    await expect(
      new NiceAdapter().searchLatestRelevantDocument(buildQuery()),
    ).resolves.toBeNull();

    expect(fetchTextMock).toHaveBeenCalledWith(
      'https://www.nice.org.uk/guidance/published',
    );
  });

  it('non-fixture non-live mode throws not implemented', async () => {
    process.env.NICE_RETRIEVAL_MODE = 'unsupported';
    const { NiceAdapter } = await import('./nice.adapter');

    await expect(
      new NiceAdapter().searchLatestRelevantDocument(buildQuery()),
    ).rejects.toThrow('NICE retrieval mode is not implemented yet.');
  });

  it('empty query returns null', async () => {
    process.env.NICE_RETRIEVAL_MODE = 'fixture';
    const { NiceAdapter } = await import('./nice.adapter');

    await expect(
      new NiceAdapter().searchLatestRelevantDocument(
        buildQuery({ rawQuery: '   ' }),
      ),
    ).resolves.toBeNull();
  });
});
