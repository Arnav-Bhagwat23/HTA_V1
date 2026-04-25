import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NormalizedQuery } from '@hta/shared';

import { HAS_FIXTURE_SELECTED_DOCUMENT } from './fixtures/has-search-result';

const buildQuery = (
  overrides: Partial<NormalizedQuery> = {},
): NormalizedQuery => ({
  rawQuery: 'mock oncology assessment france',
  canonicalDrug: null,
  canonicalIndication: null,
  canonicalGeography: 'FR',
  drugAliases: [],
  indicationAliases: [],
  geographyAliases: ['france'],
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
  delete process.env.HAS_RETRIEVAL_MODE;
  vi.resetModules();
});

describe('HasAdapter', () => {
  it('supports returns true for FR', async () => {
    process.env.HAS_RETRIEVAL_MODE = 'fixture';
    const { HasAdapter } = await import('./has.adapter');

    expect(new HasAdapter().supports(buildQuery())).toBe(true);
  });

  it('fixture mode returns HAS_FIXTURE_SELECTED_DOCUMENT', async () => {
    process.env.HAS_RETRIEVAL_MODE = 'fixture';
    const { HasAdapter } = await import('./has.adapter');

    await expect(
      new HasAdapter().searchLatestRelevantDocument(buildQuery()),
    ).resolves.toEqual(HAS_FIXTURE_SELECTED_DOCUMENT);
  });

  it('live mode calls fetchText and returns null when no candidate exists', async () => {
    process.env.HAS_RETRIEVAL_MODE = 'live';
    const fetchTextMock = vi.fn().mockResolvedValue('<html><body>No PDFs here</body></html>');
    vi.doMock('../retrieval/http-client', () => ({
      fetchText: fetchTextMock,
    }));
    const { HasAdapter } = await import('./has.adapter');

    await expect(
      new HasAdapter().searchLatestRelevantDocument(buildQuery()),
    ).resolves.toBeNull();

    expect(fetchTextMock).toHaveBeenCalledWith(
      'https://www.has-sante.fr/jcms/fc_2875171/fr/recherche',
    );
  });

  it('non-fixture non-live mode throws not implemented', async () => {
    process.env.HAS_RETRIEVAL_MODE = 'unsupported';
    const { HasAdapter } = await import('./has.adapter');

    await expect(
      new HasAdapter().searchLatestRelevantDocument(buildQuery()),
    ).rejects.toThrow('HAS retrieval mode is not implemented yet.');
  });

  it('empty query returns null', async () => {
    process.env.HAS_RETRIEVAL_MODE = 'fixture';
    const { HasAdapter } = await import('./has.adapter');

    await expect(
      new HasAdapter().searchLatestRelevantDocument(
        buildQuery({ rawQuery: '   ' }),
      ),
    ).resolves.toBeNull();
  });
});
