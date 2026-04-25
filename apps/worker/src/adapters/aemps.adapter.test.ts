import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NormalizedQuery } from '@hta/shared';

import { AEMPS_FIXTURE_SELECTED_DOCUMENT } from './fixtures/aemps-search-result';

const buildQuery = (
  overrides: Partial<NormalizedQuery> = {},
): NormalizedQuery => ({
  rawQuery: 'mock oncology assessment spain',
  canonicalDrug: null,
  canonicalIndication: null,
  canonicalGeography: 'ES',
  drugAliases: [],
  indicationAliases: [],
  geographyAliases: ['spain'],
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
  delete process.env.AEMPS_RETRIEVAL_MODE;
  vi.resetModules();
});

describe('AempsAdapter', () => {
  it('supports returns true for ES', async () => {
    process.env.AEMPS_RETRIEVAL_MODE = 'fixture';
    const { AempsAdapter } = await import('./aemps.adapter');

    expect(new AempsAdapter().supports(buildQuery())).toBe(true);
  });

  it('fixture mode returns AEMPS_FIXTURE_SELECTED_DOCUMENT', async () => {
    process.env.AEMPS_RETRIEVAL_MODE = 'fixture';
    const { AempsAdapter } = await import('./aemps.adapter');

    await expect(
      new AempsAdapter().searchLatestRelevantDocument(buildQuery()),
    ).resolves.toEqual(AEMPS_FIXTURE_SELECTED_DOCUMENT);
  });

  it('live mode calls fetchText and returns null when no candidate exists', async () => {
    process.env.AEMPS_RETRIEVAL_MODE = 'live';
    const fetchTextMock = vi.fn().mockResolvedValue('<html><body>No PDFs here</body></html>');
    vi.doMock('../retrieval/http-client', () => ({
      fetchText: fetchTextMock,
    }));
    const { AempsAdapter } = await import('./aemps.adapter');

    await expect(
      new AempsAdapter().searchLatestRelevantDocument(buildQuery()),
    ).resolves.toBeNull();

    expect(fetchTextMock).toHaveBeenCalledWith(
      'https://www.aemps.gob.es/medicamentos-de-uso-humano/informes-publicos-de-evaluacion/',
    );
  });

  it('non-fixture non-live mode throws not implemented', async () => {
    process.env.AEMPS_RETRIEVAL_MODE = 'unsupported';
    const { AempsAdapter } = await import('./aemps.adapter');

    await expect(
      new AempsAdapter().searchLatestRelevantDocument(buildQuery()),
    ).rejects.toThrow('AEMPS retrieval mode is not implemented yet.');
  });

  it('empty query returns null', async () => {
    process.env.AEMPS_RETRIEVAL_MODE = 'fixture';
    const { AempsAdapter } = await import('./aemps.adapter');

    await expect(
      new AempsAdapter().searchLatestRelevantDocument(
        buildQuery({ rawQuery: '   ' }),
      ),
    ).resolves.toBeNull();
  });
});
