import { describe, expect, it } from 'vitest';

import { normalizeQuery } from './normalize-query';

describe('normalizeQuery', () => {
  it('maps UK aliases to UK', () => {
    expect(
      normalizeQuery('Mock drug for United Kingdom HTA').canonicalGeography,
    ).toBe('UK');
    expect(
      normalizeQuery('Mock drug for Britain HTA').canonicalGeography,
    ).toBe('UK');
  });

  it('maps Germany to DE', () => {
    expect(
      normalizeQuery('Mock drug for Germany HTA').canonicalGeography,
    ).toBe('DE');
  });

  it('maps Japan to JP', () => {
    expect(
      normalizeQuery('Mock drug for Japan HTA').canonicalGeography,
    ).toBe('JP');
  });

  it('maps unsupported country to OTHER', () => {
    const normalized = normalizeQuery('Mock drug for Canada HTA');

    expect(normalized.canonicalGeography).toBe('OTHER');
    expect(normalized.requiresManualUpload).toBe(true);
  });

  it('leaves geography null when no geography is mentioned', () => {
    const normalized = normalizeQuery('Mock drug general indication');

    expect(normalized.canonicalGeography).toBeNull();
    expect(normalized.requiresManualUpload).toBe(false);
  });

  it('adds GEOGRAPHY_AMBIGUOUS for conflicting geographies', () => {
    const normalized = normalizeQuery(
      'Mock drug for Australia and Germany HTA',
    );

    expect(normalized.canonicalGeography).toBeNull();
    expect(normalized.warnings).toContain('GEOGRAPHY_AMBIGUOUS');
  });
});
