import { describe, expect, it } from 'vitest';

import { normalizeQuery } from './normalize-query';

describe('normalizeQuery', () => {
  it('resolves UK aliases to UK', () => {
    expect(normalizeQuery('NICE review in UK').canonicalGeography).toBe('UK');
    expect(normalizeQuery('NICE review in United Kingdom').canonicalGeography).toBe('UK');
    expect(normalizeQuery('NICE review in Britain').canonicalGeography).toBe('UK');
  });

  it('resolves Germany to DE', () => {
    const result = normalizeQuery('pricing update for Germany');

    expect(result.canonicalGeography).toBe('DE');
    expect(result.requiresManualUpload).toBe(false);
  });

  it('resolves Japan to JP', () => {
    const result = normalizeQuery('HTA submission in Japan');

    expect(result.canonicalGeography).toBe('JP');
  });

  it('maps unsupported countries to OTHER and requires manual upload', () => {
    const result = normalizeQuery('oncology reimbursement in Canada');

    expect(result.canonicalGeography).toBe('OTHER');
    expect(result.requiresManualUpload).toBe(true);
  });

  it('leaves geography null when no geography is mentioned', () => {
    const result = normalizeQuery('general oncology reimbursement guidance');

    expect(result.canonicalGeography).toBeNull();
    expect(result.requiresManualUpload).toBe(false);
    expect(result.warnings).toEqual([]);
  });

  it('adds an ambiguity warning for conflicting geographies', () => {
    const result = normalizeQuery('comparison between Germany and Japan');

    expect(result.canonicalGeography).toBeNull();
    expect(result.warnings).toContain('GEOGRAPHY_AMBIGUOUS');
  });
});
