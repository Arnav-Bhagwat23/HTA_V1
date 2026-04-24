import { SourceType } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { routeSourcePlans } from './source-router';

describe('routeSourcePlans', () => {
  it('returns no plan for null geography', () => {
    expect(routeSourcePlans(null)).toEqual([]);
  });

  it('returns no plan for OTHER geography', () => {
    expect(routeSourcePlans('OTHER')).toEqual([]);
  });

  it('routes UK to NICE', () => {
    expect(routeSourcePlans('UK')).toEqual([
      {
        sourceKey: 'nice',
        sourceLabel: 'NICE',
        sourceCountry: 'UK',
        sourceType: SourceType.HTML,
      },
    ]);
  });

  it('routes AU to PBAC', () => {
    expect(routeSourcePlans('AU')).toEqual([
      {
        sourceKey: 'pbac',
        sourceLabel: 'PBAC',
        sourceCountry: 'AU',
        sourceType: SourceType.PDF,
      },
    ]);
  });
});
