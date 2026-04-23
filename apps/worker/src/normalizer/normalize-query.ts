import type { NormalizedQuery } from '../../../../packages/shared/src';

export const normalizeQuery = (rawQuery: string): NormalizedQuery => {
  const normalizedRawQuery = rawQuery.trim();

  return {
    rawQuery: normalizedRawQuery,
    canonicalDrug: null,
    canonicalIndication: null,
    canonicalGeography: null,
    drugAliases: [],
    indicationAliases: [],
    geographyAliases: [],
    confidence: {
      drug: 0,
      indication: 0,
      geography: 0,
    },
    requiresManualUpload: false,
    warnings: [],
  };
};
