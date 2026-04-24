import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NormalizedQuery } from '@hta/shared';

import { PBAC_FIXTURE_SELECTED_DOCUMENT } from './fixtures/pbac-search-result';

const buildQuery = (
  overrides: Partial<NormalizedQuery> = {},
): NormalizedQuery => ({
  rawQuery: 'mock oncology reimbursement australia',
  canonicalDrug: null,
  canonicalIndication: null,
  canonicalGeography: 'AU',
  drugAliases: [],
  indicationAliases: [],
  geographyAliases: ['australia'],
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
  delete process.env.PBAC_RETRIEVAL_MODE;
  vi.resetModules();
});

describe('PbacAdapter', () => {
  it('supports returns true for AU', async () => {
    process.env.PBAC_RETRIEVAL_MODE = 'fixture';
    const { PbacAdapter } = await import('./pbac.adapter');

    expect(new PbacAdapter().supports(buildQuery())).toBe(true);
  });

  it('fixture mode returns PBAC_FIXTURE_SELECTED_DOCUMENT', async () => {
    process.env.PBAC_RETRIEVAL_MODE = 'fixture';
    const { PbacAdapter } = await import('./pbac.adapter');

    await expect(
      new PbacAdapter().searchLatestRelevantDocument(buildQuery()),
    ).resolves.toEqual(PBAC_FIXTURE_SELECTED_DOCUMENT);
  });

  it('non-fixture mode throws not implemented', async () => {
    process.env.PBAC_RETRIEVAL_MODE = 'live';
    const { PbacAdapter } = await import('./pbac.adapter');

    await expect(
      new PbacAdapter().searchLatestRelevantDocument(buildQuery()),
    ).rejects.toThrow('PBAC retrieval mode is not implemented yet.');
  });

  it('empty query returns null', async () => {
    process.env.PBAC_RETRIEVAL_MODE = 'fixture';
    const { PbacAdapter } = await import('./pbac.adapter');

    await expect(
      new PbacAdapter().searchLatestRelevantDocument(
        buildQuery({ rawQuery: '   ' }),
      ),
    ).resolves.toBeNull();
  });
});
